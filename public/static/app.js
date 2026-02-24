// WorVox - AI English Learning App
class WorVox {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.currentAudio = null;
    
    // User plan and usage tracking
    this.userPlan = 'free'; // 'free', 'premium', 'business'
    this.dailyUsage = {
      aiConversations: 0,
      pronunciationPractice: 0,
      wordSearch: 0,
      lastReset: new Date().toDateString()
    };
    this.usageLimits = {
      free: {
        aiConversations: 5,
        pronunciationPractice: 10,
        wordSearch: 10
      },
      premium: {
        aiConversations: Infinity,
        pronunciationPractice: Infinity,
        wordSearch: Infinity
      },
      business: {
        aiConversations: Infinity,
        pronunciationPractice: Infinity,
        wordSearch: Infinity
      }
    };
    
    // Onboarding state
    this.onboardingData = {
      username: '',
      level: '',
      referralSource: '',
      ageGroup: '',
      gender: '',
      occupation: ''
    };
    this.onboardingStep = 1;
    
    // Load usage from localStorage
    this.loadUsageData();
    
    this.init();
  }

  async init() {
    // Initialize Google Sign-In
    this.initGoogleSignIn();
    
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('worvox_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      await this.loadGamificationStats();
      this.showTopicSelection();
    } else {
      this.showLogin();
    }
  }

  async loadGamificationStats() {
    if (!this.currentUser || typeof gamificationManager === 'undefined') return;
    
    try {
      const stats = await gamificationManager.getStats(this.currentUser.id);
      if (stats) {
        this.updateGamificationUI(stats.stats);
      }
    } catch (error) {
      console.error('Error loading gamification stats:', error);
    }
  }

  updateGamificationUI(stats) {
    // Update level
    const levelBadge = document.querySelector('#user-level');
    if (levelBadge) {
      levelBadge.textContent = `Lv.${stats.level}`;
    }
    
    // Update XP progress bar
    const xpBar = document.querySelector('#xp-progress-bar');
    if (xpBar) {
      xpBar.style.width = `${stats.progress}%`;
    }
    
    // Update XP text
    const xpText = document.querySelector('#xp-text');
    if (xpText) {
      xpText.textContent = `${stats.xp} / ${stats.xpForNextLevel} XP`;
    }
    
    // Update coins
    const coinsDisplay = document.querySelector('#user-coins');
    if (coinsDisplay) {
      coinsDisplay.textContent = `💰 ${stats.coins}`;
    }
  }

  initGoogleSignIn() {
    // Wait for Google Sign-In library to load
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.initialize({
        client_id: '506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com',
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
      });
    } else {
      // Retry after 500ms if library not loaded yet
      setTimeout(() => this.initGoogleSignIn(), 500);
    }
  }

  async handleGoogleSignIn(response) {
    try {
      console.log('Google Sign-In response:', response);
      
      // Decode JWT token to get user info
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const profileObj = JSON.parse(jsonPayload);
      console.log('Decoded profile:', profileObj);

      // Send to backend
      const authResponse = await axios.post('/api/users/auth/google', {
        credential: response.credential,
        profileObj: profileObj
      });

      if (authResponse.data.success) {
        this.currentUser = authResponse.data.user;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        
        // Load gamification stats
        await this.loadGamificationStats();
        
        // If new user, show onboarding for additional info
        if (authResponse.data.isNew) {
          this.onboardingStep = 2; // Skip name step
          this.onboardingData.username = this.currentUser.username;
          this.showOnboardingStep();
        } else {
          this.showTopicSelection();
        }
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  }

  // UI Rendering Methods
  getSidebar(activeItem = 'home') {
    return `
      <!-- Mobile Sidebar Overlay -->
      <div id="sidebarOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden" onclick="worvox.toggleMobileSidebar()"></div>
      
      <!-- Sidebar (hidden on mobile by default) -->
      <div id="sidebar" class="fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out">
        <!-- Logo -->
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 class="text-xl font-bold">WorVox</h1>
          <button onclick="worvox.toggleMobileSidebar()" class="md:hidden text-white">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <!-- Menu Items -->
        <nav class="flex-1 p-3 space-y-2 overflow-y-auto">
          <a href="#" onclick="worvox.showTopicSelection(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'home' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-home" style="width: 20px; text-align: center;"></i>
            <span>Home</span>
          </a>
          <a href="#" onclick="worvox.startConversation(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'conversation' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-comments" style="width: 20px; text-align: center;"></i>
            <span>AI Conversation</span>
          </a>
          <a href="#" onclick="worvox.showRealConversation(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'real-conversation' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-user-tie" style="width: 20px; text-align: center;"></i>
            <span>Real Conversation</span>
          </a>
          <a href="#" onclick="worvox.startVocabulary(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'vocabulary' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-book" style="width: 20px; text-align: center;"></i>
            <span>Vocabulary</span>
          </a>
          <a href="#" onclick="worvox.showHistory(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'history' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-history" style="width: 20px; text-align: center;"></i>
            <span>History</span>
          </a>
          <a href="#" onclick="worvox.showStats(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'stats' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-chart-line" style="width: 20px; text-align: center;"></i>
            <span>Statistics</span>
          </a>
          <a href="#" onclick="worvox.showRewards(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'rewards' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-gift" style="width: 20px; text-align: center;"></i>
            <span>Rewards</span>
          </a>
          <a href="#" onclick="worvox.showPlan(); worvox.closeMobileSidebar(); return false;" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${activeItem === 'plan' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-all">
            <i class="fas fa-crown" style="width: 20px; text-align: center;"></i>
            <span>Plan</span>
          </a>
        </nav>
        
        <!-- User Profile -->
        <div class="p-4 border-t border-gray-700">
          <!-- Level & XP Info -->
          <div class="mb-3 bg-gray-800 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-gray-400">레벨</span>
              <span id="user-level" class="text-sm font-bold text-yellow-400">Lv.1</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 mb-1">
              <div id="xp-progress-bar" class="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all" style="width: 0%"></div>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span id="xp-text" class="text-gray-400">0 / 100 XP</span>
              <span id="user-coins" class="text-yellow-400">💰 0</span>
            </div>
          </div>
          
          <!-- User Info -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
              ${this.currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
              <div class="font-medium text-sm">${this.currentUser.username}</div>
              <div class="text-xs text-gray-400">${this.currentUser.level}</div>
            </div>
            <button onclick="worvox.logout()" class="text-gray-400 hover:text-white" title="Logout">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    }
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    }
  }

  getMobileHeader(title = 'WorVox') {
    return `
      <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onclick="worvox.toggleMobileSidebar()" class="text-gray-600">
          <i class="fas fa-bars text-xl"></i>
        </button>
        <h1 class="text-lg font-semibold text-gray-800">${title}</h1>
        <div class="w-6"></div>
      </div>
    `;
  }

  async startConversation() {
    // Check usage limit for free users
    if (!this.checkUsageLimit('aiConversations')) {
      return; // Show upgrade banner
    }
    
    const topics = await axios.get('/api/topics');
    const conversationTopic = topics.data.topics.find(t => t.name === 'AI English Conversation');
    if (conversationTopic) {
      // Increment usage when starting conversation
      this.incrementUsage('aiConversations');
      this.startSession(conversationTopic.id, conversationTopic.name, conversationTopic.system_prompt, conversationTopic.level);
    }
  }

  async startVocabulary() {
    const topics = await axios.get('/api/topics');
    const vocabTopic = topics.data.topics.find(t => t.name === 'Vocabulary');
    if (vocabTopic) {
      this.startSession(vocabTopic.id, vocabTopic.name, '', vocabTopic.level);
    }
  }

  showRealConversation() {
    const content = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('real-conversation')}
        <div class="flex-1 flex flex-col">
        
        <div class="flex-1 overflow-y-auto p-3 md:p-4">
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 md:p-5 text-white mb-4">
              <div class="flex items-center gap-2 md:gap-3">
                <button onclick="worvox.showTopicSelection()" 
                  class="md:hidden text-white hover:bg-emerald-600 p-2 rounded-lg transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div class="flex-1">
                  <h1 class="text-2xl md:text-3xl font-bold mb-1">
                    <i class="fas fa-user-tie mr-2"></i>
                    Real Conversation Lessons
                  </h1>
                  <p class="text-emerald-100">Book 1-on-1 lessons with certified English teachers</p>
                </div>
              </div>
            </div>

            <!-- Booking Form -->
            <div class="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">Select Your Lesson Plan</h2>

              <!-- Sessions Per Week -->
              <div class="mb-5">
                <label class="block text-sm font-semibold text-gray-700 mb-3">Sessions Per Week</label>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                  ${[1, 2, 3, 4, 5].map(num => `
                    <button 
                      onclick="worvox.selectSessions(${num})"
                      id="session-btn-${num}"
                      class="px-4 py-3 border-2 rounded-lg font-semibold transition-all hover:border-emerald-500 hover:bg-emerald-50"
                      data-sessions="${num}">
                      ${num} ${num === 1 ? 'Session' : 'Sessions'}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Session Duration -->
              <div class="mb-5">
                <label class="block text-sm font-semibold text-gray-700 mb-3">Session Duration</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onclick="worvox.selectDuration(25)"
                    id="duration-btn-25"
                    class="px-4 py-3 border-2 rounded-lg font-semibold transition-all hover:border-emerald-500 hover:bg-emerald-50"
                    data-duration="25">
                    25 Minutes
                  </button>
                  <button 
                    onclick="worvox.selectDuration(50)"
                    id="duration-btn-50"
                    class="px-4 py-3 border-2 rounded-lg font-semibold transition-all hover:border-emerald-500 hover:bg-emerald-50"
                    data-duration="50">
                    50 Minutes
                  </button>
                </div>
              </div>

              <!-- Pricing Summary -->
              <div class="bg-gray-50 rounded-lg p-4 md:p-5 mb-5">
                <h3 class="text-lg font-bold text-gray-800 mb-3">Pricing Summary</h3>
                
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-gray-600">
                    <span>Base Price (per session)</span>
                    <span class="font-semibold">₩16,500</span>
                  </div>
                  <div class="flex justify-between items-center text-gray-600">
                    <span id="sessions-display">Sessions Selected</span>
                    <span id="sessions-value" class="font-semibold">-</span>
                  </div>
                  <div class="flex justify-between items-center text-gray-600">
                    <span id="duration-display">Duration</span>
                    <span id="duration-value" class="font-semibold">-</span>
                  </div>
                  
                  <div class="border-t border-gray-300 pt-3 mt-3">
                    <div class="flex justify-between items-center text-gray-700">
                      <span class="font-semibold">Per Week</span>
                      <span id="weekly-price" class="font-bold text-lg text-emerald-600">₩0</span>
                    </div>
                    <div class="flex justify-between items-center text-gray-700 mt-2">
                      <span class="font-semibold">Per Month (4 weeks)</span>
                      <span id="monthly-price" class="font-bold text-lg text-emerald-600">₩0</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Total & Checkout -->
              <div class="border-t border-gray-200 pt-4">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-xl font-bold text-gray-800">Total (Monthly)</span>
                  <span id="total-price" class="text-2xl font-bold text-emerald-600">₩0</span>
                </div>
                <button 
                  id="checkout-btn"
                  onclick="worvox.proceedToCheckout()"
                  disabled
                  class="w-full bg-emerald-500 text-white py-3 px-6 rounded-lg font-bold text-lg transition-all hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  <i class="fas fa-credit-card mr-2"></i>
                  Proceed to Payment
                </button>
                <p class="text-xs text-gray-500 text-center mt-2">
                  Please select sessions and duration to continue
                </p>
              </div>
            </div>

            <!-- Features -->
            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="bg-white rounded-lg p-4 shadow-sm">
                <i class="fas fa-certificate text-emerald-500 text-2xl mb-2"></i>
                <h3 class="font-semibold text-gray-800 mb-1">Certified Teachers</h3>
                <p class="text-sm text-gray-600">All teachers are certified and experienced</p>
              </div>
              <div class="bg-white rounded-lg p-4 shadow-sm">
                <i class="fas fa-calendar-check text-emerald-500 text-2xl mb-2"></i>
                <h3 class="font-semibold text-gray-800 mb-1">Flexible Schedule</h3>
                <p class="text-sm text-gray-600">Book lessons at your convenience</p>
              </div>
              <div class="bg-white rounded-lg p-4 shadow-sm">
                <i class="fas fa-headset text-emerald-500 text-2xl mb-2"></i>
                <h3 class="font-semibold text-gray-800 mb-1">One-on-One</h3>
                <p class="text-sm text-gray-600">Personal attention for faster progress</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    `;
    
    document.getElementById('app').innerHTML = content;
    
    // Load gamification UI
    setTimeout(() => this.loadGamificationStats(), 100);
  }

  selectSessions(num) {
    // Remove active class from all session buttons
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`session-btn-${i}`);
      btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
      btn.classList.add('border-gray-300', 'text-gray-700');
    }
    
    // Add active class to selected button
    const selectedBtn = document.getElementById(`session-btn-${num}`);
    selectedBtn.classList.remove('border-gray-300', 'text-gray-700');
    selectedBtn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
    
    // Store selection
    this.bookingData = this.bookingData || {};
    this.bookingData.sessionsPerWeek = num;
    
    // Update display
    document.getElementById('sessions-value').textContent = `${num} ${num === 1 ? 'Session' : 'Sessions'} / week`;
    
    // Calculate price
    this.calculateBookingPrice();
  }

  selectDuration(minutes) {
    // Remove active class from all duration buttons
    [25, 50].forEach(min => {
      const btn = document.getElementById(`duration-btn-${min}`);
      btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
      btn.classList.add('border-gray-300', 'text-gray-700');
    });
    
    // Add active class to selected button
    const selectedBtn = document.getElementById(`duration-btn-${minutes}`);
    selectedBtn.classList.remove('border-gray-300', 'text-gray-700');
    selectedBtn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
    
    // Store selection
    this.bookingData = this.bookingData || {};
    this.bookingData.sessionDuration = minutes;
    
    // Update display
    document.getElementById('duration-value').textContent = `${minutes} Minutes`;
    
    // Calculate price
    this.calculateBookingPrice();
  }

  calculateBookingPrice() {
    const data = this.bookingData || {};
    
    if (!data.sessionsPerWeek || !data.sessionDuration) {
      return; // Not enough data yet
    }
    
    // Base price: ₩16,500 per 25-minute session
    const basePrice = 16500;
    const sessionsPerWeek = data.sessionsPerWeek;
    const durationMultiplier = data.sessionDuration / 25; // 25min = 1x, 50min = 2x
    
    // Calculate weekly and monthly prices
    const weeklyPrice = basePrice * sessionsPerWeek * durationMultiplier;
    const monthlyPrice = weeklyPrice * 4; // 4 weeks per month
    
    // Update display
    document.getElementById('weekly-price').textContent = `₩${weeklyPrice.toLocaleString()}`;
    document.getElementById('monthly-price').textContent = `₩${monthlyPrice.toLocaleString()}`;
    document.getElementById('total-price').textContent = `₩${monthlyPrice.toLocaleString()}`;
    
    // Enable checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('bg-gray-300');
    checkoutBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
    
    // Store calculated prices
    this.bookingData.weeklyPrice = weeklyPrice;
    this.bookingData.monthlyPrice = monthlyPrice;
  }

  async proceedToCheckout() {
    const data = this.bookingData;
    
    if (!data || !data.sessionsPerWeek || !data.sessionDuration) {
      alert('Please select both sessions per week and session duration.');
      return;
    }
    
    // Show confirmation
    const confirmed = confirm(`
Booking Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Sessions: ${data.sessionsPerWeek} per week
Duration: ${data.sessionDuration} minutes
Weekly Price: ₩${data.weeklyPrice.toLocaleString()}
Monthly Price: ₩${data.monthlyPrice.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed to payment?
    `);
    
    if (confirmed) {
      // TODO: Implement actual payment integration
      alert('Payment feature coming soon! Your booking details have been saved.');
      
      // For now, just log the booking
      console.log('Booking Data:', data);
      
      // Could send to backend to save booking
      // await axios.post('/api/bookings', {
      //   userId: this.currentUser.id,
      //   ...data
      // });
    }
  }

  showLogin() {
    this.onboardingStep = 1;
    this.showOnboardingStep();
  }

  showOnboardingStep() {
    const app = document.getElementById('app');
    
    const steps = [
      this.getStep1HTML(),
      this.getStep2HTML(),
      this.getStep3HTML()
    ];

    const progress = Math.round((this.onboardingStep / 3) * 100);

    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold gradient-text mb-2">WorVox</h1>
            <p class="text-gray-600 text-sm">Step ${this.onboardingStep} of 3</p>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300" 
                 style="width: ${progress}%"></div>
          </div>

          <!-- Current Step Content -->
          ${steps[this.onboardingStep - 1]}
        </div>
      </div>
    `;

    this.attachOnboardingListeners();
  }

  getStep1HTML() {
    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">👋</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Welcome to WorVox!</h2>
          <p class="text-gray-600">Sign in with your Google account to get started</p>
        </div>
        
        <!-- Google Sign-In Button -->
        <div id="googleSignInButton" class="flex justify-center"></div>
        
        <div class="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    `;
  }

  getStep2HTML() {
    const levels = [
      { value: 'beginner', icon: '🌱', label: 'Beginner', desc: 'Just starting out' },
      { value: 'intermediate', icon: '🌿', label: 'Intermediate', desc: 'Some experience' },
      { value: 'advanced', icon: '🌳', label: 'Advanced', desc: 'Confident speaker' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">📚</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">English Level</h2>
          <p class="text-gray-600">What's your current level?</p>
        </div>
        
        <div class="space-y-3">
          ${levels.map(level => `
            <button onclick="worvox.selectOption('level', '${level.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.level === level.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${level.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${level.label}</div>
                  <div class="text-sm text-gray-600">${level.desc}</div>
                </div>
                ${this.onboardingData.level === level.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep3HTML() {
    const occupations = [
      { value: 'entrepreneur', icon: '🚀', label: 'Entrepreneur', desc: 'Business owner' },
      { value: 'employee', icon: '💼', label: 'Employee', desc: 'Office worker' },
      { value: 'freelancer', icon: '💻', label: 'Freelancer', desc: 'Independent contractor' },
      { value: 'student', icon: '📚', label: 'Student', desc: 'Currently studying' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">💼</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Occupation</h2>
          <p class="text-gray-600">What do you do?</p>
        </div>
        
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${occupations.map(occ => `
            <button onclick="worvox.selectOption('occupation', '${occ.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.occupation === occ.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${occ.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${occ.label}</div>
                  <div class="text-sm text-gray-600">${occ.desc}</div>
                </div>
                ${this.onboardingData.occupation === occ.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep4HTML() {
    const ageGroups = [
      { value: '10s', icon: '🎮', label: '10대', desc: 'Teenager' },
      { value: '20s', icon: '🎓', label: '20대', desc: 'Twenty-something' },
      { value: '30s', icon: '💼', label: '30대', desc: 'Thirty-something' },
      { value: '40s', icon: '👔', label: '40대', desc: 'Forty-something' },
      { value: '50+', icon: '🌟', label: '50대+', desc: 'Fifty and beyond' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🎂</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Age Group</h2>
          <p class="text-gray-600">What's your age range?</p>
        </div>
        
        <div class="space-y-3">
          ${ageGroups.map(age => `
            <button onclick="worvox.selectOption('ageGroup', '${age.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.ageGroup === age.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${age.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${age.label}</div>
                  <div class="text-sm text-gray-600">${age.desc}</div>
                </div>
                ${this.onboardingData.ageGroup === age.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep5HTML() {
    const genders = [
      { value: 'male', icon: '👨', label: 'Male', desc: '남성' },
      { value: 'female', icon: '👩', label: 'Female', desc: '여성' },
      { value: 'other', icon: '🧑', label: 'Other/Prefer not to say', desc: '기타/선택 안함' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🙋</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Gender</h2>
          <p class="text-gray-600">How do you identify?</p>
        </div>
        
        <div class="space-y-3">
          ${genders.map(gender => `
            <button onclick="worvox.selectOption('gender', '${gender.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.gender === gender.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${gender.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${gender.label}</div>
                  <div class="text-sm text-gray-600">${gender.desc}</div>
                </div>
                ${this.onboardingData.gender === gender.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep4HTML() {
    const occupations = [
      { value: 'entrepreneur', icon: '🚀', label: 'Entrepreneur', desc: 'Business owner' },
      { value: 'employee', icon: '💼', label: 'Employee', desc: 'Office worker' },
      { value: 'freelancer', icon: '💻', label: 'Freelancer', desc: 'Independent contractor' },
      { value: 'student', icon: '📚', label: 'Student', desc: 'Currently studying' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">💼</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Occupation</h2>
          <p class="text-gray-600">What do you do?</p>
        </div>
        
        <div class="space-y-3">
          ${occupations.map(occ => `
            <button onclick="worvox.selectOption('occupation', '${occ.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.occupation === occ.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${occ.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${occ.label}</div>
                  <div class="text-sm text-gray-600">${occ.desc}</div>
                </div>
                ${this.onboardingData.occupation === occ.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="worvox.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  attachOnboardingListeners() {
    if (this.onboardingStep === 1) {
      const input = document.getElementById('username');
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.nextStep();
          }
        });
      }
      
      // Render Google Sign-In button
      setTimeout(() => {
        const googleButtonDiv = document.getElementById('googleSignInButton');
        if (googleButtonDiv && typeof google !== 'undefined' && google.accounts) {
          // Calculate responsive width
          const containerWidth = googleButtonDiv.offsetWidth;
          const buttonWidth = Math.min(400, containerWidth - 40); // 40px for padding
          
          google.accounts.id.renderButton(
            googleButtonDiv,
            { 
              theme: 'outline', 
              size: 'large',
              width: buttonWidth,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
        }
      }, 100);
    }
  }

  async nextStep() {
    // Validate current step
    if (this.onboardingStep === 1) {
      const username = document.getElementById('username').value.trim();
      if (!username) {
        alert('Please enter your name');
        return;
      }
      
      // Check for duplicate username
      try {
        const checkResponse = await axios.post('/api/users/check-username', { username });
        
        if (checkResponse.data.exists) {
          alert('❌ Username already exists!\n\nThis name is already taken. Please choose a different name.');
          return;
        }
        
        this.onboardingData.username = username;
      } catch (error) {
        console.error('Username check error:', error);
        if (error.response && error.response.status === 409) {
          alert('❌ Username already exists!\n\nThis name is already taken. Please choose a different name.');
          return;
        }
        // If check fails for other reasons, proceed anyway
        this.onboardingData.username = username;
      }
    }

    this.onboardingStep++;
    this.showOnboardingStep();
  }

  prevStep() {
    if (this.onboardingStep > 1) {
      this.onboardingStep--;
      this.showOnboardingStep();
    }
  }

  selectOption(field, value) {
    this.onboardingData[field] = value;
    
    // Auto-advance to next step after selection
    setTimeout(() => {
      if (this.onboardingStep < 3) {
        this.nextStep();
      } else {
        // Last step - show headphone recommendation
        this.showHeadphoneRecommendation();
      }
    }, 300);
  }

  showHeadphoneRecommendation() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center">
          <!-- Headphone Icon -->
          <div class="mb-6">
            <div class="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-headphones text-5xl text-indigo-600"></i>
            </div>
          </div>
          
          <!-- Title -->
          <h2 class="text-2xl font-bold text-gray-800 mb-4">🎧 Headphones Recommended</h2>
          
          <!-- Message -->
          <p class="text-gray-600 mb-2">
            For the best learning experience, we recommend using headphones or earphones.
          </p>
          <p class="text-gray-500 text-sm mb-8">
            This will help you hear pronunciations clearly and practice speaking without disturbing others.
          </p>
          
          <!-- Benefits -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-8 text-left">
            <div class="flex items-start gap-3 mb-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Better Audio Quality</div>
                <div class="text-sm text-gray-600">Hear pronunciations more clearly</div>
              </div>
            </div>
            <div class="flex items-start gap-3 mb-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Focused Learning</div>
                <div class="text-sm text-gray-600">Minimize distractions around you</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-green-500 text-lg mt-0.5"></i>
              <div>
                <div class="font-semibold text-gray-800">Privacy</div>
                <div class="text-sm text-gray-600">Practice speaking freely</div>
              </div>
            </div>
          </div>
          
          <!-- Continue Button -->
          <button onclick="worvox.completeOnboarding()" 
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
            Got it! Let's Start Learning
          </button>
        </div>
      </div>
    `;
  }

  async completeOnboarding() {
    try {
      const response = await axios.post('/api/users/auth', this.onboardingData);

      if (response.data.success) {
        this.currentUser = response.data.user;
        localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
        await this.loadGamificationStats();
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete registration. Please try again.');
    }
  }

  async showTopicSelection() {
    try {
      // Fetch topics
      const topicsResponse = await axios.get('/api/topics');
      const topics = topicsResponse.data.topics;

      // Fetch user statistics
      const statsResponse = await axios.get(`/api/users/${this.currentUser.id}/stats`);
      const stats = statsResponse.data.stats;

      // Calculate total words spoken (approximate)
      const totalWords = Math.floor(stats.totalMessages / 2) * 10;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
          <!-- Sidebar -->
          ${this.getSidebar('home')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Mobile Header with Upgrade -->
            <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
              <div class="flex items-center justify-between">
                <button onclick="worvox.toggleMobileSidebar()" class="text-gray-600">
                  <i class="fas fa-bars text-xl"></i>
                </button>
                <h1 class="text-lg font-semibold text-gray-800">Home</h1>
                <button onclick="worvox.showPlan()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
                  <i class="fas fa-crown"></i>
                </button>
              </div>
            </div>
            
            <!-- Desktop Top Bar -->
            <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">Choose Your Learning Path</h2>
              <button onclick="worvox.showPlan()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all">
                <i class="fas fa-crown mr-2"></i>Upgrade
              </button>
            </div>
            
            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- Welcome Message -->
                <div class="text-center mb-8 md:mb-12">
                  <h1 class="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-3">Welcome back, ${this.currentUser.username}!</h1>
                  <p class="text-gray-600 text-base md:text-lg">What would you like to learn today?</p>
                </div>
                
                <!-- Word Search Section -->
                <div class="mb-6 md:mb-8">
                  <div class="relative max-w-2xl mx-auto">
                    <input 
                      type="text" 
                      id="wordSearch" 
                      placeholder="Search for any English word..." 
                      class="w-full px-4 md:px-6 py-3 md:py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-700 placeholder-gray-400 text-base md:text-lg pr-24"
                      onkeypress="if(event.key==='Enter') worvox.searchWord()"
                    />
                    <button 
                      onclick="worvox.searchWord()"
                      class="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-2 rounded-lg transition-all text-sm md:text-base">
                      <i class="fas fa-search mr-1 md:mr-2"></i><span class="hidden sm:inline">Search</span>
                    </button>
                  </div>
                  <div id="searchResult" class="mt-4 md:mt-6 max-w-2xl mx-auto"></div>
                </div>
                
                <!-- Daily Usage Tracker (Free Plan Only) -->
                ${!this.isPremiumUser() ? `
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 md:mb-8">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">오늘의 사용량</h3>
                    <button onclick="worvox.showPlan()" class="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      Premium 보기 →
                    </button>
                  </div>
                  
                  <div class="space-y-4">
                    <!-- AI Conversation Usage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <i class="fas fa-comment text-blue-600"></i>
                          <span class="text-sm text-gray-700">AI 대화</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900">${this.getDailyUsage('ai_conversation')}/5회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${(this.getDailyUsage('ai_conversation') / 5) * 100}%"></div>
                      </div>
                    </div>
                    
                    <!-- Pronunciation Practice Usage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <i class="fas fa-microphone text-purple-600"></i>
                          <span class="text-sm text-gray-700">발음 연습</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900">${this.getDailyUsage('pronunciation')}/10회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-purple-600 h-2 rounded-full transition-all" style="width: ${(this.getDailyUsage('pronunciation') / 10) * 100}%"></div>
                      </div>
                    </div>
                    
                    <!-- Word Search Usage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <i class="fas fa-search text-emerald-600"></i>
                          <span class="text-sm text-gray-700">단어 검색</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900">${this.getDailyUsage('word_search')}/10회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-emerald-600 h-2 rounded-full transition-all" style="width: ${(this.getDailyUsage('word_search') / 10) * 100}%"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-xs text-gray-500 text-center">
                      <i class="fas fa-clock mr-1"></i>매일 자정에 초기화됩니다
                    </p>
                  </div>
                </div>
                ` : ''}
                
                <!-- Feature Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">${topics.map(topic => `
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer"
                      onclick="worvox.startSession(${topic.id}, '${topic.name}', '${topic.system_prompt}', '${topic.level}')">
                      <div class="w-12 h-12 bg-${topic.name === 'AI English Conversation' ? 'emerald' : 'blue'}-100 rounded-xl flex items-center justify-center mb-4">
                        <span class="text-2xl">${topic.icon}</span>
                      </div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">${topic.name}</h3>
                      <p class="text-gray-600 mb-4">${topic.description}</p>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-${topic.name === 'AI English Conversation' ? 'emerald' : 'blue'}-600 font-medium">Start learning →</span>
                        <span class="text-xs bg-gray-100 px-2 py-1 rounded">${topic.level}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <!-- Stats Summary -->
                <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
                  <h3 class="text-2xl font-bold mb-6">Your Progress</h3>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <div>
                      <div class="text-2xl md:text-3xl font-bold mb-1">${stats.totalSessions}</div>
                      <div class="text-emerald-100 text-sm md:text-base">Sessions</div>
                    </div>
                    <div>
                      <div class="text-2xl md:text-3xl font-bold mb-1">${totalWords.toLocaleString()}</div>
                      <div class="text-emerald-100 text-sm md:text-base">Words</div>
                    </div>
                    <div class="col-span-2 md:col-span-1">
                      <div class="text-2xl md:text-3xl font-bold mb-1">${Math.floor(stats.totalMessages / 2)}h</div>
                      <div class="text-emerald-100 text-sm md:text-base">Study Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Load gamification stats after rendering
      await this.loadGamificationStats();
    } catch (error) {
      console.error('Error loading topics:', error);
      alert('Failed to load topics. Please refresh the page.');
    }
  }

  async startSession(topicId, topicName, systemPrompt, level) {
    try {
      // Special handling for Vocabulary topic
      if (topicName === 'Vocabulary') {
        await this.showVocabulary();
        return;
      }
      
      // Check if it's Vocabulary topic
      if (topicName === 'Vocabulary') {
        this.showVocabularyLearning();
        return;
      }

      const response = await axios.post('/api/sessions/create', {
        userId: this.currentUser.id,
        topicId: topicId,
        level: level
      });

      if (response.data.success) {
        this.currentSession = response.data.sessionId;
        this.currentTopic = {
          name: topicName,
          systemPrompt: systemPrompt
        };
        this.messages = [];
        this.showChatInterface();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    }
  }

  async resumeSession(sessionId) {
    try {
      // Fetch session details
      const response = await axios.get(`/api/sessions/${sessionId}`);
      if (response.data.success) {
        const session = response.data.session;
        this.currentSession = sessionId;
        this.currentTopic = {
          name: session.topic_name || 'Conversation',
          systemPrompt: session.system_prompt || ''
        };
        
        // Load messages for this session
        const messagesResponse = await axios.get(`/api/sessions/${sessionId}/messages`);
        this.messages = messagesResponse.data.messages || [];
        
        this.showChatInterface();
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      alert('Failed to resume session. Please try again.');
    }
  }

  showChatInterface() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        ${this.getSidebar('conversation')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
            <div class="flex items-center justify-between">
              <!-- Back Button + Title -->
              <div class="flex items-center gap-2 md:gap-4 flex-1">
                <button onclick="worvox.endSession()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h2 class="text-base md:text-lg font-semibold text-gray-800">${this.currentTopic.name}</h2>
                  <span class="hidden md:inline text-sm text-gray-500">Practice your English!</span>
                </div>
              </div>
              <!-- End Session (Desktop only) -->
              <button onclick="worvox.endSession()" 
                class="hidden md:flex items-center text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-times mr-2"></i>End Session
              </button>
            </div>
          </div>

          <!-- Chat Container -->
          <div class="flex-1 overflow-hidden flex flex-col">
            <div id="chatMessages" class="flex-1 overflow-y-auto p-6 chat-container">
              <div class="max-w-3xl mx-auto">
                <div class="text-center text-gray-500 py-12">
                  <i class="fas fa-comments text-5xl mb-4"></i>
                  <p class="text-lg">Start speaking to practice English!</p>
                  <p class="text-sm text-gray-400 mt-2">Tap the microphone button below</p>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="bg-white border-t border-gray-200">
              <div class="max-w-3xl mx-auto p-6">
                <div class="flex items-center gap-4">
                  <button id="recordBtn" 
                    class="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg"
                    onclick="worvox.toggleRecording()">
                    <i class="fas fa-microphone text-xl"></i>
                  </button>
                  <div class="flex-1">
                    <p id="statusText" class="text-gray-600">Tap the microphone to start speaking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load gamification stats after rendering
    setTimeout(() => this.loadGamificationStats(), 100);
  }

  async toggleRecording() {
    if (this.isRecording) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/webm with opus codec, fallback to default
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log('audio/webm;codecs=opus not supported, trying audio/webm');
        options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.log('audio/webm not supported, using default');
          options = {};
        }
      }
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];

      console.log('MediaRecorder created with mimeType:', this.mediaRecorder.mimeType);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const recordedAudio = new Blob(this.audioChunks, { type: mimeType });
        console.log('Recording stopped. Blob size:', recordedAudio.size, 'type:', recordedAudio.type);
        await this.processAudio(recordedAudio);
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Update UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.add('mic-recording', 'bg-red-600');
      recordBtn.innerHTML = '<i class="fas fa-stop text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Recording... Tap to stop';

    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        alert('Unable to access microphone: ' + error.message);
      }
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Update UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('mic-recording', 'bg-red-600');
      recordBtn.classList.add('bg-gray-400');
      recordBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Processing...';
    }
  }

  async processAudio(recordedAudio) {
    try {
      console.log('Processing audio blob:', recordedAudio.size, 'bytes, type:', recordedAudio.type);
      
      // Step 1: Transcribe audio
      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExt = recordedAudio.type.includes('webm') ? 'webm' : 
                     recordedAudio.type.includes('mp4') ? 'm4a' : 
                     recordedAudio.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', recordedAudio, `recording.${fileExt}`);

      console.log('Sending to STT API...');
      const transcriptionResponse = await axios.post('/api/stt/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('STT Response:', transcriptionResponse.data);
      const transcription = transcriptionResponse.data.transcription;
      
      if (!transcription || transcription.trim() === '') {
        throw new Error('No transcription received. Please speak clearly.');
      }
      
      // Add user message to UI
      this.addMessage('user', transcription);

      // Step 2: Get AI response
      console.log('Sending to Chat API...');
      const chatResponse = await axios.post('/api/chat/message', {
        sessionId: this.currentSession,
        userMessage: transcription,
        systemPrompt: this.currentTopic.systemPrompt
      });

      console.log('Chat Response:', chatResponse.data);
      const aiMessage = chatResponse.data.message;
      
      // Add AI message to UI (without audio yet)
      this.addMessage('assistant', aiMessage);

      // Step 3: Generate speech for AI response
      console.log('Sending to TTS API...');
      const ttsResponse = await axios.post('/api/tts/speak', {
        text: aiMessage
      }, {
        responseType: 'arraybuffer'
      });

      console.log('TTS Response received:', ttsResponse.data.byteLength, 'bytes');
      
      // Create audio blob and URL
      const ttsAudioBlob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(ttsAudioBlob);
      
      // Store audio URL for replay button
      const lastMessageIndex = this.messages.length - 1;
      this.messages[lastMessageIndex].audioUrl = audioUrl;
      
      // Add replay button to the last AI message
      this.addReplayButton(lastMessageIndex);
      
      // Play audio
      this.playAudio(audioUrl);

      // Reset UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('bg-gray-400');
      recordBtn.classList.add('bg-red-500');
      recordBtn.innerHTML = '<i class="fas fa-microphone text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Tap the microphone to speak again';

    } catch (error) {
      console.error('Error processing audio:', error);
      
      let errorMessage = 'Failed to process your message.';
      if (error.response) {
        console.error('API Error Response:', error.response.data);
        errorMessage = `API Error: ${error.response.data.error || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage + ' Please try again.');
      
      // Reset UI
      const recordBtn = document.getElementById('recordBtn');
      recordBtn.classList.remove('bg-gray-400');
      recordBtn.classList.add('bg-red-500');
      recordBtn.innerHTML = '<i class="fas fa-microphone text-2xl"></i>';
      document.getElementById('statusText').textContent = 'Error occurred. Tap to try again';
    }
  }

  addMessage(role, content) {
    const messageIndex = this.messages.length;
    this.messages.push({ role, content, audioUrl: null });
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove empty state if exists
    if (chatMessages.querySelector('.text-center')) {
      chatMessages.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 ${role === 'user' ? 'text-right' : 'text-left'} message-${role}`;
    messageDiv.id = `message-${messageIndex}`;
    
    messageDiv.innerHTML = `
      <div class="inline-block max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
        role === 'user' 
          ? 'bg-indigo-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }">
        <p class="text-sm md:text-base">${this.escapeHtml(content)}</p>
        ${role === 'assistant' ? '<div id="replay-container-' + messageIndex + '" class="mt-2"></div>' : ''}
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addReplayButton(messageIndex) {
    const replayContainer = document.getElementById(`replay-container-${messageIndex}`);
    if (replayContainer) {
      replayContainer.innerHTML = `
        <button 
          onclick="worvox.replayAudio(${messageIndex})" 
          id="replay-btn-${messageIndex}"
          class="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
          <i class="fas fa-redo"></i>
          <span>다시 듣기</span>
        </button>
      `;
    }
  }

  async replayAudio(messageIndex) {
    const message = this.messages[messageIndex];
    const replayBtn = document.getElementById(`replay-btn-${messageIndex}`);
    
    if (!message || !message.audioUrl) {
      alert('Audio not available');
      return;
    }
    
    try {
      // Update button state
      if (replayBtn) {
        replayBtn.disabled = true;
        replayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>재생 중...</span>';
      }
      
      // Play audio
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      
      this.currentAudio = new Audio(message.audioUrl);
      this.currentAudio.playbackRate = 0.85; // 15% slower for better comprehension
      
      this.currentAudio.onended = () => {
        if (replayBtn) {
          replayBtn.disabled = false;
          replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }
      };
      
      this.currentAudio.onerror = () => {
        if (replayBtn) {
          replayBtn.disabled = false;
          replayBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
          setTimeout(() => {
            replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
          }, 2000);
        }
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error('Error replaying audio:', error);
      if (replayBtn) {
        replayBtn.disabled = false;
        replayBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
        setTimeout(() => {
          replayBtn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }, 2000);
      }
    }
  }

  playAudio(url) {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    
    this.currentAudio = new Audio(url);
    this.currentAudio.play();
  }

  async endSession() {
    try {
      if (this.currentSession) {
        await axios.post(`/api/sessions/end/${this.currentSession}`);
      }
      this.currentSession = null;
      this.currentTopic = null;
      this.messages = [];
      this.showTopicSelection();
    } catch (error) {
      console.error('Error ending session:', error);
      this.showTopicSelection();
    }
  }

  logout() {
    localStorage.removeItem('worvox_user');
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.showLogin();
  }

  // Vocabulary feature
  async showVocabulary(difficulty = 'beginner', mode = 'list') {
    this.vocabularyDifficulty = difficulty; // 'beginner', 'intermediate', 'advanced'
    this.vocabularyMode = mode; // 'list', 'flashcard', 'quiz'
    
    // Reset mode-specific data when switching modes or difficulty
    if (mode === 'flashcard') {
      this.flashcardIndex = 0;
      this.flashcardFlipped = false;
    } else if (mode === 'quiz') {
      this.quizData = null; // Reset quiz data
    }
    
    try {
      // Fetch words by difficulty
      const response = await axios.get(`/api/vocabulary/list?difficulty=${difficulty}`);
      let words = response.data.words || [];
      
      // Shuffle words for flashcard/quiz mode
      if (mode !== 'list') {
        words = this.shuffleArray(words);
      }
      
      // Store data
      document.getElementById('app').dataset.vocabularyData = JSON.stringify({ words });
      
      // Get user progress
      let progressData = {};
      let bookmarkedWords = [];
      if (this.currentUser) {
        try {
          const progressResponse = await axios.get(`/api/vocabulary/progress/${this.currentUser.id}/all`);
          const bookmarksResponse = await axios.get(`/api/vocabulary/bookmarks/${this.currentUser.id}`);
          
          if (progressResponse.data.success) {
            const progress = progressResponse.data.progress || [];
            progress.forEach(p => {
              progressData[p.word_id] = p;
            });
          }
          
          if (bookmarksResponse.data.success) {
            bookmarkedWords = bookmarksResponse.data.bookmarks.map(b => b.word_id);
          }
        } catch (e) {
          console.log('Progress/bookmarks not loaded:', e);
        }
      }
  
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
          <!-- Sidebar -->
          ${this.getSidebar('vocabulary')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header with Back Button -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 mb-4">
                <button onclick="worvox.showTopicSelection()" 
                  class="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📚 Vocabulary Study</h1>
                  <p class="hidden md:block text-gray-600 text-sm mt-1">Learn English vocabulary by difficulty level</p>
                </div>
              </div>
              
              <!-- Difficulty Tabs -->
              <div class="flex gap-2 mb-4 overflow-x-auto">
                <button onclick="worvox.showVocabulary('beginner', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'beginner' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-seedling mr-2"></i>Beginner
                </button>
                <button onclick="worvox.showVocabulary('intermediate', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'intermediate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-book mr-2"></i>Intermediate
                </button>
                <button onclick="worvox.showVocabulary('advanced', '${mode}')" 
                  class="flex-shrink-0 px-4 md:px-6 py-2 md:py-3 ${difficulty === 'advanced' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-all font-semibold text-sm md:text-base">
                  <i class="fas fa-graduation-cap mr-2"></i>Advanced
                </button>
              </div>
              
              <!-- Mode Buttons -->
              <div class="flex gap-2">
                <button onclick="worvox.showVocabulary('${difficulty}', 'list')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-list mr-2"></i>List
                </button>
                <button onclick="worvox.showVocabulary('${difficulty}', 'flashcard')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'flashcard' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-clone mr-2"></i>Flashcard
                </button>
                <button onclick="worvox.showVocabulary('${difficulty}', 'quiz')" 
                  class="flex-1 px-3 md:px-4 py-2 ${mode === 'quiz' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors text-xs md:text-sm font-medium">
                  <i class="fas fa-graduation-cap mr-2"></i>Quiz
                </button>
              </div>
            </div>
            
            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6">
              ${this.renderVocabularyContent(mode, words, difficulty, progressData, bookmarkedWords)}
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      document.getElementById('app').innerHTML = `
        <div class="flex items-center justify-center h-screen">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Failed to Load Vocabulary</h2>
            <p class="text-gray-600 mb-4">${error.message}</p>
            <button onclick="worvox.showTopicSelection()" 
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Go Back
            </button>
          </div>
        </div>
      `;
    }
  }
  
  // Render content based on mode
  renderVocabularyContent(mode, words, difficulty, progressData, bookmarkedWords) {
    if (words.length === 0) {
      return `
        <div class="text-center py-12">
          <i class="fas fa-book-open text-gray-300 text-6xl mb-4"></i>
          <h3 class="text-xl font-bold text-gray-600 mb-2">No ${difficulty} words available yet</h3>
          <p class="text-gray-500">Check back later or try another difficulty level.</p>
        </div>
      `;
    }
    
    if (mode === 'list') {
      return this.renderListMode(words, progressData, bookmarkedWords);
    } else if (mode === 'flashcard') {
      return this.renderFlashcardMode(words, progressData, bookmarkedWords);
    } else if (mode === 'quiz') {
      return this.renderQuizMode(words, difficulty);
    }
  }
  
  // List Mode
  renderListMode(words, progressData, bookmarkedWords) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${words.map(word => {
          const isLearned = progressData[word.id]?.is_learned === 1;
          const isBookmarked = bookmarkedWords.includes(word.id);
          
          return `
            <div class="bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <!-- Word Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-xl md:text-2xl font-bold text-gray-800">${this.escapeHtml(word.word)}</h3>
                    <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
                      class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                      <i class="fas fa-volume-up"></i>
                    </button>
                  </div>
                  ${word.pronunciation ? `
                    <div class="text-sm text-gray-500 italic">${this.escapeHtml(word.pronunciation)}</div>
                  ` : ''}
                </div>
                
                ${this.currentUser ? `
                  <div class="flex items-center gap-2">
                    <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                      class="p-2 text-xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                      <i class="fas fa-star"></i>
                    </button>
                    ${isLearned ? '<i class="fas fa-check-circle text-green-600 text-xl"></i>' : ''}
                  </div>
                ` : ''}
              </div>
              
              <!-- Meanings -->
              <div class="mb-3 pb-3 border-b border-gray-100">
                <div class="text-gray-800 font-medium mb-1">${this.escapeHtml(word.meaning_ko)}</div>
                ${word.meaning_en ? `
                  <div class="text-gray-600 text-sm italic">${this.escapeHtml(word.meaning_en)}</div>
                ` : ''}
              </div>
              
              <!-- Example -->
              ${word.example_sentence ? `
                <div class="bg-gray-50 rounded-lg p-3 mb-3">
                  <div class="text-sm text-gray-700 italic">"${this.escapeHtml(word.example_sentence)}"</div>
                </div>
              ` : ''}
              
              <!-- Actions -->
              ${this.currentUser ? `
                <div class="flex gap-2">
                  <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                    class="flex-1 px-4 py-2 ${isLearned ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg font-medium transition-colors text-sm">
                    ${isLearned ? '<i class="fas fa-check mr-1"></i> Learned' : 'Mark as Learned'}
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Flashcard Mode (existing implementation - will keep similar)
  renderFlashcardMode(words, progressData, bookmarkedWords) {
    const word = words[0];
    const isLearned = progressData[word.id]?.is_learned === 1;
    const isBookmarked = bookmarkedWords.includes(word.id);
    
    return `
      <div class="max-w-2xl mx-auto">
        <!-- Progress Indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm">
            <span class="text-gray-600 font-medium">Card ${this.flashcardIndex + 1} / ${words.length}</span>
            <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 transition-all" style="width: ${((this.flashcardIndex + 1) / words.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <!-- Flashcard -->
        <div id="flashcard" 
          onclick="worvox.flipFlashcard()" 
          class="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 cursor-pointer hover:shadow-3xl transition-all min-h-[400px] flex items-center justify-center border-4 border-indigo-100">
          <div id="flashcard-front" class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.word)}</div>
            ${word.pronunciation ? `
              <div class="text-lg text-gray-500 italic mb-6">${this.escapeHtml(word.pronunciation)}</div>
            ` : ''}
            <div class="text-gray-400 text-sm mt-8">
              <i class="fas fa-sync-alt mr-2"></i>Click to flip
            </div>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="mt-6 flex items-center justify-between">
          <button onclick="worvox.previousFlashcard()" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors ${this.flashcardIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left mr-2"></i>Previous
          </button>
  
          <div class="flex items-center gap-2">
            ${this.currentUser ? `
              <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                class="p-3 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                <i class="fas fa-star"></i>
              </button>
              <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                class="px-4 py-2 ${isLearned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg font-semibold hover:opacity-80 transition-opacity">
                ${isLearned ? '✓ Learned' : 'Mark Learned'}
              </button>
            ` : ''}
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>
  
          <button onclick="worvox.nextFlashcard()" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors ${this.flashcardIndex >= words.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex >= words.length - 1 ? 'disabled' : ''}>
            Next<i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    `;
  }
  
  // Quiz Mode (will use existing quiz implementation)
  renderQuizMode(words, difficulty) {
    if (!words || words.length === 0) {
      return `
        <div class="max-w-3xl mx-auto">
          <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div class="text-6xl mb-4">📖</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h3>
            <p class="text-gray-600">Add some vocabulary words first!</p>
          </div>
        </div>
      `;
    }

    // Initialize quiz if not already initialized
    if (!this.quizData) {
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const selectedWords = shuffledWords.slice(0, Math.min(10, words.length));
      
      this.quizData = {
        questions: selectedWords.map(word => {
          // Get other words for wrong options
          const otherWords = words.filter(w => w.id !== word.id);
          const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
          const wrongOptions = shuffledOthers.slice(0, 3).map(w => w.meaning_ko);
          
          // Combine correct answer with wrong options and shuffle
          const options = [word.meaning_ko, ...wrongOptions].sort(() => Math.random() - 0.5);
          
          return {
            word: word,
            options: options,
            userAnswer: null,
            isCorrect: null
          };
        }),
        currentIndex: 0,
        score: 0,
        finished: false
      };
    }

    const quiz = this.quizData;
    
    if (quiz.finished) {
      return this.renderQuizResults();
    }

    const question = quiz.questions[quiz.currentIndex];
    const word = question.word;

    return `
      <div class="max-w-3xl mx-auto">
        <!-- Quiz Progress -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-gray-600 font-semibold">Question ${quiz.currentIndex + 1} / ${quiz.questions.length}</span>
            <span class="text-indigo-600 font-bold text-lg">Score: ${quiz.score} / ${quiz.currentIndex}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-indigo-600 h-3 rounded-full transition-all" style="width: ${(quiz.currentIndex / quiz.questions.length) * 100}%"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div class="text-center mb-8">
            <h2 class="text-5xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up text-xl"></i>
            </button>
          </div>

          <p class="text-gray-700 text-xl mb-8 text-center font-medium">이 단어의 뜻은 무엇일까요?</p>

          <!-- Options -->
          <div class="space-y-3">
            ${question.options.map((option, index) => {
              const isSelected = question.userAnswer === option;
              const isCorrect = option === word.meaning_ko;
              let buttonClass = 'bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-indigo-400';
              let iconHtml = '';
              
              if (question.userAnswer !== null) {
                if (isCorrect) {
                  buttonClass = 'bg-green-50 border-2 border-green-500';
                  iconHtml = '<i class="fas fa-check-circle text-green-600 text-2xl"></i>';
                } else if (isSelected) {
                  buttonClass = 'bg-red-50 border-2 border-red-500';
                  iconHtml = '<i class="fas fa-times-circle text-red-600 text-2xl"></i>';
                }
              }
              
              return `
                <button 
                  onclick="worvox.selectQuizAnswer('${this.escapeHtml(option)}')"
                  ${question.userAnswer !== null ? 'disabled' : ''}
                  class="w-full p-5 ${buttonClass} rounded-xl transition-all text-left flex items-center justify-between group ${question.userAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}">
                  <span class="text-lg font-medium text-gray-800">${this.escapeHtml(option)}</span>
                  ${iconHtml}
                </button>
              `;
            }).join('')}
          </div>

          ${question.userAnswer !== null ? `
            <div class="mt-6 p-4 ${question.isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'} rounded-xl">
              <p class="text-lg font-semibold mb-2 ${question.isCorrect ? 'text-green-800' : 'text-red-800'}">
                ${question.isCorrect ? '✓ 정답입니다!' : '✗ 틀렸습니다'}
              </p>
              ${word.example_sentence ? `
                <p class="text-gray-700 text-sm italic">"${this.escapeHtml(word.example_sentence)}"</p>
              ` : ''}
            </div>
            
            <button 
              onclick="worvox.nextQuizQuestion()"
              class="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all">
              ${quiz.currentIndex < quiz.questions.length - 1 ? 'Next Question →' : 'Show Results 🎉'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    const frontDiv = document.getElementById('flashcard-front');
    
    if (!this.flashcardFlipped) {
      // Show back
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      const words = response.words;
      const word = words[this.flashcardIndex];
      
      frontDiv.innerHTML = `
        <div class="text-center">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.meaning_ko)}</h2>
          ${word.example_sentence ? `
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <p class="text-gray-600 text-sm mb-2">예문:</p>
              <p class="text-gray-800 italic">${this.escapeHtml(word.example_sentence)}</p>
            </div>
          ` : ''}
          <p class="mt-8 text-gray-500 text-sm">클릭하여 영어 단어 보기</p>
        </div>
      `;
      this.flashcardFlipped = true;
    } else {
      // Show front
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      const words = response.words;
      const word = words[this.flashcardIndex];
      
      frontDiv.innerHTML = `
        <h2 class="text-5xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
        <div class="flex items-center justify-center gap-2">
          <span class="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">
            ${this.escapeHtml(word.part_of_speech)}
          </span>
          ${word.toeic_related ? `
          <span class="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded">
            TOEIC
          </span>
          ` : ''}
          ${word.toefl_related ? `
          <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
            TOEFL
          </span>
          ` : ''}
        </div>
        <p class="mt-8 text-gray-500 text-sm">클릭하여 뜻 보기</p>
      `;
      this.flashcardFlipped = false;
    }
  }

  async pronounceFlashcardWord(word) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: word,
        voice: 'nova'
      }, {
        responseType: 'arraybuffer'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
    }
  }

  async nextFlashcard() {
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const words = response.words;
    
    if (this.flashcardIndex < words.length - 1) {
      this.flashcardIndex++;
      this.flashcardFlipped = false;
      // Only update the flashcard content, not the entire page
      this.updateFlashcardContent(response.words);
    }
  }

  async previousFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.flashcardFlipped = false;
      // Only update the flashcard content, not the entire page
      const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
      this.updateFlashcardContent(response.words);
    }
  }

  updateFlashcardContent(words) {
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const allWords = response.words || words;
    const word = allWords[this.flashcardIndex];
    
    // Get user progress
    let progressData = {};
    let bookmarkedWords = [];
    const isLearned = progressData[word.id]?.is_learned === 1;
    const isBookmarked = bookmarkedWords.includes(word.id);
    
    // Update flashcard content only
    const flashcardContainer = document.querySelector('.max-w-2xl.mx-auto');
    if (flashcardContainer) {
      flashcardContainer.innerHTML = `
        <!-- Progress Indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm">
            <span class="text-gray-600 font-medium">Card ${this.flashcardIndex + 1} / ${allWords.length}</span>
            <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 transition-all" style="width: ${((this.flashcardIndex + 1) / allWords.length) * 100}%"></div>
            </div>
          </div>
        </div>
        
        <!-- Flashcard -->
        <div id="flashcard" 
          onclick="worvox.flipFlashcard()" 
          class="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 cursor-pointer hover:shadow-3xl transition-all min-h-[400px] flex items-center justify-center border-4 border-indigo-100">
          <div id="flashcard-front" class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">${this.escapeHtml(word.word)}</div>
            ${word.pronunciation ? `
              <div class="text-lg text-gray-500 italic mb-6">${this.escapeHtml(word.pronunciation)}</div>
            ` : ''}
            <div class="text-gray-400 text-sm mt-8">
              <i class="fas fa-sync-alt mr-2"></i>Click to flip
            </div>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="mt-6 flex items-center justify-between">
          <button onclick="worvox.previousFlashcard()" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors ${this.flashcardIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left mr-2"></i>Previous
          </button>

          <div class="flex items-center gap-2">
            ${this.currentUser ? `
              <button onclick="worvox.toggleBookmark(${word.id}, ${isBookmarked})" 
                class="p-3 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                <i class="fas fa-star"></i>
              </button>
              <button onclick="worvox.toggleLearnedStatus(${word.id}, ${!isLearned})" 
                class="px-4 py-2 ${isLearned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg font-semibold hover:opacity-80 transition-opacity">
                ${isLearned ? '✓ Learned' : 'Mark Learned'}
              </button>
            ` : ''}
            <button onclick="worvox.playPronunciation('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>

          <button onclick="worvox.nextFlashcard()" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors ${this.flashcardIndex >= allWords.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex >= allWords.length - 1 ? 'disabled' : ''}>
            Next<i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      `;
    }
  }



  async selectQuizAnswer(answer) {
    const question = this.quizData.questions[this.quizData.currentIndex];
    
    if (question.userAnswer !== null) return; // Already answered
    
    question.userAnswer = answer;
    question.isCorrect = (answer === question.word.meaning_ko);
    
    if (question.isCorrect) {
      this.quizData.score++;
      
      // Award XP for correct answer
      if (typeof gamificationManager !== 'undefined' && this.currentUser) {
        await gamificationManager.addXP(
          this.currentUser.id,
          15, // 15 XP per correct answer
          'quiz_correct',
          `Correct answer for word: ${question.word.word}`
        );
      }
    }
    
    // Update only the quiz content area, not the entire page
    this.updateQuizContent();
  }

  async nextQuizQuestion() {
    this.quizData.currentIndex++;
    
    if (this.quizData.currentIndex >= this.quizData.questions.length) {
      this.quizData.finished = true;
      
      // Award bonus XP for completing quiz
      if (typeof gamificationManager !== 'undefined' && this.currentUser) {
        await gamificationManager.addXP(
          this.currentUser.id,
          50, // 50 XP bonus for completing quiz
          'quiz_complete',
          `Completed quiz with score: ${this.quizData.score}/${this.quizData.questions.length}`
        );
      }
    }
    
    // Update only the quiz content area
    this.updateQuizContent();
  }

  updateQuizContent() {
    const contentArea = document.querySelector('.flex-1.overflow-y-auto.p-4.md\\:p-6');
    if (!contentArea) return;
    
    const response = JSON.parse(document.getElementById('app').dataset.vocabularyData);
    const words = response.words;
    
    contentArea.innerHTML = this.renderQuizMode(words, this.vocabularyDifficulty);
  }

  renderQuizResults() {
    const quiz = this.quizData;
    const percentage = Math.round((quiz.score / quiz.questions.length) * 100);
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
      emoji = '🎉';
      message = '완벽해요! 정말 잘하셨어요!';
    } else if (percentage >= 70) {
      emoji = '👏';
      message = '잘했어요! 조금만 더 연습하면 완벽할 거예요!';
    } else if (percentage >= 50) {
      emoji = '💪';
      message = '괜찮아요! 계속 연습하세요!';
    } else {
      emoji = '📚';
      message = '더 열심히 공부해봐요!';
    }

    return `
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div class="text-8xl mb-6">${emoji}</div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">퀴즈 완료!</h2>
          <p class="text-xl text-gray-600 mb-8">${message}</p>
          
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">정답</p>
              <p class="text-3xl font-bold text-green-600">${quiz.score}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">오답</p>
              <p class="text-3xl font-bold text-red-600">${quiz.questions.length - quiz.score}</p>
            </div>
            <div class="bg-indigo-50 p-4 rounded-lg">
              <p class="text-gray-600 text-sm mb-1">정답률</p>
              <p class="text-3xl font-bold text-indigo-600">${percentage}%</p>
            </div>
          </div>

          <div class="space-y-3">
            <button onclick="worvox.startNewQuiz()" 
              class="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-forward mr-2"></i>Next Quiz (새로운 단어)
            </button>
            <button onclick="worvox.restartQuiz()" 
              class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-redo mr-2"></i>다시 풀기 (같은 단어)
            </button>
            <button onclick="worvox.showVocabulary('list')" 
              class="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors">
              <i class="fas fa-list mr-2"></i>단어 목록으로
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async restartQuiz() {
    this.quizData = null;
    this.flashcardIndex = 0;
    await this.showVocabulary('quiz');
  }

  async startNewQuiz() {
    // Reset quiz data to generate new questions with different words
    this.quizData = null;
    this.flashcardIndex = 0;
    
    // Mark that we want new words (not just resetting the same quiz)
    this.quizNeedsNewWords = true;
    
    await this.showVocabulary('quiz');
  }

  // History feature
  async showHistory() {
    try {
      const response = await axios.get(`/api/history/sessions/${this.currentUser.id}`);
      const sessions = response.data.sessions;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
          <!-- Sidebar -->
          ${this.getSidebar('history')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2">
                <button onclick="worvox.showTopicSelection()" 
                  class="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📚 Learning History</h1>
                  <p class="hidden md:block text-gray-600 text-sm mt-1">Review your past conversations and track your progress</p>
                </div>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="max-w-4xl mx-auto">
                ${sessions.length === 0 ? `
                  <div class="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div class="text-6xl mb-4">📝</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">No Learning History Yet</h3>
                    <p class="text-gray-600 mb-6">Start a conversation to see your learning history here!</p>
                    <button onclick="worvox.showTopicSelection()" 
                      class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all">
                      Start Learning
                    </button>
                  </div>
                ` : `
                  <div class="bg-white rounded-2xl shadow-sm p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Your Sessions (${sessions.length})</h2>
                    <div class="space-y-4">
                      ${this.groupSessionsByDate(sessions)}
                    </div>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Failed to load history. Please try again.');
    }
  }

  groupSessionsByDate(sessions) {
    // Group sessions by date
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.started_at);
      const dateOnly = new Date(sessionDate);
      dateOnly.setHours(0, 0, 0, 0);
      
      // Format date in English
      const dateLabel = sessionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
      
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(session);
    });

    // Generate HTML
    let html = '';
    for (const [date, dateSessions] of Object.entries(grouped)) {
      html += `
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <i class="fas fa-calendar-day mr-2 text-indigo-600"></i>${date}
          </h3>
          <div class="space-y-3">
            ${dateSessions.map(session => this.renderSessionCard(session)).join('')}
          </div>
        </div>
      `;
    }
    
    return html;
  }

  renderSessionCard(session) {
    const sessionDate = new Date(session.started_at);
    
    // Format time in English (12-hour format with AM/PM)
    const startTime = sessionDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const duration = session.ended_at 
      ? Math.round((new Date(session.ended_at) - sessionDate) / 1000 / 60)
      : 'In progress';
    
    return `
      <div class="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-all card-hover"
        onclick="worvox.showConversation(${session.id})">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${session.topic_icon || '📚'}</span>
              <h4 class="text-lg font-bold text-gray-800">${session.topic_name || 'Conversation'}</h4>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <span><i class="fas fa-clock mr-1"></i>${startTime}</span>
              <span><i class="fas fa-hourglass-half mr-1"></i>${duration}${typeof duration === 'number' ? ' min' : ''}</span>
              <span><i class="fas fa-comment mr-1"></i>${session.message_count} messages</span>
              <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                ${session.level}
              </span>
            </div>
            ${session.topic_description ? `
              <p class="text-gray-600 text-sm mt-2">${session.topic_description}</p>
            ` : ''}
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
      </div>
    `;
  }

  async showConversation(sessionId) {
    try {
      const response = await axios.get(`/api/history/conversation/${sessionId}`);
      const { session, messages } = response.data;

      const sessionDate = new Date(session.started_at);
      const startTime = sessionDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <button onclick="worvox.showHistory()" 
                class="text-indigo-600 hover:text-indigo-800 transition-colors mb-4">
                <i class="fas fa-arrow-left mr-2"></i>Back to History
              </button>
              
              <div class="flex items-start gap-4">
                <span class="text-4xl">${session.topic_icon || '📚'}</span>
                <div class="flex-1">
                  <h1 class="text-2xl font-bold text-gray-800 mb-2">${session.topic_name}</h1>
                  <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                    <span><i class="fas fa-user mr-1"></i>${session.username}</span>
                    <span><i class="fas fa-calendar mr-1"></i>${startTime}</span>
                    <span><i class="fas fa-comment mr-1"></i>${messages.length} messages</span>
                    <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      ${session.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Conversation -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-6">Conversation</h2>
              
              ${messages.length === 0 ? `
                <div class="text-center py-12 text-gray-500">
                  <i class="fas fa-comment-slash text-4xl mb-4"></i>
                  <p>No messages in this conversation</p>
                </div>
              ` : `
                <div class="space-y-4">
                  ${messages.map(msg => this.renderHistoryMessage(msg)).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Failed to load conversation. Please try again.');
    }
  }

  renderHistoryMessage(message) {
    const messageDate = new Date(message.created_at);
    const time = messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const isUser = message.role === 'user';
    const messageId = `history-msg-${message.id}`;
    
    return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs md:max-w-md lg:max-w-lg">
          <div class="inline-block px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }">
            <p class="text-sm md:text-base">${this.escapeHtml(message.content)}</p>
            ${!isUser ? `
              <div class="mt-2">
                <button 
                  onclick="worvox.playHistoryMessage('${this.escapeHtml(message.content)}', '${messageId}')" 
                  id="${messageId}"
                  class="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors">
                  <i class="fas fa-redo"></i>
                  <span>다시 듣기</span>
                </button>
              </div>
            ` : ''}
          </div>
          <p class="text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}">${time}</p>
        </div>
      </div>
    `;
  }

  async playHistoryMessage(text, buttonId) {
    const btn = document.getElementById(buttonId);
    
    try {
      // Update button state
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>재생 중...</span>';
      }
      
      // Call TTS API
      const response = await axios.post('/api/tts/speak', {
        text: text,
        voice: 'nova'
      }, {
        responseType: 'arraybuffer'
      });

      // Play audio
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (this.currentAudio) {
        this.currentAudio.pause();
      }
      
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }
        URL.revokeObjectURL(audioUrl);
      };
      
      this.currentAudio.onerror = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
          setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
          }, 2000);
        }
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error('Error playing history message:', error);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-redo"></i><span>다시 듣기</span>';
        }, 2000);
      }
    }
  }

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    const shuffled = [...array]; // Create a copy
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show Plan/Pricing Page
  showPlan() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        ${this.getSidebar('plan')}
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-800">💎 요금제</h1>
                <p class="text-gray-600 mt-1">WorVox와 함께 영어 실력을 향상시키세요</p>
              </div>
            </div>
          </div>
          
          <!-- Pricing Cards -->
          <div class="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <!-- 7-day Free Trial Banner -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-6 mb-8 text-center">
              <h2 class="text-2xl font-bold mb-2">🎉 7일 무료 체험</h2>
              <p class="text-emerald-50">Premium과 Business 플랜을 7일간 무료로 체험해보세요!</p>
            </div>
            
            <!-- Pricing Cards Grid -->
            <div class="grid md:grid-cols-3 gap-6 md:gap-8">
              <!-- Free Plan -->
              <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-gray-200 hover:border-gray-300 transition-all">
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">💚</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                  <div class="text-4xl font-bold text-gray-900 mb-2">₩0</div>
                  <p class="text-gray-500 text-sm">영원히 무료</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">AI 영어 대화 <strong>하루 5회</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">단어장 전체 레벨</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">Flashcard & Quiz 무제한</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">발음 연습 <strong>하루 10회</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-green-600 mt-1"></i>
                    <span class="text-gray-700">XP/레벨 시스템</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-times text-gray-300 mt-1"></i>
                    <span class="text-gray-400">학습 분석 리포트</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-times text-gray-300 mt-1"></i>
                    <span class="text-gray-400">AI 상세 피드백</span>
                  </li>
                </ul>
                
                <button class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                  현재 플랜
                </button>
              </div>
              
              <!-- Premium Plan -->
              <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border-4 border-emerald-500 relative transform md:scale-105">
                <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-sm font-bold">
                  인기
                </div>
                
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">⭐</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Premium</h3>
                  <div class="text-4xl font-bold text-emerald-600 mb-2">₩9,900</div>
                  <p class="text-gray-500 text-sm mb-1">/월</p>
                  <p class="text-emerald-600 text-sm font-semibold">연간 결제 시 ₩95,040 (20% 할인)</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>AI 영어 대화 무제한</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">단어장 전체 레벨</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">Flashcard & Quiz 무제한</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>발음 연습 무제한</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">XP/레벨 시스템</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>학습 분석 리포트 (주간/월간)</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>AI 상세 피드백</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">개인 맞춤 학습</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700">광고 제거</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-emerald-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Real Conversation 20% 할인</strong></span>
                  </li>
                </ul>
                
                <button onclick="worvox.upgradePlan('premium')" class="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg">
                  7일 무료 체험 시작
                </button>
              </div>
              
              <!-- Business Plan -->
              <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-indigo-200 hover:border-indigo-300 transition-all">
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">🏢</div>
                  <h3 class="text-2xl font-bold text-gray-800 mb-2">Business</h3>
                  <div class="text-4xl font-bold text-indigo-600 mb-2">₩89,000</div>
                  <p class="text-gray-500 text-sm mb-1">/월/인</p>
                  <p class="text-indigo-600 text-sm font-semibold">연간 결제 시 ₩854,400 (20% 할인)</p>
                </div>
                
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Premium 전체 기능</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>실시간 학습 대시보드</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>팀 관리 기능</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>전담 매니저</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>Real Conversation 30% 할인</strong></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <i class="fas fa-check text-indigo-600 mt-1"></i>
                    <span class="text-gray-700"><strong>5인 이상 추가 20% 할인</strong></span>
                  </li>
                </ul>
                
                <button onclick="worvox.contactSales()" class="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
                  영업팀 문의하기
                </button>
              </div>
            </div>
            
            <!-- Feature Comparison Table -->
            <div class="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div class="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4">
                <h3 class="text-xl font-bold">기능 상세 비교</h3>
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">기능</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-gray-700">Free</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-emerald-700">Premium</th>
                      <th class="px-6 py-4 text-center text-sm font-semibold text-indigo-700">Business</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <!-- 핵심 학습 기능 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-graduation-cap mr-2 text-blue-600"></i>핵심 학습 기능
                      </td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">AI 영어 대화</td>
                      <td class="px-6 py-4 text-center text-sm">하루 5회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">발음 연습</td>
                      <td class="px-6 py-4 text-center text-sm">하루 10회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어 검색 (AI 생성)</td>
                      <td class="px-6 py-4 text-center text-sm">하루 10회</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">대화 주제</td>
                      <td class="px-6 py-4 text-center text-sm">기본 2개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">전체 (10개+)</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">전체 + 커스텀</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">대화 히스토리 저장</td>
                      <td class="px-6 py-4 text-center text-sm">최근 10개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    
                    <!-- 단어장 & 학습 도구 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-book mr-2 text-purple-600"></i>단어장 & 학습 도구
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어장 (전체 레벨)</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">Flashcard & Quiz</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">단어 북마크</td>
                      <td class="px-6 py-4 text-center text-sm">최대 50개</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">무제한</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">무제한</td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">나만의 단어장</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 분석 & 피드백 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-chart-line mr-2 text-green-600"></i>분석 & 피드백
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">기본 학습 통계</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">학습 분석 리포트</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600">주간/월간</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">실시간 대시보드</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">AI 상세 피드백</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">문법 오류 분석</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">발음 개선 제안</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">개인 맞춤 학습 플랜</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 게임화 & 보상 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-trophy mr-2 text-yellow-600"></i>게임화 & 보상
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">XP/레벨 시스템</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">배지 & 업적</td>
                      <td class="px-6 py-4 text-center text-sm">기본</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">전체</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">전체 + 특별</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">리더보드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">팀 전용</td>
                    </tr>
                    
                    <!-- Real Conversation -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-user-tie mr-2 text-red-600"></i>Real Conversation (1:1 원어민 수업)
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">수업 예약</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">수업 할인</td>
                      <td class="px-6 py-4 text-center text-sm">정가</td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600 font-semibold">20% 할인</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">30% 할인</td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">우선 예약</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    
                    <!-- 기타 기능 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-cog mr-2 text-gray-600"></i>기타 기능
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">광고 제거</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">오프라인 모드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-emerald-600"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">우선 고객 지원</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-emerald-600">이메일</td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600">24시간 채팅</td>
                    </tr>
                    
                    <!-- Business 전용 -->
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 font-semibold" colspan="4">
                        <i class="fas fa-briefcase mr-2 text-indigo-600"></i>Business 전용
                      </td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">팀 관리 대시보드</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">팀원 학습 진도 추적</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">전담 학습 매니저</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">커스텀 학습 콘텐츠</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr class="bg-gray-50">
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">API 접근 (기업 연동)</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-check text-indigo-600"></i></td>
                    </tr>
                    <tr>
                      <td class="px-6 py-4 text-sm text-gray-700 pl-10">5인 이상 단체 할인</td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                      <td class="px-6 py-4 text-center text-sm text-indigo-600 font-semibold">추가 20% 할인</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Upgrade to Premium
  upgradePlan(plan) {
    const planName = plan === 'premium' ? 'Premium' : 'Business';
    alert('💎 ' + planName + ' 플랜 업그레이드\n\n결제 시스템 연동 준비 중입니다.\n\n곧 만나요! 🚀');
  }

  // Contact Sales for Business Plan
  contactSales() {
    alert('🏢 Business 플랜 문의\n\n영업팀 연락처:\n📧 business@worvox.com\n📞 02-1234-5678\n\n담당자가 곧 연락드리겠습니다!');
  }

  // Load usage data from localStorage
  loadUsageData() {
    const savedUsage = localStorage.getItem('worvox_usage');
    if (savedUsage) {
      try {
        const usage = JSON.parse(savedUsage);
        const today = new Date().toDateString();
        
        // Reset if new day
        if (usage.lastReset !== today) {
          this.resetDailyUsage();
        } else {
          this.dailyUsage = usage;
        }
      } catch (e) {
        console.error('Failed to load usage data:', e);
        this.resetDailyUsage();
      }
    }
  }

  // Save usage data to localStorage
  saveUsageData() {
    localStorage.setItem('worvox_usage', JSON.stringify(this.dailyUsage));
  }

  // Reset daily usage
  resetDailyUsage() {
    this.dailyUsage = {
      aiConversations: 0,
      pronunciationPractice: 0,
      wordSearch: 0,
      lastReset: new Date().toDateString()
    };
    this.saveUsageData();
  }

  // Check usage limit
  checkUsageLimit(feature) {
    const limit = this.usageLimits[this.userPlan][feature];
    const current = this.dailyUsage[feature];
    
    if (current >= limit) {
      this.showUpgradeBanner(feature, current, limit);
      return false;
    }
    
    return true;
  }

  // Increment usage
  incrementUsage(feature) {
    this.dailyUsage[feature]++;
    this.saveUsageData();
    
    // Show warning when approaching limit
    const limit = this.usageLimits[this.userPlan][feature];
    const current = this.dailyUsage[feature];
    
    if (this.userPlan === 'free' && current >= limit * 0.8) {
      this.showUsageWarning(feature, current, limit);
    }
  }

  // Show upgrade banner when limit reached
  showUpgradeBanner(feature, current, limit) {
    const featureNames = {
      aiConversations: 'AI 영어 대화',
      pronunciationPractice: '발음 연습',
      wordSearch: '단어 검색'
    };
    
    const banner = document.createElement('div');
    banner.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4';
    banner.innerHTML = `
      <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-2xl p-6 animate-bounce">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-4xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">오늘 ${featureNames[feature]} 횟수 초과 ⚠️</h3>
            <p class="text-sm text-red-50 mb-4">
              ${featureNames[feature]} 하루 ${limit}회 중 ${current}회를 모두 사용했습니다.<br>
              Premium으로 업그레이드하고 <strong>무제한</strong>으로 사용하세요! 🚀
            </p>
            <div class="flex gap-2">
              <button onclick="worvox.showPlan(); document.querySelector('.fixed.top-4').remove();" 
                class="flex-1 bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-all">
                <i class="fas fa-crown mr-2"></i>Premium 보기
              </button>
              <button onclick="this.closest('.fixed').remove()" 
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  // Show usage warning when approaching limit
  showUsageWarning(feature, current, limit) {
    const featureNames = {
      aiConversations: 'AI 영어 대화',
      pronunciationPractice: '발음 연습',
      wordSearch: '단어 검색'
    };
    
    const remaining = limit - current;
    
    // Only show if exactly at warning threshold
    if (current === Math.ceil(limit * 0.8)) {
      const banner = document.createElement('div');
      banner.className = 'fixed top-4 right-4 z-50 max-w-sm';
      banner.innerHTML = `
        <div class="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-xl shadow-lg p-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
            <div class="flex-1">
              <h4 class="font-bold mb-1">${featureNames[feature]} 곧 소진</h4>
              <p class="text-sm">오늘 ${remaining}회 남았습니다!</p>
              <button onclick="worvox.showPlan(); this.closest('.fixed').remove();" 
                class="mt-2 text-xs underline hover:no-underline">
                Premium 보기 →
              </button>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-700 hover:text-gray-900">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(banner);
      
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 5000);
    }
  }

  // Word Search Feature with Hybrid Approach
  async searchWord() {
    const searchInput = document.getElementById('wordSearch');
    const searchResult = document.getElementById('searchResult');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
      searchResult.innerHTML = '';
      return;
    }
    
    // Show loading state
    searchResult.innerHTML = `
      <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
        <p class="text-gray-600">Searching...</p>
      </div>
    `;
    
    try {
      // Search in vocabulary (DB first, then ChatGPT if not found)
      const response = await axios.get('/api/vocabulary/search', {
        params: { query: searchTerm.toLowerCase() }
      });
      
      if (response.data.success && response.data.words.length > 0) {
        const word = response.data.words[0]; // Get first match
        const source = response.data.source; // 'database' or 'chatgpt'
        const summary = word.summary || [];
        
        searchResult.innerHTML = `
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 animate-fadeIn">
            <!-- Header with Word and Pronunciation -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-2xl font-bold text-gray-800">${word.word}</h3>
                  <button 
                    onclick="worvox.playPronunciation('${word.word}')"
                    class="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                    <i class="fas fa-volume-up"></i>
                  </button>
                  ${source === 'chatgpt' ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✨ AI</span>' : ''}
                </div>
                <div class="text-sm text-gray-500 mb-3">${word.pronunciation || ''}</div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    ${word.part_of_speech}
                  </span>
                  ${word.toeic_related ? '<span class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">TOEIC</span>' : ''}
                  ${word.toefl_related ? '<span class="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold">TOEFL</span>' : ''}
                  <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    ${word.difficulty}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Meanings -->
            <div class="mb-4 pb-4 border-b border-indigo-100">
              <!-- Korean Meaning with Play Button -->
              <div class="mb-3">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-lg font-semibold text-gray-700">한국어 뜻:</div>
                  <button onclick="worvox.playKoreanMeaning('${word.meaning_ko}')" 
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-all">
                    <i class="fas fa-volume-up"></i>
                    듣기
                  </button>
                </div>
                <div class="text-gray-800 text-lg">${word.meaning_ko}</div>
              </div>
              
              <!-- English Meaning -->
              ${word.meaning_en ? `
                <div class="pt-3 border-t border-indigo-50">
                  <div class="text-sm font-semibold text-gray-600 mb-1">English Definition:</div>
                  <div class="text-gray-700 text-sm italic">${word.meaning_en}</div>
                </div>
              ` : ''}
            </div>
            
            ${summary.length > 0 ? `
              <!-- 5-Point Summary (from ChatGPT) -->
              <div class="mb-4 pb-4 border-b border-indigo-100">
                <div class="text-sm font-semibold text-indigo-700 mb-3">📌 핵심 요약:</div>
                <div class="space-y-2">
                  ${summary.map((point, index) => `
                    <div class="flex items-start gap-2">
                      <span class="text-indigo-600 font-bold mt-0.5">✓</span>
                      <span class="text-gray-700 text-sm">${point}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${word.example_sentence ? `
              <!-- Example Sentence -->
              <div class="bg-white rounded-lg p-4 border border-indigo-100 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-indigo-700">예문:</div>
                  <button 
                    onclick="worvox.playExampleSentence('${word.example_sentence.replace(/'/g, "\\'")}')"
                    class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition-all">
                    <i class="fas fa-volume-up mr-1"></i>듣기
                  </button>
                </div>
                <div class="text-gray-700 italic">"${word.example_sentence}"</div>
              </div>
            ` : ''}
            
            <!-- External Links -->
            <div class="bg-white rounded-lg p-4 border border-indigo-100">
              <div class="text-sm font-semibold text-indigo-700 mb-3">🔗 자세히 보기:</div>
              <div class="grid grid-cols-2 gap-2">
                <a href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 text-sm transition-all">
                  <i class="fas fa-book"></i>
                  <span>Cambridge</span>
                </a>
                <a href="https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 text-sm transition-all">
                  <i class="fas fa-book-open"></i>
                  <span>Oxford</span>
                </a>
                <a href="https://youglish.com/pronounce/${encodeURIComponent(word.word)}/english" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 text-sm transition-all">
                  <i class="fas fa-video"></i>
                  <span>Youglish</span>
                </a>
                <a href="https://www.wordreference.com/definition/${encodeURIComponent(word.word)}" 
                  target="_blank" 
                  class="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 text-sm transition-all">
                  <i class="fas fa-language"></i>
                  <span>WordRef</span>
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        searchResult.innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
            <i class="fas fa-search text-yellow-600 text-3xl mb-2"></i>
            <p class="text-gray-700">Word not found: "<strong>${searchTerm}</strong>"</p>
            <p class="text-sm text-gray-600 mt-2">Try searching for another word.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResult.innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mb-2"></i>
          <p class="text-gray-700">An error occurred while searching.</p>
          <p class="text-sm text-gray-600 mt-2">${error.response?.data?.message || 'Please try again.'}</p>
        </div>
      `;
    }
  }
  
  async playPronunciation(word) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: word,
        language: 'en'
      }, {
        responseType: 'blob'
      });
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to play pronunciation. Please try again.');
    }
  }
  
  async playExampleSentence(sentence) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: sentence,
        language: 'en'
      }, {
        responseType: 'blob'
      });
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.85; // 15% slower for better comprehension
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      alert('Failed to play sentence. Please try again.');
    }
  }

  // Statistics feature
  async showStats() {
    try {
      const response = await axios.get(`/api/history/stats/${this.currentUser.id}`);
      const stats = response.data.stats;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
          <!-- Sidebar -->
          ${this.getSidebar('stats')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-6 py-4">
              <div>
                <h1 class="text-2xl font-bold text-gray-800">📊 Learning Statistics</h1>
                <p class="text-gray-600 text-sm mt-1">Track your learning progress and insights</p>
              </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6">
              <div class="max-w-7xl mx-auto">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">📚</div>
                    <div class="text-3xl font-bold text-blue-700">${stats.totalSessions}</div>
                    <div class="text-sm text-blue-600">Total Sessions</div>
                  </div>
                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">💬</div>
                    <div class="text-3xl font-bold text-green-700">${stats.totalMessages}</div>
                    <div class="text-sm text-green-600">Total Messages</div>
                  </div>
                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">🗣️</div>
                    <div class="text-3xl font-bold text-purple-700">${stats.totalWords.toLocaleString()}</div>
                    <div class="text-sm text-purple-600">Words Spoken</div>
                  </div>
                  <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                    <div class="text-4xl mb-2">🔥</div>
                    <div class="text-3xl font-bold text-orange-700">${stats.currentStreak}</div>
                    <div class="text-sm text-orange-600">Day Streak</div>
                  </div>
                </div>

                <!-- Charts Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Daily Activity Chart -->
                  <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">📈 Daily Activity (Last 30 Days)</h3>
                    <canvas id="dailyActivityChart"></canvas>
                  </div>

                  <!-- Topic Distribution Chart -->
                  <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">🎯 Learning by Topic</h3>
                    <canvas id="topicDistributionChart"></canvas>
                  </div>

              <!-- Weekly Progress Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">📅 Weekly Progress (Last 12 Weeks)</h3>
                <canvas id="weeklyProgressChart"></canvas>
              </div>

              <!-- Level Distribution Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">🎓 Learning by Level</h3>
                <canvas id="levelDistributionChart"></canvas>
              </div>

              <!-- Time of Day Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
                <h3 class="text-xl font-bold text-gray-800 mb-4">⏰ Learning Time Patterns</h3>
                <canvas id="timeOfDayChart"></canvas>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Wait for DOM to be ready
      setTimeout(() => {
        this.renderCharts(stats);
      }, 100);
    } catch (error) {
      console.error('Error loading statistics:', error);
      alert('Failed to load statistics. Please try again.');
    }
  }

  renderCharts(stats) {
    // Daily Activity Chart
    if (stats.recentActivity && stats.recentActivity.length > 0) {
      const dailyCtx = document.getElementById('dailyActivityChart');
      if (dailyCtx) {
        new Chart(dailyCtx, {
          type: 'line',
          data: {
            labels: stats.recentActivity.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Sessions',
              data: stats.recentActivity.map(d => d.sessions),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    // Topic Distribution Chart
    if (stats.topicStats && stats.topicStats.length > 0) {
      const topicCtx = document.getElementById('topicDistributionChart');
      if (topicCtx) {
        new Chart(topicCtx, {
          type: 'doughnut',
          data: {
            labels: stats.topicStats.map(t => `${t.topic_icon} ${t.topic_name}`),
            datasets: [{
              data: stats.topicStats.map(t => t.session_count),
              backgroundColor: [
                'rgba(255, 193, 7, 0.8)',
                'rgba(33, 150, 243, 0.8)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(233, 30, 99, 0.8)',
                'rgba(156, 39, 176, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    // Weekly Progress Chart
    if (stats.weeklyActivity && stats.weeklyActivity.length > 0) {
      const weeklyCtx = document.getElementById('weeklyProgressChart');
      if (weeklyCtx) {
        new Chart(weeklyCtx, {
          type: 'bar',
          data: {
            labels: stats.weeklyActivity.map(w => {
              const date = new Date(w.week_start);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
              label: 'Sessions',
              data: stats.weeklyActivity.map(w => w.sessions),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    // Level Distribution Chart
    if (stats.levelStats && stats.levelStats.length > 0) {
      const levelCtx = document.getElementById('levelDistributionChart');
      if (levelCtx) {
        new Chart(levelCtx, {
          type: 'pie',
          data: {
            labels: stats.levelStats.map(l => l.level.charAt(0).toUpperCase() + l.level.slice(1)),
            datasets: [{
              data: stats.levelStats.map(l => l.session_count),
              backgroundColor: [
                'rgba(76, 175, 80, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(244, 67, 54, 0.8)'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }

    // Time of Day Chart
    if (stats.timeOfDay && stats.timeOfDay.length > 0) {
      const timeCtx = document.getElementById('timeOfDayChart');
      if (timeCtx) {
        // Create full 24-hour array
        const hourlyData = new Array(24).fill(0);
        stats.timeOfDay.forEach(t => {
          hourlyData[t.hour] = t.session_count;
        });

        new Chart(timeCtx, {
          type: 'bar',
          data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
              label: 'Sessions',
              data: hourlyData,
              backgroundColor: (context) => {
                const hour = context.dataIndex;
                if (hour >= 6 && hour < 12) return 'rgba(255, 193, 7, 0.8)'; // Morning
                if (hour >= 12 && hour < 18) return 'rgba(33, 150, 243, 0.8)'; // Afternoon
                if (hour >= 18 && hour < 22) return 'rgba(156, 39, 176, 0.8)'; // Evening
                return 'rgba(63, 81, 181, 0.8)'; // Night
              },
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        });
      }
    }
  }

  // Rewards System
  async showRewards() {
    try {
      // Get user gamification stats
      const stats = await gamificationManager.getStats(this.currentUser.id);
      const userLevel = stats ? stats.stats.level : 1;

      // Define rewards (unlocked at level 30, 40, 50, etc.)
      const rewards = [
        { level: 30, title: 'Bronze Champion', description: 'AI 튜터와 무제한 대화', icon: '🥉', type: 'feature', unlocked: userLevel >= 30 },
        { level: 40, title: 'Silver Master', description: '프리미엄 단어장 액세스', icon: '🥈', type: 'feature', unlocked: userLevel >= 40 },
        { level: 50, title: 'Gold Expert', description: '맞춤형 학습 플랜', icon: '🥇', type: 'feature', unlocked: userLevel >= 50 },
        { level: 60, title: 'Platinum Pro', description: '발음 교정 AI 튜터', icon: '💎', type: 'feature', unlocked: userLevel >= 60 },
        { level: 70, title: 'Diamond Elite', description: '실시간 번역 기능', icon: '💠', type: 'feature', unlocked: userLevel >= 70 },
        { level: 80, title: 'Master Scholar', description: '비즈니스 영어 코스', icon: '👑', type: 'course', unlocked: userLevel >= 80 },
        { level: 90, title: 'Legendary Linguist', description: 'TOEIC/TOEFL 모의고사', icon: '🏆', type: 'course', unlocked: userLevel >= 90 },
        { level: 100, title: 'Ultimate Master', description: '평생 프리미엄 멤버십', icon: '⭐', type: 'premium', unlocked: userLevel >= 100 },
      ];

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          <!-- Sidebar -->
          ${this.getSidebar('rewards')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 max-w-6xl mx-auto">
                <button onclick="worvox.showTopicSelection()" 
                  class="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800 mb-1">🎁 Level Rewards</h1>
                  <p class="hidden md:block text-gray-600">Unlock exclusive rewards as you level up!</p>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">
              <div class="max-w-6xl mx-auto">
                <!-- Current Level Card -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white mb-8 shadow-2xl">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h2 class="text-3xl font-bold mb-2">Level ${userLevel}</h2>
                      <p class="text-indigo-100">Keep learning to unlock more rewards!</p>
                    </div>
                    <div class="text-6xl">🎯</div>
                  </div>
                  <div class="bg-white bg-opacity-20 rounded-full h-4">
                    <div class="bg-yellow-400 h-4 rounded-full transition-all" style="width: ${stats ? stats.stats.progress : 0}%"></div>
                  </div>
                  <div class="mt-2 text-sm text-indigo-100">
                    ${stats ? `${stats.stats.xp} / ${stats.stats.xpForNextLevel} XP to next level` : ''}
                  </div>
                </div>

                <!-- Rewards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${rewards.map(reward => `
                    <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${reward.unlocked ? 'transform hover:-translate-y-1' : ''}">
                      <!-- Unlocked/Locked Overlay -->
                      ${!reward.unlocked ? `
                        <div class="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-10">
                          <div class="text-center">
                            <i class="fas fa-lock text-5xl text-white mb-3"></i>
                            <p class="text-white font-bold text-lg">Level ${reward.level} Required</p>
                            <p class="text-gray-300 text-sm mt-1">${reward.level - userLevel} levels to go</p>
                          </div>
                        </div>
                      ` : ''}
                      
                      <!-- Reward Content -->
                      <div class="p-6 ${!reward.unlocked ? 'filter grayscale' : ''}">
                        <!-- Level Badge -->
                        <div class="flex items-center justify-between mb-4">
                          <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                            Lv.${reward.level}
                          </span>
                          ${reward.unlocked ? `
                            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              <i class="fas fa-check mr-1"></i>UNLOCKED
                            </span>
                          ` : ''}
                        </div>
                        
                        <!-- Icon -->
                        <div class="text-6xl mb-4 text-center">${reward.icon}</div>
                        
                        <!-- Title & Description -->
                        <h3 class="text-xl font-bold text-gray-800 mb-2 text-center">${reward.title}</h3>
                        <p class="text-gray-600 text-center mb-4">${reward.description}</p>
                        
                        <!-- Type Badge -->
                        <div class="text-center">
                          <span class="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            ${reward.type === 'feature' ? '🎯 Feature' : reward.type === 'course' ? '📚 Course' : '👑 Premium'}
                          </span>
                        </div>
                        
                        <!-- Claim Button (if unlocked) -->
                        ${reward.unlocked ? `
                          <button onclick="worvox.claimReward(${reward.level})" 
                            class="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                            <i class="fas fa-gift mr-2"></i>Claim Reward
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Next Milestone -->
                ${userLevel < 30 ? `
                  <div class="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                    <div class="text-4xl mb-3">🎯</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">First Reward at Level 30!</h3>
                    <p class="text-gray-600 mb-4">You need ${30 - userLevel} more levels to unlock your first reward.</p>
                    <p class="text-sm text-gray-500">Keep completing quizzes to earn XP and level up faster!</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      // Load gamification stats after rendering
      await this.loadGamificationStats();
    } catch (error) {
      console.error('Error loading rewards:', error);
      alert('Failed to load rewards. Please try again.');
    }
  }

  claimReward(level) {
    // Placeholder for claim reward functionality
    alert(`🎉 Congratulations! You've claimed the Level ${level} reward!\n\nThis feature will be available soon.`);
  }

  showUpgrade() {
    // Redirect to Plan page
    this.showPlan();
  }

  // Vocabulary Learning Feature
  async showVocabularyLearning() {
    try {
      this.vocabularyWords = [];
      this.currentWordIndex = 0;
      
      // Fetch random words based on user's level
      const response = await axios.get(`/api/vocabulary/words/random`, {
        params: {
          difficulty: this.currentUser.level,
          limit: 20,
          userId: this.currentUser.id
        }
      });

      if (response.data.success && response.data.words.length > 0) {
        this.vocabularyWords = response.data.words;
        this.showVocabularyCard();
      } else {
        alert('No words available for your level. Try a different level!');
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      alert('Failed to load vocabulary. Please try again.');
      this.showTopicSelection();
    }
  }

  showVocabularyCard() {
    const word = this.vocabularyWords[this.currentWordIndex];
    const progress = this.currentWordIndex + 1;
    const total = this.vocabularyWords.length;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="max-w-2xl mx-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <button onclick="worvox.showTopicSelection()" 
              class="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors">
              <i class="fas fa-arrow-left mr-2"></i>Back
            </button>
            <div class="text-gray-600 font-semibold">
              ${progress} / ${total}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300" 
                 style="width: ${(progress / total) * 100}%"></div>
          </div>

          <!-- Vocabulary Card -->
          <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <!-- Word -->
            <div class="text-center mb-8">
              <div class="text-6xl md:text-7xl font-bold text-gray-800 mb-4">
                ${word.word}
              </div>
              <div class="text-gray-500 text-lg mb-2">
                ${word.part_of_speech || ''}
              </div>
              <div class="text-gray-400 text-sm mb-4">
                ${word.pronunciation || ''}
              </div>
              
              <!-- Pronunciation Button -->
              <button onclick="worvox.playWordPronunciation('${word.word}', '${word.meaning_ko}')" 
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all">
                <i class="fas fa-volume-up"></i>
                발음 듣기
              </button>
            </div>

            <!-- Meanings -->
            <div class="border-t border-gray-200 pt-6 mb-6">
              <!-- Korean Meaning -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-gray-600 text-sm">한국어 뜻</div>
                  <button onclick="worvox.playKoreanMeaning('${word.meaning_ko}')" 
                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-all">
                    <i class="fas fa-volume-up"></i>
                    듣기
                  </button>
                </div>
                <div class="text-2xl font-semibold text-gray-800">
                  ${word.meaning_ko}
                </div>
              </div>
              
              <!-- English Meaning -->
              ${word.meaning_en ? `
                <div class="pt-4 border-t border-gray-100">
                  <div class="text-gray-600 text-sm mb-2">English Definition</div>
                  <div class="text-lg text-gray-700 italic">
                    ${word.meaning_en}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Example Sentence -->
            ${word.example_sentence ? `
              <div class="border-t border-gray-200 pt-6 mb-6">
                <div class="text-gray-600 text-sm mb-2">예문</div>
                <div class="text-lg text-gray-700 italic">
                  "${word.example_sentence}"
                </div>
              </div>
            ` : ''}

            <!-- Category Badge -->
            <div class="flex items-center justify-center gap-2 mb-8">
              <span class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                ${word.category || 'general'}
              </span>
              <span class="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                ${word.difficulty}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4">
              <button onclick="worvox.markWordAsLearned(${word.id}, false)" 
                class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                <i class="fas fa-times mr-2"></i>다시 보기
              </button>
              <button onclick="worvox.markWordAsLearned(${word.id}, true)" 
                class="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                <i class="fas fa-check mr-2"></i>알았어요!
              </button>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex gap-4 mt-6">
            ${this.currentWordIndex > 0 ? `
              <button onclick="worvox.previousWord()" 
                class="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                <i class="fas fa-chevron-left mr-2"></i>이전 단어
              </button>
            ` : ''}
            ${this.currentWordIndex < this.vocabularyWords.length - 1 ? `
              <button onclick="worvox.nextWord()" 
                class="ml-auto px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                다음 단어<i class="fas fa-chevron-right ml-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async playWordPronunciation(word, meaningKo) {
    try {
      // Play English word first
      const englishResponse = await axios.post('/api/tts/speak', {
        text: word,
        language: 'en'
      }, {
        responseType: 'blob'
      });

      const englishBlob = new Blob([englishResponse.data], { type: 'audio/mpeg' });
      const englishUrl = URL.createObjectURL(englishBlob);
      const englishAudio = new Audio(englishUrl);
      englishAudio.playbackRate = 0.85; // 15% slower for better pronunciation learning
      
      // When English audio ends, play Korean meaning
      englishAudio.onended = async () => {
        URL.revokeObjectURL(englishUrl);
        
        try {
          // Add a short pause before Korean
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Play Korean meaning
          const koreanResponse = await axios.post('/api/tts/speak', {
            text: meaningKo,
            language: 'ko'
          }, {
            responseType: 'blob'
          });

          const koreanBlob = new Blob([koreanResponse.data], { type: 'audio/mpeg' });
          const koreanUrl = URL.createObjectURL(koreanBlob);
          const koreanAudio = new Audio(koreanUrl);
          koreanAudio.playbackRate = 0.85;
          
          koreanAudio.onended = () => {
            URL.revokeObjectURL(koreanUrl);
          };
          
          koreanAudio.play();
        } catch (error) {
          console.error('Error playing Korean meaning:', error);
        }
      };
      
      englishAudio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      alert('Failed to play pronunciation. Please try again.');
    }
  }

  async playKoreanMeaning(meaningKo) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: meaningKo,
        language: 'ko'
      }, {
        responseType: 'blob'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.85; // 15% slower for better comprehension
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error playing Korean meaning:', error);
      alert('Failed to play audio. Please try again.');
    }
  }

  async markWordAsLearned(wordId, isLearned) {
    try {
      await axios.post('/api/vocabulary/progress', {
        userId: this.currentUser.id,
        wordId: wordId,
        isLearned: isLearned
      });

      // Move to next word
      if (this.currentWordIndex < this.vocabularyWords.length - 1) {
        this.nextWord();
      } else {
        // Show completion message
        this.showVocabularyCompletion();
      }
    } catch (error) {
      console.error('Error marking word:', error);
      // Still allow moving to next word even if save fails
      if (this.currentWordIndex < this.vocabularyWords.length - 1) {
        this.nextWord();
      } else {
        this.showVocabularyCompletion();
      }
    }
  }

  nextWord() {
    if (this.currentWordIndex < this.vocabularyWords.length - 1) {
      this.currentWordIndex++;
      this.showVocabularyCard();
    }
  }

  previousWord() {
    if (this.currentWordIndex > 0) {
      this.currentWordIndex--;
      this.showVocabularyCard();
    }
  }

  showVocabularyCompletion() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center max-w-lg">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">완료했습니다!</h2>
          <p class="text-gray-600 mb-8">
            ${this.vocabularyWords.length}개의 단어를 학습했습니다!
          </p>
          
          <div class="flex gap-4">
            <button onclick="worvox.showVocabularyLearning()" 
              class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
              <i class="fas fa-redo mr-2"></i>더 학습하기
            </button>
            <button onclick="worvox.showTopicSelection()" 
              class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all">
              <i class="fas fa-home mr-2"></i>홈으로
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Premium user check helper
  isPremiumUser() {
    // TODO: Implement actual subscription check from backend
    // For now, check if user has a premium subscription record
    return this.currentUser && this.currentUser.subscription_plan && 
           (this.currentUser.subscription_plan === 'premium' || 
            this.currentUser.subscription_plan === 'business');
  }
}

// Initialize app
const worvox = new WorVox();
// Backward compatibility alias
const heyspeak = worvox;
