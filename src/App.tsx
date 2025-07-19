import { Header1 } from "@/components/ui/header";
import { useEffect, useState, Suspense } from "react";
import { Hero } from "@/components/ui/animated-hero";
import { ComoFuncionaSection } from "./components/sections/ComoFuncionaSection";
import { PricingSection } from "@/components/ui/pricing-section";
import { AboutSection } from "./components/sections/AboutSection";
import { FAQ } from "@/components/ui/faq-section";
import { Footerdemo } from "@/components/ui/footer-section";
import { FocusCardsDemo } from "@/components/ui/demo";
import { PortfolioSection } from "./components/sections/PortfolioSection";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-icon";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import LeadsList from './components/admin/LeadsList';
import { supabase } from './lib/supabaseClient';
import { usePreload } from './hooks/usePreload';

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

// Componente de loading para Suspense
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#84CC15]"></div>
    </div>
  );
}

function LandingPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  // Hook para preload de recursos críticos
  usePreload();

  useEffect(() => {
    toggleDarkMode(dark);
  }, [dark]);

  // Lenis Smooth Scroll
  useEffect(() => {
    let lenis: any;
    let cleanup: (() => void) | undefined;
    
    // Preload do Lenis
    const preloadLenis = () => {
      return import("lenis");
    };
    
    // Carrega o Lenis de forma otimizada
    const loadLenis = async () => {
      try {
        const { default: Lenis } = await preloadLenis();
        lenis = new Lenis({
          autoRaf: true,
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
        cleanup = () => {
          if (lenis) lenis.destroy();
        };
      } catch (error) {
        console.warn('Lenis failed to load:', error);
      }
    };
    
    // Carrega após um pequeno delay para não bloquear o render inicial
    const timer = setTimeout(loadLenis, 100);
    
    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <>
      <Header1 />
      <Hero />
      <ComoFuncionaSection />
      <PricingSection />
      <Suspense fallback={<LoadingSpinner />}>
        <PortfolioSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <FocusCardsDemo />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <Footerdemo />
      </Suspense>
      <WhatsAppFloatingButton />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<Login onLogin={() => window.location.href = '/admin/leads'} />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout><LeadsList /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute><AdminLayout><LeadsList /></AdminLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default App; 