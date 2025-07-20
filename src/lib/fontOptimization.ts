import { detectDeviceCapabilities } from './performance';

// Configuração de fontes
interface FontConfig {
  family: string;
  style?: string;
  weight?: string;
  src: string;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
}

// Fontes configuradas
const FONT_CONFIGS: FontConfig[] = [
  {
    family: 'Coolvetica',
    src: '/assets/fonts/coolvetica-rg.woff',
    weight: '400',
    display: 'swap',
    preload: true,
  },
  {
    family: 'Coolvetica',
    src: '/assets/fonts/coolvetica-rg-it.woff',
    style: 'italic',
    weight: '400',
    display: 'swap',
    preload: false,
  },
  {
    family: 'Coolvetica',
    src: '/assets/fonts/coolvetica-condensed-rg.woff',
    weight: '400',
    display: 'swap',
    preload: false,
  },
  {
    family: 'Coolvetica',
    src: '/assets/fonts/coolvetica-compressed-hv.woff',
    weight: '900',
    display: 'swap',
    preload: false,
  },
  {
    family: 'Coolvetica',
    src: '/assets/fonts/coolvetica-crammed-rg.woff',
    weight: '400',
    display: 'swap',
    preload: false,
  },
];

// Sistema de carregamento de fontes otimizado
export class FontOptimizer {
  private loadedFonts = new Set<string>();
  private loadingFonts = new Map<string, Promise<void>>();
  private fontFaceCache = new Map<string, FontFace>();

  constructor() {
    this.initializeFonts();
  }

  private getFontKey(font: FontConfig): string {
    return `${font.family}-${font.style || 'normal'}-${font.weight || '400'}`;
  }

  private async loadFontFace(font: FontConfig): Promise<FontFace> {
    const fontKey = this.getFontKey(font);
    
    if (this.fontFaceCache.has(fontKey)) {
      return this.fontFaceCache.get(fontKey)!;
    }

    try {
      const fontFace = new FontFace(
        font.family,
        `url(${font.src})`,
        {
          style: font.style || 'normal',
          weight: font.weight || '400',
          display: font.display || 'swap',
        }
      );

      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      this.fontFaceCache.set(fontKey, loadedFont);
      
      return loadedFont;
    } catch (error) {
      console.warn(`Failed to load font: ${fontKey}`, error);
      throw error;
    }
  }

  private async loadFont(font: FontConfig): Promise<void> {
    const fontKey = this.getFontKey(font);
    
    if (this.loadedFonts.has(fontKey) || this.loadingFonts.has(fontKey)) {
      return;
    }

    const loadPromise = this.loadFontFace(font).then(() => {
      this.loadedFonts.add(fontKey);
      this.loadingFonts.delete(fontKey);
    }).catch((error) => {
      this.loadingFonts.delete(fontKey);
      throw error;
    });

    this.loadingFonts.set(fontKey, loadPromise);
    return loadPromise;
  }

  private initializeFonts() {
    const capabilities = detectDeviceCapabilities();
    
    // Carrega fontes essenciais imediatamente
    const essentialFonts = FONT_CONFIGS.filter(font => font.preload);
    essentialFonts.forEach(font => {
      this.loadFont(font);
    });

    // Carrega outras fontes baseado no dispositivo
    const otherFonts = FONT_CONFIGS.filter(font => !font.preload);
    
    if (capabilities.hasSlowConnection) {
      // Em conexões lentas, carrega apenas fontes essenciais
      return;
    }

    // Carrega fontes adicionais com delay
    setTimeout(() => {
      otherFonts.forEach((font, index) => {
        setTimeout(() => {
          this.loadFont(font);
        }, index * 200); // Stagger loading
      });
    }, 1000);
  }

  public async preloadFont(fontFamily: string, style: string = 'normal', weight: string = '400'): Promise<void> {
    const font = FONT_CONFIGS.find(f => 
      f.family === fontFamily && 
      f.style === style && 
      f.weight === weight
    );

    if (font) {
      return this.loadFont(font);
    }
  }

  public isFontLoaded(fontFamily: string, style: string = 'normal', weight: string = '400'): boolean {
    const fontKey = `${fontFamily}-${style}-${weight}`;
    return this.loadedFonts.has(fontKey);
  }

  public isFontLoading(fontFamily: string, style: string = 'normal', weight: string = '400'): boolean {
    const fontKey = `${fontFamily}-${style}-${weight}`;
    return this.loadingFonts.has(fontKey);
  }

  public getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts);
  }
}

// Sistema de preload de fontes
export const createFontPreloader = () => {
  const preloadedFonts = new Set<string>();

  return {
    preload: (fontFamily: string, src: string) => {
      const fontKey = `${fontFamily}-${src}`;
      
      if (preloadedFonts.has(fontKey)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = src;
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
      preloadedFonts.add(fontKey);
    },

         preloadCriticalFonts: () => {
       const criticalFonts = FONT_CONFIGS.filter(font => font.preload);
       
       criticalFonts.forEach(font => {
         fontPreloader.preload(font.family, font.src);
       });
     },
  };
};

// Sistema de FOUT (Flash of Unstyled Text) handling
export const createFOUTHandler = () => {
  let fontsLoaded = false;
  const callbacks: (() => void)[] = [];

  return {
    onFontsLoaded: (callback: () => void) => {
      if (fontsLoaded) {
        callback();
      } else {
        callbacks.push(callback);
      }
    },

    markFontsLoaded: () => {
      fontsLoaded = true;
      callbacks.forEach(callback => callback());
      callbacks.length = 0;
    },

    // Aplica classes CSS baseado no carregamento de fontes
    applyFontClasses: () => {
      const capabilities = detectDeviceCapabilities();
      
      // Adiciona classe para indicar que fontes estão carregadas
      document.documentElement.classList.add('fonts-loaded');
      
      // Adiciona classe baseada no dispositivo
      if (capabilities.isMobile) {
        document.documentElement.classList.add('device-mobile');
      } else if (capabilities.isTablet) {
        document.documentElement.classList.add('device-tablet');
      } else {
        document.documentElement.classList.add('device-desktop');
      }

      // Adiciona classe para conexão lenta
      if (capabilities.hasSlowConnection) {
        document.documentElement.classList.add('connection-slow');
      }
    },
  };
};

// Instâncias globais
export const fontOptimizer = new FontOptimizer();
export const fontPreloader = createFontPreloader();
export const foutHandler = createFOUTHandler();

// Função de inicialização
export const initializeFontOptimization = () => {
  // Preload de fontes críticas
  fontPreloader.preloadCriticalFonts();
  
  // Aplica classes CSS
  foutHandler.applyFontClasses();
  
  // Marca fontes como carregadas após um tempo
  setTimeout(() => {
    foutHandler.markFontsLoaded();
  }, 2000);
};

// Hook para React (requer import do React)
export const useFontOptimization = () => {
  // Este hook deve ser usado em componentes React com import do React
  // const [fontsLoaded, setFontsLoaded] = React.useState(false);
  // React.useEffect(() => {
  //   foutHandler.onFontsLoaded(() => {
  //     setFontsLoaded(true);
  //   });
  // }, []);
  // return { fontsLoaded };
  
  return { fontsLoaded: false };
}; 