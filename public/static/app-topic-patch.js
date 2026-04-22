// App Topic Selection Patch - Enable guest mode for dashboard
// This patches showTopicSelection() to allow non-logged-in users to see the app UI

(function() {
  'use strict';
  
  console.log('🔧 Patching worvox.showTopicSelection() to support guest mode...');
  
  // Wait for worvox to be ready
  let patchAttempts = 0;
  const maxAttempts = 100; // 10 seconds
  
  const tryPatch = () => {
    patchAttempts++;
    
    if (typeof window.worvox !== 'undefined' && typeof window.worvox.showTopicSelection === 'function') {
      // Save original function
      const _originalShowTopicSelection = window.worvox.showTopicSelection;
      
      // Override showTopicSelection to support guest mode
      window.worvox.showTopicSelection = async function() {
        try {
          console.log('🏠 showTopicSelection called (patched version)');
          
          // Add to browser history
          if (!window.location.pathname.includes('/app')) {
            history.pushState({ page: 'dashboard' }, '', '/app');
          } else if (history.state && history.state.page !== 'dashboard') {
            history.pushState({ page: 'dashboard' }, '', '/app');
          }
          this.currentPage = 'dashboard';
          
          // Check if user is logged in
          const isLoggedIn = !!this.currentUser || !!localStorage.getItem('worvox_user');
          
          if (isLoggedIn) {
            // User is logged in - use original function
            console.log('✅ User logged in - using original dashboard');
            return _originalShowTopicSelection.call(this);
          }
          
          // Guest mode - show simplified dashboard
          console.log('👤 Guest mode - showing simplified dashboard');
          
          // Fetch topics (no auth required)
          const topicsResponse = await axios.get('/api/topics');
          this.topics = topicsResponse.data.data.topics;
          
          const app = document.getElementById('app');
          
          // Create guest sidebar without calling getSidebar() (which requires currentUser)
          const guestSidebar = `
            <div id="sidebar" class="fixed md:static inset-y-0 left-0 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out bg-gray-900 text-white w-64 flex flex-col z-50">
              <div class="flex items-center justify-between p-4 border-b border-gray-800">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <i class="fas fa-graduation-cap text-white"></i>
                  </div>
                  <span class="text-xl font-bold">WorVox</span>
                </div>
                <button onclick="worvox.closeMobileSidebar()" class="md:hidden text-gray-400 hover:text-white">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <nav class="flex-1 p-4 overflow-y-auto">
                <a href="/app" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-600 text-white mb-2">
                  <i class="fas fa-home"></i>
                  <span>홈</span>
                </a>
              </nav>
              
              <div class="p-4 border-t border-gray-800">
                <button onclick="window.loginModal && window.loginModal.open('guest-sidebar')" class="flex items-center gap-3 w-full hover:bg-gray-800 p-3 rounded-lg transition-all bg-gray-800">
                  <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium text-sm">게스트</div>
                    <div class="text-xs text-gray-400">로그인하기</div>
                  </div>
                </button>
              </div>
            </div>
          `;
          
          app.innerHTML = `
            <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
              <!-- Sidebar -->
              ${guestSidebar}
              
              <!-- Main Content -->
              <div class="flex-1 flex flex-col overflow-hidden border-l border-gray-200 dark:border-gray-700">
                <!-- Desktop Top Bar -->
                <div class="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Choose Your Learning Path</h2>
                  <div class="flex items-center gap-3">
                    <button onclick="window.loginModal && window.loginModal.open('guest-upgrade')" 
                      class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-all">
                      <i class="fas fa-crown mr-2"></i>로그인하기
                    </button>
                  </div>
                </div>
                
                <!-- Mobile Header -->
                <div class="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                  <div class="flex items-center justify-between">
                    <button onclick="worvox.toggleMobileSidebar()" class="text-gray-600 dark:text-gray-300">
                      <i class="fas fa-bars text-xl"></i>
                    </button>
                    <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Home</h1>
                    <button onclick="window.loginModal && window.loginModal.open('guest-upgrade')" 
                      class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      <i class="fas fa-crown"></i>
                    </button>
                  </div>
                </div>
                
                <!-- Content Area -->
                <div class="flex-1 overflow-y-auto p-6">
                  <!-- Guest Welcome Banner -->
                  <div class="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                    <h3 class="text-2xl font-bold mb-2">👋 Welcome to WorVox!</h3>
                    <p class="mb-4">AI 영어 학습을 시작하세요. 로그인하고 더 많은 기능을 사용해보세요!</p>
                    <button onclick="window.loginModal && window.loginModal.open('guest-welcome')" 
                      class="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all">
                      무료로 시작하기 →
                    </button>
                  </div>
                  
                  <!-- Learning Modes Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    ${this.topics.map(topic => `
                      <button onclick="window.loginModal && window.loginModal.open('feature-locked')" 
                        class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 p-6">
                        <div class="flex flex-col items-center text-center">
                          <div class="text-4xl mb-3">${topic.icon}</div>
                          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">${topic.name}</h3>
                          <p class="text-sm text-gray-600 dark:text-gray-400">${topic.description}</p>
                          <div class="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            <i class="fas fa-lock text-xs"></i>
                            <span class="text-sm">로그인 필요</span>
                          </div>
                        </div>
                      </button>
                    `).join('')}
                  </div>
                  
                  <!-- Additional Learning Tools -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onclick="window.loginModal && window.loginModal.open('feature-locked')" 
                      class="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-6 text-white hover:shadow-lg transition-all">
                      <i class="fas fa-stopwatch text-3xl mb-3"></i>
                      <h3 class="text-lg font-bold mb-2">타이머 모드</h3>
                      <p class="text-sm opacity-90">시간 제한 도전</p>
                      <div class="mt-3 text-xs opacity-75">
                        <i class="fas fa-lock mr-1"></i>로그인 필요
                      </div>
                    </button>
                    
                    <button onclick="window.loginModal && window.loginModal.open('feature-locked')" 
                      class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white hover:shadow-lg transition-all">
                      <i class="fas fa-theater-masks text-3xl mb-3"></i>
                      <h3 class="text-lg font-bold mb-2">시나리오 모드</h3>
                      <p class="text-sm opacity-90">실제 상황 연습</p>
                      <div class="mt-3 text-xs opacity-75">
                        <i class="fas fa-lock mr-1"></i>로그인 필요
                      </div>
                    </button>
                    
                    <button onclick="window.loginModal && window.loginModal.open('feature-locked')" 
                      class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white hover:shadow-lg transition-all">
                      <i class="fas fa-graduation-cap text-3xl mb-3"></i>
                      <h3 class="text-lg font-bold mb-2">모의고사</h3>
                      <p class="text-sm opacity-90">실력 테스트</p>
                      <div class="mt-3 text-xs opacity-75">
                        <i class="fas fa-lock mr-1"></i>로그인 필요
                      </div>
                    </button>
                  </div>
                  
                  <!-- Features Section -->
                  <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      <i class="fas fa-star text-yellow-500 mr-2"></i>WorVox 주요 기능
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="flex items-start gap-3">
                        <i class="fas fa-robot text-emerald-500 text-xl mt-1"></i>
                        <div>
                          <h4 class="font-semibold text-gray-800 dark:text-gray-200">AI 대화 파트너</h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">실시간 AI와 자연스러운 영어 대화</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-3">
                        <i class="fas fa-chart-line text-blue-500 text-xl mt-1"></i>
                        <div>
                          <h4 class="font-semibold text-gray-800 dark:text-gray-200">학습 분석</h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">상세한 학습 통계와 피드백</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-3">
                        <i class="fas fa-trophy text-yellow-500 text-xl mt-1"></i>
                        <div>
                          <h4 class="font-semibold text-gray-800 dark:text-gray-200">게임화 시스템</h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">레벨업, 스트릭, 코인 획득</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-3">
                        <i class="fas fa-book text-purple-500 text-xl mt-1"></i>
                        <div>
                          <h4 class="font-semibold text-gray-800 dark:text-gray-200">개인화 학습</h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400">나만의 단어장과 복습 시스템</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Ensure sidebar is functional
          if (typeof this.closeMobileSidebar === 'function') {
            this.closeMobileSidebar();
          }
          
          console.log('✅ Guest dashboard rendered successfully');
          
        } catch (error) {
          console.error('❌ Error in patched showTopicSelection:', error);
          // Fallback to original if patch fails
          if (typeof _originalShowTopicSelection === 'function') {
            return _originalShowTopicSelection.call(this);
          }
        }
      };
      
      console.log('✅ showTopicSelection() successfully patched for guest mode');
      return true;
    }
    
    // Retry if not ready yet
    if (patchAttempts < maxAttempts) {
      setTimeout(tryPatch, 100);
    } else {
      console.error('❌ Failed to patch showTopicSelection after', patchAttempts, 'attempts');
    }
  };
  
  // Start patching
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryPatch);
  } else {
    tryPatch();
  }
})();
