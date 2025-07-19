import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw',
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Gerar srcset para diferentes tamanhos
  const generateSrcSet = (originalSrc: string) => {
    const baseName = originalSrc.replace(/\.[^/.]+$/, '');
    
    // Verificar se existe versão otimizada
    const optimizedSrc = originalSrc.replace(/\.(png|jpg|jpeg)$/, '.webp');
    const optimizedPath = optimizedSrc.replace('/assets/', '/assets/optimized/');
    
    return {
      webp: optimizedPath,
      fallback: originalSrc,
    };
  };

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  // Gerar srcset
  const srcSet = generateSrcSet(src);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Estilos para prevenir layout shift
  const imageStyle = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit: 'cover' as const,
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={imageStyle}
    >
      {/* Placeholder/loading state */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Imagem otimizada */}
      {isInView && (
        <picture>
          {/* WebP format */}
          <source
            srcSet={srcSet.webp}
            sizes={sizes}
            type="image/webp"
          />
          
          {/* Fallback image */}
          <motion.img
            src={srcSet.fallback}
            alt={alt}
            className={`w-full h-full transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={imageStyle}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
          />
        </picture>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Erro ao carregar imagem</div>
        </div>
      )}
    </div>
  );
};

// Hook para pré-carregar imagens
export const useImagePreload = (srcs: string[]) => {
  useEffect(() => {
    srcs.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [srcs]);
}; 