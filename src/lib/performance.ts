// Configurações de performance para otimização

export const PERFORMANCE_CONFIG = {
    // Throttle para eventos de scroll
    SCROLL_THROTTLE: 16, // ~60fps
    
    // Debounce para eventos de resize
    RESIZE_DEBOUNCE: 150,
    
    // Intersection Observer options
    INTERSECTION_OPTIONS: {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    },
    
    // Lazy loading options
    LAZY_LOADING: {
        threshold: 0.1,
        rootMargin: '50px'
    }
} as const;

// Função para throttle
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }) as T;
};

// Função para debounce
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
};

// Função para preload de recursos críticos
export const preloadCriticalResources = () => {
    const criticalResources = [
        '/assets/icone-1.jpg',
        '/assets/optimized/site-hero-cerna-hero-v2.webp',
        '/assets/optimized/logo-principal-preta.webp',
        // Adicione outros recursos críticos aqui
    ];

    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = resource;
        document.head.appendChild(link);
    });
};

// Função para otimizar imagens
export const optimizeImage = (src: string, width?: number, height?: number) => {
    // Aqui você pode adicionar lógica para otimização de imagens
    // Por exemplo, usar um CDN ou service worker para otimização
    return src;
};

// Função para preload de recursos
export const preloadResource = (href: string, as: string, type?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = href;
    if (type) link.type = type;
    document.head.appendChild(link);
};

// Função para preload de imagens
export const preloadImage = (src: string) => {
    const img = new Image();
    img.src = src;
};

// Função para detectar conexão lenta
export const isSlowConnection = () => {
    if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        return connection.effectiveType === 'slow-2g' || 
               connection.effectiveType === '2g' || 
               connection.effectiveType === '3g';
    }
    return false;
};

// Função para detectar memória limitada
export const hasLimitedMemory = () => {
    if ('deviceMemory' in navigator) {
        return (navigator as any).deviceMemory < 4; // Menos de 4GB
    }
    return false;
};

// Função para decidir se usar otimizações de baixo desempenho
export const shouldUseLowPerfOptimizations = () => {
    return isSlowConnection() || hasLimitedMemory();
}; 