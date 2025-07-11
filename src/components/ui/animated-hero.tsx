import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence, useInView } from "framer-motion";
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

const floatingSites = [
  {
    src: "/assets/site - sancao.png",
    alt: "Site Sancao",
    layoutId: "site-sancao",
    title: "Sancao"
  },
  {
    src: "/assets/site - hotledas.png",
    alt: "Site Hotledas",
    layoutId: "site-hotledas",
    title: "Hotledas"
  },
  {
    src: "/assets/site - engicore.png",
    alt: "Site Engicore",
    layoutId: "site-engicore",
    title: "Engicore"
  },
  {
    src: "/assets/site - alive.png",
    alt: "Site Alive",
    layoutId: "site-alive",
    title: "Alive"
  },
];

// Aceita props de transição do FullpageSection
function Hero(props: FullpageSectionProps) {
  const bullets = [
    "por apenas R$120/mês",
    "feito em até 7 dias",
    "sem fidelidade, sem pegadinhas",
  ];

  // Hook para detectar se a galeria está visível
  const [showcaseRef, showcaseInView] = useSectionInView({ threshold: 0.4 });
  const [morphDone, setMorphDone] = useState(false);
  const [morphTriggered, setMorphTriggered] = useState(false); // novo estado

  // Ref para a Hero Section
  const heroRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, margin: "-20% 0px -20% 0px" });

  // Controla se os sites estão na Hero ou no Grid
  const showInHero = !morphTriggered && !morphDone;
  const showInGrid = morphTriggered;

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
    <div ref={heroRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      <FullpageSection {...props} className="w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatedGridBG />
        <div aria-hidden="true" className="absolute inset-0 z-5 pointer-events-none block dark:hidden bg-[radial-gradient(ellipse_at_center,transparent_40%,white)]" />
        <div aria-hidden="true" className="absolute inset-0 z-5 pointer-events-none hidden dark:block bg-[radial-gradient(ellipse_at_center,transparent_40%,black)]" />

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
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
            {/* Texto à esquerda */}
            <div className="flex flex-col items-start text-left max-w-3xl flex-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-black dark:text-white leading-tight mb-6">
                <span className="block">Tenha um site profissional</span>
                <span className="block">sem complicação</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-gray-700 dark:text-gray-200 mb-8 max-w-2xl">
                Feito para autônomos e pequenos negócios que precisam de presença online rápida, bonita e sem dor de cabeça.
              </p>
              <div className="flex flex-col items-start w-full mb-8">
                <span className="relative flex justify-start items-center h-12 lg:h-14 w-full">
                  <Typewriter
                    text={bullets}
                    speed={60}
                    loop={true}
                    cursor={""}
                    className="font-extrabold text-base sm:text-lg lg:text-xl px-4 py-2 rounded-full whitespace-nowrap text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <RainbowButton>Quero meu site agora 🚀</RainbowButton>
                <Button variant="outline" size="lg" className="font-semibold text-base lg:text-lg px-6 py-3 rounded-2xl border-gray-200 dark:border-white/20">
                  Saber mais <MoveRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
            {/* Imagem à direita */}
            <div className="flex-1 flex justify-center items-center w-full h-full max-w-xl mt-10 lg:mt-0">
              <img
                src="/assets/site - hero - cerna hero.png"
                alt="Ilustração de pessoas conversando sobre site"
                className="w-full h-[220px] sm:h-[260px] md:h-[320px] lg:h-[380px] xl:h-[420px] max-h-[60vh] object-contain drop-shadow-xl"
                loading="eager"
                draggable="false"
              />
            </div>
          </div>
        </div>
        <motion.button
          onClick={scrollToNextSection}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 p-3 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/30 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronDown className="w-6 h-6 text-black dark:text-white" />
        </motion.button>
      </FullpageSection>
    </div>
  );
}

export { Hero };
