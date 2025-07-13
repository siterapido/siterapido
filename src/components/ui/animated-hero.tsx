
import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { MoveRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typewriter } from "@/components/ui/typewriter-text";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useSectionInView } from "@/hooks/useSectionInView";
import { FullpageSection } from "@/components/layout/FullpageSection";
import type { FullpageSectionProps } from "@/components/layout/FullpageSection";

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
          : "repeating-linear-gradient(0deg,rgba(0,0,0,0.07),rgba(0,0,0,0.07) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,rgba(0,0,0,0.07),rgba(0,0,0,0.07) 1px,transparent 1px,transparent 40px)",
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
    "por apenas R$120/mês",
    "feito em até 7 dias",
    "sem fidelidade, sem pegadinhas",
  ];

  // Hook para detectar se a galeria está visível
  const [morphDone, setMorphDone] = useState(false);
  const [morphTriggered, setMorphTriggered] = useState(false); // novo estado

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
    <div ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-[80px] pb-4 sm:pt-16"> {/* pt-16 só no sm+ para compensar header fixo, pt-[80px] no mobile para header fixo, pb-4 para garantir visibilidade do botão */}
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
        <div id="hero" className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-0"> {/* Adicionado pb-8 para mobile */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4"> {/* flex-col no mobile, imagem por último, gap reduzido */}
            {/* Imagem acima do conteúdo no mobile, à direita no desktop */}
            <div className="block sm:hidden w-full flex justify-center items-center pt-[35px]">
              <img
                src="/assets/site - hero - cerna hero.png"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[200px] max-h-[40vh] object-contain drop-shadow-2xl mb-[-8px]"
                loading="eager"
                draggable="false"
              />
            </div>
            {/* Texto à esquerda (desktop) ou abaixo da imagem (mobile) */}
            <div className="flex flex-col items-start text-left max-w-3xl flex-1 w-full sm:mt-0">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-extrabold text-black dark:text-white leading-tight mb-4 break-words w-full">
                <span className="block">Tenha um site profissional</span>
                <span className="block">sem complicação</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-2xl leading-relaxed text-gray-700 dark:text-gray-200 mb-4 max-w-xl">
                Feito para autônomos e pequenos negócios que precisam de presença online rápida, bonita e sem dor de cabeça.
              </p>
              <div className="flex flex-col items-start w-full mb-4">
                <span className="relative flex justify-start items-center h-12 lg:h-14 w-full">
                  <Typewriter
                    text={bullets}
                    speed={60}
                    loop={true}
                    cursor={""}
                    className="font-extrabold text-sm sm:text-lg lg:text-xl px-3 py-2 rounded-full whitespace-nowrap text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </span>
              </div>
              <div className="flex flex-row gap-3 w-full">
                <RainbowButton className="flex-1 min-w-0 px-4 py-2 text-sm sm:text-base">Quero meu site agora 🚀</RainbowButton>
                <Button variant="outline" size="lg" className="flex-1 min-w-0 font-semibold text-sm sm:text-base lg:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border-gray-200 dark:border-white/20">
                  Saber mais <MoveRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
            {/* Imagem à direita no desktop */}
            <div className="hidden sm:flex flex-1 justify-center items-center w-full h-full max-w-xs sm:max-w-xl mt-6 lg:mt-0 mb-4 lg:mb-0 order-last">
              <img
                src="/assets/site - hero - cerna hero.png"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[200px] sm:h-[220px] md:h-[320px] lg:h-[540px] xl:h-[600px] max-h-[40vh] sm:max-h-[60vh] object-contain drop-shadow-2xl"
                loading="eager"
                draggable="false"
              />
            </div>
          </div>
        </div>
        {/* Removido: Botão com ChevronDown para scroll */}
      </FullpageSection>
    </div>
  );
}

export { Hero };
