import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

// Configuração de breakpoints para imagens responsivas
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Gerar múltiplos tamanhos de imagem
const generateImageSizes = (originalWidth: number, originalHeight: number) => {
  const sizes = [];
  
  // Tamanhos para diferentes breakpoints
  const breakpointSizes = [
    { width: 320, height: Math.round((320 * originalHeight) / originalWidth) },
    { width: 480, height: Math.round((480 * originalHeight) / originalWidth) },
    { width: 640, height: Math.round((640 * originalHeight) / originalWidth) },
    { width: 768, height: Math.round((768 * originalHeight) / originalWidth) },
    { width: 1024, height: Math.round((1024 * originalHeight) / originalWidth) },
    { width: 1280, height: Math.round((1280 * originalHeight) / originalWidth) },
  ];

  // Filtrar tamanhos que não excedem o original
  return breakpointSizes.filter(size => size.width <= originalWidth);
};

// Gerar srcset para diferentes formatos
const generateSrcSet = (baseSrc: string, sizes: Array<{width: number, height: number}>) => {
  const baseName = baseSrc.replace(/\.[^/.]+$/, '');
  const extension = baseSrc.split('.').pop();
  
  // Para imagens já otimizadas, usar o mesmo arquivo
  if (baseSrc.includes('/optimized/')) {
    return {
      webp: baseSrc,
      fallback: baseSrc.replace('.webp', '.jpg'),
    };
  }

  // Para imagens não otimizadas, gerar caminhos otimizados
  const optimizedPath = baseSrc.replace('/assets/', '/assets/optimized/').replace(/\.(png|jpg|jpeg)$/, '.webp');
  
  return {
    webp: optimizedPath,
    fallback: baseSrc,
  };
};

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw',
  aspectRatio,
  placeholder,
  onLoad,
  onError,
  lazy = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority || !lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Gerar tamanhos responsivos
  const imageSizes = width && height ? generateImageSizes(width, height) : [];
  const srcSet = generateSrcSet(src, imageSizes);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || !lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Carregar 100px antes de entrar na viewport
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
  }, [priority, lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Calcular aspect ratio para prevenir layout shift
  const aspectRatioStyle = aspectRatio ? {
    aspectRatio: aspectRatio.toString(),
  } : {};

  // Estilos para prevenir layout shift
  const containerStyle = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    ...aspectRatioStyle,
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* Placeholder/loading state */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Imagem responsiva */}
      {isInView && (
        <picture>
          {/* WebP format com srcset */}
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
            decoding="async"
          />
        </picture>
      )}

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm text-center">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            Erro ao carregar imagem
          </div>
        </div>
      )}
    </div>
  );
};

// Hook para pré-carregar imagens críticas
export const useCriticalImagePreload = (srcs: string[]) => {
  useEffect(() => {
    srcs.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });
  }, [srcs]);
};

// Hook para pré-carregar imagens não críticas
export const useImagePreload = (srcs: string[]) => {
  useEffect(() => {
    srcs.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'low';
      document.head.appendChild(link);
    });
  }, [srcs]);
}; 