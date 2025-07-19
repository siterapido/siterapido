// Utilitários para otimizações de performance

// Debounce para otimizar eventos de scroll e resize
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle para otimizar eventos frequentes
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Intersection Observer para lazy loading
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

// Preload de recursos críticos
export function preloadResource(href: string, as: string, type?: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  if (type) link.type = type;
  if (as === 'font') link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Preload de imagens críticas
export function preloadImage(src: string): void {
  const img = new Image();
  img.src = src;
}

// Verificar se o dispositivo tem conexão lenta
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' || 
           connection.effectiveType === '3g';
  }
  return false;
}

// Verificar se o dispositivo tem memória limitada
export function hasLimitedMemory(): boolean {
  if ('deviceMemory' in navigator) {
    return (navigator as any).deviceMemory < 4;
  }
  return false;
}

// Verificar se deve usar otimizações para dispositivos de baixo desempenho
export function shouldUseLowPerfOptimizations(): boolean {
  return isSlowConnection() || hasLimitedMemory();
} 