// Helper functions to integrate daily goals with existing app activities

// Update daily goal progress automatically
window.updateDailyGoalProgress = async function(activity, amount = 1) {
  if (!window.worvox?.currentUser || !window.dailyGoalsManager) {
    return;
  }

  try {
    await window.dailyGoalsManager.updateProgress(
      window.worvox.currentUser.id,
      activity,
      amount
    );
  } catch (error) {
    console.error('Failed to update daily goal progress:', error);
  }
};

// Show daily goals dashboard in a modal
window.showDailyGoalsDashboard = function() {
  const modal = document.createElement('div');
  modal.id = 'daily-goals-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">📊 일일 목표 대시보드</h2>
          <p class="text-sm text-gray-600">매일 목표를 달성하고 스트릭을 유지하세요!</p>
        </div>
        <button onclick="document.getElementById('daily-goals-modal').remove()" 
          class="text-gray-500 hover:text-gray-700 text-2xl font-bold">
          ×
        </button>
      </div>
      
      <!-- Dashboard Content -->
      <div class="p-6" id="daily-goals-dashboard">
        <!-- Dashboard will be rendered here by DailyGoalsManager -->
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p class="text-gray-600">로딩 중...</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Render dashboard if manager is initialized
  if (window.dailyGoalsManager && window.dailyGoalsManager.currentGoal) {
    window.dailyGoalsManager.renderDashboard();
  }
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// Add daily goals button to the app UI
window.addDailyGoalsButton = function() {
  // Check if button already exists
  if (document.getElementById('daily-goals-btn')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'daily-goals-btn';
  button.className = 'fixed bottom-20 right-4 md:bottom-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40';
  button.innerHTML = '<i class="fas fa-trophy text-xl"></i>';
  button.title = '일일 목표 대시보드';
  button.onclick = window.showDailyGoalsDashboard;
  
  document.body.appendChild(button);
  console.log('✅ Daily goals button added!');
};

window.addEventListener('load', () => {
  setTimeout(() => {
    // Check if user is logged in before showing button
    if (window.worvox?.currentUser) {
      window.addDailyGoalsButton();
    } else {
      console.log('⏳ User not logged in yet, button will be added after login');
    }
  }, 3000); // Wait 3 seconds for app to initialize
});
