// WorVox History Module
// Learning history and statistics
(function() {
  'use strict';
  if (!window.WorVox) return;
  
  Object.assign(window.WorVox.prototype, {
    showHistoryTab(tabName) {
      console.log('📊 Showing history:', tabName);
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-purple-50 to-pink-50">
          ${this.getSidebar('history')}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white border-b border-purple-200 px-6 py-3">
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-history text-purple-600 mr-2"></i>학습 기록
              </h1>
            </div>
            <div class="flex-1 overflow-y-auto p-8">
              <div class="max-w-4xl mx-auto">
                <div class="text-6xl mb-4 text-center">📊</div>
                <h2 class="text-3xl font-bold mb-4 text-center">학습 통계</h2>
                <p class="text-gray-600 mb-8 text-center">나의 학습 기록을 확인하세요</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  });
  console.log('✅ History module loaded');
})();
