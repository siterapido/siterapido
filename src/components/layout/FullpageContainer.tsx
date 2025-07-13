import React, { useState, useEffect } from "react";

interface FullpageContainerProps {
  children: React.ReactNode;
}

// Para funcionar corretamente, as seções devem aceitar props: isActive, isLeaving, isEntering
export function FullpageContainer({ children }: FullpageContainerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;

  useEffect(() => {
    if (!isDesktop) return;
    // Só trava o scroll se NÃO estiver na última seção
    const isLastSection = activeIndex === React.Children.count(children) - 1;
    document.body.style.overflow = isTransitioning || !isLastSection ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isTransitioning, isDesktop, activeIndex, children]);

  useEffect(() => {
    if (!isDesktop) return;
    const onWheel = (e: WheelEvent) => {
      if (isTransitioning) return;
      if (e.deltaY > 40 && activeIndex < React.Children.count(children) - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveIndex((i) => Math.min(i + 1, React.Children.count(children) - 1));
          setIsTransitioning(false);
        }, 1200);
      } else if (e.deltaY < -40 && activeIndex > 0) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveIndex((i) => Math.max(i - 1, 0));
          setIsTransitioning(false);
        }, 1200);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [activeIndex, isTransitioning, children, isDesktop]);

  // Só passa props extras se o filho for um componente de seção fullpage
  return (
    <div className="relative w-full overflow-hidden">
      {React.Children.toArray(children).map((child, idx) => {
        if (
          React.isValidElement(child) &&
          (child.type as any).displayName === 'FullpageSection'
        ) {
          const el = child as React.ReactElement<any>;
          const extraProps: any = {};
          if ('isActive' in el.props) extraProps.isActive = idx === activeIndex;
          if ('isLeaving' in el.props) extraProps.isLeaving = idx === activeIndex - 1 && isTransitioning;
          if ('isEntering' in el.props) extraProps.isEntering = idx === activeIndex + 1 && isTransitioning;
          if ('className' in el.props) extraProps.key = idx;
          return React.cloneElement(el, extraProps);
        }
        return child;
      })}
    </div>
  );
} 