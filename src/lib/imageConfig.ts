// Configuração de imagens responsivas
export const IMAGE_CONFIG = {
  // Imagens críticas (LCP)
  critical: {
    hero: {
      mobile: '/assets/responsive/site-hero-cerna-hero-v2-mobile.webp',
      tablet: '/assets/responsive/site-hero-cerna-hero-v2-tablet.webp',
      desktop: '/assets/responsive/site-hero-cerna-hero-v2-desktop.webp',
      original: '/assets/optimized/site-hero-cerna-hero-v2.webp'
    }
  },
  
  // Imagens do portfólio
  portfolio: {
    sancao: {
      mobile: '/assets/responsive/site-sancao-mobile.webp',
      tablet: '/assets/responsive/site-sancao-tablet.webp',
      desktop: '/assets/optimized/site-sancao.webp'
    },
    hotledas: {
      mobile: '/assets/responsive/site-hotledas-mobile.webp',
      tablet: '/assets/responsive/site-hotledas-tablet.webp',
      desktop: '/assets/optimized/site-hotledas.webp'
    },
    engicore: {
      mobile: '/assets/responsive/site-engicore-mobile.webp',
      tablet: '/assets/responsive/site-engicore-tablet.webp',
      desktop: '/assets/optimized/site-engicore.webp'
    },
    alive: {
      mobile: '/assets/responsive/site-alive-mobile.webp',
      tablet: '/assets/responsive/site-alive-tablet.webp',
      desktop: '/assets/optimized/site-alive.webp'
    }
  },
  
  // Breakpoints para dispositivos
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1025
  }
};

// Função para obter a URL da imagem baseada no dispositivo
export const getResponsiveImageUrl = (
  image: string | { mobile: string; tablet: string; desktop: string },
  device?: 'mobile' | 'tablet' | 'desktop'
): string => {
  if (typeof image === 'string') return image;
  
  if (device) {
    return image[device];
  }
  
  // Detectar dispositivo automaticamente
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= IMAGE_CONFIG.breakpoints.mobile) return image.mobile;
    if (width <= IMAGE_CONFIG.breakpoints.tablet) return image.tablet;
    return image.desktop;
  }
  
  return image.mobile; // Fallback para SSR
};

// Função para gerar srcset para picture element
export const generateSrcSet = (image: string | { mobile: string; tablet: string; desktop: string }) => {
  if (typeof image === 'string') {
    return {
      mobile: image,
      tablet: image,
      desktop: image,
    };
  }
  return image;
};

// Configuração de preload para imagens críticas
export const CRITICAL_IMAGES_PRELOAD = [
  IMAGE_CONFIG.critical.hero.mobile,
  IMAGE_CONFIG.portfolio.sancao.mobile,
  IMAGE_CONFIG.portfolio.hotledas.mobile,
  IMAGE_CONFIG.portfolio.engicore.mobile,
  IMAGE_CONFIG.portfolio.alive.mobile,
];

// Configuração de lazy loading
export const LAZY_LOAD_CONFIG = {
  rootMargin: '200px',
  threshold: 0.1,
  priority: {
    hero: true,
    portfolioFirst: true,
    portfolioRest: false
  }
}; 