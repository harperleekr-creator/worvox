// HeySpeak - AI English Learning App
class HeySpeak {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.currentAudio = null;
    
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
    
    this.init();
  }

  async init() {
    // Initialize Google Sign-In
    this.initGoogleSignIn();
    
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('heyspeak_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.showTopicSelection();
    } else {
      this.showLogin();
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
        localStorage.setItem('heyspeak_user', JSON.stringify(this.currentUser));
        
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
  showLogin() {
    this.onboardingStep = 1;
    this.showOnboardingStep();
  }

  showOnboardingStep() {
    const app = document.getElementById('app');
    
    const steps = [
      this.getStep1HTML(),
      this.getStep2HTML(),
      this.getStep3HTML(),
      this.getStep4HTML(),
      this.getStep5HTML(),
      this.getStep6HTML()
    ];

    const progress = Math.round((this.onboardingStep / 6) * 100);

    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
          <!-- Header -->
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold gradient-text mb-2">HeySpeak</h1>
            <p class="text-gray-600 text-sm">Step ${this.onboardingStep} of 6</p>
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
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
          <p class="text-gray-600">Sign in to get started</p>
        </div>
        
        <!-- Google Sign-In Button -->
        <div id="googleSignInButton" class="flex justify-center"></div>
        
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500">Or continue with name</span>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
          <input type="text" id="username" value="${this.onboardingData.username}"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            placeholder="Enter your name">
        </div>

        <button onclick="heyspeak.nextStep()" 
          class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all btn-hover">
          Continue
        </button>
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
            <button onclick="heyspeak.selectOption('level', '${level.value}')" 
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

        <button onclick="heyspeak.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep3HTML() {
    const sources = [
      { value: 'search', icon: '🔍', label: 'Search Engine', desc: 'Google, Naver, etc.' },
      { value: 'social', icon: '📱', label: 'Social Media', desc: 'Instagram, YouTube, etc.' },
      { value: 'friend', icon: '👥', label: 'Friend Referral', desc: 'Someone told me' },
      { value: 'ad', icon: '📢', label: 'Advertisement', desc: 'Saw an ad' },
      { value: 'other', icon: '💭', label: 'Other', desc: 'Different source' }
    ];

    return `
      <div class="space-y-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🤔</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">How did you find us?</h2>
          <p class="text-gray-600">Help us improve our reach</p>
        </div>
        
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${sources.map(source => `
            <button onclick="heyspeak.selectOption('referralSource', '${source.value}')" 
              class="w-full p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left ${this.onboardingData.referralSource === source.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}">
              <div class="flex items-center">
                <span class="text-3xl mr-4">${source.icon}</span>
                <div class="flex-1">
                  <div class="font-semibold text-gray-800">${source.label}</div>
                  <div class="text-sm text-gray-600">${source.desc}</div>
                </div>
                ${this.onboardingData.referralSource === source.value ? '<span class="text-indigo-600">✓</span>' : ''}
              </div>
            </button>
          `).join('')}
        </div>

        <button onclick="heyspeak.prevStep()" 
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
            <button onclick="heyspeak.selectOption('ageGroup', '${age.value}')" 
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

        <button onclick="heyspeak.prevStep()" 
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
            <button onclick="heyspeak.selectOption('gender', '${gender.value}')" 
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

        <button onclick="heyspeak.prevStep()" 
          class="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all">
          Back
        </button>
      </div>
    `;
  }

  getStep6HTML() {
    const occupations = [
      { value: 'entrepreneur', icon: '🚀', label: 'Entrepreneur', desc: '사업가' },
      { value: 'employee', icon: '💼', label: 'Employee', desc: '직장인' },
      { value: 'freelancer', icon: '💻', label: 'Freelancer', desc: '프리랜서' },
      { value: 'student', icon: '📚', label: 'Student', desc: '학생' }
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
            <button onclick="heyspeak.selectOption('occupation', '${occ.value}')" 
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

        <button onclick="heyspeak.prevStep()" 
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
          google.accounts.id.renderButton(
            googleButtonDiv,
            { 
              theme: 'outline', 
              size: 'large',
              width: 400,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
        }
      }, 100);
    }
  }

  nextStep() {
    // Validate current step
    if (this.onboardingStep === 1) {
      const username = document.getElementById('username').value.trim();
      if (!username) {
        alert('Please enter your name');
        return;
      }
      this.onboardingData.username = username;
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
      if (this.onboardingStep < 6) {
        this.nextStep();
      } else {
        // Last step - complete onboarding
        this.completeOnboarding();
      }
    }, 300);
  }

  async completeOnboarding() {
    try {
      const response = await axios.post('/api/users/auth', this.onboardingData);

      if (response.data.success) {
        this.currentUser = response.data.user;
        localStorage.setItem('heyspeak_user', JSON.stringify(this.currentUser));
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
      const totalWords = Math.floor(stats.totalMessages / 2) * 10; // Assume ~10 words per user message

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-6xl mx-auto">
            <!-- Header with Stats -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-4">
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Welcome, ${this.currentUser.username}! 👋</h1>
                  </div>
                  <div class="flex items-center gap-4 mt-2 flex-wrap">
                    <p class="text-gray-600">
                      Level: <span class="font-semibold text-indigo-600">${this.currentUser.level}</span>
                    </p>
                    <span class="text-gray-400">•</span>
                    <p class="text-gray-600">
                      Words spoken: <span class="font-bold text-green-600">${totalWords.toLocaleString()}</span> 💬
                    </p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button onclick="heyspeak.showStats()" 
                    class="px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors">
                    <i class="fas fa-chart-line mr-2"></i>Stats
                  </button>
                  <button onclick="heyspeak.showHistory()" 
                    class="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                    <i class="fas fa-history mr-2"></i>History
                  </button>
                  <button onclick="heyspeak.logout()" 
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                  </button>
                </div>
              </div>

              <!-- Additional Stats Cards -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div class="text-2xl font-bold text-blue-700">${stats.totalSessions}</div>
                  <div class="text-sm text-blue-600">Total Sessions</div>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div class="text-2xl font-bold text-green-700">${stats.totalMessages}</div>
                  <div class="text-sm text-green-600">Total Messages</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div class="text-2xl font-bold text-purple-700">${totalWords.toLocaleString()}</div>
                  <div class="text-sm text-purple-600">Words Spoken</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <div class="text-2xl font-bold text-orange-700">${stats.totalSessions > 0 ? '🔥' : '✨'}</div>
                  <div class="text-sm text-orange-600">${stats.totalSessions > 0 ? 'Keep it up!' : 'Start today!'}</div>
                </div>
              </div>
            </div>

            <!-- Topics -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-2xl font-bold text-gray-800 mb-6">Choose a Topic 📚</h2>
              
              <!-- Word Search Section -->
              <div class="mb-6">
                <div class="relative">
                  <input 
                    type="text" 
                    id="wordSearch" 
                    placeholder="Search Words!" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 text-gray-700 placeholder-gray-400"
                    onkeypress="if(event.key==='Enter') heyspeak.searchWord()"
                  />
                  <button 
                    onclick="heyspeak.searchWord()"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 hover:text-indigo-800">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
                <div id="searchResult" class="mt-4"></div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${topics.map(topic => `
                  <div class="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-all card-hover"
                    onclick="heyspeak.startSession(${topic.id}, '${topic.name}', '${topic.system_prompt}', '${topic.level}')">
                    <div class="text-4xl mb-3">${topic.icon}</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${topic.name}</h3>
                    <p class="text-gray-600 text-sm mb-3">${topic.description}</p>
                    <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      ${topic.level}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
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

  showChatInterface() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <div class="bg-white shadow-md">
          <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button onclick="heyspeak.endSession()" 
                class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-arrow-left text-xl"></i>
              </button>
              <div>
                <h2 class="text-xl font-bold text-gray-800">${this.currentTopic.name}</h2>
                <p class="text-sm text-gray-600">Practice your English!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Container -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <div id="chatMessages" class="flex-1 overflow-y-auto p-4 chat-container max-w-4xl w-full mx-auto">
            <div class="text-center text-gray-500 py-8">
              <i class="fas fa-comments text-4xl mb-2"></i>
              <p>Start speaking to practice English!</p>
            </div>
          </div>

          <!-- Input Area -->
          <div class="bg-white border-t shadow-lg">
            <div class="max-w-4xl mx-auto p-4">
              <div class="flex items-center space-x-4">
                <button id="recordBtn" 
                  class="flex-shrink-0 w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all btn-hover"
                  onclick="heyspeak.toggleRecording()">
                  <i class="fas fa-microphone text-2xl"></i>
                </button>
                <div class="flex-1 text-gray-600">
                  <p id="statusText">Tap the microphone to start speaking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
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
          onclick="heyspeak.replayAudio(${messageIndex})" 
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
    localStorage.removeItem('heyspeak_user');
    this.currentUser = null;
    this.currentSession = null;
    this.currentTopic = null;
    this.messages = [];
    this.showLogin();
  }

  // Vocabulary feature
  async showVocabulary(mode = 'list') {
    this.vocabularyMode = mode; // 'list', 'flashcard', 'quiz'
    try {
      const response = await axios.get('/api/vocabulary/list');
      const words = response.data.words;
      
      // Store vocabulary data for flashcard/quiz access
      document.getElementById('app').dataset.vocabularyData = JSON.stringify(response.data);
      
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
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 class="text-2xl md:text-3xl font-bold text-gray-800">📚 Vocabulary Study</h1>
                  <p class="text-gray-600 mt-2">Learn and practice English vocabulary with pronunciations</p>
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="heyspeak.showVocabulary('list')" 
                    class="px-4 py-2 ${mode === 'list' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-colors">
                    <i class="fas fa-list mr-2"></i>List
                  </button>
                  <button onclick="heyspeak.showVocabulary('flashcard')" 
                    class="px-4 py-2 ${mode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-colors">
                    <i class="fas fa-clone mr-2"></i>Flashcard
                  </button>
                  <button onclick="heyspeak.showVocabulary('quiz')" 
                    class="px-4 py-2 ${mode === 'quiz' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-colors">
                    <i class="fas fa-graduation-cap mr-2"></i>Quiz
                  </button>
                  <button onclick="heyspeak.showTopicSelection()" 
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>Back
                  </button>
                </div>
              </div>
              
              <!-- Progress Stats -->
              ${this.currentUser ? `
                <div class="mt-4 flex items-center gap-4 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-600">진도:</span>
                    <span class="font-bold text-green-600">${Object.values(progressData).filter(p => p.is_learned).length} / ${words.length}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-600">북마크:</span>
                    <span class="font-bold text-yellow-600">${bookmarkedWords.length}</span>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Vocabulary List -->
            ${mode === 'list' ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${words.map((word, index) => {
                const progress = progressData[word.id];
                const isLearned = progress?.is_learned || false;
                const isBookmarked = bookmarkedWords.includes(word.id);
                return `
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow relative">
                  <!-- Bookmark Button -->
                  ${this.currentUser ? `
                  <button onclick="heyspeak.toggleBookmark(${word.id}, ${isBookmarked})" 
                    class="absolute top-4 right-4 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                    <i class="fas fa-star"></i>
                  </button>
                  ` : ''}
                  
                  <!-- Word Card -->
                  <div class="space-y-4">
                    <!-- English Word -->
                    <div class="text-center">
                      <h3 class="text-3xl font-bold text-indigo-600 mb-2">${this.escapeHtml(word.word)}</h3>
                      <div class="flex items-center justify-center gap-2">
                        <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                          ${this.escapeHtml(word.part_of_speech)}
                        </span>
                        ${word.toeic_related ? `
                        <span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                          TOEIC
                        </span>
                        ` : ''}
                        ${word.toefl_related ? `
                        <span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          TOEFL
                        </span>
                        ` : ''}
                      </div>
                    </div>

                    <!-- Korean Meaning -->
                    <div class="border-t pt-4">
                      <p class="text-gray-600 text-sm mb-1">한국어 뜻:</p>
                      <p class="text-xl font-semibold text-gray-800">${this.escapeHtml(word.meaning_ko)}</p>
                    </div>

                    <!-- Pronunciation Button -->
                    <button 
                      onclick="heyspeak.pronounceWord('${this.escapeHtml(word.word)}', ${index})"
                      id="pronounce-btn-${index}"
                      class="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center space-x-2">
                      <i class="fas fa-volume-up"></i>
                      <span>발음 듣기</span>
                    </button>

                    <!-- Example Sentence (if available) -->
                    ${word.example_sentence ? `
                      <div class="border-t pt-4">
                        <p class="text-gray-600 text-sm mb-1">예문:</p>
                        <p class="text-gray-700 italic text-sm">${this.escapeHtml(word.example_sentence)}</p>
                      </div>
                    ` : ''}
                    
                    <!-- Progress Checkbox -->
                    ${this.currentUser ? `
                      <div class="border-t pt-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" 
                            ${isLearned ? 'checked' : ''}
                            onchange="heyspeak.toggleLearnedStatus(${word.id}, this.checked)"
                            class="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500">
                          <span class="text-sm ${isLearned ? 'text-green-600 font-semibold' : 'text-gray-600'}">
                            ${isLearned ? '✓ 학습 완료' : '학습 완료 표시'}
                          </span>
                        </label>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `; }).join('')}
            </div>
            ` : mode === 'flashcard' ? this.renderFlashcardMode(words, progressData, bookmarkedWords) : this.renderQuizMode(words, progressData)}

            ${words.length === 0 ? `
              <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div class="text-6xl mb-4">📖</div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h3>
                <p class="text-gray-600">Vocabulary words will be added soon!</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      alert('Failed to load vocabulary. Please try again.');
    }
  }

  async pronounceWord(word, index) {
    try {
      const btn = document.getElementById(`pronounce-btn-${index}`);
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>재생 중...</span>';
      btn.disabled = true;

      // Call TTS API
      const response = await axios.post('/api/tts/speak', {
        text: word,
        voice: 'nova' // Clear, natural voice for pronunciation
      }, {
        responseType: 'arraybuffer'
      });

      // Play audio
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        btn.innerHTML = '<i class="fas fa-volume-up"></i><span>발음 듣기</span>';
        btn.disabled = false;
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
        btn.disabled = false;
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-volume-up"></i><span>발음 듣기</span>';
        }, 2000);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      const btn = document.getElementById(`pronounce-btn-${index}`);
      btn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>오류</span>';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-volume-up"></i><span>발음 듣기</span>';
        btn.disabled = false;
      }, 2000);
    }
  }

  // Toggle learned status
  async toggleLearnedStatus(wordId, isLearned) {
    if (!this.currentUser) return;
    
    try {
      await axios.post('/api/vocabulary/progress', {
        userId: this.currentUser.id,
        wordId: wordId,
        isLearned: isLearned
      });
      
      // Refresh to update progress count
      await this.showVocabulary(this.vocabularyMode);
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress');
    }
  }

  // Toggle bookmark
  async toggleBookmark(wordId, isCurrentlyBookmarked) {
    if (!this.currentUser) return;
    
    try {
      if (isCurrentlyBookmarked) {
        await axios.delete(`/api/vocabulary/bookmarks/${this.currentUser.id}/${wordId}`);
      } else {
        await axios.post('/api/vocabulary/bookmarks', {
          userId: this.currentUser.id,
          wordId: wordId
        });
      }
      
      // Refresh to update bookmark display
      await this.showVocabulary(this.vocabularyMode);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    }
  }

  // Flashcard Mode
  renderFlashcardMode(words, progressData, bookmarkedWords) {
    if (!words || words.length === 0) {
      return `
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div class="text-6xl mb-4">📖</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h3>
          <p class="text-gray-600">Vocabulary words will be added soon!</p>
        </div>
      `;
    }

    this.flashcardIndex = this.flashcardIndex || 0;
    this.flashcardFlipped = false;
    const word = words[this.flashcardIndex];
    const progress = progressData[word.id];
    const isLearned = progress?.is_learned || false;
    const isBookmarked = bookmarkedWords.includes(word.id);

    return `
      <div class="max-w-2xl mx-auto">
        <!-- Card Counter -->
        <div class="text-center mb-4">
          <span class="text-gray-600">Card ${this.flashcardIndex + 1} / ${words.length}</span>
        </div>

        <!-- Flashcard -->
        <div id="flashcard-container" class="perspective-1000">
          <div id="flashcard" class="bg-white rounded-2xl shadow-2xl p-12 min-h-96 flex flex-col items-center justify-center cursor-pointer transform transition-transform duration-500"
               onclick="heyspeak.flipFlashcard()">
            <div id="flashcard-front" class="text-center">
              <h2 class="text-5xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
              <div class="flex items-center justify-center gap-2 mb-4">
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
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="mt-6 flex items-center justify-between">
          <button onclick="heyspeak.previousFlashcard()" 
            class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors ${this.flashcardIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex === 0 ? 'disabled' : ''}>
            <i class="fas fa-arrow-left mr-2"></i>이전
          </button>

          <div class="flex items-center gap-2">
            ${this.currentUser ? `
              <button onclick="heyspeak.toggleBookmark(${word.id}, ${isBookmarked}); event.stopPropagation();" 
                class="p-3 text-2xl ${isBookmarked ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors">
                <i class="fas fa-star"></i>
              </button>
              <button onclick="heyspeak.toggleLearnedStatus(${word.id}, ${!isLearned}); event.stopPropagation();" 
                class="px-4 py-2 ${isLearned ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg font-semibold hover:opacity-80 transition-opacity">
                ${isLearned ? '✓ 학습 완료' : '학습 완료 표시'}
              </button>
            ` : ''}
            <button onclick="heyspeak.pronounceFlashcardWord('${this.escapeHtml(word.word)}')" 
              class="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>

          <button onclick="heyspeak.nextFlashcard()" 
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors ${this.flashcardIndex >= words.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
            ${this.flashcardIndex >= words.length - 1 ? 'disabled' : ''}>
            다음<i class="fas fa-arrow-right ml-2"></i>
          </button>
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
      await this.showVocabulary('flashcard');
    }
  }

  async previousFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.flashcardFlipped = false;
      await this.showVocabulary('flashcard');
    }
  }

  // Quiz Mode
  renderQuizMode(words, progressData) {
    if (!words || words.length === 0) {
      return `
        <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div class="text-6xl mb-4">📖</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">No Vocabulary Yet</h3>
          <p class="text-gray-600">Vocabulary words will be added soon!</p>
        </div>
      `;
    }

    if (!this.quizData) {
      // Initialize quiz with random words
      // Shuffle all words and pick 10
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const selectedWords = shuffledWords.slice(0, Math.min(10, words.length));
      
      this.quizData = {
        questions: selectedWords.map(word => ({
          word: word,
          options: this.generateQuizOptions(word, words),
          userAnswer: null,
          correct: null
        })),
        currentIndex: 0,
        score: 0,
        finished: false
      };
      
      // Reset the flag
      this.quizNeedsNewWords = false;
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
            <span class="text-gray-600">Question ${quiz.currentIndex + 1} / ${quiz.questions.length}</span>
            <span class="text-indigo-600 font-bold">Score: ${quiz.score} / ${quiz.currentIndex}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-indigo-600 h-2 rounded-full transition-all" style="width: ${(quiz.currentIndex / quiz.questions.length) * 100}%"></div>
          </div>
        </div>

        <!-- Question Card -->
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div class="text-center mb-8">
            <h2 class="text-4xl font-bold text-indigo-600 mb-4">${this.escapeHtml(word.word)}</h2>
            <div class="flex items-center justify-center gap-2 mb-4">
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
            <button onclick="heyspeak.pronounceFlashcardWord('${this.escapeHtml(word.word)}')" 
              class="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
              <i class="fas fa-volume-up"></i>
            </button>
          </div>

          <p class="text-gray-700 text-lg mb-6 text-center">이 단어의 뜻은 무엇일까요?</p>

          <!-- Options -->
          <div class="space-y-3">
            ${question.options.map((option, index) => {
              const isSelected = question.userAnswer === option;
              const isCorrect = option === word.meaning_ko;
              let buttonClass = 'bg-white hover:bg-gray-50 border-2 border-gray-200';
              
              if (question.userAnswer !== null) {
                if (isCorrect) {
                  buttonClass = 'bg-green-100 border-2 border-green-500';
                } else if (isSelected) {
                  buttonClass = 'bg-red-100 border-2 border-red-500';
                }
              }
              
              return `
                <button onclick="heyspeak.selectQuizAnswer('${this.escapeHtml(option)}')" 
                  class="w-full p-4 ${buttonClass} rounded-lg text-left font-semibold transition-all ${question.userAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}"
                  ${question.userAnswer !== null ? 'disabled' : ''}>
                  <span class="text-gray-700">${index + 1}. ${this.escapeHtml(option)}</span>
                  ${question.userAnswer !== null && isCorrect ? '<i class="fas fa-check text-green-600 float-right"></i>' : ''}
                  ${question.userAnswer !== null && isSelected && !isCorrect ? '<i class="fas fa-times text-red-600 float-right"></i>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Next Button -->
        ${question.userAnswer !== null ? `
          <div class="text-center">
            <button onclick="heyspeak.nextQuizQuestion()" 
              class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
              ${quiz.currentIndex < quiz.questions.length - 1 ? '다음 문제' : '결과 보기'} <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  generateQuizOptions(correctWord, allWords) {
    const options = [correctWord.meaning_ko];
    const otherWords = allWords.filter(w => w.id !== correctWord.id);
    
    // Add 3 random wrong answers
    while (options.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const randomWord = otherWords[randomIndex];
      
      if (!options.includes(randomWord.meaning_ko)) {
        options.push(randomWord.meaning_ko);
      }
      
      otherWords.splice(randomIndex, 1);
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  }

  async selectQuizAnswer(answer) {
    const question = this.quizData.questions[this.quizData.currentIndex];
    
    if (question.userAnswer !== null) return; // Already answered
    
    question.userAnswer = answer;
    question.correct = (answer === question.word.meaning_ko);
    
    if (question.correct) {
      this.quizData.score++;
    }
    
    // Re-render to show result
    await this.showVocabulary('quiz');
  }

  async nextQuizQuestion() {
    this.quizData.currentIndex++;
    
    if (this.quizData.currentIndex >= this.quizData.questions.length) {
      this.quizData.finished = true;
    }
    
    await this.showVocabulary('quiz');
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
            <button onclick="heyspeak.startNewQuiz()" 
              class="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-forward mr-2"></i>Next Quiz (새로운 단어)
            </button>
            <button onclick="heyspeak.restartQuiz()" 
              class="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors">
              <i class="fas fa-redo mr-2"></i>다시 풀기 (같은 단어)
            </button>
            <button onclick="heyspeak.showVocabulary('list')" 
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
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 class="text-2xl md:text-3xl font-bold text-gray-800">📚 Learning History</h1>
                  <p class="text-gray-600 mt-2">Review your past conversations and track your progress</p>
                </div>
                <button onclick="heyspeak.showTopicSelection()" 
                  class="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                  <i class="fas fa-arrow-left mr-2"></i>Back to Topics
                </button>
              </div>
            </div>

            <!-- Sessions List -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              ${sessions.length === 0 ? `
                <div class="text-center py-12">
                  <div class="text-6xl mb-4">📝</div>
                  <h3 class="text-xl font-bold text-gray-800 mb-2">No Learning History Yet</h3>
                  <p class="text-gray-600 mb-6">Start a conversation to see your learning history here!</p>
                  <button onclick="heyspeak.showTopicSelection()" 
                    class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                    Start Learning
                  </button>
                </div>
              ` : `
                <h2 class="text-xl font-bold text-gray-800 mb-4">Your Sessions (${sessions.length})</h2>
                <div class="space-y-4">
                  ${this.groupSessionsByDate(sessions)}
                </div>
              `}
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
    // Group sessions by date with Korean timezone
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.started_at);
      const dateOnly = new Date(sessionDate);
      dateOnly.setHours(0, 0, 0, 0);
      
      // Calculate days difference
      const daysDiff = Math.floor((today - dateOnly) / (1000 * 60 * 60 * 24));
      
      let dateLabel;
      if (daysDiff === 0) {
        dateLabel = '오늘 (Today)';
      } else if (daysDiff === 1) {
        dateLabel = '어제 (Yesterday)';
      } else if (daysDiff < 7) {
        dateLabel = `${daysDiff}일 전 (${sessionDate.toLocaleDateString('ko-KR', { 
          month: 'long', 
          day: 'numeric',
          weekday: 'short'
        })})`;
      } else {
        dateLabel = sessionDate.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        });
      }
      
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
    
    // Format time in 24-hour format (Korean standard)
    const startTime = sessionDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Calculate relative time
    const now = new Date();
    const diffMs = now - sessionDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let relativeTime;
    if (diffMins < 1) {
      relativeTime = '방금 전';
    } else if (diffMins < 60) {
      relativeTime = `${diffMins}분 전`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}일 전`;
    } else {
      relativeTime = startTime;
    }
    
    const duration = session.ended_at 
      ? Math.round((new Date(session.ended_at) - sessionDate) / 1000 / 60)
      : 'In progress';
    
    return `
      <div class="border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition-all card-hover"
        onclick="heyspeak.showConversation(${session.id})">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${session.topic_icon || '📚'}</span>
              <h4 class="text-lg font-bold text-gray-800">${session.topic_name || 'Conversation'}</h4>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <span><i class="fas fa-clock mr-1"></i>${startTime} (${relativeTime})</span>
              <span><i class="fas fa-hourglass-half mr-1"></i>${duration}${typeof duration === 'number' ? '분' : ''}</span>
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
      const startTime = sessionDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <button onclick="heyspeak.showHistory()" 
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
    const time = messageDate.toLocaleTimeString('ko-KR', {
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
                  onclick="heyspeak.playHistoryMessage('${this.escapeHtml(message.content)}', '${messageId}')" 
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        <p class="text-gray-600">검색 중...</p>
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
                    onclick="heyspeak.playPronunciation('${word.word}')"
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
            
            <!-- Korean Meaning -->
            <div class="mb-4 pb-4 border-b border-indigo-100">
              <div class="text-lg font-semibold text-gray-700 mb-1">뜻:</div>
              <div class="text-gray-800 text-lg">${word.meaning_ko}</div>
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
                    onclick="heyspeak.playExampleSentence('${word.example_sentence.replace(/'/g, "\\'")}')"
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
            <p class="text-gray-700">단어를 찾을 수 없습니다: "<strong>${searchTerm}</strong>"</p>
            <p class="text-sm text-gray-600 mt-2">다른 단어를 검색해보세요.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResult.innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
          <i class="fas fa-exclamation-circle text-red-600 text-3xl mb-2"></i>
          <p class="text-gray-700">검색 중 오류가 발생했습니다.</p>
          <p class="text-sm text-gray-600 mt-2">${error.response?.data?.message || '다시 시도해주세요.'}</p>
        </div>
      `;
    }
  }
  
  async playExampleSentence(sentence) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: sentence,
        language: 'en'
      });
      
      if (response.data.success) {
        const audio = new Audio(response.data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  // Statistics feature
  async showStats() {
    try {
      const response = await axios.get(`/api/history/stats/${this.currentUser.id}`);
      const stats = response.data.stats;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 class="text-2xl md:text-3xl font-bold text-gray-800">📊 Learning Statistics</h1>
                  <p class="text-gray-600 mt-2">Track your learning progress and insights</p>
                </div>
                <button onclick="heyspeak.showTopicSelection()" 
                  class="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                  <i class="fas fa-arrow-left mr-2"></i>Back to Topics
                </button>
              </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <div class="text-4xl mb-2">📚</div>
                <div class="text-3xl font-bold text-blue-700">${stats.totalSessions}</div>
                <div class="text-sm text-blue-600">Total Sessions</div>
              </div>
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6">
                <div class="text-4xl mb-2">💬</div>
                <div class="text-3xl font-bold text-green-700">${stats.totalMessages}</div>
                <div class="text-sm text-green-600">Total Messages</div>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6">
                <div class="text-4xl mb-2">🗣️</div>
                <div class="text-3xl font-bold text-purple-700">${stats.totalWords.toLocaleString()}</div>
                <div class="text-sm text-purple-600">Words Spoken</div>
              </div>
              <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-6">
                <div class="text-4xl mb-2">🔥</div>
                <div class="text-3xl font-bold text-orange-700">${stats.currentStreak}</div>
                <div class="text-sm text-orange-600">Day Streak</div>
              </div>
            </div>

            <!-- Charts Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Daily Activity Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">📈 Daily Activity (Last 30 Days)</h3>
                <canvas id="dailyActivityChart"></canvas>
              </div>

              <!-- Topic Distribution Chart -->
              <div class="bg-white rounded-2xl shadow-lg p-6">
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
            <button onclick="heyspeak.showTopicSelection()" 
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
              <button onclick="heyspeak.playWordPronunciation('${word.word}')" 
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all">
                <i class="fas fa-volume-up"></i>
                발음 듣기
              </button>
            </div>

            <!-- Meaning -->
            <div class="border-t border-gray-200 pt-6 mb-6">
              <div class="text-gray-600 text-sm mb-2">한국어 뜻</div>
              <div class="text-2xl font-semibold text-gray-800 mb-4">
                ${word.meaning_ko}
              </div>
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
              <button onclick="heyspeak.markWordAsLearned(${word.id}, false)" 
                class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                <i class="fas fa-times mr-2"></i>다시 보기
              </button>
              <button onclick="heyspeak.markWordAsLearned(${word.id}, true)" 
                class="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
                <i class="fas fa-check mr-2"></i>알았어요!
              </button>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex gap-4 mt-6">
            ${this.currentWordIndex > 0 ? `
              <button onclick="heyspeak.previousWord()" 
                class="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                <i class="fas fa-chevron-left mr-2"></i>이전 단어
              </button>
            ` : ''}
            ${this.currentWordIndex < this.vocabularyWords.length - 1 ? `
              <button onclick="heyspeak.nextWord()" 
                class="ml-auto px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md">
                다음 단어<i class="fas fa-chevron-right ml-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async playWordPronunciation(word) {
    try {
      const response = await axios.post('/api/tts/speak', {
        text: word
      }, {
        responseType: 'blob'
      });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      alert('Failed to play pronunciation. Please try again.');
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
            <button onclick="heyspeak.showVocabularyLearning()" 
              class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
              <i class="fas fa-redo mr-2"></i>더 학습하기
            </button>
            <button onclick="heyspeak.showTopicSelection()" 
              class="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all">
              <i class="fas fa-home mr-2"></i>홈으로
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize app
const heyspeak = new HeySpeak();
