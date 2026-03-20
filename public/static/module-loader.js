/**
 * Module Loader - Lazy Loading System
 * 기능별 모듈을 필요할 때만 로드하여 초기 로딩 속도 개선
 */

class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingModules = new Map();
    this.moduleCache = new Map();
    
    // 모듈 의존성 정의
    this.modules = {
      core: {
        url: '/static/modules/core.js',
        dependencies: [],
        preload: true // 항상 미리 로드
      },
      conversation: {
        url: '/static/modules/conversation.js',
        dependencies: ['core'],
        preload: false
      },
      scenario: {
        url: '/static/modules/scenario.js',
        dependencies: ['core'],
        preload: false
      },
      timer: {
        url: '/static/modules/timer.js',
        dependencies: ['core'],
        preload: false
      },
      exam: {
        url: '/static/modules/exam.js',
        dependencies: ['core'],
        preload: false
      },
      vocabulary: {
        url: '/static/modules/vocabulary.js',
        dependencies: ['core'],
        preload: false
      },
      history: {
        url: '/static/modules/history.js',
        dependencies: ['core'],
        preload: false
      },
      stats: {
        url: '/static/modules/stats.js',
        dependencies: ['core'],
        preload: false
      },
      rewards: {
        url: '/static/modules/rewards.js',
        dependencies: ['core'],
        preload: false
      },
      payment: {
        url: '/static/modules/payment.js',
        dependencies: ['core'],
        preload: false
      }
    };
    
    this.init();
  }

  init() {
    console.log('📦 Module Loader initialized');
    
    // 현재 모듈 파일이 없으므로 프리로드 비활성화
    // this.preloadModules();
    
    // 네트워크 상태 확인도 비활성화
    // this.checkNetworkAndPreload();
    
    console.log('ℹ️ Module Loader ready (preload disabled until modules are created)');
  }

  /**
   * 프리로드 모듈 미리 로드
   */
  async preloadModules() {
    const preloadModules = Object.keys(this.modules).filter(
      name => this.modules[name].preload
    );

    console.log('🚀 Preloading modules:', preloadModules);

    for (const moduleName of preloadModules) {
      await this.loadModule(moduleName);
    }
  }

  /**
   * 네트워크 상태에 따라 추가 프리로드
   */
  async checkNetworkAndPreload() {
    // 빠른 네트워크 & 절약 모드 아닐 때만 추가 프리로드
    if (window.mobileUtils) {
      const network = window.mobileUtils.checkNetworkStatus();
      
      if (network && network.effectiveType === '4g' && !network.saveData) {
        console.log('📡 Fast network detected, preloading common modules');
        
        // 자주 사용되는 모듈 프리로드
        setTimeout(() => {
          this.loadModule('conversation');
          this.loadModule('scenario');
        }, 2000);
      }
    }
  }

  /**
   * 모듈 로드
   * @param {string} moduleName - 모듈 이름
   * @returns {Promise<any>} - 로드된 모듈
   */
  async loadModule(moduleName) {
    // 이미 로드된 모듈
    if (this.loadedModules.has(moduleName)) {
      console.log(`✅ Module '${moduleName}' already loaded`);
      return this.moduleCache.get(moduleName);
    }

    // 로딩 중인 모듈 (중복 요청 방지)
    if (this.loadingModules.has(moduleName)) {
      console.log(`⏳ Module '${moduleName}' is loading, waiting...`);
      return this.loadingModules.get(moduleName);
    }

    const module = this.modules[moduleName];
    if (!module) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    // 로딩 프로미스 생성
    const loadingPromise = this._loadModuleWithDependencies(moduleName);
    this.loadingModules.set(moduleName, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadedModules.add(moduleName);
      this.moduleCache.set(moduleName, result);
      this.loadingModules.delete(moduleName);
      
      console.log(`✅ Module '${moduleName}' loaded successfully`);
      return result;
    } catch (error) {
      this.loadingModules.delete(moduleName);
      console.error(`❌ Failed to load module '${moduleName}':`, error);
      throw error;
    }
  }

  /**
   * 의존성과 함께 모듈 로드
   */
  async _loadModuleWithDependencies(moduleName) {
    const module = this.modules[moduleName];

    // 1. 의존성 먼저 로드
    if (module.dependencies.length > 0) {
      console.log(`📦 Loading dependencies for '${moduleName}':`, module.dependencies);
      
      await Promise.all(
        module.dependencies.map(dep => this.loadModule(dep))
      );
    }

    // 2. 모듈 스크립트 로드
    return this._loadScript(module.url, moduleName);
  }

  /**
   * 스크립트 동적 로드
   */
  _loadScript(url, moduleName) {
    return new Promise((resolve, reject) => {
      // 이미 같은 URL의 스크립트가 있는지 확인
      const existingScript = document.querySelector(`script[data-module="${moduleName}"]`);
      if (existingScript) {
        resolve(window[`${moduleName}Module`]);
        return;
      }

      const script = document.createElement('script');
      script.src = `${url}?v=${Date.now()}`; // 캐시 버스팅
      script.dataset.module = moduleName;
      script.async = true;

      script.onload = () => {
        console.log(`📥 Script loaded: ${url}`);
        
        // 모듈 객체 반환 (전역 변수로 노출되어 있다고 가정)
        const moduleObject = window[`${moduleName}Module`];
        resolve(moduleObject);
      };

      script.onerror = (error) => {
        console.warn(`⚠️ Module not found (expected): ${url}`);
        document.head.removeChild(script);
        reject(new Error(`Module not available: ${moduleName}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * 여러 모듈 동시 로드
   */
  async loadModules(moduleNames) {
    console.log('📦 Loading multiple modules:', moduleNames);
    
    return Promise.all(
      moduleNames.map(name => this.loadModule(name))
    );
  }

  /**
   * 모듈 언로드 (메모리 절약)
   */
  unloadModule(moduleName) {
    if (!this.loadedModules.has(moduleName)) {
      return;
    }

    // 프리로드 모듈은 언로드하지 않음
    if (this.modules[moduleName].preload) {
      console.warn(`⚠️ Cannot unload preload module: ${moduleName}`);
      return;
    }

    // 스크립트 제거
    const script = document.querySelector(`script[data-module="${moduleName}"]`);
    if (script) {
      document.head.removeChild(script);
    }

    // 모듈 정리
    this.loadedModules.delete(moduleName);
    this.moduleCache.delete(moduleName);
    delete window[`${moduleName}Module`];

    console.log(`🗑️ Module '${moduleName}' unloaded`);
  }

  /**
   * 모듈 상태 확인
   */
  getStatus() {
    return {
      loaded: Array.from(this.loadedModules),
      loading: Array.from(this.loadingModules.keys()),
      available: Object.keys(this.modules)
    };
  }

  /**
   * Prefetch (미리 다운로드만, 실행 안 함)
   */
  prefetchModule(moduleName) {
    const module = this.modules[moduleName];
    if (!module) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = module.url;
    link.as = 'script';
    document.head.appendChild(link);

    console.log(`🔄 Prefetching module: ${moduleName}`);
  }

  /**
   * Preload (높은 우선순위로 다운로드)
   */
  preloadModuleScript(moduleName) {
    const module = this.modules[moduleName];
    if (!module) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = module.url;
    link.as = 'script';
    document.head.appendChild(link);

    console.log(`⚡ Preloading module: ${moduleName}`);
  }

  /**
   * 모듈 로딩 상태 UI 표시
   */
  showLoadingUI(moduleName) {
    if (window.toast) {
      return window.toast.loading(`${moduleName} 모듈 로딩 중...`);
    }
    return null;
  }

  hideLoadingUI(toastId) {
    if (window.toast && toastId) {
      window.toast.remove(toastId);
    }
  }

  /**
   * 안전한 모듈 로드 (에러 핸들링 포함)
   */
  async safeLoadModule(moduleName) {
    const toastId = this.showLoadingUI(moduleName);

    try {
      const result = await this.loadModule(moduleName);
      this.hideLoadingUI(toastId);
      return result;
    } catch (error) {
      this.hideLoadingUI(toastId);
      
      // 모듈이 아직 생성되지 않은 경우 조용히 처리
      console.warn(`ℹ️ Module '${moduleName}' not available yet`);
      
      // Toast 에러 표시 안 함
      // if (window.toast) {
      //   window.toast.error(`모듈 로드 실패: ${moduleName}`);
      // }
      
      throw error;
    }
  }
}

// 전역 인스턴스 생성
if (typeof window !== 'undefined') {
  window.moduleLoader = new ModuleLoader();
  console.log('✅ Module Loader initialized');
}
