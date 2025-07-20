
import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { MoveRight, ChevronDown, PhoneCall } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button as ShadButton } from "@/components/ui/button";
import { Typewriter } from "@/components/ui/typewriter-text";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useSectionInView } from "@/hooks/useSectionInView";
import { FullpageSection } from "@/components/layout/FullpageSection";
import type { FullpageSectionProps } from "@/components/layout/FullpageSection";
import React from "react";
import { LeadFormModal } from "@/components/ui/LeadFormModal";
import { gerarLinkWhatsApp } from "@/lib/utils";

function AnimatedGridBG() {
  const controls = useAnimation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    updateDark();
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    controls.start({
      backgroundPosition: [
        "0px 0px, 0px 0px",
        "40px 40px, 40px 40px",
        "0px 0px, 0px 0px"
      ],
      opacity: [0.7, 0.9, 0.7],
      transition: {
        backgroundPosition: {
          duration: 16,
          ease: "linear",
          repeat: Infinity,
        },
        opacity: {
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }
      }
    });
  }, [controls]);

  return (
    <motion.div
      aria-hidden
      animate={controls}
      initial={{ opacity: 0.7, backgroundPosition: "0px 0px, 0px 0px" }}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      style={{
        backgroundImage: isDark
          ? "repeating-linear-gradient(0deg,rgba(255,255,255,0.07),rgba(255,255,255,0.07) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(255,255,255,0.07),rgba(255,255,255,0.07) 1px,transparent 1px,transparent 40px)"
          : "repeating-linear-gradient(0deg,rgba(0,0,0,0.13),rgba(0,0,0,0.13) 1.5px,transparent 1.5px,transparent 40px),repeating-linear-gradient(90deg,rgba(0,0,0,0.13),rgba(0,0,0,0.13) 1.5px,transparent 1.5px,transparent 40px)",
        maskImage:
          "linear-gradient(to bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.7) 80%,transparent)",
        backgroundSize: "40px 40px, 40px 40px",
        backgroundPosition: "0px 0px, 0px 0px",
      }}
    />
  );
}

