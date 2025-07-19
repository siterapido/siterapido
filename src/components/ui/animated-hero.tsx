
import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { MoveRight, ChevronDown, PhoneCall } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button as ShadButton } from "@/components/ui/button";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
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
  const bullets = [
    "Assinatura por R$ 119,90/mês",
  ];

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
        <div id="hero" className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pb-8 sm:pb-0">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-16 xl:gap-24">
            {/* Imagem acima do conteúdo no mobile, à direita no desktop */}
            <div className="block sm:hidden w-full flex justify-center items-center pt-6 pb-2">
              <img
                src="/assets/site-hero-cerna-hero-v2.png"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[180px] max-h-[32vh] object-contain drop-shadow-2xl mb-[-8px]"
                loading="eager"
                draggable="false"
              />
            </div>
            {/* Texto à esquerda (desktop) ou abaixo da imagem (mobile) */}
            <div className="flex flex-col items-center text-center max-w-3xl flex-1 w-full sm:mt-0 mx-auto sm:items-start sm:text-left gap-4">
              {/* Título removido para ser recriado do zero */}
              <h2
                className="font-coolvetica-compressed text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black dark:text-white leading-tight mb-2 break-words w-full"
              >
                <span className="block">Venda mais</span>
                <span className="block">com um site profissional</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-2xl leading-relaxed text-gray-700 dark:text-gray-200 mb-2 max-w-xl mx-auto sm:mx-0">
                Site profissional e rápido para seu negócio!<br />Transforme cliques em clientes
              </p>
              <div className="flex flex-col items-center sm:items-start w-full mb-4">
                <span className="relative flex justify-center sm:justify-start items-center h-12 lg:h-14 w-full">
                  <Typewriter
                    text={bullets}
                    speed={60}
                    loop={true}
                    cursor={""}
                    className="font-extrabold text-sm sm:text-lg lg:text-xl px-3 py-2 rounded-full whitespace-nowrap text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center sm:justify-start items-center mt-2">
                <a
                  href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o site de vocês e quero um orçamento personalizado para meu negócio. Pode me ajudar?')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-full h-16 text-base sm:text-lg md:text-xl font-extrabold flex items-center justify-center gap-3 rounded-full px-6 sm:px-8 py-3 transition-all duration-200 border-2 border-[#84CC15] bg-[#84CC15]/80 text-white shadow-xl backdrop-blur-md relative overflow-hidden group focus:ring-2 focus:ring-[#84CC15] focus:ring-offset-2 whitespace-nowrap"
                  style={{letterSpacing:'0.02em', boxShadow:'0 0 32px 0 #84CC1555, 0 4px 24px 0 #84CC1511'}}>
                  <span className="absolute inset-0 z-0 rounded-full pointer-events-none" style={{boxShadow:'0 0 32px 8px #b6e35a55, 0 0 0 0 #fff0', opacity:0.7, filter:'blur(2px)'}}></span>
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <FaWhatsapp className="w-6 h-6 mr-2 text-white" />
                    Orçamento personalizado
                  </span>
                </a>
                <button
                  className="w-full max-w-xs md:max-w-xs lg:max-w-[180px] xl:max-w-[200px] h-16 text-lg md:text-xl font-extrabold flex items-center justify-center gap-3 rounded-full px-8 md:px-4 py-3 transition-all duration-200 border-2 border-[#84CC15] bg-white text-[#222] shadow-xl backdrop-blur-md relative overflow-hidden group focus:ring-2 focus:ring-[#84CC15] focus:ring-offset-2 whitespace-nowrap"
                  style={{letterSpacing:'0.02em', boxShadow:'0 0 32px 0 #84CC1511, 0 4px 24px 0 #0001'}}
                  onClick={() => {
                    const section = document.querySelector('#planos');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="absolute inset-0 z-0 rounded-full pointer-events-none group-hover:opacity-80" style={{boxShadow:'0 0 24px 4px #84CC1533, 0 0 0 0 #fff0', opacity:0.4, filter:'blur(2px)'}}></span>
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    Ver Planos
                    <MoveRight className="w-5 h-5" />
                  </span>
                </button>
              </div>
            </div>
            {/* Imagem à direita no desktop */}
            <div className="hidden sm:flex flex-1 justify-center items-center w-full h-full max-w-xs sm:max-w-xl mt-6 lg:mt-0 mb-4 lg:mb-0 order-last">
              <img
                src="/assets/site-hero-cerna-hero-v2.png"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[200px] sm:h-[220px] md:h-[320px] lg:h-[440px] xl:h-[520px] max-h-[40vh] sm:max-h-[60vh] object-contain drop-shadow-2xl"
                loading="eager"
                draggable="false"
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
