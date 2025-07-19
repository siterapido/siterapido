import { Timeline } from "@/components/ui/timeline";
import { Rocket, Code2, Lightbulb, MoveRight } from "lucide-react";
import CheckIcon from "@/components/ui/check-icon";
import React, { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { gerarLinkWhatsApp } from "@/lib/utils";

export function ComoFuncionaSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const headerOffset = 72; // ajuste conforme a altura real do seu menu/header fixo
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offsets = stepRefs.current.map((ref) => {
        if (!ref) return Infinity;
        const rect = ref.getBoundingClientRect();
        // Ativa quando o topo da etapa cruza o topo visível (abaixo do header)
        return Math.abs(rect.top - headerOffset);
      });
      const min = Math.min(...offsets);
      setActiveIndex(offsets.indexOf(min));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const etapas = [
    { numero: 1, titulo: "Planejamento", icone: Lightbulb, subtitulo: "Análise Personalizada" },
    { numero: 2, titulo: "Desenvolvimento", icone: Code2, subtitulo: "Criação de Excelência" },
    { numero: 3, titulo: "Entrega", icone: Rocket, subtitulo: "Lançamento e Suporte" },
  ];
  const conteudos = [
    [
      "Entendimento dos objetivos e público-alvo",
      "Estratégia de design e conteúdo sob medida",
      "Aprovação do escopo antes de iniciar",
    ],
    [
      "Design moderno e responsivo",
      "Elementos que convertem visitantes",
      "Otimização para carregamento rápido e SEO",
    ],
    [
      "Configuração de domínio e hospedagem",
      "Integração com ferramentas de análise e marketing",
      "Treinamento e suporte contínuo após o lançamento",
    ],
  ];
  const data = etapas.map((etapa, idx) => ({
    numero: etapa.numero,
    ref: (el: HTMLDivElement | null) => { stepRefs.current[idx] = el; },
    title: (
      <>
        <div className="block text-3xl md:text-5xl font-extrabold text-white mb-2 font-[Coolvetica] tracking-wide">{etapa.titulo}</div>
        <div className="flex items-center gap-2 mb-4">
          <etapa.icone size={24} className="text-[#84CC15]" />
          <span className="font-bold text-lg md:text-xl text-[#84CC15]">{etapa.subtitulo}</span>
        </div>
      </>
    ),
    content: (
      <div className="bg-neutral-900 border border-[#84CC15] rounded-xl p-5 md:p-6 mt-0">
        <ul className="pl-0 text-white text-base md:text-lg font-normal space-y-3">
          {conteudos[idx].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckIcon size={20} className="mt-1 text-[#84CC15]" />{item}
            </li>
          ))}
        </ul>
      </div>
    ),
  }));

  return (
    <section id="como-funciona" className="w-full border-b border-neutral-800 py-20 md:py-32" style={{ background: 'radial-gradient(circle at 50% 30%, #181A1B 60%, #050505 100%)' }}>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#84CC15] text-black">Como funciona</Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">
            Como o <span className="text-[#84CC15]">processo</span> funciona
          </h2>
          <p className="text-lg text-neutral-400">
            Desenvolvemos um processo simples em 3 etapas para criar websites que geram resultados para o seu negócio
          </p>
        </div>
        <Timeline data={data} vertical activeIndex={activeIndex} />
        
        {/* Botão de Call-to-Action */}
        <div className="text-center mt-16">
          <a
            href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi como funciona o processo de vocês e quero começar meu projeto. Pode me ajudar?')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-[#84CC15] hover:bg-[#84CC15]/90 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Quero começar meu projeto
            <MoveRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
} 