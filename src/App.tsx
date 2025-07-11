import { Header1 } from "@/components/ui/header";
import { ProblemSection } from "@/components/ui/problem-section";
import { useEffect, useState } from "react";
import { FullpageContainer } from "@/components/layout/FullpageContainer";
import { FullpageSection } from "@/components/layout/FullpageSection";
import { Hero } from "@/components/ui/animated-hero";
import { FrustrationSection } from "./components/sections/FrustrationSection";
import { ComoFuncionaSection } from "./components/sections/ComoFuncionaSection";
import { FeatureStepsDemo } from "@/components/ui/feature-section-demo";
import { PricingSection } from "./components/sections/PricingSection";
import { AboutSection } from "./components/sections/AboutSection";
import { FAQ } from "@/components/ui/faq-section";
import { Footerdemo } from "@/components/ui/footer-section";
import { motion, AnimatePresence } from "framer-motion";
import { SolutionSection } from "./components/sections";
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

  // Estado para controlar a transição entre as seções
  const [showcaseEntering, setShowcaseEntering] = useState(false);

  // Callback para detectar quando a ShowcaseSection está entrando
  const handleShowcaseEntering = (isEntering: boolean) => {
    setShowcaseEntering(isEntering);
  };

  useEffect(() => {
    toggleDarkMode(dark);
  }, [dark]);

  const handleToggleTheme = () => {
    setDark((prevDark) => !prevDark);
  };

  return (
    <>
      <Header1 />
      <Hero />
      <FocusCardsDemo />
      <ProblemSection />
      <SolutionSection />
      <PortfolioSection />
      <FeatureStepsDemo />
      <PricingSection />
      <AboutSection />
      <FAQ />
      <Footerdemo />
    </>
  );
}

export default App; 