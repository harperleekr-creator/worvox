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
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('heyspeak_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.showTopicSelection();
    } else {
      this.showLogin();
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
          <p class="text-gray-600">What should we call you?</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
          <input type="text" id="username" value="${this.onboardingData.username}"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            placeholder="Enter your name" autofocus>
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
                <button onclick="heyspeak.logout()" 
                  class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <i class="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app
const heyspeak = new HeySpeak();
