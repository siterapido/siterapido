import { useEffect } from 'react';
import { preloadResource, preloadImage, shouldUseLowPerfOptimizations } from '@/lib/performance';

export function usePreload() {
  useEffect(() => {
    // Só faz preload se não for dispositivo de baixo desempenho
    if (shouldUseLowPerfOptimizations()) {
      return;
    }

    // Preload de imagens críticas
    const criticalImages = [
      '/assets/site-hero-cerna-hero-v2.png',
      '/assets/site-sancao.png',
      '/assets/site-hotledas.png',
      '/assets/site-engicore.png',
      '/assets/site-alive.png'
    ];

    criticalImages.forEach(src => {
      preloadResource(src, 'image');
      preloadImage(src);
    });

    // Preload de fontes críticas
    const criticalFonts = [
      '/Fontes/coolvetica-rg.woff',
      '/Fontes/coolvetica-compressed-hv.woff'
    ];

    criticalFonts.forEach(href => {
      preloadResource(href, 'font', 'font/woff');
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