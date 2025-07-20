import { useEffect, useRef, useState } from 'react';

interface ImageConfig {
  mobile: string;
  tablet: string;
  desktop: string;
}

interface UseImageOptimizationProps {
  images: (string | ImageConfig)[];
  priority?: boolean;
  preloadCount?: number;
}

export const useImageOptimization = ({
  images,
  priority = false,
  preloadCount = 3
}: UseImageOptimizationProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Função para obter a URL da imagem baseada no dispositivo
  const getImageUrl = (image: string | ImageConfig): string => {
    if (typeof image === 'string') return image;
    
    // Detectar dispositivo baseado na largura da tela
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 640) return image.mobile;
      if (width <= 1024) return image.tablet;
      return image.desktop;
    }
    
    return image.mobile; // Fallback para SSR
  };

  // Função para preload de imagens
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  // Preload de imagens críticas
  useEffect(() => {
    if (priority) {
      const criticalImages = images.slice(0, preloadCount);
      criticalImages.forEach(image => {
        const url = getImageUrl(image);
        preloadImage(url).catch(console.warn);
      });
    }
  }, [images, priority, preloadCount]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              preloadImage(src).catch(console.warn);
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  // Função para observar uma imagem
  const observeImage = (element: HTMLImageElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  };

  return {
    loadedImages,
    getImageUrl,
    observeImage,
    preloadImage,
  };
};

// Hook para otimizar uma única imagem
export const useOptimizedImage = (image: string | ImageConfig, priority = false) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const getImageUrl = (image: string | ImageConfig): string => {
    if (typeof image === 'string') return image;
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 640) return image.mobile;
      if (width <= 1024) return image.tablet;
      return image.desktop;
    }
    
    return image.mobile;
  };

  useEffect(() => {
    if (priority) {
      const url = getImageUrl(image);
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsError(true);
      img.src = url;
    }
  }, [image, priority]);

  return {
    isLoaded,
    isError,
    imgRef,
    getImageUrl: () => getImageUrl(image),
  };
}; 