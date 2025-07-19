import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazyLoad = (options: UseLazyLoadOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const callback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          setHasTriggered(true);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    },
    [triggerOnce]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasTriggered) return;

    const observer = new IntersectionObserver(callback, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, threshold, rootMargin, hasTriggered]);

  return { elementRef, isVisible };
};

// Hook para lazy loading de imagens
export const useImageLazyLoad = (src: string, options?: UseLazyLoadOptions) => {
  const { elementRef, isVisible } = useLazyLoad(options);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src);
    }
  }, [isVisible, src, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return {
    elementRef,
    imageSrc,
    isLoaded,
    hasError,
    handleLoad,
    handleError,
  };
};

// Hook para lazy loading de componentes React
export const useComponentLazyLoad = <T extends HTMLElement>(
  options?: UseLazyLoadOptions
) => {
  const { elementRef, isVisible } = useLazyLoad(options);
  
  return {
    ref: elementRef as React.RefObject<T>,
    isVisible,
  };
};

// Hook para lazy loading de scripts
export const useScriptLazyLoad = (src: string, options?: UseLazyLoadOptions) => {
  const { elementRef, isVisible } = useLazyLoad(options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !isLoaded && !hasError) {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        setHasError(true);
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [isVisible, src, isLoaded, hasError]);

  return {
    elementRef,
    isLoaded,
    hasError,
  };
}; 