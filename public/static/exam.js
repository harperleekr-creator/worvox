// WorVox Exam Module
// OPIC-style speaking exam
(function() {
  'use strict';
  if (!window.WorVox) return;
  
  Object.assign(window.WorVox.prototype, {
    showExamMode() {
      if (!this.checkUsageLimit('examMode')) return;
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-orange-50 to-red-50">
          ${this.getSidebar('exam-mode')}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white border-b border-orange-200 px-6 py-3">
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-clipboard-check text-orange-600 mr-2"></i>시험 모드
              </h1>
            </div>
            <div class="flex-1 overflow-y-auto p-8">
              <div class="max-w-4xl mx-auto text-center">
                <div class="text-6xl mb-4">📝</div>
                <h2 class="text-3xl font-bold mb-4">OPIC 스타일 시험</h2>
                <p class="text-gray-600 mb-8">실전 스피킹 테스트로 실력을 평가하세요</p>
                <button onclick="worvox.startExam()" 
                  class="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-orange-700">
                  시험 시작
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    startExam() {
      console.log('📝 Exam started');
      this.showToast('시험을 시작합니다', 'success');
    }
  });
  console.log('✅ Exam module loaded');
})();
