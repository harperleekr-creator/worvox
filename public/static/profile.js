// WorVox Profile Module
// User profile and settings
(function() {
  'use strict';
  if (!window.WorVox) return;
  
  Object.assign(window.WorVox.prototype, {
    showProfile() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="flex h-screen bg-gradient-to-br from-gray-50 to-slate-50">
          ${this.getSidebar('profile')}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="bg-white border-b border-gray-200 px-6 py-3">
              <h1 class="text-2xl font-bold text-gray-800">
                <i class="fas fa-user text-gray-600 mr-2"></i>프로필
              </h1>
            </div>
            <div class="flex-1 overflow-y-auto p-8">
              <div class="max-w-4xl mx-auto">
                <div class="text-6xl mb-4 text-center">👤</div>
                <h2 class="text-3xl font-bold mb-4 text-center">내 프로필</h2>
                <p class="text-gray-600 mb-8 text-center">프로필과 설정을 관리하세요</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  });
  console.log('✅ Profile module loaded');
})();
