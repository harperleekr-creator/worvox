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
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold gradient-text mb-2">HeySpeak</h1>
            <p class="text-gray-600">AI-Powered English Learning</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input type="text" id="username" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select id="level" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">🌿 Intermediate</option>
                <option value="advanced">🌳 Advanced</option>
              </select>
            </div>
            
            <button type="submit" 
              class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all btn-hover">
              Get Started
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  async handleLogin() {
    const username = document.getElementById('username').value;
    const level = document.getElementById('level').value;

    try {
      const response = await axios.post('/api/users/auth', {
        username,
        level
      });

      if (response.data.success) {
        this.currentUser = response.data.user;
        localStorage.setItem('heyspeak_user', JSON.stringify(this.currentUser));
        this.showTopicSelection();
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login. Please try again.');
    }
  }

  async showTopicSelection() {
    try {
      const response = await axios.get('/api/topics');
      const topics = response.data.topics;

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="min-h-screen p-4 md:p-8">
          <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-800">Welcome, ${this.currentUser.username}! 👋</h1>
                  <p class="text-gray-600 mt-1">Level: <span class="font-semibold text-indigo-600">${this.currentUser.level}</span></p>
                </div>
                <button onclick="heyspeak.logout()" 
                  class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <i class="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
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
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('Recording stopped. Blob size:', audioBlob.size, 'type:', audioBlob.type);
        await this.processAudio(audioBlob);
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

  async processAudio(audioBlob) {
    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      // Step 1: Transcribe audio
      const formData = new FormData();
      // Determine file extension based on mime type
      const fileExt = audioBlob.type.includes('webm') ? 'webm' : 
                     audioBlob.type.includes('mp4') ? 'm4a' : 
                     audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      formData.append('audio', audioBlob, `recording.${fileExt}`);

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
      const audioBlob = new Blob([ttsResponse.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
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
