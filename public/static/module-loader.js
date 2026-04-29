// WorVox Module Loader
// Dynamic module loading system for performance optimization
// Reduces initial load from 880KB to ~150KB (core only)

(function() {
  'use strict';
  
  // Module registry
  const modules = {
    'scenario-data': {
      path: '/static/scenario-data.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'payment': {
      path: '/static/payment.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'conversation': {
      path: '/static/conversation.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'timer': {
      path: '/static/timer.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'exam': {
      path: '/static/exam.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'vocabulary': {
      path: '/static/vocabulary.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'history': {
      path: '/static/history.js',
      loaded: false,
      loading: false,
      callbacks: []
    },
    'profile': {
      path: '/static/profile.js',
      loaded: false,
      loading: false,
      callbacks: []
    }
  };
  
  // Load a module
  function loadModule(name) {
    return new Promise((resolve, reject) => {
      const module = modules[name];
      
      if (!module) {
        reject(new Error(`Module "${name}" not found`));
        return;
      }
      
      // Already loaded
      if (module.loaded) {
        resolve();
        return;
      }
      
      // Currently loading, add to callback queue
      if (module.loading) {
        module.callbacks.push({ resolve, reject });
        return;
      }
      
      // Start loading
      module.loading = true;
      module.callbacks.push({ resolve, reject });
      
      const script = document.createElement('script');
      script.src = module.path + '?v=' + Date.now();
      script.async = true;
      
      script.onload = () => {
        module.loaded = true;
        module.loading = false;
        console.log(`✅ Module loaded: ${name} (${module.path})`);
        
        // Resolve all pending callbacks
        module.callbacks.forEach(cb => cb.resolve());
        module.callbacks = [];
      };
      
      script.onerror = (error) => {
        module.loading = false;
        console.error(`❌ Failed to load module: ${name}`, error);
        
        // Reject all pending callbacks
        module.callbacks.forEach(cb => cb.reject(error));
        module.callbacks = [];
      };
      
      document.head.appendChild(script);
    });
  }
  
  // Load multiple modules
  function loadModules(names) {
    return Promise.all(names.map(name => loadModule(name)));
  }
  
  // Preload module (don't wait for it)
  function preloadModule(name) {
    loadModule(name).catch(err => {
      console.warn(`Preload failed for ${name}:`, err);
    });
  }
  
  // Check if module is loaded
  function isModuleLoaded(name) {
    const module = modules[name];
    return module ? module.loaded : false;
  }
  
  // Global API
  window.WorVoxModuleLoader = {
    load: loadModule,
    loadAll: loadModules,
    preload: preloadModule,
    isLoaded: isModuleLoaded,
    modules: Object.keys(modules)
  };
  
  console.log('✅ WorVox Module Loader initialized');
  console.log('📦 Available modules:', Object.keys(modules));
  
})();
