import { Header1 } from "@/components/ui/header";
import { useEffect, useState } from "react";
import { Hero } from "@/components/ui/animated-hero";
import { ComoFuncionaSection } from "./components/sections/ComoFuncionaSection";
import { PricingSection } from "@/components/ui/pricing-section";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-icon";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { usePreload } from './hooks/usePreload';
import { initThirdPartyOptimization } from './lib/thirdPartyOptimization';
import { initializeFontOptimization } from './lib/fontOptimization';
import { loadLenisConditionally, progressiveLoader } from './lib/performance';
import { 
  LazyPortfolioSection, 
  LazyFocusCardsDemo, 
  LazyAboutSection, 
  LazyFAQ, 
  LazyFooterdemo,
  LazyAdminLayout,
  LazyLeadsList,
  LazyLogin
} from './components/lazy';

function toggleDarkMode(forceDark?: boolean) {
  const html = document.documentElement;
  if (forceDark === undefined) {
    html.classList.toggle("dark");
  } else if (forceDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function LandingPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  // Hook para preload de recursos críticos
  usePreload();
  
  // Inicializa otimizações
  useEffect(() => {
    // Inicializa otimização de terceiros
    initThirdPartyOptimization();
    
    // Inicializa otimização de fontes
    initializeFontOptimization();
    
    // Preload de componentes pesados
    progressiveLoader.preload('portfolio-section', () => 
      import('./components/sections/PortfolioSection')
    );
    
    progressiveLoader.preload('focus-cards', () => 
      import('./components/ui/demo')
    );
  }, []);

  useEffect(() => {
    toggleDarkMode(dark);
  }, [dark]);

  // Lenis Smooth Scroll - Carregamento otimizado
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeLenis = async () => {
      try {
        const lenis = await loadLenisConditionally();
        if (lenis) {
          cleanup = () => {
            if (lenis && typeof lenis.destroy === 'function') {
              lenis.destroy();
            }
          };
        }
      } catch (error) {
        console.warn('Lenis failed to load:', error);
      }
    };
    
    // Carrega após o primeiro frame para não bloquear o render inicial
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeLenis);
    } else {
      setTimeout(initializeLenis, 100);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <Header1 />
      <Hero />
      <ComoFuncionaSection />
      <PricingSection />
      <LazyPortfolioSection />
      <LazyFocusCardsDemo />
      <LazyAboutSection />
      <LazyFAQ />
      <LazyFooterdemo />
      <WhatsAppFloatingButton />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<LazyLogin onLogin={() => window.location.href = '/admin/leads'} />} />
      <Route path="/admin" element={<ProtectedRoute><LazyAdminLayout><LazyLeadsList /></LazyAdminLayout></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute><LazyAdminLayout><LazyLeadsList /></LazyAdminLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default App; 