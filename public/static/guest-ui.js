/**
 * Guest UI Manager for WorVox
 * Handles UI for non-authenticated users
 */

(function() {
  'use strict';

  window.guestUI = {
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
      const storedUser = localStorage.getItem('worvox_user');
      return !!storedUser;
    },

    /**
     * Initialize guest UI elements
     */
    init() {
      if (this.isLoggedIn()) {
        console.log('✅ User is logged in, skipping guest UI');
        return;
      }

      console.log('👤 Initializing guest UI...');
      
      // Add login buttons to UI
      this.addHeaderLoginButton();
      this.addProfileLoginButton();
      
      // Intercept feature button clicks
      this.interceptFeatureButtons();
    },

    /**
     * Add login button to header (next to Upgrade button)
     */
    addHeaderLoginButton() {
      // Wait for header to be rendered
      const checkHeader = setInterval(() => {
        const upgradeButton = document.querySelector('.upgrade-button, [onclick*="upgrade"]');
        
        if (upgradeButton && upgradeButton.parentElement) {
          clearInterval(checkHeader);
          
          // Check if login button already exists
          if (document.getElementById('headerLoginBtn')) {
            return;
          }

          // Create login button
          const loginBtn = document.createElement('button');
          loginBtn.id = 'headerLoginBtn';
          loginBtn.className = 'px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2';
          loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span class="hidden sm:inline">로그인</span>';
          loginBtn.onclick = () => {
            if (window.loginModal) {
              window.loginModal.open('header');
            }
          };

          // Insert before upgrade button
          upgradeButton.parentElement.insertBefore(loginBtn, upgradeButton);
          
          console.log('✅ Header login button added');
        }
      }, 100);

      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkHeader), 5000);
    },

    /**
     * Add login button to profile section (left sidebar bottom)
     */
    addProfileLoginButton() {
      // Wait for sidebar to be rendered
      const checkSidebar = setInterval(() => {
        // Find the profile/user info section in sidebar
        const sidebar = document.querySelector('.sidebar, [class*="sidebar"], .left-panel');
        
        if (sidebar) {
          // Look for profile section or create one
          let profileSection = sidebar.querySelector('.profile-section, .user-info, [class*="profile"]');
          
          if (!profileSection) {
            // Create profile section at bottom of sidebar
            profileSection = document.createElement('div');
            profileSection.className = 'profile-section mt-auto p-4 border-t border-gray-200 dark:border-gray-700';
            sidebar.appendChild(profileSection);
          }

          // Check if login button already exists
          if (document.getElementById('sidebarLoginBtn')) {
            clearInterval(checkSidebar);
            return;
          }

          // Clear existing content for guest users
          profileSection.innerHTML = `
            <div class="text-center">
              <div class="mb-3">
                <i class="fas fa-user-circle text-6xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                로그인하고 학습 기록을 저장하세요!
              </p>
              <button id="sidebarLoginBtn" onclick="loginModal.open('sidebar')" class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                <i class="fas fa-sign-in-alt"></i>
                <span>로그인하기</span>
              </button>
            </div>
          `;
          
          console.log('✅ Sidebar login button added');
          clearInterval(checkSidebar);
        }
      }, 100);

      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkSidebar), 5000);
    },

    /**
     * Intercept feature button clicks and show login modal
     */
    interceptFeatureButtons() {
      // List of features that require login
      const protectedFeatures = [
        'ai-conversation',
        'ai-chat',
        'timer-mode',
        'scenario-mode',
        'exam-mode',
        'vocabulary',
        'pronunciation',
        'speaking-practice'
      ];

      // Use event delegation to catch all button clicks
      document.addEventListener('click', (e) => {
        const button = e.target.closest('button, [role="button"], .feature-btn');
        
        if (!button) return;

        // Check if this is a protected feature
        const isProtected = protectedFeatures.some(feature => {
          return button.className?.includes(feature) ||
                 button.id?.includes(feature) ||
                 button.getAttribute('data-feature') === feature ||
                 button.textContent?.includes('AI 대화') ||
                 button.textContent?.includes('타이머') ||
                 button.textContent?.includes('시나리오') ||
                 button.textContent?.includes('시험');
        });

        if (isProtected && !this.isLoggedIn()) {
          e.preventDefault();
          e.stopPropagation();
          
          // Show login modal
          if (window.loginModal) {
            window.loginModal.open('feature-click');
          }
          
          console.log('🔒 Protected feature clicked, showing login modal');
        }
      }, true); // Use capture phase to intercept early

      console.log('✅ Feature button interception enabled');
    },

    /**
     * Show guest welcome message (optional)
     */
    showWelcomeMessage() {
      if (this.isLoggedIn()) return;

      // Check if user has seen welcome before
      const hasSeenWelcome = sessionStorage.getItem('worvox_guest_welcome');
      
      if (!hasSeenWelcome) {
        setTimeout(() => {
          if (window.showToast) {
            window.showToast('👋 WorVox에 오신 것을 환영합니다! 로그인하고 모든 기능을 사용해보세요', 'info', 5000);
          }
          sessionStorage.setItem('worvox_guest_welcome', 'true');
        }, 2000);
      }
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.guestUI.init();
        window.guestUI.showWelcomeMessage();
      }, 500);
    });
  } else {
    setTimeout(() => {
      window.guestUI.init();
      window.guestUI.showWelcomeMessage();
    }, 500);
  }
})();
