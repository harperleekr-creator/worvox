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
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      
      // Add AI message to UI
      this.addMessage('assistant', aiMessage);

      // Step 3: Generate speech for AI response
      console.log('Sending to TTS API...');
      const ttsResponse = await axios.post('/api/tts/speak', {
        text: aiMessage
      }, {
        responseType: 'arraybuffer'
      });

      console.log('TTS Response received:', ttsResponse.data.byteLength, 'bytes');
      
      // Play audio
      const ttsAudioBlob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(ttsAudioBlob);
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
    this.messages.push({ role, content });
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Remove empty state if exists
    if (chatMessages.querySelector('.text-center')) {
      chatMessages.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `mb-4 ${role === 'user' ? 'text-right' : 'text-left'} message-${role}`;
    
    messageDiv.innerHTML = `
      <div class="inline-block max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
        role === 'user' 
          ? 'bg-indigo-600 text-white' 
          : 'bg-gray-200 text-gray-800'
      }">
        <p class="text-sm md:text-base">${this.escapeHtml(content)}</p>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
    
    return `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
        <div class="max-w-xs md:max-w-md lg:max-w-lg">
          <div class="inline-block px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-800'
          }">
            <p class="text-sm md:text-base">${this.escapeHtml(message.content)}</p>
          </div>
          <p class="text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}">${time}</p>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
}

// Initialize app
const heyspeak = new HeySpeak();
