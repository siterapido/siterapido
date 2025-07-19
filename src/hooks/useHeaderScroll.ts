import { useCallback, useEffect, useState } from 'react';

export const useHeaderScroll = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    // Otimizar scroll com throttle
    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 50);
    }, []);

    useEffect(() => {
        let ticking = false;
        
        const throttledScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', throttledScroll);
        };
    }, [handleScroll]);

    return { isScrolled };
};

export const useSmoothScroll = () => {
    return useCallback((href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                e.preventDefault();
                
                // Usar Intersection Observer para melhor performance
                const header = document.querySelector('header');
                const headerHeight = header ? header.getBoundingClientRect().height : 0;
                const sectionTop = (section as HTMLElement).getBoundingClientRect().top + window.scrollY;
                
                window.scrollTo({
                    top: sectionTop - headerHeight - 8,
                    behavior: 'smooth'
                });
            }
        }
    }, []);
}; 