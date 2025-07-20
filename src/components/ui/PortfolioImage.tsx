import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PortfolioImageProps {
  image: string | {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const PortfolioImage: React.FC<PortfolioImageProps> = ({
  image,
  alt,
  className = '',
  priority = false,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Função para obter a URL da imagem baseada no dispositivo
  const getImageUrl = (image: string | { mobile: string; tablet: string; desktop: string }): string => {
    if (typeof image === 'string') return image;
    
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 640) return image.mobile;
      if (width <= 1024) return image.tablet;
      return image.desktop;
    }
    
    return image.mobile; // Fallback para SSR
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
        rootMargin: '200px', // Carregar 200px antes de entrar na viewport
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

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // Obter URLs para diferentes tamanhos
  const getImageUrls = () => {
    if (typeof image === 'string') {
      return {
        mobile: image,
        tablet: image,
        desktop: image,
      };
    }
    return image;
  };

  const urls = getImageUrls();

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Placeholder/loading state */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Imagem responsiva */}
      {isInView && (
        <picture>
          {/* Mobile */}
          <source
            media="(max-width: 640px)"
            srcSet={urls.mobile}
            type="image/webp"
          />
          {/* Tablet */}
          <source
            media="(min-width: 641px) and (max-width: 1024px)"
            srcSet={urls.tablet}
            type="image/webp"
          />
          {/* Desktop */}
          <source
            media="(min-width: 1025px)"
            srcSet={urls.desktop}
            type="image/webp"
          />
          {/* Fallback */}
          <motion.img
            src={urls.mobile}
            alt={alt}
            className={`w-full h-full object-cover object-top object-center transition-transform duration-300 group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
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
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
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