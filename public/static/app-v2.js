// WorVox App V2 - Modern UI with Real API Integration
// This is a complete rewrite of the app UI while keeping all backend APIs intact

class WorVoxV2 {
  constructor() {
    this.currentUser = null;
    this.userPlan = 'free';
    this.topics = [];
    this.stats = {};
    this.gamificationStats = {};
    
    this.init();
  }
  
  async init() {
    console.log('🚀 WorVox V2 Initializing...');
    
    // Check if user is logged in
    const storedUser = localStorage.getItem('worvox_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.userPlan = this.currentUser.plan || 'free';
        console.log('✅ User loaded:', this.currentUser.username);
        
        // Load data
        await this.loadData();
        
        // Show dashboard
        this.showDashboard();
      } catch (e) {
        console.error('Failed to parse user:', e);
        this.showLogin();
      }
    } else {
      this.showLogin();
    }
  }
  
  async loadData() {
    try {
      // Load topics
      const topicsResponse = await axios.get('/api/topics');
      this.topics = topicsResponse.data.data.topics;
      
      // Load user stats
      const statsResponse = await axios.get(`/api/users/${this.currentUser.id}/stats`);
      this.stats = statsResponse.data.stats;
      
      // Load gamification stats
      const gamifResponse = await axios.get(`/api/gamification/stats/${this.currentUser.id}`);
      this.gamificationStats = gamifResponse.data.stats;
      
      console.log('✅ Data loaded:', { topics: this.topics.length, stats: this.stats, gamification: this.gamificationStats });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }
  
  showLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Welcome to WorVox</h1>
          <p class="text-gray-600 mb-6">Modern AI English Learning Platform</p>
          
          <button onclick="window.location.href='/app'" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition">
            Go to Login
          </button>
        </div>
      </div>
    `;
  }
  
  showDashboard() {
    const level = this.gamificationStats.level || 1;
    const xp = this.gamificationStats.xp || 0;
    const totalXp = this.gamificationStats.totalXP || 0;
    const coins = this.gamificationStats.coins || 0;
    const streak = this.gamificationStats.currentStreak || 0;
    
    const totalSessions = this.stats.totalSessions || 0;
    const totalMessages = this.stats.totalMessages || 0;
    const wordsLearned = Math.floor(totalMessages / 2) * 10;
    
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="min-h-screen" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
        
        <!-- Header -->
        <header class="max-w-7xl mx-auto p-6 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <i class="fas fa-graduation-cap text-white"></i>
              </div>
              <span class="text-white text-xl font-bold">WorVox</span>
            </div>
            
            <nav class="hidden md:flex items-center gap-2">
              <a href="/app-v2" class="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold">Dashboard</a>
              <a href="/app" class="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition">Classic UI</a>
            </nav>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="hidden md:flex items-center gap-3 bg-gray-800 rounded-full px-4 py-2">
              <span class="text-white font-medium">${this.currentUser.username}</span>
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span class="text-white font-bold">${this.currentUser.username.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <button onclick="worvoxV2.logout()" class="text-gray-400 hover:text-white">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>

        <div class="max-w-7xl mx-auto px-6 pb-12">
          
          <!-- Hero Section -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            <!-- AI Teacher Card -->
            <div class="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden" style="box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);">
              <div class="absolute top-4 right-4 flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                READY
              </div>
              
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                  🤖
                </div>
                <div>
                  <div class="text-gray-400 text-sm">AI English Teacher</div>
                  <div class="text-white text-2xl font-bold">Ready to Help You</div>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-gray-700/50 rounded-xl p-4 text-center">
                  <div class="text-3xl mb-2">💬</div>
                  <div class="text-white text-2xl font-bold">${totalSessions}</div>
                  <div class="text-gray-400 text-xs">Sessions</div>
                </div>
                <div class="bg-gray-700/50 rounded-xl p-4 text-center">
                  <div class="text-3xl mb-2">📚</div>
                  <div class="text-white text-2xl font-bold">${wordsLearned}</div>
                  <div class="text-gray-400 text-xs">Words</div>
                </div>
                <div class="bg-gray-700/50 rounded-xl p-4 text-center">
                  <div class="text-3xl mb-2">🔥</div>
                  <div class="text-white text-2xl font-bold">${streak}</div>
                  <div class="text-gray-400 text-xs">Day Streak</div>
                </div>
              </div>
              
              <button onclick="worvoxV2.startChat()" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition">
                <i class="fas fa-comments"></i>
                Start AI Conversation
              </button>
            </div>
            
            <!-- Stats Card -->
            <div class="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-6 text-white" style="box-shadow: 0 0 20px rgba(251, 146, 60, 0.3);">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">${this.userPlan.toUpperCase()}</span>
                <span class="text-sm">Level ${level}</span>
              </div>
              
              <div class="space-y-4 mb-6">
                <div class="flex items-center gap-3">
                  <i class="fas fa-trophy text-white/80"></i>
                  <div class="flex-1">
                    <div class="text-sm font-semibold">Total XP</div>
                    <div class="text-2xl font-bold">${totalXp.toLocaleString()}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <i class="fas fa-coins text-white/80"></i>
                  <div class="flex-1">
                    <div class="text-sm font-semibold">Coins</div>
                    <div class="text-2xl font-bold">${coins}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <i class="fas fa-fire text-white/80"></i>
                  <div class="flex-1">
                    <div class="text-sm font-semibold">Streak</div>
                    <div class="text-2xl font-bold">${streak} days</div>
                  </div>
                </div>
              </div>
              
              <!-- XP Progress -->
              <div class="bg-white/10 rounded-2xl p-4">
                <div class="text-xs text-white/80 mb-2">Level Progress</div>
                <div class="bg-white/20 rounded-full h-3 mb-2">
                  <div class="bg-white rounded-full h-3 transition-all" style="width: ${(xp % 100)}%"></div>
                </div>
                <div class="text-xs text-white/80">${xp} / 100 XP to Level ${level + 1}</div>
              </div>
            </div>
          </div>

          <!-- Learning Topics -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-3xl font-bold text-white">Learning Topics</h2>
              <p class="text-gray-400">Choose what you want to practice</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              ${this.topics.map(topic => `
                <button onclick="worvoxV2.selectTopic('${topic.id}')" 
                  class="bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-105"
                  style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div class="text-5xl mb-4">${topic.icon}</div>
                  <h3 class="text-white text-xl font-bold mb-2">${topic.name}</h3>
                  <p class="text-gray-400 text-sm">${topic.description}</p>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
              <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-stopwatch text-3xl"></i>
                <h3 class="text-xl font-bold">Timer Mode</h3>
              </div>
              <p class="text-white/80 text-sm mb-4">Challenge yourself with time limits</p>
              <button onclick="window.location.href='/app#timer'" class="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition">
                Start Challenge
              </button>
            </div>
            
            <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-theater-masks text-3xl"></i>
                <h3 class="text-xl font-bold">Scenario Mode</h3>
              </div>
              <p class="text-white/80 text-sm mb-4">Practice real-life situations</p>
              <button onclick="window.location.href='/app#scenario'" class="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition">
                Start Scenario
              </button>
            </div>
            
            <div class="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-graduation-cap text-3xl"></i>
                <h3 class="text-xl font-bold">Exam Mode</h3>
              </div>
              <p class="text-white/80 text-sm mb-4">Test your knowledge</p>
              <button onclick="window.location.href='/app#exam'" class="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition">
                Take Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  startChat() {
    window.location.href = '/app#chat';
  }
  
  selectTopic(topicId) {
    console.log('Selected topic:', topicId);
    window.location.href = `/app#topic-${topicId}`;
  }
  
  logout() {
    localStorage.removeItem('worvox_user');
    window.location.reload();
  }
}

// Initialize app
window.worvoxV2 = new WorVoxV2();