// Aceita props de transição do FullpageSection
function Hero(props: FullpageSectionProps) {
  // Removido o array bullets com o preço para evitar inconsistência

  // Hook para detectar se a galeria está visível
  const [morphDone, setMorphDone] = useState(false);
  const [morphTriggered, setMorphTriggered] = useState(false); // novo estado
  const [modalOpen, setModalOpen] = useState<false | 'orcamento'>(false);

  // Ref para a Hero Section
  const heroRef = useRef<HTMLDivElement>(null);
  const showcaseInView = useSectionInView({ threshold: 0.4 });

  // Controla o timing do morph
  useEffect(() => {
    if (showcaseInView && !morphTriggered) {
      // Aguarda a animação morph (0.9s) e então mostra o grid
      const t = setTimeout(() => {
        setMorphDone(true);
        setMorphTriggered(true); // trava o morph para não voltar
      }, 900);
      return () => clearTimeout(t);
    }
  }, [showcaseInView, morphTriggered]);

  // Função para scroll suave para a próxima seção
  const scrollToNextSection = () => {
    const nextSection = document.querySelector('#showcase-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-[80px] pb-4 sm:pt-16" style={{ background: '#F1F3F2' }}> {/* pt-16 só no sm+ para compensar header fixo, pt-[80px] no mobile para header fixo, pb-4 para garantir visibilidade do botão */}
      <FullpageSection {...props} className="w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatedGridBG />
        <div aria-hidden="true" className="absolute inset-0 z-5 pointer-events-none block dark:hidden bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.2)_60%,transparent_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 z-5 pointer-events-none hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.2)_60%,transparent_100%)]" />

        {/*
          Sites flutuantes sticky:
          - Só aparecem em xl+ (desktop).
          - Usam position: sticky para acompanhar o scroll até a próxima seção.
          - Não renderizam em mobile/tablet para evitar problemas de usabilidade.
        */}
        {/* REMOVIDO: Renderização dos sites flutuantes */}
        {/* Sites flutuantes morph - mobile/tablet: não exibir */}
        {/* Nenhuma renderização para <div className="block xl:hidden"> para garantir que não aparece em mobile/tablet */}

        {/* Conteúdo principal */}
        <div id="hero" className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 sm:pb-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-12 xl:gap-16">
            {/* Imagem acima do conteúdo no mobile, à direita no desktop */}
            <div className="block sm:hidden w-full flex justify-center items-center pt-4 pb-6">
              <img
                src="/assets/optimized/site-hero-cerna-hero-v2.webp"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[200px] max-h-[35vh] object-contain drop-shadow-2xl"
                loading="eager"
                draggable="false"
                fetchPriority="high"
              />
            </div>
            {/* Texto à esquerda (desktop) ou abaixo da imagem (mobile) */}
            <div className="flex flex-col items-center text-center max-w-3xl flex-1 w-full sm:mt-0 mx-auto sm:items-start sm:text-left gap-4 px-2 sm:px-0">
              {/* Headline com melhor hierarquia e responsividade */}
              <div className="space-y-1 sm:space-y-2">
                <h1
                  className="font-coolvetica text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-black dark:text-white leading-[1.1] sm:leading-[1.05] md:leading-[1.0] w-full tracking-wide"
                  style={{
                    letterSpacing: '0.05em'
                  }}
                >
                  <span className="block mb-2 sm:mb-3 whitespace-nowrap">Transforme cliques em</span>
                  <span className="block mb-2 sm:mb-3 whitespace-nowrap">clientes com um site</span>
                  <span 
                    className="block whitespace-nowrap" 
                    style={{ 
                      color: '#9CD653', 
                      textShadow: '0 2px 8px rgba(156, 214, 83, 0.3)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    que funciona
                  </span>
                </h1>
              </div>
              
              {/* Subtítulo com melhor estrutura e espaçamento */}
              <div className="space-y-2 sm:space-y-3 max-w-2xl">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-gray-800 dark:text-gray-100 font-medium">
                  Seu site profissional por mensalidade.
                </p>
                <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-300 font-normal">
                  Sem taxa de entrada. Sem fidelidade. Cancele quando quiser.
                </p>
              </div>
              
              {/* CTAs com melhor espaçamento e responsividade */}
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center sm:justify-start items-center mt-3 sm:mt-4">
                {/* CTA Principal - Quero ver os planos */}
                <button
                  className="w-full sm:w-auto min-w-[180px] h-12 sm:h-14 text-sm sm:text-base md:text-lg font-bold flex items-center justify-center gap-3 rounded-2xl px-5 sm:px-6 py-3 transition-all duration-300 border-2 border-[#9CD653] bg-[#9CD653] text-white shadow-2xl backdrop-blur-md relative overflow-hidden group focus:ring-4 focus:ring-[#9CD653] focus:ring-offset-2 hover:scale-105 hover:shadow-[0_20px_40px_rgba(156,214,83,0.3)]"
                  style={{letterSpacing:'0.02em'}}
                  onClick={() => {
                    const section = document.querySelector('#planos');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="absolute inset-0 z-0 rounded-2xl pointer-events-none bg-gradient-to-r from-[#9CD653] to-[#84CC15] opacity-90 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center gap-3 text-center leading-tight">
                    <span className="hidden sm:inline">Quero ver os planos</span>
                    <span className="sm:hidden">Ver planos</span>
                    <MoveRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                
                {/* CTA Secundário - Falar com especialista */}
                <a
                  href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o site de vocês e quero falar com um especialista sobre meu projeto. Pode me ajudar?')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-w-[180px] h-12 sm:h-14 text-sm sm:text-base md:text-lg font-bold flex items-center justify-center gap-3 rounded-2xl px-5 sm:px-6 py-3 transition-all duration-300 border-2 border-[#9CD653] bg-white text-[#222] shadow-xl backdrop-blur-md relative overflow-hidden group focus:ring-4 focus:ring-[#9CD653] focus:ring-offset-2 hover:scale-105 hover:shadow-[0_20px_40px_rgba(156,214,83,0.2)]"
                  style={{letterSpacing:'0.02em'}}
                >
                  <span className="absolute inset-0 z-0 rounded-2xl pointer-events-none bg-gradient-to-r from-white to-gray-50 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center gap-3 text-center leading-tight">
                    <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span className="hidden sm:inline">Falar com especialista</span>
                    <span className="sm:hidden">Especialista</span>
                  </span>
                </a>
              </div>
            </div>
            {/* Imagem à direita no desktop */}
            <div className="hidden sm:flex flex-1 justify-center items-center w-full h-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mt-8 lg:mt-0 mb-4 lg:mb-0 order-last">
              <img
                src="/assets/optimized/site-hero-cerna-hero-v2.webp"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[240px] sm:h-[280px] md:h-[320px] lg:h-[400px] xl:h-[480px] max-h-[50vh] sm:max-h-[65vh] object-contain drop-shadow-2xl"
                loading="eager"
                draggable="false"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
        {/* Removido: Botão com ChevronDown para scroll */}
        <LeadFormModal open={modalOpen !== false} onClose={() => setModalOpen(false)} plano={modalOpen === 'orcamento' ? 'orcamento' : undefined} />
      </FullpageSection>
    </div>
  );
}

export { Hero };
