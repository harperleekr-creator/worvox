// WorVox Timer Module
// Timer mode for focused speaking practice
(function() {
  'use strict';
  if (!window.WorVox) return;
  
  Object.assign(window.WorVox.prototype, {
    showTimerMode() {
      if (!this.checkUsageLimit('timerMode')) return;
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          ${this.getSidebar('timer-mode')}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white border-b border-blue-200 px-6 py-3">
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-clock text-blue-600 mr-2"></i>타이머 모드
              </h1>
            </div>
            <div class="flex-1 overflow-y-auto p-8">
              <div class="max-w-4xl mx-auto text-center">
                <div class="text-6xl mb-4">⏱️</div>
                <h2 class="text-3xl font-bold mb-4">타이머 모드</h2>
                <p class="text-gray-600 mb-8">자유롭게 말하기 연습을 시작하세요</p>
                <button onclick="worvox.startTimer()" 
                  class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700">
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    startTimer() {
      console.log('🎯 Timer started');
      this.showToast('타이머가 시작되었습니다', 'success');
    }
  });
  console.log('✅ Timer module loaded');
})();
