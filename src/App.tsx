import { Header1 } from "@/components/ui/header";
import { useEffect, useState } from "react";
import { Hero } from "@/components/ui/animated-hero";
import { ComoFuncionaSection } from "./components/sections/ComoFuncionaSection";
import { PricingSection } from "@/components/ui/pricing-section";
import { AboutSection } from "./components/sections/AboutSection";
import { FAQ } from "@/components/ui/faq-section";
import { Footerdemo } from "@/components/ui/footer-section";
import { FocusCardsDemo } from "@/components/ui/demo";
import { PortfolioSection } from "./components/sections/PortfolioSection";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import LeadsList from './components/admin/LeadsList';
import { supabase } from './lib/supabaseClient';

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

  useEffect(() => {
    toggleDarkMode(dark);
  }, [dark]);

  // Lenis Smooth Scroll
  useEffect(() => {
    let lenis: any;
    let cleanup: (() => void) | undefined;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({
        autoRaf: true,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      cleanup = () => {
        if (lenis) lenis.destroy();
      };
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleToggleTheme = () => {
    setDark((prevDark) => !prevDark);
  };

  return (
    <>
      <Header1 />
      <Hero />
      <ComoFuncionaSection />
      <PricingSection />
      <PortfolioSection />
      <FocusCardsDemo />
      <AboutSection />
      <FAQ />
      <Footerdemo />
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