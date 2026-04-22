/**
 * App Login Patch
 * Override showLogin() to use modal instead of full-page login
 */

(function() {
  'use strict';

  // Wait for worvox app to be initialized
  function patchShowLogin() {
    if (window.worvox && window.loginModal) {
      console.log('🔧 Patching worvox.showLogin() to use modal...');
      
      // Store original function (in case we need it)
      window.worvox._originalShowLogin = window.worvox.showLogin;
      
      // Override showLogin to use modal
      window.worvox.showLogin = function() {
        console.log('📱 showLogin() called - opening modal instead');
        
        // Open login modal instead of showing full-page login
        if (window.loginModal) {
          window.loginModal.open('app-redirect');
        } else {
          console.error('❌ Login modal not available, falling back to original');
          this._originalShowLogin();
        }
      };
      
      // Also patch showLoginForm (used by some buttons)
      if (window.worvox.showLoginForm) {
        window.worvox._originalShowLoginForm = window.worvox.showLoginForm;
        window.worvox.showLoginForm = function() {
          console.log('📱 showLoginForm() called - opening modal instead');
          
          if (window.loginModal) {
            window.loginModal.open('login-form');
          } else {
            console.error('❌ Login modal not available, falling back to original');
            this._originalShowLoginForm();
          }
        };
      }
      
      console.log('✅ showLogin() successfully patched to use modal');
    } else {
      // Retry after a short delay
      setTimeout(patchShowLogin, 100);
    }
  }

  // Start patching when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(patchShowLogin, 200);
    });
  } else {
    setTimeout(patchShowLogin, 200);
  }
})();
