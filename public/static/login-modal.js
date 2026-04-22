/**
 * Login Modal for WorVox
 * Provides a popup login interface for non-authenticated users
 */

(function() {
  'use strict';

  // Login modal manager
  window.loginModal = {
    currentStep: 1,
    modalElement: null,
    isOpen: false,
    pendingAction: null, // Store the action to perform after login

    /**
     * Initialize the login modal
     */
    init() {
      this.createModal();
      this.attachEventListeners();
      console.log('✅ Login modal initialized');
    },

    /**
     * Create the modal HTML structure
     */
    createModal() {
      const modalHTML = `
        <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-[9999]" style="display: none;">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                <i class="fas fa-sign-in-alt mr-2 text-purple-500"></i>
                로그인
              </h2>
              <button onclick="loginModal.close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>

            <!-- Modal Body -->
            <div id="loginModalBody" class="p-6">
              <!-- Step 1: Choose login method -->
              <div id="loginStep1" class="login-step">
                <p class="text-gray-600 dark:text-gray-300 mb-6 text-center">
                  WorVox의 모든 기능을 사용하려면<br>로그인이 필요합니다 ✨
                </p>

                <!-- Google Login Button -->
                <button onclick="loginModal.handleGoogleLogin()" class="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-4 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-200 flex items-center justify-center gap-3 mb-4 group">
                  <svg class="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span class="font-semibold">Google로 계속하기</span>
                </button>

                <!-- Email Login Button -->
                <button onclick="loginModal.showEmailLogin()" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group">
                  <i class="fas fa-envelope text-lg"></i>
                  <span class="font-semibold">이메일로 로그인</span>
                </button>

                <div class="mt-6 text-center">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    계정이 없으신가요?
                    <button onclick="loginModal.showEmailSignup()" class="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                      회원가입
                    </button>
                  </p>
                </div>
              </div>

              <!-- Step 2: Email Login -->
              <div id="loginStep2" class="login-step hidden">
                <button onclick="loginModal.backToStep1()" class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 flex items-center gap-2">
                  <i class="fas fa-arrow-left"></i>
                  <span>뒤로</span>
                </button>

                <form onsubmit="loginModal.handleEmailLogin(event)" class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                    <input type="email" id="loginEmail" required class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" placeholder="your@email.com">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">비밀번호</label>
                    <input type="password" id="loginPassword" required class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" placeholder="••••••••">
                  </div>
                  <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200">
                    로그인
                  </button>
                </form>

                <div class="mt-4 text-center">
                  <button onclick="loginModal.showPasswordReset()" class="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                    비밀번호를 잊으셨나요?
                  </button>
                </div>
              </div>

              <!-- Step 3: Email Signup -->
              <div id="loginStep3" class="login-step hidden">
                <button onclick="loginModal.backToStep1()" class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-4 flex items-center gap-2">
                  <i class="fas fa-arrow-left"></i>
                  <span>뒤로</span>
                </button>

                <form onsubmit="loginModal.handleEmailSignup(event)" class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">이름</label>
                    <input type="text" id="signupName" required class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" placeholder="홍길동">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                    <input type="email" id="signupEmail" required class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" placeholder="your@email.com">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">비밀번호</label>
                    <input type="password" id="signupPassword" required minlength="6" class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors" placeholder="6자 이상">
                  </div>
                  <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200">
                    회원가입
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;

      // Insert modal into body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.modalElement = document.getElementById('loginModal');
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
      // Close modal when clicking outside
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
          this.close();
        }
      });

      // Close modal with ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    },

    /**
     * Open the modal
     * @param {string} context - Context/reason for showing login (e.g., 'ai-chat', 'timer')
     */
    open(context = null) {
      this.pendingAction = context;
      this.modalElement.style.display = 'flex';
      this.isOpen = true;
      this.showStep1();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      console.log('🔓 Login modal opened', context ? `(context: ${context})` : '');
    },

    /**
     * Close the modal
     */
    close() {
      this.modalElement.style.display = 'none';
      this.isOpen = false;
      this.pendingAction = null;
      
      // Restore body scroll
      document.body.style.overflow = '';

      console.log('🔒 Login modal closed');
    },

    /**
     * Show step 1 (choose login method)
     */
    showStep1() {
      this.currentStep = 1;
      document.getElementById('loginStep1').classList.remove('hidden');
      document.getElementById('loginStep2').classList.add('hidden');
      document.getElementById('loginStep3').classList.add('hidden');
    },

    /**
     * Show email login form
     */
    showEmailLogin() {
      this.currentStep = 2;
      document.getElementById('loginStep1').classList.add('hidden');
      document.getElementById('loginStep2').classList.remove('hidden');
      document.getElementById('loginStep3').classList.add('hidden');
    },

    /**
     * Show email signup form
     */
    showEmailSignup() {
      this.currentStep = 3;
      document.getElementById('loginStep1').classList.add('hidden');
      document.getElementById('loginStep2').classList.add('hidden');
      document.getElementById('loginStep3').classList.remove('hidden');
    },

    /**
     * Back to step 1
     */
    backToStep1() {
      this.showStep1();
    },

    /**
     * Handle Google login
     */
    async handleGoogleLogin() {
      try {
        console.log('🔵 Starting Google login...');
        
        // Use existing Google Sign-In implementation
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.initialize({
            client_id: '506018364729-ichplnfnqlk2hmh1bhblepm0un44ltdr.apps.googleusercontent.com',
            callback: async (response) => {
              try {
                // Send ID token to backend
                const result = await axios.post('/api/users/google-login', {
                  credential: response.credential
                });

                if (result.data.success) {
                  // Save user data
                  localStorage.setItem('worvox_user', JSON.stringify(result.data.user));
                  
                  // Close modal
                  this.close();
                  
                  // Show success message
                  if (window.showToast) {
                    window.showToast('로그인 성공!', 'success');
                  }
                  
                  // Reload page to initialize user session
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                } else {
                  throw new Error(result.data.error || '로그인 실패');
                }
              } catch (error) {
                console.error('❌ Google login error:', error);
                if (window.showToast) {
                  window.showToast('로그인 실패: ' + error.message, 'error');
                }
              }
            }
          });

          // Trigger Google Sign-In prompt
          google.accounts.id.prompt();
        } else {
          throw new Error('Google Sign-In not loaded');
        }
      } catch (error) {
        console.error('❌ Google login error:', error);
        if (window.showToast) {
          window.showToast('Google 로그인을 사용할 수 없습니다', 'error');
        }
      }
    },

    /**
     * Handle email login
     */
    async handleEmailLogin(event) {
      event.preventDefault();

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        if (window.showToast) {
          window.showToast('이메일과 비밀번호를 입력해주세요', 'error');
        }
        return;
      }

      try {
        console.log('📧 Email login attempt:', email);

        const result = await axios.post('/api/users/login', {
          email,
          password
        });

        if (result.data.success) {
          // Save user data
          localStorage.setItem('worvox_user', JSON.stringify(result.data.user));
          
          // Close modal
          this.close();
          
          // Show success message
          if (window.showToast) {
            window.showToast('로그인 성공!', 'success');
          }
          
          // Reload page to initialize user session
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          throw new Error(result.data.error || '로그인 실패');
        }
      } catch (error) {
        console.error('❌ Email login error:', error);
        if (window.showToast) {
          window.showToast('로그인 실패: ' + (error.response?.data?.error || error.message), 'error');
        }
      }
    },

    /**
     * Handle email signup
     */
    async handleEmailSignup(event) {
      event.preventDefault();

      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;

      if (!name || !email || !password) {
        if (window.showToast) {
          window.showToast('모든 필드를 입력해주세요', 'error');
        }
        return;
      }

      if (password.length < 6) {
        if (window.showToast) {
          window.showToast('비밀번호는 6자 이상이어야 합니다', 'error');
        }
        return;
      }

      try {
        console.log('📝 Email signup attempt:', email);

        const result = await axios.post('/api/users/signup', {
          username: name,
          email,
          password
        });

        if (result.data.success) {
          // Save user data
          localStorage.setItem('worvox_user', JSON.stringify(result.data.user));
          
          // Close modal
          this.close();
          
          // Show success message
          if (window.showToast) {
            window.showToast('회원가입 성공! 환영합니다 🎉', 'success');
          }
          
          // Reload page to initialize user session
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          throw new Error(result.data.error || '회원가입 실패');
        }
      } catch (error) {
        console.error('❌ Email signup error:', error);
        if (window.showToast) {
          window.showToast('회원가입 실패: ' + (error.response?.data?.error || error.message), 'error');
        }
      }
    },

    /**
     * Show password reset
     */
    showPasswordReset() {
      if (window.showToast) {
        window.showToast('비밀번호 재설정 기능은 준비 중입니다', 'info');
      }
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.loginModal.init();
    });
  } else {
    window.loginModal.init();
  }
})();
