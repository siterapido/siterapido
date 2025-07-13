import { Header1 } from "@/components/ui/header";
import { ProblemSection } from "@/components/ui/problem-section";
import { useEffect, useState } from "react";
import { Hero } from "@/components/ui/animated-hero";
import { ComoFuncionaSection } from "./components/sections/ComoFuncionaSection";
import { PricingSection } from "./components/sections/PricingSection";
import { AboutSection } from "./components/sections/AboutSection";
import { FAQ } from "@/components/ui/faq-section";
import { Footerdemo } from "@/components/ui/footer-section";
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
      <ComoFuncionaSection />
      <SolutionSection />
      <PortfolioSection />
      <PricingSection />
      <AboutSection />
      <FAQ />
      <Footerdemo />
    </>
  );
}

export default App; 