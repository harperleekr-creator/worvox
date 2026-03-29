// WorVox Module Loader v2.0 - Dynamic Module Loading System
// Loads modules on-demand to improve initial page load time

class ModuleLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingModules = new Map(); // Promise cache to prevent duplicate loads
    this.buildTime = document.querySelector('script[src*="app.min.js"]')?.src.match(/v=(\d+)/)?.[1] || Date.now();
  }

  /**
   * Load a module dynamically
   * @param {string} moduleName - Name of the module to load (e.g., 'conversation', 'timer')
   * @returns {Promise<void>}
   */
  async loadModule(moduleName) {
    // Already loaded
    if (this.loadedModules.has(moduleName)) {
      return Promise.resolve();
    }

    // Currently loading - return existing promise
    if (this.loadingModules.has(moduleName)) {
      return this.loadingModules.get(moduleName);
    }

    // Start loading
    const loadPromise = this._loadScript(moduleName);
    this.loadingModules.set(moduleName, loadPromise);

    try {
      await loadPromise;
      this.loadedModules.add(moduleName);
      this.loadingModules.delete(moduleName);
      console.log(`✅ Module loaded: ${moduleName}`);
    } catch (error) {
      this.loadingModules.delete(moduleName);
      console.error(`❌ Failed to load module: ${moduleName}`, error);
      throw error;
    }
  }

  /**
   * Load multiple modules in parallel
   * @param {string[]} moduleNames
   * @returns {Promise<void[]>}
   */
  async loadModules(moduleNames) {
    return Promise.all(moduleNames.map(name => this.loadModule(name)));
  }

  /**
   * Load a script file
   * @private
   */
  _loadScript(moduleName) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/static/modules/${moduleName}.js?v=${this.buildTime}`;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${moduleName}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Preload critical modules (called on app init)
   */
  async preloadCriticalModules() {
    // These modules are needed for basic app functionality
    const criticalModules = ['conversation', 'pronunciation'];
    
    try {
      await this.loadModules(criticalModules);
      console.log('✅ Critical modules preloaded');
    } catch (error) {
      console.error('❌ Failed to preload critical modules:', error);
    }
  }

  /**
   * Check if a module is loaded
   */
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get loaded modules list
   */
  getLoadedModules() {
    return Array.from(this.loadedModules);
  }
}

// Global module loader instance
window.moduleLoader = new ModuleLoader();
