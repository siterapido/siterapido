import { useEffect } from 'react';
import { detectDeviceCapabilities } from '@/lib/performance';
import { CRITICAL_IMAGES_PRELOAD } from '@/lib/imageConfig';
import { fontOptimizer } from '@/lib/fontOptimization';

// Função para preload de recursos
const preloadResource = (href: string, as: string, type?: string) => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  if (type) link.type = type;
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
};

// Função para preload de imagens
const preloadImage = (src: string) => {
  if (typeof document === 'undefined') return;
  
  const img = new Image();
  img.src = src;
};

export function usePreload() {
  useEffect(() => {
    const capabilities = detectDeviceCapabilities();
    
    // Só faz preload se não for dispositivo de baixo desempenho
    if (capabilities.hasSlowConnection || capabilities.hasLowMemory) {
      return;
    }

    // Preload de imagens críticas responsivas
    CRITICAL_IMAGES_PRELOAD.forEach(src => {
      preloadResource(src, 'image');
      preloadImage(src);
    });

    // Preload de fontes críticas usando o novo sistema
    const criticalFonts = [
      { family: 'Coolvetica', weight: '400' },
      { family: 'Coolvetica', weight: '900' }
    ];

    criticalFonts.forEach(font => {
      fontOptimizer.preloadFont(font.family, 'normal', font.weight);
    });

    // Preload de recursos CSS críticos
    const criticalCSS = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    criticalCSS.forEach(href => {
      preloadResource(href, 'style');
    });
  }, []);
} 