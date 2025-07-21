import { detectDeviceCapabilities } from './performance';

// Configuração de scripts de terceiros
interface ThirdPartyScript {
  id: string;
  src: string;
  async?: boolean;
  defer?: boolean;
  loadCondition: () => boolean;
  loadStrategy: 'immediate' | 'delayed' | 'interaction' | 'idle';
  priority: 'high' | 'medium' | 'low';
}

// Scripts de terceiros configurados
const thirdPartyScripts: ThirdPartyScript[] = [
  {
    id: 'gtm',
    src: 'https://www.googletagmanager.com/gtm.js?id=GTM-M83CJT4B',
    async: true,
    loadCondition: () => !detectDeviceCapabilities().hasSlowConnection,
    loadStrategy: 'delayed',
    priority: 'medium',
  },
  {
    id: 'facebook-pixel',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
    async: true,
    loadCondition: () => !detectDeviceCapabilities().hasSlowConnection,
    loadStrategy: 'interaction',
    priority: 'low',
  },
  {
    id: 'hotjar',
    src: 'https://static.hotjar.com/c/hotjar-XXXXXXX.js?sv=6',
    async: true,
    loadCondition: () => detectDeviceCapabilities().isDesktop,
    loadStrategy: 'idle',
    priority: 'low',
  },
];

// Sistema de carregamento de scripts
class ScriptLoader {
  private loadedScripts = new Set<string>();
  private loadingScripts = new Map<string, Promise<void>>();
  private interactionDetected = false;
  private idleCallbackSupported = 'requestIdleCallback' in window;

  constructor() {
    this.setupInteractionDetection();
  }

  private setupInteractionDetection() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const markInteraction = () => {
      this.interactionDetected = true;
      events.forEach(event => document.removeEventListener(event, markInteraction, true));
      this.loadInteractionBasedScripts();
    };

    events.forEach(event => {
      document.addEventListener(event, markInteraction, { once: true, passive: true });
    });
  }

  private async loadScript(script: ThirdPartyScript): Promise<void> {
    if (this.loadedScripts.has(script.id) || this.loadingScripts.has(script.id)) {
      return;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.id = script.id;
      scriptElement.src = script.src;
      scriptElement.async = script.async || false;
      scriptElement.defer = script.defer || false;

      scriptElement.onload = () => {
        this.loadedScripts.add(script.id);
        this.loadingScripts.delete(script.id);
        resolve();
      };

      scriptElement.onerror = () => {
        this.loadingScripts.delete(script.id);
        reject(new Error(`Failed to load script: ${script.id}`));
      };

      document.head.appendChild(scriptElement);
    });

    this.loadingScripts.set(script.id, loadPromise);
    return loadPromise;
  }

  private loadImmediateScripts() {
    const immediateScripts = thirdPartyScripts.filter(
      script => script.loadStrategy === 'immediate' && script.loadCondition()
    );

    immediateScripts.forEach(script => {
      this.loadScript(script);
    });
  }

  private loadDelayedScripts() {
    const delayedScripts = thirdPartyScripts.filter(
      script => script.loadStrategy === 'delayed' && script.loadCondition()
    );

    // Carrega scripts com delay baseado na prioridade
    delayedScripts.forEach((script, index) => {
      const delay = script.priority === 'high' ? 1000 : 
                   script.priority === 'medium' ? 3000 : 5000;
      
      setTimeout(() => {
        this.loadScript(script);
      }, delay + (index * 500)); // Stagger loading
    });
  }

  private loadInteractionBasedScripts() {
    const interactionScripts = thirdPartyScripts.filter(
      script => script.loadStrategy === 'interaction' && script.loadCondition()
    );

    interactionScripts.forEach(script => {
      this.loadScript(script);
    });
  }

  private loadIdleScripts() {
    const idleScripts = thirdPartyScripts.filter(
      script => script.loadStrategy === 'idle' && script.loadCondition()
    );

    if (this.idleCallbackSupported) {
      idleScripts.forEach(script => {
        requestIdleCallback(() => {
          this.loadScript(script);
        }, { timeout: 5000 });
      });
    } else {
      // Fallback para navegadores sem requestIdleCallback
      idleScripts.forEach((script, index) => {
        setTimeout(() => {
          this.loadScript(script);
        }, 10000 + (index * 1000));
      });
    }
  }

  public initialize() {
    this.loadImmediateScripts();
    this.loadDelayedScripts();
    this.loadIdleScripts();
  }

  public forceLoad(scriptId: string) {
    const script = thirdPartyScripts.find(s => s.id === scriptId);
    if (script) {
      this.loadScript(script);
    }
  }

  public isLoaded(scriptId: string): boolean {
    return this.loadedScripts.has(scriptId);
  }

  public isLoading(scriptId: string): boolean {
    return this.loadingScripts.has(scriptId);
  }
}

