/**
 * App Login Patch
 * Override showLogin() to use modal instead of full-page login
 */

(function() {
  'use strict';

  // Patch immediately when window.worvox becomes available
  function patchShowLogin() {
    if (window.worvox) {
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
          if (this._originalShowLogin) {
            this._originalShowLogin.call(this);
          }
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
            if (this._originalShowLoginForm) {
              this._originalShowLoginForm.call(this);
            }
          }
        };
      }
      
      console.log('✅ showLogin() successfully patched to use modal');
      return true; // Success
    }
    return false; // Not ready yet
  }

  // Try to patch immediately
  let patched = patchShowLogin();
  
  // If not patched, use polling
  if (!patched) {
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    
    const pollInterval = setInterval(() => {
      attempts++;
      if (patchShowLogin() || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (attempts >= maxAttempts) {
          console.error('❌ Failed to patch showLogin() - worvox not initialized');
        }
      }
    }, 100);
  }
})();
