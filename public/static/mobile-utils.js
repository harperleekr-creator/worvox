/**
 * Mobile UX Utilities
 * 모바일 터치 제스처, 키보드 최적화, 오디오 녹음 개선
 */

class MobileUtils {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isAndroid = /Android/.test(navigator.userAgent);
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    
    this.init();
  }

  init() {
    console.log('📱 Mobile Utils initialized:', {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid
    });

    if (this.isMobile) {
      this.setupTouchGestures();
      this.setupKeyboardOptimizations();
      this.setupViewportFixes();
      this.setupAudioOptimizations();
    }
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * 터치 제스처 설정
   */
  setupTouchGestures() {
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      
      const touchDuration = Date.now() - touchStartTime;
      this.handleGesture(touchDuration);
    }, { passive: true });
  }

  handleGesture(duration) {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const minSwipeDistance = 50;

    // Swipe Right (뒤로가기)
    if (deltaX > minSwipeDistance && Math.abs(deltaY) < 100) {
      this.onSwipeRight();
    }
    
    // Swipe Left (다음)
    else if (deltaX < -minSwipeDistance && Math.abs(deltaY) < 100) {
      this.onSwipeLeft();
    }
    
    // Swipe Up (스크롤 업)
    else if (deltaY < -minSwipeDistance && Math.abs(deltaX) < 100) {
      this.onSwipeUp();
    }
    
    // Swipe Down (스크롤 다운)
    else if (deltaY > minSwipeDistance && Math.abs(deltaX) < 100) {
      this.onSwipeDown();
    }
    
    // Long Press (duration > 500ms)
    if (duration > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.onLongPress();
    }
  }

  onSwipeRight() {
    console.log('👉 Swipe Right detected');
    // 대화 페이지에서 뒤로가기
    if (window.worvox && typeof window.worvox.showTopicSelection === 'function') {
      const conversationView = document.querySelector('#chat-container');
      if (conversationView && conversationView.style.display !== 'none') {
        window.worvox.showTopicSelection();
      }
    }
  }

  onSwipeLeft() {
    console.log('👈 Swipe Left detected');
    // 향후 확장: 다음 대화 또는 메뉴 열기
  }

  onSwipeUp() {
    console.log('👆 Swipe Up detected');
    // 메시지 입력창 포커스
    const messageInput = document.querySelector('#message-input');
    if (messageInput && document.activeElement !== messageInput) {
      messageInput.focus();
    }
  }

  onSwipeDown() {
    console.log('👇 Swipe Down detected');
    // 키보드 닫기
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  onLongPress() {
    console.log('⏱️ Long Press detected');
    // 향후 확장: 컨텍스트 메뉴 표시
  }

  /**
   * 키보드 최적화
   */
  setupKeyboardOptimizations() {
    // Enter 키로 메시지 전송
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target;
        
        // 메시지 입력창에서 Enter 누르면 전송
        if (target.id === 'message-input' || target.id === 'user-input') {
          e.preventDefault();
          
          // 전송 버튼 찾아서 클릭
          const sendButton = document.querySelector('#send-button') || 
                           document.querySelector('button[onclick*="sendMessage"]');
          if (sendButton) {
            sendButton.click();
          }
        }
        
        // 검색창에서 Enter 누르면 검색
        if (target.type === 'search' || target.classList.contains('search-input')) {
          e.preventDefault();
          const searchButton = target.parentElement.querySelector('button');
          if (searchButton) {
            searchButton.click();
          }
        }
      }
    });

    // 모바일에서 입력창 포커스 시 화면 스크롤 방지
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });

    // iOS 키보드 완료 버튼 최적화
    if (this.isIOS) {
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          // iOS에서 키보드 닫힐 때 viewport 복구
          window.scrollTo(0, 0);
        });
      });
    }
  }

  /**
   * Viewport 100vh 문제 해결 (모바일 주소창 대응)
   */
  setupViewportFixes() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    console.log('📐 Viewport height fixed:', window.innerHeight);
  }

  /**
   * 오디오 녹음 최적화
   */
  setupAudioOptimizations() {
    // iOS Safari에서 오디오 재생 최적화
    if (this.isIOS) {
      // Web Audio API 초기화 (사용자 인터랙션 후)
      document.addEventListener('touchstart', () => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !window.audioContext) {
          window.audioContext = new AudioContext();
          console.log('🔊 AudioContext initialized for iOS');
        }
      }, { once: true });
    }

    // 녹음 권한 미리 요청 (첫 대화 시작 시)
    this.requestMicrophonePermission();
  }

  async requestMicrophonePermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 Microphone permission granted');
        
        // 권한만 확인하고 스트림 즉시 종료
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (error) {
      console.warn('🎤 Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * 모바일 최적화된 녹음 시작
   */
  async startRecording(options = {}) {
    const {
      mimeType = this.getOptimalMimeType(),
      sampleRate = this.isIOS ? 44100 : 48000,
      echoCancellation = true,
      noiseSuppression = true,
      autoGainControl = true
    } = options;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          echoCancellation,
          noiseSuppression,
          autoGainControl,
          channelCount: 1 // 모노 녹음으로 용량 절약
        }
      });

      console.log('🎤 Recording started with:', { mimeType, sampleRate });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps
      });

      return { mediaRecorder, stream };
    } catch (error) {
      console.error('❌ Recording failed:', error);
      
      if (window.toast) {
        window.toast.error('마이크 접근 권한이 필요합니다');
      }
      
      throw error;
    }
  }

  /**
   * 디바이스에 맞는 최적 MIME 타입 반환
   */
  getOptimalMimeType() {
    const types = [
      'audio/webm;codecs=opus', // 최고 품질, 작은 용량
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('🎵 Selected MIME type:', type);
        return type;
      }
    }

    return ''; // 브라우저 기본값 사용
  }

  /**
   * 햅틱 피드백 (진동)
   */
  vibrate(pattern = 50) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * 네트워크 상태 확인
   */
  checkNetworkStatus() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // Round-trip time (ms)
        saveData: connection.saveData // 데이터 절약 모드
      };
    }

    return null;
  }

  /**
   * 저전력 모드 감지 (배터리 API)
   */
  async checkBatteryStatus() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: battery.level, // 0.0 ~ 1.0
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        console.warn('Battery API not supported:', error);
      }
    }
    return null;
  }

  /**
   * 이미지 lazy loading 최적화
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Pull-to-refresh 비활성화 (필요시)
   */
  disablePullToRefresh() {
    document.body.style.overscrollBehavior = 'contain';
  }

  /**
   * 모바일 디버깅 로그 (화면에 표시)
   */
  showDebugLog(message) {
    if (!this.debugContainer) {
      this.debugContainer = document.createElement('div');
      this.debugContainer.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        font-size: 12px;
        max-height: 150px;
        overflow-y: auto;
        z-index: 999999;
        font-family: monospace;
      `;
      document.body.appendChild(this.debugContainer);
    }

    const log = document.createElement('div');
    log.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    this.debugContainer.insertBefore(log, this.debugContainer.firstChild);

    // 최대 20개 로그만 유지
    while (this.debugContainer.children.length > 20) {
      this.debugContainer.removeChild(this.debugContainer.lastChild);
    }
  }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
  window.mobileUtils = new MobileUtils();
  console.log('✅ Mobile Utils initialized');
}
