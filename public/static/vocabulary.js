// WorVox Vocabulary Module
// Vocabulary learning and flashcards
(function() {
  'use strict';
  if (!window.WorVox) return;
  
  Object.assign(window.WorVox.prototype, {
    showVocabularyCard() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-green-50 to-emerald-50">
          ${this.getSidebar('vocabulary')}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white border-b border-green-200 px-6 py-3">
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-book text-green-600 mr-2"></i>단어 학습
              </h1>
            </div>
            <div class="flex-1 overflow-y-auto p-8">
              <div class="max-w-4xl mx-auto text-center">
                <div class="text-6xl mb-4">📚</div>
                <h2 class="text-3xl font-bold mb-4">단어 학습</h2>
                <p class="text-gray-600 mb-8">플래시카드로 단어를 익히세요</p>
                <button onclick="worvox.startVocabulary()" 
                  class="bg-green-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-green-700">
                  학습 시작
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    startVocabulary() {
      console.log('📚 Vocabulary started');
      this.showToast('단어 학습을 시작합니다', 'success');
    }
  });
  console.log('✅ Vocabulary module loaded');
})();
