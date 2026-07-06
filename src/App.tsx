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
import { Toaster } from '@/components/ui/sonner';
import Login from './components/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import PipelineBoard from './components/admin/PipelineBoard';
import LeadDetail from './components/admin/LeadDetail';
import SubscriptionsTable from './components/admin/SubscriptionsTable';
import CustomersTable from './components/admin/CustomersTable';
import ResumoPage from './components/admin/ResumoPage';
import { 
  LazyPortfolioSection, 
  LazyAboutSection, 
  LazyFAQ, 
  LazyFooterdemo,
} from './components/lazy';

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
  usePreload();
  
  useEffect(() => {
    initThirdPartyOptimization();
    initializeFontOptimization();
    
    progressiveLoader.preload('portfolio-section', () => 
      import('./components/sections/PortfolioSection')
    );
  }, []);

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
      <LazyAboutSection />
      <LazyFAQ />
      <LazyFooterdemo />
      <WhatsAppFloatingButton />
    </>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<Login onLogin={() => window.location.href = '/admin/resumo'} />} />
        <Route path="/admin" element={<Navigate to="/admin/resumo" replace />} />
        <Route path="/admin/resumo" element={<ProtectedRoute><AdminLayout><ResumoPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/pipeline" element={<ProtectedRoute><AdminLayout><PipelineBoard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/leads/:id" element={<ProtectedRoute><AdminLayout><LeadDetail /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/assinaturas" element={<ProtectedRoute><AdminLayout><SubscriptionsTable /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/clientes" element={<ProtectedRoute><AdminLayout><CustomersTable /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/leads" element={<Navigate to="/admin/pipeline" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
