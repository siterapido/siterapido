// Sistema avançado de otimização de performance
export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasSlowConnection: boolean;
  hasLowMemory: boolean;
  supportsWebP: boolean;
  supportsAVIF: boolean;
  supportsIntersectionObserver: boolean;
  supportsResizeObserver: boolean;
  supportsWebWorkers: boolean;
}

// Detecção de capacidades do dispositivo
export const detectDeviceCapabilities = (): DeviceCapabilities => {
  const userAgent = navigator.userAgent.toLowerCase();
  const connection = (navigator as any).connection;
  const memory = (performance as any).memory;
  
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  const hasSlowConnection = connection ? 
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' || 
    connection.effectiveType === '3g' : 
    false;
  
  const hasLowMemory = memory ? 
    memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8 : 
    false;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    hasSlowConnection,
    hasLowMemory,
    supportsWebP: checkWebPSupport(),
    supportsAVIF: false, // checkAVIFSupport() retorna Promise, será verificado dinamicamente
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    supportsResizeObserver: 'ResizeObserver' in window,
    supportsWebWorkers: 'Worker' in window,
  };
};

// Verificar suporte a WebP
const checkWebPSupport = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Verificar suporte a AVIF
const checkAVIFSupport = (): boolean => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }).then(() => true).catch(() => false);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer com fallback
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }
  return null;
};

// Carregamento condicional de bibliotecas
export const loadLibraryConditionally = async <T>(
  libraryName: string,
  importFn: () => Promise<T>,
  shouldLoad: () => boolean
): Promise<T | null> => {
  if (!shouldLoad()) {
    return null;
  }
  
  try {
    return await importFn();
  } catch (error) {
    console.warn(`Failed to load ${libraryName}:`, error);
    return null;
  }
};

// Carregamento de bibliotecas de animação baseado no dispositivo
export const loadAnimationLibrary = async () => {
  const capabilities = detectDeviceCapabilities();
  
  // Em dispositivos lentos, carrega apenas o básico
  if (capabilities.hasSlowConnection || capabilities.hasLowMemory) {
    return null;
  }
  
  // Em mobile, carrega GSAP básico
  if (capabilities.isMobile) {
    return loadLibraryConditionally(
      'GSAP',
      () => import('gsap'),
      () => true
    );
  }
  
  // Em desktop, carrega GSAP completo
  return loadLibraryConditionally(
    'GSAP',
    () => import('gsap'),
    () => true
  );
};

// Carregamento de Lenis baseado no dispositivo
export const loadLenisConditionally = async () => {
  const capabilities = detectDeviceCapabilities();
  
  // Não carrega Lenis em dispositivos lentos
  if (capabilities.hasSlowConnection || capabilities.hasLowMemory) {
    return null;
  }
  
  return loadLibraryConditionally(
    'Lenis',
    () => import('@studio-freight/lenis'),
    () => !capabilities.isMobile // Apenas em desktop/tablet
  );
};

// Sistema de carregamento progressivo de componentes
export const createProgressiveLoader = () => {
  const loadedComponents = new Set<string>();
  const loadingPromises = new Map<string, Promise<any>>();
  
  return {
    load: async <T>(name: string, importFn: () => Promise<T>): Promise<T> => {
      if (loadedComponents.has(name)) {
        return Promise.resolve(loadedComponents as any);
      }
      
      if (loadingPromises.has(name)) {
        return loadingPromises.get(name) as Promise<T>;
      }
      
      const promise = importFn().then((module) => {
        loadedComponents.add(name);
        loadingPromises.delete(name);
        return module;
      });
      
      loadingPromises.set(name, promise);
      return promise;
    },
    
    preload: (name: string, importFn: () => Promise<any>) => {
      if (!loadedComponents.has(name) && !loadingPromises.has(name)) {
        const promise = importFn().then((module) => {
          loadedComponents.add(name);
          loadingPromises.delete(name);
          return module;
        });
        loadingPromises.set(name, promise);
      }
    },
    
    isLoaded: (name: string) => loadedComponents.has(name),
    isLoading: (name: string) => loadingPromises.has(name),
  };
};

// Otimização de imagens baseada no dispositivo
export const getOptimizedImageConfig = () => {
  const capabilities = detectDeviceCapabilities();
  
  return {
    format: capabilities.supportsAVIF ? 'avif' : 
            capabilities.supportsWebP ? 'webp' : 'jpg',
    quality: capabilities.hasSlowConnection ? 0.7 : 0.9,
    lazyLoad: capabilities.isMobile || capabilities.hasSlowConnection,
    preload: !capabilities.hasSlowConnection,
  };
};

// Sistema de cache inteligente
export const createSmartCache = <T>(maxSize: number = 100) => {
  const cache = new Map<string, { value: T; timestamp: number }>();
  
  return {
    get: (key: string): T | undefined => {
      const item = cache.get(key);
      if (item) {
        // Atualiza timestamp para LRU
        item.timestamp = Date.now();
        return item.value;
      }
      return undefined;
    },
    
    set: (key: string, value: T) => {
      // Remove item mais antigo se cache estiver cheio
      if (cache.size >= maxSize) {
        let oldestKey = '';
        let oldestTime = Date.now();
        
        for (const [k, v] of cache.entries()) {
          if (v.timestamp < oldestTime) {
            oldestTime = v.timestamp;
            oldestKey = k;
          }
        }
        
        if (oldestKey) {
          cache.delete(oldestKey);
        }
      }
      
      cache.set(key, { value, timestamp: Date.now() });
    },
    
    clear: () => cache.clear(),
    size: () => cache.size,
  };
};

// Monitor de performance
export const createPerformanceMonitor = () => {
  const metrics: Record<string, number[]> = {};
  
  return {
    measure: (name: string, fn: () => any) => {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      
      if (!metrics[name]) {
        metrics[name] = [];
      }
      metrics[name].push(end - start);
      
      return result;
    },
    
    measureAsync: async (name: string, fn: () => Promise<any>) => {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      
      if (!metrics[name]) {
        metrics[name] = [];
      }
      metrics[name].push(end - start);
      
      return result;
    },
    
    getMetrics: () => {
      const averages: Record<string, number> = {};
      for (const [name, times] of Object.entries(metrics)) {
        averages[name] = times.reduce((a, b) => a + b, 0) / times.length;
      }
      return averages;
    },
    
    clear: () => {
      Object.keys(metrics).forEach(key => delete metrics[key]);
    },
  };
};

// Instâncias globais
export const progressiveLoader = createProgressiveLoader();
export const smartCache = createSmartCache();
export const performanceMonitor = createPerformanceMonitor(); 