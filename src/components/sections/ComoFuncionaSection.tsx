import React, { useRef, useEffect, useState } from "react";
import { Smartphone, Paintbrush, CheckCircle2, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevealText } from "@/components/ui/reveal-text";

const steps = [
  {
    icon: <Smartphone size={36} className="text-blue-500" />,
    title: "Você escolhe",
    desc: "Seleciona um modelo ou nos envia suas ideias pelo WhatsApp.",
    image: "/assets/site - como funciona - cena 1.png"
  },
  {
    icon: <Paintbrush size={36} className="text-green-500" />,
    title: "Nós criamos",
    desc: "Em até 48 horas, seu site está pronto com sua identidade visual.",
    image: "/assets/site - como funciona - cena 2.png"
  },
  {
    icon: <CheckCircle2 size={36} className="text-emerald-500" />,
    title: "Você aprova",
    desc: "Fazemos ajustes necessários e colocamos no ar.",
    image: "/assets/site - como funciona - cena 3.png"
  },
  {
    icon: <Coffee size={36} className="text-yellow-500" />,
    title: "Você relaxa",
    desc: "Suporte contínuo para tudo que precisar.",
    image: "/assets/site - como funciona - cena 4.png"
  },
];

export function ComoFuncionaSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionRect = sectionRef.current.getBoundingClientRect();
      const sectionTop = sectionRect.top;
      const sectionHeight = sectionRect.height;
      const windowHeight = window.innerHeight;

      // Se a seção não está visível, não fazer nada
      if (sectionTop > windowHeight || sectionTop + sectionHeight < 0) {
        return;
      }

      // Calcular progresso da seção (0 a 1)
      const progress = Math.max(0, Math.min(1, 
        (windowHeight - sectionTop) / (sectionHeight + windowHeight)
      ));

      // Determinar qual step deve estar ativo
      const newActiveStep = Math.floor(progress * steps.length);
      const clampedStep = Math.max(0, Math.min(steps.length - 1, newActiveStep));

      // Debug - remover depois
      console.log('Scroll Debug:', {
        progress: progress.toFixed(2),
        newActiveStep,
        clampedStep,
        sectionTop,
        sectionHeight,
        windowHeight
      });

      setActiveStep(clampedStep);
    };

    // Adicionar evento de scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Executar uma vez no mount
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Função para testar manualmente os steps
  const testStep = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

  return (
    <section 
      id="como-funciona" 
      ref={sectionRef}
      className="w-full bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 relative py-16 md:py-32"
      style={{ minHeight: "150vh" }} // Altura maior para testar scroll
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header da seção */}
        <div className="text-center mb-20">
          <RevealText 
            text="Simples como 1, 2, 3" 
            as="h2" 
            className="text-3xl md:text-5xl font-extrabold mb-6 text-neutral-900 dark:text-white" 
          />
          <p className="text-lg md:text-2xl text-neutral-700 dark:text-neutral-200 max-w-2xl mx-auto font-medium">
            Veja como é fácil ter seu site pronto com a Site Rápido:
          </p>
          
          {/* Botões de debug - remover depois */}
          <div className="mt-8 flex gap-2 justify-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => testStep(i)}
                className={`px-4 py-2 rounded-lg ${
                  activeStep === i 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Step {i + 1}
              </button>
            ))}
          </div>
          
          {/* Debug info */}
          <div className="mt-4 text-sm text-gray-600">
            Active Step: {activeStep + 1}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Coluna dos Steps */}
          <div className="flex-1 space-y-12">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-start gap-6 p-8 rounded-2xl transition-all duration-500 ease-out ${
                  activeStep === i
                    ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 scale-[1.02] shadow-xl border-2 border-yellow-300/50"
                    : "bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-transparent"
                }`}
                style={{ minHeight: "150px" }}
              >
                {/* Círculo com número/checkmark */}
                <div className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-500 ease-out ${
                  activeStep === i
                    ? "bg-yellow-400 text-neutral-900 scale-110 shadow-lg"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}>
                  {activeStep === i ? (
                    <CheckCircle2 size={36} className="text-neutral-900" />
                  ) : (
                    <span className="text-3xl font-bold">{i + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`transition-all duration-500 ease-out mb-3 ${
                    activeStep === i
                      ? "font-extrabold text-neutral-900 dark:text-white text-2xl md:text-3xl"
                      : "font-bold text-neutral-800 dark:text-neutral-200 text-xl md:text-2xl"
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`transition-all duration-500 ease-out ${
                    activeStep === i
                      ? "text-neutral-700 dark:text-neutral-300 text-lg md:text-xl"
                      : "text-neutral-600 dark:text-neutral-400 text-base md:text-lg"
                  }`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Coluna da Imagem - Desktop */}
          <div className="hidden lg:block flex-1">
            <div 
              className="sticky w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl"
              style={{ top: "5vh" }}
            >
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    activeStep === i 
                      ? "opacity-100 scale-100" 
                      : "opacity-0 scale-105"
                  }`}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay com título */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
                    <div className="p-8 text-white">
                      <h4 className="text-3xl font-bold mb-3">{step.title}</h4>
                      <p className="text-xl opacity-90">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Indicadores de progresso */}
              <div className="absolute top-8 right-8 flex flex-col gap-3">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-12 rounded-full transition-all duration-300 ${
                      activeStep === i 
                        ? "bg-yellow-400 scale-125" 
                        : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile: Carrossel de imagens */}
        <div className="block lg:hidden mt-16">
          <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  activeStep === i ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h4 className="text-2xl font-bold mb-2">{step.title}</h4>
                    <p className="text-lg opacity-90">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicadores mobile */}
            <div className="absolute top-6 right-6 flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeStep === i 
                      ? "bg-yellow-400 scale-125" 
                      : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA Final */}
        <div className="mt-20 text-center">
          <Button 
            size="lg" 
            className="px-12 py-4 text-lg font-bold rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105"
          >
            Começar Agora
          </Button>
        </div>
      </div>
    </section>
  );
} 