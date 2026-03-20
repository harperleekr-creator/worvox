/**
 * Toast Notification System
 * 사용자 친화적인 알림 시스템
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.toastId = 0;
    this.init();
  }

  init() {
    // Toast container 생성
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
    document.body.appendChild(this.container);

    // CSS 스타일 추가
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .toast-enter {
        animation: slideInRight 0.3s ease-out;
      }

      .toast-exit {
        animation: slideOutRight 0.3s ease-in;
      }

      .toast-item {
        pointer-events: auto;
        cursor: pointer;
      }

      /* Mobile responsive */
      @media (max-width: 640px) {
        #toast-container {
          top: 1rem;
          right: 1rem;
          left: 1rem;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Toast 생성
   * @param {String} message - 메시지
   * @param {String} type - success, error, warning, info, loading
   * @param {Number} duration - 지속 시간 (ms), 0이면 자동 닫힘 없음
   */
  show(message, type = 'info', duration = 4000) {
    const id = ++this.toastId;
    
    const toast = document.createElement('div');
    toast.className = `toast-item toast-enter bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 flex items-start gap-3 border-l-4 ${this.getBorderColor(type)}`;
    toast.dataset.toastId = id;

    const icon = this.getIcon(type);
    const iconColor = this.getIconColor(type);

    toast.innerHTML = `
      <div class="flex-shrink-0 ${iconColor}">
        ${icon}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white break-words">
          ${this.escapeHtml(message)}
        </p>
      </div>
      <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    `;

    // 닫기 버튼 클릭 이벤트
    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => this.remove(id));

    // Toast 전체 클릭 이벤트 (닫기)
    toast.addEventListener('click', (e) => {
      if (e.target !== closeBtn && !closeBtn.contains(e.target)) {
        this.remove(id);
      }
    });

    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // 자동 닫기 (loading 타입은 자동 닫힘 없음)
    if (duration > 0 && type !== 'loading') {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  /**
   * Toast 제거
   * @param {Number} id - Toast ID
   */
  remove(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 300);
  }

  /**
   * 모든 Toast 제거
   */
  clear() {
    this.toasts.forEach((toast, id) => {
      this.remove(id);
    });
  }

  // 편의 메서드
  success(message, duration = 4000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  loading(message = '처리중...') {
    return this.show(message, 'loading', 0);
  }

  // Helper methods
  getBorderColor(type) {
    const colors = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500',
      loading: 'border-purple-500'
    };
    return colors[type] || colors.info;
  }

  getIconColor(type) {
    const colors = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500',
      loading: 'text-purple-500'
    };
    return colors[type] || colors.info;
  }

  getIcon(type) {
    const icons = {
      success: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`,
      error: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`,
      warning: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>`,
      info: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`,
      loading: `<svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
  window.toast = new ToastManager();
  console.log('✅ Toast notification system initialized');
}
