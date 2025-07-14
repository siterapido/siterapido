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

function App() {
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

export default App; 