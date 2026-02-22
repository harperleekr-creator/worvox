// Gamification Module for WorVox
class GamificationManager {
  constructor() {
    this.xpValues = {
      word_learned: 10,
      quiz_correct: 15,
      quiz_completed: 50,
      conversation_message: 5,
      conversation_completed: 100,
      daily_login: 20,
      mission_completed: 50
    };
  }

  // Add XP to user
  async addXP(userId, xp, activityType, details = null) {
    try {
      const response = await axios.post('/api/gamification/xp/add', {
        userId,
        xp,
        activityType,
        details
      });

      if (response.data.success) {
        const data = response.data;
        
        // Show XP notification
        this.showXPNotification(data);
        
        // Show level up notification if leveled up
        if (data.leveledUp) {
          this.showLevelUpNotification(data);
        }
        
        // Update UI with new stats
        this.updateStatsUI(data);
        
        return data;
      }
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }

  // Show XP notification
  showXPNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-right flex items-center gap-3';
    notification.innerHTML = `
      <i class="fas fa-star text-yellow-300 text-xl"></i>
      <div>
        <div class="font-bold">+${data.xpGained} XP</div>
        ${data.coinsEarned > 0 ? `<div class="text-sm">+${data.coinsEarned} 코인</div>` : ''}
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Show level up notification
  showLevelUpNotification(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform animate-scale-in">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Level Up!</h2>
        <div class="text-5xl font-bold text-indigo-600 mb-4">
          ${data.oldLevel} → ${data.newLevel}
        </div>
        <p class="text-gray-600 mb-6">
          축하합니다! 레벨 ${data.newLevel}에 도달했습니다!
        </p>
        <button onclick="this.closest('.fixed').remove()" 
          class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all">
          계속하기
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Auto close after 5 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
      }
    }, 5000);
  }

  // Update stats UI in sidebar/profile
  updateStatsUI(data) {
    // Update level badge
    const levelBadge = document.querySelector('#user-level');
    if (levelBadge) {
      levelBadge.textContent = `Lv.${data.newLevel}`;
    }
    
    // Update XP progress bar
    const xpBar = document.querySelector('#xp-progress-bar');
    if (xpBar) {
      const progress = (data.currentLevelXP / data.xpNeededForNextLevel) * 100;
      xpBar.style.width = `${progress}%`;
    }
    
    // Update XP text
    const xpText = document.querySelector('#xp-text');
    if (xpText) {
      xpText.textContent = `${data.currentLevelXP} / ${data.xpNeededForNextLevel} XP`;
    }
    
    // Update coins
    const coinsDisplay = document.querySelector('#user-coins');
    if (coinsDisplay) {
      coinsDisplay.textContent = `💰 ${data.totalCoins}`;
    }
  }

  // Get user stats
  async getStats(userId) {
    try {
      const response = await axios.get(`/api/gamification/stats/${userId}`);
      if (response.data.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Error getting stats:', error);
    }
    return null;
  }

  // Get leaderboard
  async getLeaderboard() {
    try {
      const response = await axios.get('/api/gamification/leaderboard');
      if (response.data.success) {
        return response.data.leaderboard;
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
    }
    return [];
  }

  // Show stats modal
  async showStatsModal(userId) {
    const stats = await this.getStats(userId);
    if (!stats) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">📊 나의 통계</h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl p-4">
            <div class="text-sm opacity-90">레벨</div>
            <div class="text-3xl font-bold">${stats.stats.level}</div>
          </div>
          <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4">
            <div class="text-sm opacity-90">총 XP</div>
            <div class="text-3xl font-bold">${stats.stats.totalXP.toLocaleString()}</div>
          </div>
          <div class="bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl p-4">
            <div class="text-sm opacity-90">코인</div>
            <div class="text-3xl font-bold">${stats.stats.coins}</div>
          </div>
          <div class="bg-gradient-to-br from-pink-500 to-red-600 text-white rounded-xl p-4">
            <div class="text-sm opacity-90">연속 학습</div>
            <div class="text-3xl font-bold">${stats.stats.currentStreak}일</div>
          </div>
        </div>
        
        <!-- XP Progress -->
        <div class="mb-6">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-600">다음 레벨까지</span>
            <span class="font-semibold text-indigo-600">${stats.stats.xp} / ${stats.stats.xpForNextLevel} XP</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all" 
              style="width: ${stats.stats.progress}%"></div>
          </div>
        </div>
        
        <!-- Badges -->
        ${stats.badges.length > 0 ? `
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">🏆 획득한 뱃지</h3>
            <div class="grid grid-cols-4 gap-3">
              ${stats.badges.map(badge => `
                <div class="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-all">
                  <div class="text-3xl mb-1">${badge.badge_icon}</div>
                  <div class="text-xs font-semibold text-gray-700">${badge.badge_name}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Recent Activity -->
        ${stats.recentActivity.length > 0 ? `
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-3">📈 최근 활동</h3>
            <div class="space-y-2">
              ${stats.recentActivity.slice(0, 5).map(activity => `
                <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div class="flex items-center gap-3">
                    <span class="text-lg">${this.getActivityIcon(activity.activity_type)}</span>
                    <div>
                      <div class="text-sm font-medium text-gray-800">${this.getActivityName(activity.activity_type)}</div>
                      <div class="text-xs text-gray-500">${new Date(activity.created_at).toLocaleString('ko-KR')}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-indigo-600">+${activity.xp_gained} XP</div>
                    ${activity.coins_gained > 0 ? `<div class="text-xs text-yellow-600">+${activity.coins_gained} 코인</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    document.body.appendChild(modal);
  }

  getActivityIcon(type) {
    const icons = {
      word_learned: '📚',
      quiz_completed: '✅',
      conversation_completed: '💬',
      mission_completed: '🎯',
      daily_login: '📅'
    };
    return icons[type] || '⭐';
  }

  getActivityName(type) {
    const names = {
      word_learned: '단어 학습',
      quiz_completed: '퀴즈 완료',
      conversation_completed: '대화 완료',
      mission_completed: '미션 완료',
      daily_login: '일일 출석'
    };
    return names[type] || '활동';
  }
}

// Initialize gamification manager
const gamificationManager = new GamificationManager();
