import { Timeline } from "@/components/ui/timeline";
import { Rocket, Code2, Lightbulb, MoveRight, CheckCircle } from "lucide-react";
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
    { numero: 1, titulo: "Briefing Ágil", icone: Lightbulb, subtitulo: "Análise Personalizada" },
    { numero: 2, titulo: "Construção e Otimização", icone: Code2, subtitulo: "Criação de Excelência" },
    { numero: 3, titulo: "Lançamento e Suporte Contínuo", icone: Rocket, subtitulo: "Lançamento e Suporte" },
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
        <div className="block text-3xl md:text-5xl font-extrabold text-white mb-4 font-[Coolvetica] tracking-wide">{etapa.titulo}</div>
        <div className="flex items-center gap-3 mb-6">
          <etapa.icone size={24} className="text-[#9CD653]" />
          <span className="font-bold text-lg md:text-xl text-[#9CD653]">{etapa.subtitulo}</span>
        </div>
      </>
    ),
    content: (
              <div className="bg-neutral-900 border border-[#9CD653] rounded-xl p-6 md:p-8 mt-0">
        <ul className="pl-0 text-white text-base md:text-lg font-normal space-y-4">
          {conteudos[idx].map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#9CD653]/20 shadow-sm mt-0.5">
                <CheckCircle className="w-5 h-5" style={{ color: '#9CD653', filter: 'drop-shadow(0 1px 2px #9CD65355)' }} />
              </span>
              <span className="text-white leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  }));

  return (
    <section id="como-funciona" className="w-full border-b border-neutral-800 py-20 md:py-32" style={{ background: 'radial-gradient(circle at 50% 30%, #181A1B 60%, #050505 100%)' }}>
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-[#9CD653] text-black">Como funciona</Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white">
            Como o <span className="text-[#9CD653]">processo</span> funciona
          </h2>
          <p className="text-lg text-neutral-400 leading-relaxed">
            Desenvolvemos um processo simples em 3 etapas para criar websites que geram resultados para o seu negócio
          </p>
        </div>
        <Timeline data={data} vertical activeIndex={activeIndex} />
        
        {/* Botão de Call-to-Action */}
        <div className="text-center mt-20">
          <a
            href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi como funciona o processo de vocês e quero começar meu projeto. Pode me ajudar?')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-[#9CD653] hover:bg-[#9CD653]/90 text-black font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Quero começar meu projeto
            <MoveRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
} 