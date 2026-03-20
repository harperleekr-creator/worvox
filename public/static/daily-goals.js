// Daily Goals & Streak System for WorVox
class DailyGoalsManager {
  constructor() {
    this.currentGoal = null;
    this.currentStreak = null;
    this.updateInterval = null;
  }

  // Initialize daily goals system
  async init(userId, goalLevel = 'balanced') {
    try {
      const response = await axios.post('/api/daily-goals/init', {
        userId,
        goalLevel
      });

      if (response.data.success) {
        this.currentGoal = response.data.goal;
        await this.loadStreak(userId);
        this.renderDashboard();
        this.startAutoUpdate(userId);
        return response.data;
      }
    } catch (error) {
      console.error('Error initializing daily goals:', error);
      throw error;
    }
  }

  // Load current goal and streak
  async loadStreak(userId) {
    try {
      const response = await axios.get(`/api/daily-goals/${userId}`);
      
      if (response.data.success) {
        this.currentGoal = response.data.goal;
        this.currentStreak = response.data.streak;
        this.progress = response.data.progress;
        return response.data;
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  }

  // Update progress after activity
  async updateProgress(userId, activity, amount = 1) {
    try {
      const response = await axios.post('/api/daily-goals/update-progress', {
        userId,
        activity, // 'conversation', 'timer', 'word', 'xp'
        amount
      });

      if (response.data.success) {
        this.currentGoal = response.data.goal;
        this.currentStreak = response.data.streak;
        
        // Update UI
        this.renderDashboard();

        // Show completion notification if just completed
        if (response.data.justCompleted) {
          this.showCompletionNotification(response.data.completionReward);
        }

        return response.data;
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }

  // Render dashboard UI
  renderDashboard() {
    const container = document.getElementById('daily-goals-dashboard');
    if (!container || !this.currentGoal) return;

    const goal = this.currentGoal;
    const streak = this.currentStreak || { current_streak: 0, longest_streak: 0 };

    // Calculate progress percentages
    const conversationProgress = Math.min(100, Math.round((goal.current_conversations / goal.target_conversations) * 100));
    const timerProgress = Math.min(100, Math.round((goal.current_timer_sessions / goal.target_timer_sessions) * 100));
    const wordsProgress = Math.min(100, Math.round((goal.current_words / goal.target_words) * 100));
    const xpProgress = Math.min(100, Math.round((goal.current_xp / goal.target_xp) * 100));
    
    const overallProgress = Math.round((conversationProgress + timerProgress + wordsProgress + xpProgress) / 4);

    // Get next milestone
    const nextMilestone = this.getNextMilestone(streak.current_streak);

    container.innerHTML = `
      <!-- Overall Progress Card -->
      <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold">오늘의 목표</h2>
            <p class="text-purple-100 text-sm">${this.getGoalLevelName(goal.goal_level)}</p>
          </div>
          <div class="text-right">
            <div class="text-4xl font-bold">${overallProgress}%</div>
            <p class="text-sm text-purple-100">전체 진행률</p>
          </div>
        </div>
        
        <!-- Overall Progress Bar -->
        <div class="w-full bg-purple-400 bg-opacity-30 rounded-full h-4 overflow-hidden">
          <div class="bg-white h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2" 
               style="width: ${overallProgress}%">
            ${overallProgress > 10 ? '<span class="text-xs font-bold text-purple-600">✨</span>' : ''}
          </div>
        </div>

        ${goal.is_completed ? `
          <div class="mt-4 bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <span class="text-2xl">🎉</span>
            <p class="font-bold">목표 달성 완료!</p>
            <p class="text-sm text-purple-100">+${goal.xp_reward} XP • +${goal.random_boxes_earned} 랜덤박스</p>
          </div>
        ` : ''}
      </div>

      <!-- Individual Progress Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Conversations -->
        <div class="bg-white rounded-xl p-4 shadow-md border-2 ${goal.current_conversations >= goal.target_conversations ? 'border-green-500' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">💬</span>
              <span class="font-bold text-gray-800">AI 대화</span>
            </div>
            <span class="text-sm font-bold ${goal.current_conversations >= goal.target_conversations ? 'text-green-600' : 'text-gray-600'}">
              ${goal.current_conversations}/${goal.target_conversations}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500" 
                 style="width: ${conversationProgress}%"></div>
          </div>
          ${goal.current_conversations >= goal.target_conversations ? 
            '<p class="text-xs text-green-600 mt-1 font-semibold">✅ 완료!</p>' : 
            '<p class="text-xs text-gray-500 mt-1">' + (goal.target_conversations - goal.current_conversations) + '회 남음</p>'}
        </div>

        <!-- Timer Sessions -->
        <div class="bg-white rounded-xl p-4 shadow-md border-2 ${goal.current_timer_sessions >= goal.target_timer_sessions ? 'border-green-500' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">⏱️</span>
              <span class="font-bold text-gray-800">타이머 모드</span>
            </div>
            <span class="text-sm font-bold ${goal.current_timer_sessions >= goal.target_timer_sessions ? 'text-green-600' : 'text-gray-600'}">
              ${goal.current_timer_sessions}/${goal.target_timer_sessions}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500" 
                 style="width: ${timerProgress}%"></div>
          </div>
          ${goal.current_timer_sessions >= goal.target_timer_sessions ? 
            '<p class="text-xs text-green-600 mt-1 font-semibold">✅ 완료!</p>' : 
            '<p class="text-xs text-gray-500 mt-1">' + (goal.target_timer_sessions - goal.current_timer_sessions) + '회 남음</p>'}
        </div>

        <!-- Words Learned -->
        <div class="bg-white rounded-xl p-4 shadow-md border-2 ${goal.current_words >= goal.target_words ? 'border-green-500' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">📚</span>
              <span class="font-bold text-gray-800">단어 학습</span>
            </div>
            <span class="text-sm font-bold ${goal.current_words >= goal.target_words ? 'text-green-600' : 'text-gray-600'}">
              ${goal.current_words}/${goal.target_words}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                 style="width: ${wordsProgress}%"></div>
          </div>
          ${goal.current_words >= goal.target_words ? 
            '<p class="text-xs text-green-600 mt-1 font-semibold">✅ 완료!</p>' : 
            '<p class="text-xs text-gray-500 mt-1">' + (goal.target_words - goal.current_words) + '개 남음</p>'}
        </div>

        <!-- XP Progress -->
        <div class="bg-white rounded-xl p-4 shadow-md border-2 ${goal.current_xp >= goal.target_xp ? 'border-green-500' : 'border-gray-200'}">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">⭐</span>
              <span class="font-bold text-gray-800">경험치 획득</span>
            </div>
            <span class="text-sm font-bold ${goal.current_xp >= goal.target_xp ? 'text-green-600' : 'text-gray-600'}">
              ${goal.current_xp}/${goal.target_xp}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                 style="width: ${xpProgress}%"></div>
          </div>
          ${goal.current_xp >= goal.target_xp ? 
            '<p class="text-xs text-green-600 mt-1 font-semibold">✅ 완료!</p>' : 
            '<p class="text-xs text-gray-500 mt-1">' + (goal.target_xp - goal.current_xp) + ' XP 남음</p>'}
        </div>
      </div>

      <!-- Streak Card -->
      <div class="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold mb-1">🔥 연속 출석</h3>
            <p class="text-orange-100 text-sm">매일 목표를 달성하여 스트릭을 유지하세요!</p>
          </div>
          <div class="text-right">
            <div class="text-5xl font-bold">${streak.current_streak}</div>
            <p class="text-sm text-orange-100">일 연속</p>
          </div>
        </div>

        <!-- Streak Visualization -->
        <div class="flex gap-2 mb-4 flex-wrap">
          ${this.renderStreakDays(streak.current_streak)}
        </div>

        <!-- Next Milestone -->
        ${nextMilestone ? `
          <div class="bg-white bg-opacity-20 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold">다음 마일스톤</p>
                <p class="text-xs text-orange-100">${nextMilestone.days}일 달성</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold">${nextMilestone.xp} XP</p>
                <p class="text-xs text-orange-100">${nextMilestone.boxes} 랜덤박스</p>
              </div>
            </div>
            <div class="w-full bg-orange-400 bg-opacity-30 rounded-full h-2 mt-2">
              <div class="bg-white h-full rounded-full" 
                   style="width: ${(streak.current_streak / nextMilestone.days) * 100}%"></div>
            </div>
          </div>
        ` : `
          <div class="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <p class="text-sm font-bold">🏆 최고 기록</p>
            <p class="text-xs text-orange-100">${streak.longest_streak}일 연속 (개인 최고 기록)</p>
          </div>
        `}
      </div>

      <!-- Goal Level Selector -->
      <div class="bg-white rounded-xl p-4 shadow-md">
        <h3 class="font-bold text-gray-800 mb-3">목표 난이도 조정</h3>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="window.dailyGoalsManager.changeGoalLevel('casual')" 
                  class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${goal.goal_level === 'casual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
            😊 여유롭게
          </button>
          <button onclick="window.dailyGoalsManager.changeGoalLevel('balanced')" 
                  class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${goal.goal_level === 'balanced' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
            ⚖️ 균형있게
          </button>
          <button onclick="window.dailyGoalsManager.changeGoalLevel('intensive')" 
                  class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${goal.goal_level === 'intensive' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
            🔥 집중적으로
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 text-center">
          ${this.getGoalLevelDescription(goal.goal_level)}
        </p>
      </div>
    `;
  }

  // Render streak days visualization
  renderStreakDays(streak) {
    const maxDisplay = 7;
    const days = Math.min(streak, maxDisplay);
    const remaining = maxDisplay - days;
    
    let html = '';
    
    // Filled fire icons
    for (let i = 0; i < days; i++) {
      html += '<div class="w-10 h-10 bg-white bg-opacity-30 rounded-lg flex items-center justify-center text-2xl">🔥</div>';
    }
    
    // Empty slots
    for (let i = 0; i < remaining; i++) {
      html += '<div class="w-10 h-10 bg-white bg-opacity-10 rounded-lg flex items-center justify-center text-xl text-gray-400">⬜</div>';
    }
    
    return html;
  }

  // Get next milestone info
  getNextMilestone(currentStreak) {
    const milestones = [7, 14, 30, 100];
    
    for (const days of milestones) {
      if (currentStreak < days) {
        return {
          days,
          xp: days === 7 ? 100 : days === 14 ? 200 : days === 30 ? 500 : 2000,
          boxes: days === 7 ? 2 : days === 14 ? 3 : days === 30 ? 5 : 10,
          badge: days === 7 ? '🔥 7일 연속' : days === 14 ? '🔥🔥 14일 연속' : days === 30 ? '🔥🔥🔥 30일 연속' : '🏆 100일 레전드'
        };
      }
    }
    
    return null;
  }

  // Get goal level name
  getGoalLevelName(level) {
    const names = {
      casual: '여유롭게 🌱',
      balanced: '균형있게 ⚖️',
      intensive: '집중적으로 🔥'
    };
    return names[level] || names.balanced;
  }

  // Get goal level description
  getGoalLevelDescription(level) {
    const descriptions = {
      casual: '하루 10분 투자 • 부담없이 시작하기',
      balanced: '하루 15분 투자 • 꾸준한 학습',
      intensive: '하루 30분 투자 • 빠른 성장'
    };
    return descriptions[level] || descriptions.balanced;
  }

  // Change goal level
  async changeGoalLevel(newLevel) {
    if (!window.worvox.currentUser) return;

    try {
      const response = await axios.post('/api/daily-goals/change-level', {
        userId: window.worvox.currentUser.id,
        newLevel
      });

      if (response.data.success) {
        this.currentGoal = response.data.goal;
        this.renderDashboard();
        
        // Show success toast
        if (window.toastManager) {
          window.toastManager.show(`목표 난이도가 변경되었습니다: ${this.getGoalLevelName(newLevel)}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error changing goal level:', error);
      if (window.toastManager) {
        window.toastManager.show('목표 난이도 변경 실패', 'error');
      }
    }
  }

  // Show completion notification
  showCompletionNotification(reward) {
    if (!reward) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center transform animate-scale-in">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">목표 달성!</h2>
        <p class="text-gray-600 mb-6">오늘의 학습 목표를 완료했습니다!</p>
        
        <div class="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-3xl font-bold text-purple-600">+${reward.xp}</div>
              <div class="text-sm text-gray-600">경험치</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-blue-600">+${reward.randomBoxes}</div>
              <div class="text-sm text-gray-600">랜덤박스</div>
            </div>
          </div>
        </div>

        ${reward.streakUpdated ? `
          <div class="bg-orange-100 rounded-lg p-3 mb-4">
            <div class="flex items-center justify-center gap-2">
              <span class="text-2xl">🔥</span>
              <span class="font-bold text-orange-700">${reward.newStreak}일 연속 달성!</span>
            </div>
          </div>
        ` : ''}

        ${reward.milestone ? `
          <div class="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-4 mb-4 text-white">
            <div class="text-3xl mb-2">🏆</div>
            <div class="font-bold text-xl mb-1">${reward.milestone.badge}</div>
            <div class="text-sm">마일스톤 달성 보너스</div>
            <div class="mt-2 text-sm">
              +${reward.milestone.xp} XP • +${reward.milestone.boxes} 랜덤박스
            </div>
          </div>
        ` : ''}
        
        <button onclick="this.closest('.fixed').remove()" 
          class="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all w-full">
          계속하기
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    // Auto close after 10 seconds
    setTimeout(() => {
      if (modal.parentElement) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
      }
    }, 10000);

    // Confetti effect (if available)
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  // Start auto-update interval
  startAutoUpdate(userId) {
    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.loadStreak(userId);
      this.renderDashboard();
    }, 30000);
  }

  // Stop auto-update
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Initialize global manager
window.dailyGoalsManager = new DailyGoalsManager();