// Instância global do carregador
const scriptLoader = new ScriptLoader();

// Função de inicialização
export const initThirdPartyOptimization = () => {
  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scriptLoader.initialize();
    });
  } else {
    scriptLoader.initialize();
  }
};

// Funções de utilidade
export const loadScriptOnDemand = (scriptId: string) => {
  scriptLoader.forceLoad(scriptId);
};

export const isScriptLoaded = (scriptId: string): boolean => {
  return scriptLoader.isLoaded(scriptId);
};

// Sistema de analytics otimizado
export class OptimizedAnalytics {
  private queue: Array<{ event: string; data: any; timestamp: number }> = [];
  private isInitialized = false;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupPeriodicFlush();
  }

  private setupPeriodicFlush() {
    // Flush a cada 30 segundos
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  public track(event: string, data: any = {}) {
    const eventData = {
      event,
      data,
      timestamp: Date.now(),
    };

    this.queue.push(eventData);

    // Flush imediatamente se for um evento importante
    if (['purchase', 'lead', 'contact'].includes(event)) {
      this.flush();
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Envia eventos para analytics
    if (this.isInitialized) {
      try {
        // Google Analytics 4
        if (typeof (window as any).gtag !== 'undefined') {
          events.forEach(({ event, data }) => {
            (window as any).gtag('event', event, data);
          });
        }

        // Facebook Pixel
        if (typeof (window as any).fbq !== 'undefined') {
          events.forEach(({ event, data }) => {
            (window as any).fbq('track', event, data);
          });
        }
      } catch (error) {
        console.warn('Analytics flush failed:', error);
      }
    }
  }

  public initialize() {
    this.isInitialized = true;
    this.flush();
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Instância global do analytics
export const analytics = new OptimizedAnalytics();

// Sistema de carregamento de fontes otimizado
export class FontLoader {
  private loadedFonts = new Set<string>();
  private fontFaceObserver: any = null;

  constructor() {
    this.initializeFontFaceObserver();
  }

  private async initializeFontFaceObserver() {
    // FontFaceObserver não está disponível, usando fallback
    this.fontFaceObserver = null;
  }

  public async loadFont(fontFamily: string, fontStyle: string = 'normal', fontWeight: string = '400') {
    const fontKey = `${fontFamily}-${fontStyle}-${fontWeight}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve();
    }

    try {
      if (this.fontFaceObserver) {
        const font = new this.fontFaceObserver(fontFamily, {
          style: fontStyle,
          weight: fontWeight,
        });
        
        await font.load();
        this.loadedFonts.add(fontKey);
      } else {
        // Fallback: aguarda um tempo arbitrário
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.loadedFonts.add(fontKey);
      }
    } catch (error) {
      console.warn(`Failed to load font: ${fontKey}`, error);
    }
  }

  public preloadFonts(fonts: Array<{ family: string; style?: string; weight?: string }>) {
    const capabilities = detectDeviceCapabilities();
    
    // Em conexões lentas, carrega apenas fontes essenciais
    if (capabilities.hasSlowConnection) {
      const essentialFonts = fonts.slice(0, 2);
      essentialFonts.forEach(font => {
        this.loadFont(font.family, font.style, font.weight);
      });
    } else {
      fonts.forEach(font => {
        this.loadFont(font.family, font.style, font.weight);
      });
    }
  }
}

// Instância global do carregador de fontes
export const fontLoader = new FontLoader(); 