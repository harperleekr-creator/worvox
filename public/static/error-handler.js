/**
 * Global Error Handler
 * 전역 에러 처리 및 재시도 로직
 */

class ErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      retryDelayMultiplier: 2
    };
    
    this.init();
  }

  init() {
    // Unhandled Promise rejection 처리
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
      this.handleError(event.reason, 'Unhandled Promise');
      event.preventDefault();
    });

    // Global error 처리
    window.addEventListener('error', (event) => {
      console.error('❌ Global error:', event.error);
      if (event.error) {
        this.handleError(event.error, 'Global Error');
      }
    });

    // Axios 인터셉터 설정 (axios가 로드된 후 실행)
    this.setupAxiosInterceptor();
  }

  setupAxiosInterceptor() {
    if (typeof axios !== 'undefined') {
      // Request 인터셉터
      axios.interceptors.request.use(
        (config) => {
          // 요청 전 처리
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response 인터셉터
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          this.handleAxiosError(error);
          return Promise.reject(error);
        }
      );
    } else {
      // axios가 아직 로드되지 않았다면 나중에 재시도
      setTimeout(() => this.setupAxiosInterceptor(), 100);
    }
  }

  handleError(error, context = '') {
    const errorMessage = this.getErrorMessage(error);
    
    // 개발 환경에서는 상세 로그
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('pages.dev')) {
      console.error(`[${context}]`, error);
    }

    // 사용자에게 친화적인 메시지 표시
    if (window.toast) {
      window.toast.error(errorMessage);
    } else {
      console.warn('Toast system not available, falling back to alert');
      alert(errorMessage);
    }
  }

  handleAxiosError(error) {
    if (error.response) {
      // 서버 응답 에러 (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          this.handleError(data.error || '잘못된 요청입니다', 'Bad Request');
          break;
        case 401:
          this.handleError('로그인이 필요합니다', 'Unauthorized');
          // 로그인 페이지로 리다이렉트
          setTimeout(() => {
            if (window.worvox && typeof window.worvox.showLogin === 'function') {
              window.worvox.showLogin();
            }
          }, 2000);
          break;
        case 403:
          this.handleError('접근 권한이 없습니다', 'Forbidden');
          break;
        case 404:
          this.handleError('요청한 데이터를 찾을 수 없습니다', 'Not Found');
          break;
        case 429:
          this.handleError(data.message || '너무 많은 요청입니다. 잠시 후 다시 시도해주세요', 'Rate Limited');
          break;
        case 500:
        case 502:
        case 503:
          this.handleError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요', 'Server Error');
          break;
        default:
          this.handleError(data.error || '알 수 없는 오류가 발생했습니다', 'API Error');
      }
    } else if (error.request) {
      // 요청은 보내졌으나 응답 없음 (네트워크 오류)
      this.handleError('네트워크 연결을 확인해주세요', 'Network Error');
    } else {
      // 요청 설정 중 오류
      this.handleError(error.message || '요청 처리 중 오류가 발생했습니다', 'Request Error');
    }
  }

  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error) return error.error;
    return '알 수 없는 오류가 발생했습니다';
  }

  /**
   * 재시도 로직을 포함한 함수 실행
   * @param {Function} fn - 실행할 함수
   * @param {Object} options - 재시도 옵션
   */
  async retry(fn, options = {}) {
    const config = { ...this.retryConfig, ...options };
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < config.maxRetries) {
          const delay = config.retryDelay * Math.pow(config.retryDelayMultiplier, attempt);
          console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          
          if (window.toast) {
            window.toast.warning(`재시도 중... (${attempt + 1}/${config.maxRetries})`, 1000);
          }
          
          await this.sleep(delay);
        }
      }
    }

    // 모든 재시도 실패
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 안전한 API 호출 헬퍼
   * @param {Function} apiCall - API 호출 함수
   * @param {Object} options - 옵션
   */
  async safeApiCall(apiCall, options = {}) {
    const {
      showLoading = false,
      loadingMessage = '처리중...',
      successMessage = null,
      errorMessage = null,
      retry = false
    } = options;

    let loadingToast = null;

    try {
      if (showLoading && window.toast) {
        loadingToast = window.toast.loading(loadingMessage);
      }

      const result = retry 
        ? await this.retry(apiCall)
        : await apiCall();

      if (loadingToast) {
        window.toast.remove(loadingToast);
      }

      if (successMessage && window.toast) {
        window.toast.success(successMessage);
      }

      return result;
    } catch (error) {
      if (loadingToast) {
        window.toast.remove(loadingToast);
      }

      const message = errorMessage || this.getErrorMessage(error);
      
      if (window.toast) {
        window.toast.error(message);
      }

      throw error;
    }
  }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
  window.errorHandler = new ErrorHandler();
}
