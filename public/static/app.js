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
        aiConversations: 100,
        pronunciationPractice: 100,
        wordSearch: 100
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
    // ========== TEMPORARY: Skip login for NHN KCP integration ==========
    // TODO: Re-enable Google login and onboarding after KCP integration
    
    // Create temporary test user
    this.currentUser = {
      id: 1,  // INTEGER ID for database compatibility
      email: 'test@worvox.com',
      username: 'Test User',
      profilePicture: null,
      level: 'intermediate',
      plan: 'free'
    };
    
    // Save to localStorage
    localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
    
    // Load usage data
    await this.loadUsageFromServer();
    await this.loadGamificationStats();
    
    // Show dashboard directly
    this.showTopicSelection();
    
    /* ========== ORIGINAL CODE (commented out) ==========
    // Initialize Google Sign-In
    this.initGoogleSignIn();
    
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('worvox_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      // Load usage data from server
      await this.loadUsageFromServer();
      await this.loadGamificationStats();
      this.showTopicSelection();
    } else {
      this.showLogin();
    }
    ========== END ORIGINAL CODE ========== */
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

  // Footer with company information
  getFooter() {
    return `
      <footer class="w-full bg-gray-900 text-gray-400 py-4 -mx-4 md:-mx-8 mt-8 md:mt-12">
        <div class="px-4 md:px-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3 text-xs">
            <!-- Company Info -->
            <div class="text-center md:text-left">
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5 md:gap-2">
                <span class="font-medium text-gray-300">하퍼잉글리쉬</span>
                <span class="text-gray-600 hidden md:inline">|</span>
                <span class="block md:inline w-full md:w-auto text-center md:text-left">대표자: 이강돈</span>
                <span class="text-gray-600 hidden md:inline">|</span>
                <span class="block md:inline w-full md:w-auto text-center md:text-left">사업자번호: 542-07-02097</span>
              </div>
            </div>
            
            <!-- Copyright & Links -->
            <div class="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 mt-2 md:mt-0">
              <span class="text-gray-500">© ${new Date().getFullYear()} WorVox</span>
              <span class="text-gray-700 hidden md:inline">|</span>
              <a href="#" onclick="worvox.showTerms(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">이용약관</a>
              <span class="text-gray-700">|</span>
              <a href="#" onclick="worvox.showPrivacy(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">개인정보처리방침</a>
              <span class="text-gray-700">|</span>
              <a href="#" onclick="worvox.showRefund(); return false;" class="hover:text-gray-300 transition-colors whitespace-nowrap">환불정책</a>
            </div>
          </div>
        </div>
      </footer>
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
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('real-conversation')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">Real Conversation</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center gap-4">
            <button onclick="worvox.showTopicSelection()" 
              class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-user-tie mr-2"></i>Real Conversation Lessons
            </h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto">
                <!-- My Lesson Credits -->
                <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white mb-6 md:mb-8">
                  <div class="flex items-center justify-between">
                    <div>
                      <h2 class="text-xl md:text-2xl font-bold mb-2">내 수업권</h2>
                      <p class="text-emerald-100 mb-4">1:1 프리미엄 전화영어</p>
                      <div class="flex items-center gap-4">
                        <div>
                          <div class="text-3xl md:text-4xl font-bold">0</div>
                          <div class="text-emerald-100 text-sm">잔여 수업</div>
                        </div>
                        <div class="h-12 w-px bg-emerald-300"></div>
                        <div>
                          <div class="text-3xl md:text-4xl font-bold">0</div>
                          <div class="text-emerald-100 text-sm">완료한 수업</div>
                        </div>
                      </div>
                    </div>
                    <div class="hidden md:block">
                      <i class="fas fa-graduation-cap text-6xl text-white/20"></i>
                    </div>
                  </div>
                </div>
                
                <!-- Lesson Packages -->
                <h3 class="text-2xl font-bold text-gray-900 mb-4">수업권 구매</h3>
                <p class="text-gray-600 mb-6">원하는 수업권을 구매하고 자유롭게 예약하세요</p>
                
                <div class="grid md:grid-cols-3 gap-6 mb-8">
                  <!-- 1회 체험권 (무료) -->
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-500 hover:border-emerald-600 transition-all">
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🎁</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">1회 체험권</h4>
                      <div class="text-3xl font-bold text-emerald-600 mb-1">무료</div>
                      <p class="text-sm text-gray-600">첫 수업 체험</p>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">25분 또는 50분 선택</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">1:1 프리미엄 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-emerald-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(1, 0)" 
                      class="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all">
                      무료 체험하기
                    </button>
                  </div>
                  
                  <!-- 10회권 (인기) -->
                  <div class="bg-white rounded-2xl shadow-2xl p-6 border-4 border-blue-500 relative transform md:scale-105">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-1 rounded-full text-sm font-bold">
                      인기
                    </div>
                    
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🎯</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">Pro 10회권</h4>
                      <div class="text-3xl font-bold text-blue-600 mb-1">₩165,000</div>
                      <p class="text-sm text-gray-600 mb-1">회당 ₩16,500</p>
                      <span class="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        25분 기준
                      </span>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">25분 또는 50분 선택</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">1:1 프리미엄 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-blue-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-star text-blue-600 mt-1"></i>
                        <span class="text-gray-700 font-semibold">해외 10년 거주 한국인 강사</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(10, 165000)" 
                      class="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg">
                      구매하기
                    </button>
                  </div>
                  
                  <!-- 30회권 (최대 할인) -->
                  <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-200 hover:border-indigo-500 transition-all">
                    <div class="text-center mb-4">
                      <div class="text-4xl mb-3">🏆</div>
                      <h4 class="text-xl font-bold text-gray-800 mb-2">Pro 30회권</h4>
                      <div class="text-3xl font-bold text-indigo-600 mb-1">₩495,000</div>
                      <p class="text-sm text-gray-600 mb-1">회당 ₩16,500</p>
                      <span class="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                        25분 기준
                      </span>
                    </div>
                    
                    <ul class="space-y-2 mb-6">
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-indigo-600 mt-1"></i>
                        <span class="text-gray-700">25분 또는 50분 선택</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-indigo-600 mt-1"></i>
                        <span class="text-gray-700">1:1 프리미엄 전화영어</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-check text-indigo-600 mt-1"></i>
                        <span class="text-gray-700">자유로운 예약</span>
                      </li>
                      <li class="flex items-start gap-2 text-sm">
                        <i class="fas fa-star text-indigo-600 mt-1"></i>
                        <span class="text-gray-700 font-semibold">해외 10년 거주 한국인 강사</span>
                      </li>
                    </ul>
                    
                    <button onclick="worvox.purchaseLessons(30, 495000)" 
                      class="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
                      구매하기
                    </button>
                  </div>
                </div>
                
                <!-- Features -->
                <div class="grid md:grid-cols-3 gap-6 mb-6">
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-globe text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">경험 많은 강사진</h4>
                        <p class="text-sm text-gray-600">해외 10년 거주 한국인 강사</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-calendar-check text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">유연한 스케줄</h4>
                        <p class="text-sm text-gray-600">원하는 시간에 자유롭게 예약</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div class="flex items-start gap-4">
                      <div class="bg-emerald-100 p-3 rounded-lg">
                        <i class="fas fa-phone text-emerald-600 text-2xl"></i>
                      </div>
                      <div>
                        <h4 class="font-bold text-gray-800 mb-1">1:1 프리미엄 전화영어</h4>
                        <p class="text-sm text-gray-600">개인 맞춤형 학습으로 빠른 성장</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Premium Member Benefits -->
                ${!this.isPremiumUser() ? `
                <div class="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
                  <div class="flex items-center gap-4">
                    <div class="bg-amber-100 p-4 rounded-full">
                      <i class="fas fa-crown text-amber-600 text-3xl"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-xl font-bold text-gray-900 mb-2">Premium 회원 혜택</h4>
                      <p class="text-gray-700 mb-3">Premium 또는 Business 플랜 가입 시 추가 할인!</p>
                      <ul class="space-y-1 text-sm text-gray-600 mb-4">
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>Premium: 모든 수업권 <strong>15% 추가 할인</strong></li>
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>Business: 모든 수업권 <strong>25% 추가 할인</strong></li>
                        <li><i class="fas fa-check text-amber-600 mr-2"></i>우선 예약 가능</li>
                      </ul>
                      <button onclick="worvox.showPlan()" 
                        class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                        플랜 보기
                      </button>
                    </div>
                  </div>
                </div>
                ` : ''}
              </div>
              
              <!-- Footer -->
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load gamification stats
    setTimeout(() => this.loadGamificationStats(), 100);
  }

  // Purchase lesson packages (일반결제)
  async purchaseLessons(lessonCount, amount) {
    // Apply discount for Premium/Business users
    let finalAmount = amount;
    let discountPercent = 0;
    
    if (this.userPlan === 'premium') {
      discountPercent = 15;
      finalAmount = Math.floor(amount * 0.85);
    } else if (this.userPlan === 'business') {
      discountPercent = 25;
      finalAmount = Math.floor(amount * 0.75);
    }
    
    const packageName = `${lessonCount}회 수업권`;
    const pricePerLesson = Math.floor(finalAmount / lessonCount);
    
    // Show purchase confirmation
    const discountText = discountPercent > 0 
      ? `\n${this.userPlan === 'premium' ? 'Premium' : 'Business'} 회원 할인: -${discountPercent}% (₩${(amount - finalAmount).toLocaleString()} 할인)\n` 
      : '';
    
    const confirmed = confirm(`
🎓 Real Conversation 수업권 구매
━━━━━━━━━━━━━━━━━━━━━━━━━━
패키지: ${packageName}
정가: ₩${amount.toLocaleString()}${discountText}
최종 금액: ₩${finalAmount.toLocaleString()}
회당 가격: ₩${pricePerLesson.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━

구매하시겠습니까?
    `);
    
    if (!confirmed) return;
    
    try {
      // TODO: Implement NHN KCP 일반결제 integration
      alert(`💳 결제 준비 중...\n\n${packageName}\n결제 금액: ₩${finalAmount.toLocaleString()}\n\nNHN KCP 일반결제 시스템 연동 준비 중입니다.\n곧 만나요! 🚀`);
      
      // Simulate purchase success (for testing)
      // After payment success, save to DB:
      // - lesson_purchases table
      // - total_lessons: lessonCount
      // - remaining_lessons: lessonCount
      // - amount: finalAmount
      
    } catch (error) {
      console.error('Lesson purchase error:', error);
      alert('❌ 구매 처리 중 오류가 발생했습니다.\n다시 시도해주세요.');
    }
  }

  // Legacy functions (will be removed after migration)
  selectSessions(num) {
    // Deprecated - kept for backward compatibility
    console.warn('selectSessions is deprecated');
  }

  selectDuration(minutes) {
    // Deprecated - kept for backward compatibility
    console.warn('selectDuration is deprecated');
  }

  calculateBookingPrice() {
    // Deprecated - kept for backward compatibility
    console.warn('calculateBookingPrice is deprecated');
  }

  async proceedToCheckout() {
    // Deprecated - kept for backward compatibility
    console.warn('proceedToCheckout is deprecated');
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
      this.topics = topicsResponse.data.topics; // Store for later use

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
            
            <!-- Content Area with Scrolling -->
            <div class="flex-1 overflow-y-auto">
              <div class="p-4 md:p-8">
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
                <div class="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 mb-6 md:mb-8">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base md:text-lg font-semibold text-gray-900">오늘의 사용량</h3>
                    <button onclick="worvox.showPlan()" class="text-emerald-600 hover:text-emerald-700 text-xs md:text-sm font-medium">
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
                        <span class="text-sm font-medium text-gray-900" data-usage-count="ai_conversation">${this.getDailyUsage('ai_conversation')}/100회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all" data-usage-bar="ai_conversation" style="width: ${(this.getDailyUsage('ai_conversation') / 100) * 100}%"></div>
                      </div>
                    </div>
                    
                    <!-- Pronunciation Practice Usage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <i class="fas fa-microphone text-purple-600"></i>
                          <span class="text-sm text-gray-700">발음 연습</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900" data-usage-count="pronunciation">${this.getDailyUsage('pronunciation')}/100회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-purple-600 h-2 rounded-full transition-all" data-usage-bar="pronunciation" style="width: ${(this.getDailyUsage('pronunciation') / 100) * 100}%"></div>
                      </div>
                    </div>
                    
                    <!-- Word Search Usage -->
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <i class="fas fa-search text-emerald-600"></i>
                          <span class="text-sm text-gray-700">단어 검색</span>
                        </div>
                        <span class="text-sm font-medium text-gray-900" data-usage-count="word_search">${this.getDailyUsage('word_search')}/100회</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-emerald-600 h-2 rounded-full transition-all" data-usage-bar="word_search" style="width: ${(this.getDailyUsage('word_search') / 100) * 100}%"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-xs text-gray-500 text-center">
                      <i class="fas fa-clock mr-1"></i>매일 자정에 초기화됩니다
                    </p>
                  </div>
                </div>

                <!-- Latest Report Card -->
                <div id="latestReportCard" class="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 mb-6 md:mb-8">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base md:text-lg font-semibold text-gray-900">
                      <i class="fas fa-chart-line text-purple-600 mr-2"></i>최근 학습 리포트
                    </h3>
                    <button onclick="worvox.showHistory()" class="text-purple-600 hover:text-purple-700 text-xs md:text-sm font-medium">
                      전체 보기 →
                    </button>
                  </div>
                  <div id="latestReportContent">
                    <div class="text-center py-8 text-gray-400">
                      <i class="fas fa-chart-pie text-4xl mb-3"></i>
                      <p class="text-sm">아직 분석된 리포트가 없습니다</p>
                      <p class="text-xs mt-1">AI 대화를 시작하고 리포트를 받아보세요!</p>
                    </div>
                  </div>
                </div>
                ` : ''}
                
                <!-- Feature Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">${this.topics.map(topic => `
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer"
                      data-topic-id="${topic.id}" 
                      data-topic-name="${this.escapeHtml(topic.name)}" 
                      data-topic-level="${topic.level}"
                      onclick="worvox.startTopicById(${topic.id})">
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
              
              <!-- Footer (inside padded content area) -->
              ${this.getFooter()}
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Load gamification stats after rendering
      await this.loadGamificationStats();
      
      // Load latest report
      await this.loadLatestReport();
    } catch (error) {
      console.error('Error loading topics:', error);
      alert('Failed to load topics. Please refresh the page.');
    }
  }

  // Load latest report for dashboard
  async loadLatestReport() {
    try {
      if (!this.currentUser || !this.currentUser.id) {
        return;
      }

      const response = await axios.get(`/api/analysis/users/${this.currentUser.id}/latest-report`);
      
      if (response.data.success && response.data.report) {
        const report = response.data.report;
        const reportContainer = document.getElementById('latestReportContent');
        
        if (!reportContainer) return;
        
        // Calculate average score
        const avgScore = Math.round((report.grammar_score + report.vocabulary_score + report.fluency_score) / 3);
        
        // Determine color based on score
        let scoreColor = 'text-red-600';
        let bgColor = 'bg-red-50';
        let borderColor = 'border-red-200';
        if (avgScore >= 80) {
          scoreColor = 'text-green-600';
          bgColor = 'bg-green-50';
          borderColor = 'border-green-200';
        } else if (avgScore >= 60) {
          scoreColor = 'text-yellow-600';
          bgColor = 'bg-yellow-50';
          borderColor = 'border-yellow-200';
        }
        
        reportContainer.innerHTML = `
          <div class="border ${borderColor} ${bgColor} rounded-xl p-5 md:p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 md:w-20 md:h-20 ${bgColor} rounded-full flex items-center justify-center border-2 ${borderColor}">
                  <span class="text-3xl md:text-4xl ${scoreColor} font-bold">${avgScore}</span>
                </div>
                <div>
                  <div class="text-base md:text-lg font-bold text-gray-900">평균 점수</div>
                  <div class="text-xs md:text-sm text-gray-500">${new Date(report.analyzed_at).toLocaleDateString('ko-KR')}</div>
                </div>
              </div>
              <button onclick="worvox.showSessionReportById(${report.session_id})" 
                class="text-purple-600 hover:text-purple-700 text-sm md:text-base font-semibold whitespace-nowrap">
                상세보기 →
              </button>
            </div>
            
            <div class="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">문법</div>
                <div class="text-xl md:text-2xl font-bold text-blue-600">${report.grammar_score}</div>
              </div>
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-purple-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">어휘</div>
                <div class="text-xl md:text-2xl font-bold text-purple-600">${report.vocabulary_score}</div>
              </div>
              <div class="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm border border-green-100">
                <div class="text-xs md:text-sm text-gray-500 mb-1 font-medium">유창성</div>
                <div class="text-xl md:text-2xl font-bold text-green-600">${report.fluency_score}</div>
              </div>
            </div>
            
            ${report.total_messages ? `
              <div class="pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between text-xs md:text-sm text-gray-600">
                  <span class="flex items-center gap-1"><i class="fas fa-comments"></i>${report.total_messages}개 대화</span>
                  <span class="flex items-center gap-1"><i class="fas fa-font"></i>${report.total_words}단어</span>
                  <span class="flex items-center gap-1"><i class="fas fa-clock"></i>${Math.ceil(report.total_messages * 0.5)}분</span>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading latest report:', error);
      // Silent fail - just keep the empty state
    }
  }

  // Start topic by ID (finds topic from stored topics array)
  startTopicById(topicId) {
    const topic = this.topics.find(t => t.id === topicId);
    if (topic) {
      this.startSession(topic.id, topic.name, topic.system_prompt, topic.level);
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
                <div class="flex-1">
                  <h2 class="text-base md:text-lg font-semibold text-gray-800">${this.currentTopic.name}</h2>
                  <span class="hidden md:inline text-sm text-gray-500">Practice your English!</span>
                </div>
              </div>
              <!-- End Session Button -->
              <button onclick="worvox.endSession()" 
                class="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 px-3 md:px-4 py-2 rounded-lg transition-all text-sm md:text-base font-semibold shadow-sm">
                <i class="fas fa-stop-circle"></i>
                <span class="hidden sm:inline">End</span>
                <span class="hidden md:inline">Session</span>
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
      console.log('🛑 End Session clicked!');
      if (this.currentSession) {
        console.log('✅ Current session ID:', this.currentSession);
        console.log('📝 Total messages:', this.messages.length);
        
        // 1. 세션 종료 API 호출
        await axios.post(`/api/sessions/end/${this.currentSession}`);
        console.log('✅ Session ended successfully');
        
        // 2. 분석 시작 (최소 3개 이상의 사용자 메시지가 있을 때)
        const userMessages = this.messages.filter(m => m.role === 'user');
        console.log('👤 User messages count:', userMessages.length);
        
        if (userMessages.length >= 3) {
          console.log('✅ Starting analysis (>=3 messages)...');
          const sessionIdToAnalyze = this.currentSession;
          
          // 세션 변수 초기화 (분석 중에도 다른 작업 가능하게)
          this.currentSession = null;
          this.currentTopic = null;
          this.messages = [];
          
          // 분석 로딩 화면 표시
          this.showAnalysisLoading();
          
          try {
            // 3. 분석 API 호출
            const analysisResponse = await axios.post(
              `/api/analysis/sessions/${sessionIdToAnalyze}/analyze`
            );
            
            console.log('✅ Analysis response:', analysisResponse.data);
            
            if (analysisResponse.data.success) {
              console.log('✅ Showing report with ID:', analysisResponse.data.reportId);
              // 4. 리포트 페이지로 이동
              await this.showSessionReport(analysisResponse.data.reportId);
              console.log('✅ Report displayed successfully');
            } else {
              throw new Error('Analysis failed: ' + JSON.stringify(analysisResponse.data));
            }
          } catch (error) {
            console.error('❌ Analysis error:', error);
            console.error('Error details:', error.response?.data);
            const errorMsg = error.response?.data?.error || error.message || '알 수 없는 오류';
            const errorDetails = error.response?.data?.details || '';
            alert('분석 중 오류가 발생했습니다:\n\n' + errorMsg + (errorDetails ? '\n\n상세: ' + errorDetails : '') + '\n\n콘솔(F12)에서 자세한 내용을 확인하세요.');
            // 분석 실패 시 대시보드로
            this.showTopicSelection();
          }
        } else {
          // 메시지가 너무 적으면 분석 없이 종료
          console.log('⚠️ Not enough messages for analysis (need 3+, got ' + userMessages.length + ')');
          alert('분석을 위해서는 최소 3번 이상 대화해야 합니다.\n현재 메시지: ' + userMessages.length + '개');
          this.currentSession = null;
          this.currentTopic = null;
          this.messages = [];
          this.showTopicSelection();
        }
      } else {
        console.log('❌ No current session');
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Error ending session:', error);
      this.currentSession = null;
      this.currentTopic = null;
      this.messages = [];
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
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
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
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
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
      <div class="border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-500 transition-all">
        <div class="flex items-start justify-between">
          <div class="flex-1 cursor-pointer" onclick="worvox.showConversation(${session.id})">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${session.topic_icon || '📚'}</span>
              <h4 class="text-lg font-bold text-gray-800">${session.topic_name || 'Conversation'}</h4>
              ${session.has_report ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold ml-2">✓ 분석완료</span>' : ''}
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
          <div class="flex flex-col gap-2">
            ${session.has_report ? `
              <button 
                onclick="event.stopPropagation(); worvox.showSessionReportById(${session.id})"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                📊 리포트 보기
              </button>
            ` : ''}
            <i class="fas fa-chevron-right text-gray-400 text-center"></i>
          </div>
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
                  <p class="text-gray-500 text-sm">/월</p>
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
                    <span class="text-gray-700"><strong>Real Conversation 15% 할인</strong></span>
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
                  <div class="text-4xl font-bold text-indigo-600 mb-2">₩32,000</div>
                  <p class="text-gray-500 text-sm">/월/인</p>
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
                    <span class="text-gray-700"><strong>Real Conversation 25% 할인</strong></span>
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
            
            <!-- Footer (inside padded content area) -->
            ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Upgrade to Premium
  upgradePlan(plan) {
    this.showPaymentPage(plan);
  }

  // Show payment page with billing cycle selection
  showPaymentPage(plan) {
    const planName = plan === 'premium' ? 'Premium' : 'Business';
    const monthlyPrice = plan === 'premium' ? 9900 : 32000;
    // Yearly payment option removed temporarily
    // const yearlyPrice = plan === 'premium' ? 95040 : 854400;
    // const yearlySavings = plan === 'premium' ? 23760 : 213600;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        ${this.getSidebar('plan')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showPlan()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">${planName} 구독</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showPlan()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">${planName} 플랜 구독</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4 md:p-8">
            <div class="max-w-2xl mx-auto">
              <!-- Plan Info Card -->
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white mb-6">
                <div class="flex items-center gap-3 mb-4">
                  <i class="fas fa-crown text-3xl"></i>
                  <div>
                    <h2 class="text-2xl md:text-3xl font-bold">${planName} 플랜</h2>
                    <p class="text-emerald-100 mt-1">무제한 학습 + 고급 기능</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 inline-block">
                  <i class="fas fa-check-circle"></i>
                  <span class="font-medium">7일 무료 체험</span>
                </div>
              </div>
              
              <!-- TEMPORARY: Billing cycle selection removed (monthly only) -->
              <!-- Payment Summary -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">결제 정보</h3>
                
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-2">
                    <span class="text-gray-700">${planName} 플랜</span>
                    <span class="font-semibold text-gray-900" id="planPrice">₩${monthlyPrice.toLocaleString()}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-gray-700">결제 주기</span>
                    <span class="font-medium text-gray-900" id="billingCycleText">월간</span>
                  </div>
                  <div class="flex items-center justify-between py-2 text-emerald-600">
                    <span class="flex items-center gap-2">
                      <i class="fas fa-gift"></i>
                      <span>7일 무료 체험</span>
                    </span>
                    <span class="font-semibold">-₩0</span>
                  </div>
                  
                  <div class="border-t border-gray-200 pt-3 mt-3">
                    <div class="flex items-center justify-between">
                      <span class="text-lg font-bold text-gray-900">오늘 결제 금액</span>
                      <span class="text-2xl font-bold text-emerald-600">₩0</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">
                      * 7일 무료 체험 후 자동 결제됩니다
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Payment Method -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">결제 수단</h3>
                
                <div class="space-y-3">
                  <label class="flex items-center p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl cursor-pointer">
                    <input type="radio" name="paymentMethod" value="card" class="mr-4" checked>
                    <i class="fas fa-credit-card text-emerald-600 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">신용/체크카드</span>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                    <input type="radio" name="paymentMethod" value="kakaopay" class="mr-4">
                    <i class="fas fa-comment text-yellow-500 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">카카오페이</span>
                  </label>
                  
                  <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                    <input type="radio" name="paymentMethod" value="naverpay" class="mr-4">
                    <i class="fas fa-n text-green-600 text-xl mr-3"></i>
                    <span class="font-semibold text-gray-900">네이버페이</span>
                  </label>
                </div>
              </div>
              
              <!-- Terms Agreement -->
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <label class="flex items-start cursor-pointer">
                  <input type="checkbox" id="agreeTerms" class="mt-1 mr-3">
                  <div class="text-sm text-gray-700">
                    <span class="font-semibold">(필수)</span> 
                    <a href="#" class="text-emerald-600 hover:underline">서비스 이용약관</a> 및 
                    <a href="#" class="text-emerald-600 hover:underline">개인정보 처리방침</a>, 
                    <a href="#" class="text-emerald-600 hover:underline">자동결제 이용약관</a>에 동의합니다.
                  </div>
                </label>
              </div>
              
              <!-- Payment Button -->
              <button onclick="worvox.processPayment('${plan}')" 
                class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-lg font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg">
                <i class="fas fa-lock mr-2"></i>안전하게 결제하기
              </button>
              
              <p class="text-xs text-gray-500 text-center mt-4">
                <i class="fas fa-shield-alt mr-1"></i>
                NHN KCP 안전결제 시스템으로 보호됩니다
              </p>
            </div>
            
            <!-- Footer (inside padded content area) -->
            ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Set default billing cycle to monthly (yearly option removed)
    this.selectedBillingCycle = 'monthly';
    this.selectedPlanPrice = monthlyPrice;
  }

  selectBillingCycle(cycle, price) {
    this.selectedBillingCycle = cycle;
    this.selectedPlanPrice = price;
    
    // Update UI
    document.getElementById('planPrice').textContent = '₩' + price.toLocaleString();
    document.getElementById('billingCycleText').textContent = cycle === 'monthly' ? '월간' : '연간';
    document.getElementById('chargeDate').textContent = this.getChargeDate();
  }

  getChargeDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async processPayment(plan) {
    // Check terms agreement
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms || !agreeTerms.checked) {
      alert('⚠️ 약관에 동의해주세요.');
      return;
    }
    
    // Get selected payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    
    try {
      // TODO: Implement actual NHN KCP payment integration
      // For now, show preparation message
      
      const planName = plan === 'premium' ? 'Premium' : 'Business';
      const billingCycleKo = this.selectedBillingCycle === 'monthly' ? '월간' : '연간';
      
      alert(`💳 결제 준비 중...\n\n${planName} 플랜 (${billingCycleKo})\n결제 금액: ₩${this.selectedPlanPrice.toLocaleString()}\n결제 수단: ${this.getPaymentMethodName(paymentMethod)}\n\nNHN KCP 결제 시스템 연동 준비 중입니다.\n곧 만나요! 🚀`);
      
      // Simulate payment success
      // setTimeout(() => {
      //   this.handlePaymentSuccess(plan, this.selectedBillingCycle);
      // }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('❌ 결제 처리 중 오류가 발생했습니다.\n다시 시도해주세요.');
    }
  }

  getPaymentMethodName(method) {
    const names = {
      'card': '신용/체크카드',
      'kakaopay': '카카오페이',
      'naverpay': '네이버페이'
    };
    return names[method] || '신용/체크카드';
  }

  handlePaymentSuccess(plan, billingCycle) {
    // Update user subscription status
    this.currentUser.subscription_plan = plan;
    this.currentUser.billing_cycle = billingCycle;
    this.currentUser.subscription_status = 'trial'; // 7-day trial
    this.currentUser.trial_ends_at = this.getChargeDate();
    localStorage.setItem('worvox_user', JSON.stringify(this.currentUser));
    
    // Show success message and redirect
    alert('🎉 구독이 완료되었습니다!\n\n7일 무료 체험이 시작되었습니다.\n이제 모든 프리미엄 기능을 사용하실 수 있습니다!');
    this.showTopicSelection();
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

  // Load usage data from server
  async loadUsageFromServer() {
    if (!this.currentUser) return;
    
    try {
      const response = await axios.get(`/api/usage/${this.currentUser.id}`);
      if (response.data.success && response.data.usage) {
        this.dailyUsage = response.data.usage;
        // Also save to localStorage as backup
        this.saveUsageData();
      }
    } catch (error) {
      console.error('Failed to load usage from server:', error);
      // Fallback to localStorage
      this.loadUsageData();
    }
  }

  // Save usage data to localStorage
  saveUsageData() {
    localStorage.setItem('worvox_usage', JSON.stringify(this.dailyUsage));
  }

  // Save usage data to server
  async saveUsageToServer(featureType) {
    if (!this.currentUser) return;
    
    try {
      await axios.post(`/api/usage/${this.currentUser.id}`, {
        featureType: featureType,
        increment: 1
      });
    } catch (error) {
      console.error('Failed to save usage to server:', error);
    }
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
    
    // Save to server
    this.saveUsageToServer(feature);
    
    // Update UI if usage tracker is visible
    this.updateUsageTrackerUI();
    
    // Show warning when approaching limit
    const limit = this.usageLimits[this.userPlan][feature];
    const current = this.dailyUsage[feature];
    
    if (this.userPlan === 'free' && current >= limit * 0.8) {
      this.showUsageWarning(feature, current, limit);
    }
  }

  // Update usage tracker UI in real-time
  updateUsageTrackerUI() {
    // Map internal keys to UI feature names
    const features = [
      { internal: 'aiConversations', ui: 'ai_conversation', limit: 5 },
      { internal: 'pronunciationPractice', ui: 'pronunciation', limit: 10 },
      { internal: 'wordSearch', ui: 'word_search', limit: 10 }
    ];
    
    features.forEach(({ internal, ui, limit }) => {
      const current = this.dailyUsage[internal] || 0;
      const percentage = (current / limit) * 100;
      
      // Update count text
      const countElements = document.querySelectorAll(`[data-usage-count="${ui}"]`);
      countElements.forEach(el => {
        el.textContent = `${current}/${limit}회`;
      });
      
      // Update progress bar
      const barElements = document.querySelectorAll(`[data-usage-bar="${ui}"]`);
      barElements.forEach(el => {
        el.style.width = `${percentage}%`;
      });
    });
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
    // Check usage limit for free users
    if (!this.checkUsageLimit('wordSearch')) {
      return; // Show upgrade banner
    }
    
    const searchInput = document.getElementById('wordSearch');
    const searchResult = document.getElementById('searchResult');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
      searchResult.innerHTML = '';
      return;
    }
    
    // Increment usage when searching
    this.incrementUsage('wordSearch');
    
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
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800">📊 Learning Statistics</h1>
                  <p class="text-gray-600 text-sm mt-1">Track your learning progress and insights</p>
                </div>
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
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
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

  // Plan Page (요금제 비교)
  async showPlan() {
    try {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
          <!-- Sidebar -->
          ${this.getSidebar('plan')}
          
          <!-- Main Content -->
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
              <div class="flex items-center gap-2 max-w-6xl mx-auto">
                <button onclick="worvox.showTopicSelection()" 
                  class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                  <i class="fas fa-arrow-left text-xl"></i>
                </button>
                <div>
                  <h1 class="text-lg md:text-2xl font-bold text-gray-800 mb-1">👑 요금제</h1>
                  <p class="hidden md:block text-gray-600">당신에게 맞는 플랜을 선택하세요</p>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-8">
              <div class="max-w-7xl mx-auto">
                
                <!-- Pricing Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  
                  <!-- Free Plan -->
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 transition-all hover:shadow-2xl">
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 text-center">
                      <div class="text-4xl mb-3">🆓</div>
                      <h3 class="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                      <div class="text-gray-600 mb-4">
                        <span class="text-3xl font-bold">무료</span>
                      </div>
                      <p class="text-sm text-gray-500">기본 기능 체험</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">일일 대화 <strong>5분</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">단어 검색 <strong>제한</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">기본 학습 기능</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-times text-gray-300 mr-2 mt-1"></i>
                          <span class="text-gray-400">리포트 & 분석</span>
                        </li>
                      </ul>
                      <button class="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold cursor-default">
                        현재 플랜
                      </button>
                    </div>
                  </div>

                  <!-- Core Plan -->
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-200 transition-all hover:shadow-2xl transform hover:-translate-y-1">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center text-white">
                      <div class="text-4xl mb-3">💙</div>
                      <h3 class="text-2xl font-bold mb-2">Core</h3>
                      <div class="mb-4">
                        <span class="text-3xl font-bold">₩9,900</span>
                        <span class="text-blue-100 text-sm">/월</span>
                      </div>
                      <p class="text-sm text-blue-100">무제한 대화</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">AI 대화 <strong>무제한</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">개인 단어장</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">단어 퀴즈 & 학습</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-times text-gray-300 mr-2 mt-1"></i>
                          <span class="text-gray-400">리포트 & 분석</span>
                        </li>
                      </ul>
                      <button onclick="worvox.showPaymentStayTuned('Core', '₩9,900')" 
                        class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all">
                        선택하기
                      </button>
                    </div>
                  </div>

                  <!-- Premium Plan (Most Popular) -->
                  <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-400 relative transition-all hover:shadow-2xl transform hover:-translate-y-2">
                    <!-- Popular Badge -->
                    <div class="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🔥 POPULAR
                    </div>
                    <div class="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-center text-white">
                      <div class="text-4xl mb-3">✨</div>
                      <h3 class="text-2xl font-bold mb-2">Premium</h3>
                      <div class="mb-4">
                        <span class="text-3xl font-bold">₩19,000</span>
                        <span class="text-purple-100 text-sm">/월</span>
                      </div>
                      <p class="text-sm text-purple-100">완벽한 학습 경험</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">발음 <strong>분석</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">문장 <strong>첨삭</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">학습 <strong>리포트</strong></span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">+ Core 모든 기능</span>
                        </li>
                      </ul>
                      <button onclick="worvox.showPaymentStayTuned('Premium', '₩19,000')" 
                        class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
                        선택하기
                      </button>
                    </div>
                  </div>

                  <!-- B2B Plan -->
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-yellow-200 transition-all hover:shadow-2xl transform hover:-translate-y-1">
                    <div class="bg-gradient-to-br from-yellow-400 to-orange-400 p-6 text-center text-white">
                      <div class="text-4xl mb-3">🏢</div>
                      <h3 class="text-2xl font-bold mb-2">B2B</h3>
                      <div class="mb-4">
                        <span class="text-2xl font-bold">협의</span>
                      </div>
                      <p class="text-sm text-yellow-100">기업 맞춤 솔루션</p>
                    </div>
                    <div class="p-6">
                      <ul class="space-y-3 mb-6">
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">관리자 대시보드</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700 font-semibold">팀 분석 리포트</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">모든 Premium 기능</span>
                        </li>
                        <li class="flex items-start">
                          <i class="fas fa-check text-green-500 mr-2 mt-1"></i>
                          <span class="text-gray-700">전담 지원팀</span>
                        </li>
                      </ul>
                      <button onclick="worvox.showPaymentStayTuned('B2B', 'Custom Pricing')" 
                        class="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all">
                        문의하기
                      </button>
                    </div>
                  </div>

                </div>

                <!-- 카테고리별 상세 비교 -->
                <div class="mt-12 mb-8">
                  <h2 class="text-3xl font-bold text-gray-800 mb-2 text-center">📊 상세 기능 비교</h2>
                  <p class="text-gray-600 text-center mb-8">플랜별 제공 기능을 카테고리별로 확인하세요</p>
                  
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- 기본 기능 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-star mr-2"></i>
                          기본 기능
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">일일 AI 대화</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 5분</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">AI 대화 주제</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 3개</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 20개</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 커스텀</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">대화 히스토리</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 7일</span><br>
                                <span class="text-blue-600">Core: 30일</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">음성 인식/답변</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜 제공</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 단어 학습 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-book mr-2"></i>
                          단어 학습
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">단어 검색</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 일 10개</span><br>
                                <span class="text-blue-600 font-semibold">Core+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">개인 단어장</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600">Core: 500개</span><br>
                                <span class="text-purple-600 font-semibold">Premium+: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">단어 퀴즈</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">플래시카드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- AI 분석 & 피드백 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-brain mr-2"></i>
                          AI 분석 & 피드백
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">발음 분석 AI</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">문법 첨삭</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">표현 제안</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">학습 리포트</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">약점 분석</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600">Premium: 주간</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 실시간</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 게임화 & 동기부여 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-trophy mr-2"></i>
                          게임화 & 동기부여
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">레벨 & XP</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">학습 스트릭</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">배지 & 업적</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free: 기본</span><br>
                                <span class="text-blue-600">Core: 고급</span><br>
                                <span class="text-purple-600">Premium: 프리미엄</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 전체</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">리워드</td>
                              <td class="py-3 text-right">
                                <span class="text-blue-600 font-semibold">Core 이상</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 팀 & 관리 (B2B 전용) -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-yellow-200">
                      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-users mr-2"></i>
                          팀 & 관리 기능
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">관리자 대시보드</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">팀원 진도 추적</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">팀 분석 리포트</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B: 주간/월간</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">사용자 수</td>
                              <td class="py-3 text-right">
                                <span class="text-gray-600">Free-Premium: 1명</span><br>
                                <span class="text-yellow-600 font-semibold">B2B: 무제한</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">전담 매니저</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- 고객 지원 -->
                    <div class="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-100">
                      <div class="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 text-white">
                        <h3 class="text-xl font-bold flex items-center">
                          <i class="fas fa-headset mr-2"></i>
                          고객 지원
                        </h3>
                      </div>
                      <div class="p-6">
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-gray-100">
                            <tr>
                              <td class="py-3 text-gray-700">우선 지원</td>
                              <td class="py-3 text-right">
                                <span class="text-purple-600 font-semibold">Premium 이상</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">맞춤형 교육 자료</td>
                              <td class="py-3 text-right">
                                <span class="text-yellow-600 font-semibold">B2B 전용</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="py-3 text-gray-700">이메일 지원</td>
                              <td class="py-3 text-right">
                                <span class="text-green-600 font-semibold">모든 플랜</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Feature Comparison Table -->
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
                    <h2 class="text-2xl font-bold text-white">📊 기능 비교</h2>
                    <p class="text-indigo-100 mt-2">모든 플랜의 기능을 한눈에 비교해보세요</p>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-4 text-left text-sm font-bold text-gray-700">기능</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-gray-700">Free</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-blue-700">Core</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-purple-700">Premium</th>
                          <th class="px-6 py-4 text-center text-sm font-bold text-yellow-700">B2B</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200">
                        <!-- 기본 기능 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-star text-yellow-500 mr-2"></i>기본 기능
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">일일 AI 대화 시간</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">5분</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">AI 대화 주제</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">기본 3개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">전체 20개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">전체 20개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체 + 커스텀</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">음성 인식 (STT)</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">음성 답변 (TTS)</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">대화 히스토리</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">7일</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">30일</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>

                        <!-- 단어 학습 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-book text-blue-500 mr-2"></i>단어 학습
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">단어 검색</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">일 10개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">개인 단어장</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">최대 500개</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">무제한</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">단어 퀴즈</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">플래시카드</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>

                        <!-- AI 분석 & 피드백 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-brain text-purple-500 mr-2"></i>AI 분석 & 피드백
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">발음 분석 AI</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">실시간 분석</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간 분석</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">문법 첨삭</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">자동 교정</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">자동 교정</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">더 나은 표현 제안</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">문장별 제안</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">문장별 제안</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">학습 리포트</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">세션별 생성</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">세션별 생성</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">약점 분석</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">주간 리포트</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간 추적</td>
                        </tr>

                        <!-- 게임화 & 동기부여 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-trophy text-yellow-500 mr-2"></i>게임화 & 동기부여
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">레벨 & XP 시스템</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">학습 스트릭</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">배지 & 업적</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">기본</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">고급</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">프리미엄</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">리워드 시스템</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>

                        <!-- 팀 & 관리 기능 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-users text-indigo-500 mr-2"></i>팀 & 관리 기능
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">관리자 대시보드</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">전체 기능</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">팀원 진도 추적</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">실시간</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">팀 분석 리포트</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">주간/월간</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">사용자 수</td>
                          <td class="px-6 py-4 text-center text-sm text-gray-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-blue-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-purple-600">1명</td>
                          <td class="px-6 py-4 text-center text-sm font-semibold text-yellow-600">무제한</td>
                        </tr>

                        <!-- 고객 지원 섹션 -->
                        <tr class="bg-gray-100">
                          <td colspan="5" class="px-6 py-3 text-sm font-bold text-gray-700 uppercase">
                            <i class="fas fa-headset text-green-500 mr-2"></i>고객 지원
                          </td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">전담 매니저</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">우선 지원</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 text-sm text-gray-700">맞춤형 교육 자료</td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                          <td class="px-6 py-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- FAQ Section -->
                <div class="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8">
                  <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-question-circle text-blue-500 mr-2"></i>
                    자주 묻는 질문
                  </h3>
                  <div class="space-y-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ 플랜은 언제든지 변경할 수 있나요?</h4>
                      <p class="text-sm text-gray-600">네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 변경된 플랜은 즉시 적용됩니다.</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ 환불 정책은 어떻게 되나요?</h4>
                      <p class="text-sm text-gray-600">7일 이내 서비스 이용이 1회 미만인 경우 전액 환불 가능합니다. 자세한 내용은 이용약관을 참조해주세요.</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                      <h4 class="font-semibold text-gray-800 mb-2">❓ B2B 플랜은 어떻게 신청하나요?</h4>
                      <p class="text-sm text-gray-600">contact@worvox.com으로 문의주시면 전담팀이 맞춤 견적을 제공해드립니다.</p>
                    </div>
                  </div>
                </div>

              </div>
              
              <!-- Footer -->
              ${this.getFooter()}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading plan page:', error);
      alert('Failed to load plan page. Please try again.');
    }
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

  // Get daily usage count for a feature
  getDailyUsage(featureType) {
    // Map feature names from UI to internal storage keys
    const featureMap = {
      'ai_conversation': 'aiConversations',
      'pronunciation': 'pronunciationPractice',
      'word_search': 'wordSearch'
    };
    
    const internalKey = featureMap[featureType] || featureType;
    
    if (!this.dailyUsage) {
      return 0;
    }
    return this.dailyUsage[internalKey] || 0;
  }

  // Premium user check helper
  isPremiumUser() {
    // TODO: Implement actual subscription check from backend
    // For now, check if user has a premium subscription record
    return this.currentUser && this.currentUser.subscription_plan && 
           (this.currentUser.subscription_plan === 'premium' || 
            this.currentUser.subscription_plan === 'business');
  }

  // ========================================
  // PHASE 1: Session Analysis & Report
  // ========================================
  
  showAnalysisLoading() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div class="text-center p-8">
          <div class="mb-6">
            <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">🧠 AI가 대화를 분석하고 있어요</h2>
          <p class="text-gray-600 mb-6">잠시만 기다려주세요...</p>
          <div class="space-y-2 text-sm text-gray-500">
            <p class="animate-pulse">✓ 문법 체크 중</p>
            <p class="animate-pulse delay-100">✓ 어휘 분석 중</p>
            <p class="animate-pulse delay-200">✓ 개선점 찾는 중</p>
          </div>
        </div>
      </div>
    `;
  }

  async showSessionReport(reportId) {
    try {
      console.log('🔍 Fetching report with ID:', reportId);
      // 리포트 데이터 가져오기
      const response = await axios.get(`/api/analysis/reports/${reportId}`);
      console.log('📊 Report data received:', response.data);
      const { report, feedback } = response.data;
      
      // 에러와 제안 분리
      const errors = feedback.filter(f => f.type === 'error');
      const suggestions = feedback.filter(f => f.type === 'suggestion');
      
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gray-50">
          ${this.getSidebar('conversation')}
          
          <div class="flex-1 overflow-y-auto">
            <div class="max-w-4xl mx-auto p-6 md:p-8">
              
              <!-- 헤더 -->
              <div class="text-center mb-8">
                <div class="text-6xl mb-4">🎉</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">대화 분석 완료!</h1>
                <p class="text-gray-600">AI가 당신의 대화를 분석했어요</p>
              </div>
              
              <!-- 점수 카드 -->
              <div class="grid md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white text-center">
                  <div class="text-sm mb-1">종합 점수</div>
                  <div class="text-4xl font-bold">${report.overall_score}</div>
                  <div class="text-sm opacity-80">/ 100</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">문법</div>
                  <div class="text-3xl font-bold text-gray-800">${report.grammar_score}</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">어휘</div>
                  <div class="text-3xl font-bold text-gray-800">${report.vocabulary_score}</div>
                </div>
                <div class="bg-white rounded-2xl p-6 text-center border-2 border-gray-200">
                  <div class="text-sm text-gray-600 mb-1">유창성</div>
                  <div class="text-3xl font-bold text-gray-800">${report.fluency_score}</div>
                </div>
              </div>
              
              <!-- 고쳐야 할 문장 -->
              ${errors.length > 0 ? `
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="text-2xl">⚠️</span>
                  고쳐야 할 문장 TOP ${errors.length}
                </h2>
                <div class="space-y-4">
                  ${errors.map((err, i) => `
                    <div class="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                      <div class="flex items-start justify-between mb-2">
                        <span class="text-sm font-bold text-red-700">#${i + 1} ${this.getCategoryBadge(err.category)}</span>
                        <span class="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">우선순위 ${err.priority}</span>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">❌ 당신의 문장:</div>
                        <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${err.original_text}</div>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">✅ 올바른 표현:</div>
                        <div class="text-green-700 font-mono bg-green-50 px-3 py-2 rounded font-semibold">${err.improved_text}</div>
                      </div>
                      <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                        💡 ${err.explanation}
                      </div>
                      <button 
                        onclick="worvox.practiceSentence(${err.id}, '${err.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                        class="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all">
                        🔄 이 문장 다시 연습하기
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- 더 나은 표현 -->
              ${suggestions.length > 0 ? `
              <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span class="text-2xl">💡</span>
                  더 나은 표현
                </h2>
                <div class="space-y-4">
                  ${suggestions.map((sug, i) => `
                    <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <div class="flex items-start justify-between mb-2">
                        <span class="text-sm font-bold text-blue-700">#${i + 1} ${this.getCategoryBadge(sug.category)}</span>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">😊 당신의 표현:</div>
                        <div class="text-gray-800 font-mono bg-white px-3 py-2 rounded">${sug.original_text}</div>
                      </div>
                      <div class="mb-2">
                        <div class="text-sm text-gray-600 mb-1">🌟 더 자연스러운 표현:</div>
                        <div class="text-blue-700 font-mono bg-blue-50 px-3 py-2 rounded font-semibold">${sug.improved_text}</div>
                      </div>
                      <div class="text-sm text-gray-700 bg-white px-3 py-2 rounded italic">
                        💡 ${sug.explanation}
                      </div>
                      <button 
                        onclick="worvox.practiceSentence(${sug.id}, '${sug.improved_text.replace(/'/g, "\\'")}', ${report.session_id})"
                        class="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                        🔄 이 표현 연습하기
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- 액션 버튼 -->
              <div class="flex gap-4">
                <button 
                  onclick="worvox.showTopicSelection()"
                  class="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg">
                  🏠 홈으로 돌아가기
                </button>
                <button 
                  onclick="worvox.showHistory()"
                  class="flex-1 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold text-lg transition-all">
                  📚 히스토리 보기
                </button>
              </div>
              
            </div>
          </div>
        </div>
      `;
      
      console.log('✅ Report HTML rendered successfully');
      
    } catch (error) {
      console.error('❌ Show report error:', error);
      alert('리포트를 불러오는 데 실패했습니다:\n' + error.message);
      this.showTopicSelection();
    }
  }

  getCategoryBadge(category) {
    const badges = {
      'grammar': '<span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">문법</span>',
      'vocabulary': '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">어휘</span>',
      'pronunciation': '<span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">발음</span>',
      'style': '<span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">스타일</span>',
    };
    return badges[category] || '';
  }

  async practiceSentence(feedbackId, sentence, sessionId) {
    // 확인 대화상자
    const confirmed = confirm(`🎯 문장 연습하기\n\n다음 문장을 따라 말해보세요:\n\n"${sentence}"\n\n준비되셨나요?`);
    
    if (!confirmed) return;
    
    // 피드백 완료 표시
    try {
      await axios.post(`/api/analysis/feedback/${feedbackId}/practice`);
    } catch (e) {
      console.error('Failed to mark as practiced:', e);
    }
    
    // 간단한 연습 UI 표시
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div class="max-w-2xl w-full p-8">
          <div class="bg-white rounded-3xl shadow-2xl p-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 문장 연습</h2>
            
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
              <p class="text-lg text-gray-800 font-semibold text-center leading-relaxed">
                ${sentence}
              </p>
            </div>
            
            <div class="text-center mb-6">
              <p class="text-gray-600 mb-4">이 문장을 3번 따라 말해보세요!</p>
              <div class="text-4xl mb-4">🎤</div>
              <p class="text-sm text-gray-500">연습을 완료했다면 아래 버튼을 눌러주세요</p>
            </div>
            
            <button 
              onclick="worvox.showSessionReportById(${sessionId})"
              class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all mb-3">
              ✅ 연습 완료! 리포트로 돌아가기
            </button>
            
            <button 
              onclick="worvox.showTopicSelection()"
              class="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all">
              🏠 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async showSessionReportById(sessionId) {
    try {
      const response = await axios.get(`/api/analysis/sessions/${sessionId}/report`);
      if (response.data.success && response.data.report) {
        this.showSessionReport(response.data.report.id);
      } else {
        alert('이 세션의 리포트를 찾을 수 없습니다.');
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Report not found:', error);
      alert('리포트를 불러오는 데 실패했습니다.');
      this.showTopicSelection();
    }
  }
  
  // ========================================
  // End of PHASE 1 Functions
  // ========================================

  // Show Terms of Service
  showTerms() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">이용약관</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">이용약관</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">WorVox 이용약관</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
                    <p class="leading-relaxed">
                      본 약관은 하퍼잉글리쉬(이하 "회사")가 제공하는 WorVox 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>"서비스"</strong>란 회사가 제공하는 AI 기반 영어 학습 플랫폼 WorVox를 의미합니다.</li>
                      <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                      <li><strong>"회원"</strong>이란 회사와 서비스 이용계약을 체결하고 회원 ID를 부여받은 자를 말합니다.</li>
                      <li><strong>"유료 서비스"</strong>란 회사가 유료로 제공하는 Premium, Business 플랜 및 Real Conversation 수업권 등을 말합니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.</li>
                      <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</li>
                      <li>약관이 변경될 경우, 회사는 변경사항을 시행일로부터 최소 7일 전에 공지합니다.</li>
                      <li>이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제4조 (회원 가입 및 계정)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원 가입은 이용자가 약관에 동의하고 회사가 정한 가입 양식에 따라 회원 정보를 기입하여 신청합니다.</li>
                      <li>회사는 다음 각 호의 경우 회원 가입을 거부하거나 승인을 유보할 수 있습니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>타인의 명의를 도용한 경우</li>
                          <li>허위 정보를 기재한 경우</li>
                          <li>이미 가입된 회원인 경우</li>
                          <li>기타 회사가 정한 이용 신청 요건을 충족하지 못한 경우</li>
                        </ul>
                      </li>
                      <li>회원은 계정 정보를 안전하게 관리할 책임이 있으며, 타인에게 양도하거나 대여할 수 없습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제5조 (서비스의 제공)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 다음과 같은 서비스를 제공합니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>AI 영어 대화 연습</li>
                          <li>발음 연습 및 피드백</li>
                          <li>단어장 및 어휘 학습</li>
                          <li>학습 통계 및 분석</li>
                          <li>Real Conversation (1:1 원어민 수업)</li>
                          <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
                        </ul>
                      </li>
                      <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다. 단, 시스템 점검 등 필요한 경우 서비스를 일시 중단할 수 있습니다.</li>
                      <li>회사는 서비스 향상을 위해 서비스의 내용을 변경하거나 추가할 수 있습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제6조 (유료 서비스)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 무료 서비스와 유료 서비스를 구분하여 제공할 수 있습니다.</li>
                      <li>유료 서비스의 요금 및 결제 방법은 각 서비스 페이지에 명시됩니다.</li>
                      <li>Premium 및 Business 플랜은 월 단위 정기결제로 제공됩니다.</li>
                      <li>Real Conversation 수업권은 일회성 결제로 제공되며, 구매 후 유효기간 내 자유롭게 사용할 수 있습니다.</li>
                      <li>유료 서비스 이용 요금의 환불은 환불정책에 따릅니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원은 다음 행위를 해서는 안 됩니다:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>허위 정보 등록 또는 타인의 정보 도용</li>
                          <li>회사의 서비스 운영을 방해하는 행위</li>
                          <li>타인의 명예를 훼손하거나 불이익을 주는 행위</li>
                          <li>서비스를 영리 목적으로 이용하는 행위</li>
                          <li>저작권 등 타인의 권리를 침해하는 행위</li>
                          <li>음란물, 불법 정보 등을 게시하는 행위</li>
                        </ul>
                      </li>
                      <li>회원은 관련 법령, 본 약관, 이용안내 및 주의사항 등을 준수해야 합니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제8조 (회원 탈퇴 및 자격 상실)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회원은 언제든지 회사에 탈퇴를 요청할 수 있으며, 회사는 즉시 회원 탈퇴를 처리합니다.</li>
                      <li>회사는 회원이 본 약관을 위반한 경우 사전 통보 후 회원 자격을 제한 또는 정지시킬 수 있습니다.</li>
                      <li>회원 탈퇴 시 남은 유료 서비스 기간에 대해서는 환불정책에 따라 처리됩니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제9조 (면책 조항)</h2>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed">
                      <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                      <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</li>
                      <li>회사는 이용자가 서비스를 통해 얻은 정보나 자료로 인한 손해에 대해 책임지지 않습니다.</li>
                    </ol>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">제10조 (준거법 및 재판관할)</h2>
                    <p class="leading-relaxed">
                      본 약관과 회사와 이용자 간의 서비스 이용 계약에 대해서는 대한민국 법률을 준거법으로 하며, 분쟁 발생 시 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
                    </p>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 약관은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show Privacy Policy
  showPrivacy() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">개인정보처리방침</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">개인정보처리방침</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <p class="leading-relaxed mb-4">
                      하퍼잉글리쉬(이하 "회사")는 이용자의 개인정보를 중요시하며, "정보통신망 이용촉진 및 정보보호에 관한 법률", "개인정보보호법" 등 관련 법령을 준수하고 있습니다.
                    </p>
                    <p class="leading-relaxed">
                      회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">1. 수집하는 개인정보의 항목 및 수집방법</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 수집하는 개인정보의 항목</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>회원가입 시:</strong> 이메일 주소, 이름, 프로필 사진(선택), 학습 레벨</li>
                      <li><strong>소셜 로그인 시:</strong> Google 계정 정보(이메일, 이름, 프로필 사진)</li>
                      <li><strong>유료 서비스 이용 시:</strong> 결제 정보(카드번호는 PG사에서 처리하며 회사는 저장하지 않음)</li>
                      <li><strong>서비스 이용 과정에서 자동 수집:</strong> IP 주소, 쿠키, 접속 로그, 서비스 이용 기록, 학습 데이터</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 개인정보 수집방법</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
                      <li>Google 소셜 로그인을 통한 자동 수집</li>
                      <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">2. 개인정보의 수집 및 이용목적</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 회원관리</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>회원제 서비스 제공에 따른 본인 확인</li>
                      <li>개인 식별, 불량회원의 부정 이용 방지</li>
                      <li>가입 의사 확인, 연령 확인</li>
                      <li>고충처리, 분쟁 조정을 위한 기록 보존</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 서비스 제공</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>AI 영어 학습 서비스 제공</li>
                      <li>학습 진도 및 통계 관리</li>
                      <li>맞춤형 학습 콘텐츠 추천</li>
                      <li>Real Conversation 수업 예약 및 관리</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">다. 요금 결제 및 정산</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>유료 서비스 이용에 따른 요금 결제</li>
                      <li>구매 및 결제, 환불 처리</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">3. 개인정보의 보유 및 이용기간</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
                    </p>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 회사 내부 방침에 의한 정보보유</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>부정이용 방지:</strong> 부정 이용 기록 - 1년</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 관련 법령에 의한 정보보유</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래법)</li>
                      <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</li>
                      <li><strong>소비자 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래법)</li>
                      <li><strong>표시/광고에 관한 기록:</strong> 6개월 (전자상거래법)</li>
                      <li><strong>접속에 관한 기록:</strong> 3개월 (통신비밀보호법)</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">4. 개인정보의 파기절차 및 방법</h2>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">가. 파기절차</h3>
                    <p class="leading-relaxed mb-4">
                      이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.
                    </p>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">나. 파기방법</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>전자적 파일형태:</strong> 복구 불가능한 방법으로 영구 삭제</li>
                      <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">5. 개인정보의 제3자 제공</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:
                    </p>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>이용자가 사전에 동의한 경우</li>
                      <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">6. 개인정보 처리위탁</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
                    </p>
                    <div class="overflow-x-auto">
                      <table class="min-w-full border border-gray-300">
                        <thead class="bg-gray-100">
                          <tr>
                            <th class="border border-gray-300 px-4 py-2 text-left">수탁업체</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">위탁 업무 내용</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">NHN KCP</td>
                            <td class="border border-gray-300 px-4 py-2">결제 처리 및 정산</td>
                          </tr>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">Cloudflare</td>
                            <td class="border border-gray-300 px-4 py-2">서버 호스팅 및 데이터 저장</td>
                          </tr>
                          <tr>
                            <td class="border border-gray-300 px-4 py-2">Google</td>
                            <td class="border border-gray-300 px-4 py-2">소셜 로그인 처리</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">7. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
                      <li>이용자는 언제든지 회원탈퇴를 통해 개인정보의 수집 및 이용 동의를 철회할 수 있습니다.</li>
                      <li>만 14세 미만 아동의 경우, 법정대리인이 아동의 개인정보를 조회하거나 수정할 권리, 수집 및 이용 동의를 철회할 권리를 가집니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">8. 개인정보 보호책임자</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                    </p>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <p class="font-semibold mb-2">▶ 개인정보 보호책임자</p>
                      <ul class="space-y-1 text-sm">
                        <li>성명: 이강돈</li>
                        <li>직책: 대표</li>
                        <li>이메일: support@worvox.com</li>
                      </ul>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">9. 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
                    <p class="leading-relaxed mb-4">
                      회사는 이용자에게 개인화되고 맞춤화된 서비스를 제공하기 위해 이용자의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.
                    </p>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>쿠키의 사용 목적:</strong> 로그인 세션 유지, 서비스 이용 편의 제공</li>
                      <li><strong>쿠키 설정 거부 방법:</strong> 웹브라우저 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.</li>
                    </ul>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 개인정보처리방침은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show Refund Policy
  showRefund() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        ${this.getSidebar('home')}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Mobile Header -->
          <div class="md:hidden bg-white border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <button onclick="worvox.showTopicSelection()" class="text-gray-600">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <h1 class="text-lg font-semibold text-gray-800">환불정책</h1>
              <div class="w-6"></div>
            </div>
          </div>
          
          <!-- Desktop Top Bar -->
          <div class="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center">
            <button onclick="worvox.showTopicSelection()" class="text-gray-600 hover:text-gray-800 mr-4">
              <i class="fas fa-arrow-left text-xl"></i>
            </button>
            <h2 class="text-lg font-semibold text-gray-800">환불정책</h2>
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 md:p-8">
              <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-6">환불정책</h1>
                <p class="text-sm text-gray-500 mb-8">최종 업데이트: 2026년 2월 24일</p>
                
                <div class="space-y-8 text-gray-700">
                  <section>
                    <p class="leading-relaxed mb-4">
                      하퍼잉글리쉬(이하 "회사")는 "전자상거래 등에서의 소비자보호에 관한 법률" 등 관련 법령을 준수하며, 공정하고 투명한 환불정책을 운영합니다.
                    </p>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">1. Premium/Business 플랜 환불</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 7일 무료 체험 기간</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>Premium 및 Business 플랜 가입 시 <strong>7일 무료 체험</strong>이 제공됩니다.</li>
                      <li>무료 체험 기간 내 취소 시 <strong>요금이 청구되지 않습니다</strong>.</li>
                      <li>무료 체험 기간 종료 후 자동으로 정기결제가 시작됩니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 정기결제 중도 해지</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>언제든지 구독을 취소할 수 있습니다.</li>
                      <li>취소 시점까지의 요금은 환불되지 않으며, 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할 수 있습니다.</li>
                      <li><strong>예시:</strong> 2월 1일에 월 구독을 시작하고 2월 15일에 취소한 경우
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>2월 말까지 서비스 이용 가능</li>
                          <li>3월 1일부터 Free 플랜으로 자동 전환</li>
                          <li>이미 결제된 2월 요금은 환불 불가</li>
                        </ul>
                      </li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 서비스 장애로 인한 환불</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>회사의 귀책사유로 서비스를 이용하지 못한 경우, 이용하지 못한 기간만큼 일할 계산하여 환불해드립니다.</li>
                      <li>환불 신청은 support@worvox.com으로 연락 주시기 바랍니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">2. Real Conversation 수업권 환불</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 환불 가능 조건</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li><strong>미사용 수업권:</strong> 한 번도 사용하지 않은 수업권은 구매일로부터 <strong>7일 이내</strong> 전액 환불 가능합니다.</li>
                      <li><strong>부분 사용 수업권:</strong> 일부 수업을 사용한 경우, 남은 수업권에 대해 환불 가능합니다.
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>환불금액 = (총 구매금액 / 전체 수업 횟수) × 남은 수업 횟수</li>
                          <li>단, 사용한 수업은 정가 기준으로 차감됩니다.</li>
                        </ul>
                      </li>
                    </ul>
                    
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                      <p class="font-semibold mb-2">📌 환불 계산 예시</p>
                      <p class="text-sm mb-2"><strong>4회 수업권 ₩180,000 구매 (회당 ₩45,000) 후 2회 사용</strong></p>
                      <ul class="text-sm space-y-1">
                        <li>• 사용한 수업: 2회 × ₩50,000(정가) = ₩100,000</li>
                        <li>• 환불 금액: ₩180,000 - ₩100,000 = <strong>₩80,000</strong></li>
                      </ul>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 환불 불가 조건</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>수업 예약 후 <strong>무단 불참(No-Show)</strong>한 경우 해당 수업은 사용으로 간주됩니다.</li>
                      <li>수업 시작 <strong>24시간 이내 취소</strong>한 경우 환불 불가합니다.</li>
                      <li>구매일로부터 <strong>30일 경과</strong> 후에는 환불이 제한될 수 있습니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 수업 취소 및 일정 변경</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>수업 시작 <strong>24시간 전</strong>까지 무료로 취소 또는 일정 변경 가능합니다.</li>
                      <li>24시간 이내 취소 시 해당 수업권 1회가 차감됩니다.</li>
                      <li>강사의 사정으로 수업이 취소된 경우 수업권이 복구됩니다.</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">3. 환불 처리 절차</h2>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">가. 환불 신청 방법</h3>
                    <ol class="list-decimal pl-6 space-y-2 leading-relaxed mb-4">
                      <li>이메일로 환불 신청: <strong>support@worvox.com</strong></li>
                      <li>필수 포함 정보:
                        <ul class="list-disc pl-6 mt-2 space-y-1">
                          <li>이름 및 이메일 주소</li>
                          <li>구매 내역 (영수증 또는 주문번호)</li>
                          <li>환불 사유</li>
                          <li>환불 받을 계좌번호 (예금주, 은행명, 계좌번호)</li>
                        </ul>
                      </li>
                    </ol>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">나. 환불 처리 기간</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed mb-4">
                      <li>환불 신청 접수 후 <strong>영업일 기준 3~5일 이내</strong> 검토 후 승인 여부를 안내해드립니다.</li>
                      <li>승인 후 <strong>3~7영업일 이내</strong> 환불 처리됩니다.</li>
                      <li>신용카드 결제의 경우 카드사 정책에 따라 처리 기간이 다를 수 있습니다.</li>
                    </ul>
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">다. 환불 수단</h3>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li><strong>신용카드 결제:</strong> 결제 취소 처리 (카드사 정책에 따라 1~2개월 소요)</li>
                      <li><strong>계좌이체/무통장입금:</strong> 고객 지정 계좌로 환불</li>
                      <li><strong>간편결제:</strong> 각 결제수단별 정책에 따름</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">4. 환불 제한 사항</h2>
                    <ul class="list-disc pl-6 space-y-2 leading-relaxed">
                      <li>부정한 방법으로 서비스를 이용한 경우</li>
                      <li>이용약관을 위반하여 서비스 이용이 제한된 경우</li>
                      <li>타인 명의를 도용하거나 허위 정보로 가입한 경우</li>
                      <li>과도한 서비스 남용으로 판단되는 경우</li>
                    </ul>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">5. 고객 지원</h2>
                    <p class="leading-relaxed mb-4">
                      환불과 관련하여 궁금한 사항이 있으시면 언제든지 문의해주시기 바랍니다.
                    </p>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <p class="font-semibold mb-2">▶ 고객 지원 연락처</p>
                      <ul class="space-y-1 text-sm">
                        <li>이메일: support@worvox.com</li>
                        <li>운영 시간: 평일 09:00 - 18:00 (주말 및 공휴일 제외)</li>
                        <li>응답 시간: 영업일 기준 24시간 이내</li>
                      </ul>
                    </div>
                  </section>
                  
                  <section>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">6. 소비자 피해 보상</h2>
                    <p class="leading-relaxed">
                      본 환불정책에 명시되지 않은 사항에 대해서는 "전자상거래 등에서의 소비자보호에 관한 법률" 등 관련 법령 및 회사의 이용약관에 따릅니다.
                    </p>
                  </section>
                  
                  <section class="pt-6 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                      <strong>시행일:</strong> 본 환불정책은 2026년 2월 24일부터 시행됩니다.
                    </p>
                  </section>
                </div>
              </div>
              
              ${this.getFooter()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async showPlan() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <!-- Sidebar -->
        ${this.getSidebar('plan')}
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
            <div class="flex items-center gap-2">
              <button onclick="worvox.showTopicSelection()" 
                class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div>
                <h1 class="text-lg md:text-2xl font-bold text-gray-800">👑 요금제</h1>
                <p class="hidden md:block text-gray-600 text-sm mt-1">나에게 맞는 플랜을 선택하세요</p>
              </div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-4 md:p-8">
            <div class="max-w-7xl mx-auto">
              
              <!-- Pricing Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                <!-- Free Plan -->
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-gray-300 transition-all">
                  <div class="text-center mb-6">
                    <div class="text-4xl mb-3">🆓</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                    <div class="text-3xl font-bold text-gray-900 mb-1">₩0</div>
                    <p class="text-sm text-gray-500">무료</p>
                  </div>
                  <ul class="space-y-3 mb-6">
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700">일일 대화 5분</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700">단어 검색 제한</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-times text-gray-300 mt-1"></i>
                      <span class="text-sm text-gray-400">AI 대화 무제한</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-times text-gray-300 mt-1"></i>
                      <span class="text-sm text-gray-400">발음 분석</span>
                    </li>
                  </ul>
                  <button class="w-full py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold cursor-default">
                    현재 플랜
                  </button>
                </div>

                <!-- Core Plan -->
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-400 hover:border-blue-500 transition-all relative">
                  <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span class="px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">인기</span>
                  </div>
                  <div class="text-center mb-6">
                    <div class="text-4xl mb-3">⭐</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Core</h3>
                    <div class="text-3xl font-bold text-blue-600 mb-1">₩9,900</div>
                    <p class="text-sm text-gray-500">월 정기결제</p>
                  </div>
                  <ul class="space-y-3 mb-6">
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700 font-semibold">AI 대화 무제한</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700 font-semibold">단어장 기능</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700">무제한 단어 검색</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-times text-gray-300 mt-1"></i>
                      <span class="text-sm text-gray-400">발음 분석</span>
                    </li>
                  </ul>
                  <button class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                    선택하기
                  </button>
                </div>

                <!-- Premium Plan -->
                <div class="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all relative">
                  <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span class="px-4 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">추천</span>
                  </div>
                  <div class="text-center mb-6">
                    <div class="text-4xl mb-3">💎</div>
                    <h3 class="text-2xl font-bold mb-2">Premium</h3>
                    <div class="text-3xl font-bold mb-1">₩19,000</div>
                    <p class="text-sm text-purple-200">월 정기결제</p>
                  </div>
                  <ul class="space-y-3 mb-6">
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-yellow-300 mt-1"></i>
                      <span class="text-sm font-semibold">Core 모든 기능</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-yellow-300 mt-1"></i>
                      <span class="text-sm font-semibold">발음 분석 AI</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-yellow-300 mt-1"></i>
                      <span class="text-sm font-semibold">문장 첨삭 서비스</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-yellow-300 mt-1"></i>
                      <span class="text-sm font-semibold">학습 리포트 제공</span>
                    </li>
                  </ul>
                  <button class="w-full py-3 bg-white text-purple-600 hover:bg-gray-100 rounded-lg font-semibold transition-all">
                    선택하기
                  </button>
                </div>

                <!-- B2B Plan -->
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-800 hover:border-gray-900 transition-all">
                  <div class="text-center mb-6">
                    <div class="text-4xl mb-3">🏢</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">B2B</h3>
                    <div class="text-2xl font-bold text-gray-900 mb-1">협의</div>
                    <p class="text-sm text-gray-500">기업/단체</p>
                  </div>
                  <ul class="space-y-3 mb-6">
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700 font-semibold">Premium 모든 기능</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700 font-semibold">관리자 대시보드</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700 font-semibold">팀 분석 리포트</span>
                    </li>
                    <li class="flex items-start gap-2">
                      <i class="fas fa-check text-green-500 mt-1"></i>
                      <span class="text-sm text-gray-700">전담 고객지원</span>
                    </li>
                  </ul>
                  <button class="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-all">
                    문의하기
                  </button>
                </div>
              </div>

              <!-- Feature Comparison Table -->
              <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">상세 기능 비교</h2>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b-2 border-gray-200">
                        <th class="text-left py-4 px-4 font-semibold text-gray-700">기능</th>
                        <th class="text-center py-4 px-4 font-semibold text-gray-700">Free</th>
                        <th class="text-center py-4 px-4 font-semibold text-blue-600">Core</th>
                        <th class="text-center py-4 px-4 font-semibold text-purple-600">Premium</th>
                        <th class="text-center py-4 px-4 font-semibold text-gray-800">B2B</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">AI 대화</td>
                        <td class="py-4 px-4 text-center text-gray-600">일 5분</td>
                        <td class="py-4 px-4 text-center text-blue-600 font-semibold">무제한</td>
                        <td class="py-4 px-4 text-center text-purple-600 font-semibold">무제한</td>
                        <td class="py-4 px-4 text-center text-gray-800 font-semibold">무제한</td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">단어 검색</td>
                        <td class="py-4 px-4 text-center text-gray-600">제한적</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">단어장 기능</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">발음 분석</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">문장 첨삭</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">학습 리포트</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">관리자 대시보드</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">팀 분석</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                      <tr class="hover:bg-gray-50">
                        <td class="py-4 px-4 text-gray-700">전담 고객지원</td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-times text-gray-300"></i></td>
                        <td class="py-4 px-4 text-center"><i class="fas fa-check text-green-500"></i></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- FAQ Section -->
              <div class="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">자주 묻는 질문</h2>
                <div class="space-y-4">
                  <div class="border-b border-gray-200 pb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">💳 결제 방법은 무엇인가요?</h3>
                    <p class="text-gray-600 text-sm">신용카드, 체크카드, 간편결제(NHN KCP)를 지원합니다.</p>
                  </div>
                  <div class="border-b border-gray-200 pb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">🔄 플랜 변경이 가능한가요?</h3>
                    <p class="text-gray-600 text-sm">언제든지 플랜 업그레이드가 가능하며, 남은 기간은 일할 계산됩니다.</p>
                  </div>
                  <div class="border-b border-gray-200 pb-4">
                    <h3 class="font-semibold text-gray-800 mb-2">❌ 환불 정책은 어떻게 되나요?</h3>
                    <p class="text-gray-600 text-sm">결제 후 7일 이내 미사용 시 전액 환불이 가능합니다.</p>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800 mb-2">🏢 B2B 플랜은 어떻게 신청하나요?</h3>
                    <p class="text-gray-600 text-sm">contact@worvox.com으로 문의주시면 상담 도와드립니다.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Payment Stay Tuned Modal
  showPaymentStayTuned(plan, price) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 24px;
        padding: 48px 40px;
        max-width: 480px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="font-size: 64px; margin-bottom: 24px;">🚀</div>
        <h2 style="
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 16px;
        ">Stay Tuned!</h2>
        <p style="
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.6;
        ">
          Payment feature is coming soon.<br>
          We're working hard to bring you the best experience!
        </p>
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          border-radius: 16px;
          margin-bottom: 32px;
        ">
          <div style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin-bottom: 8px;">
            Selected Plan
          </div>
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 4px;">
            ${plan}
          </div>
          <div style="color: rgba(255, 255, 255, 0.95); font-size: 20px; font-weight: 600;">
            ${price}/month
          </div>
        </div>
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';">
          Got it!
        </button>
      </div>
    `;
    
    // Add animation keyframes
    if (!document.getElementById('stayTunedAnimation')) {
      const style = document.createElement('style');
      style.id = 'stayTunedAnimation';
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
}

// Initialize app
const worvox = new WorVox();
// Backward compatibility alias
const heyspeak = worvox;
