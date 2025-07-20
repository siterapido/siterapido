import { memo } from 'react';

interface OptimizedLogoProps {
    className?: string;
    width?: number;
    height?: number;
}

const OptimizedLogo = memo(({ 
    className = "h-6 md:h-8 w-auto object-contain",
    width = 120,
    height = 32 
}: OptimizedLogoProps) => (
    <div className="flex items-center gap-4">
        <img 
            src="/assets/optimized/logo-principal-preta.webp" 
            alt="Logo Site Rápido" 
            className={className}
            width={width}
            height={height}
            loading="eager"
            decoding="async"
            fetchPriority="high"
        />
    </div>
));

OptimizedLogo.displayName = 'OptimizedLogo';

export { OptimizedLogo }; 