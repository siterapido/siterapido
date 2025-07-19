import React from "react";
import { Badge } from "@/components/ui/badge";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { LeadFormModal } from "@/components/ui/LeadFormModal";
import { gerarLinkWhatsApp } from "@/lib/utils";

const portfolioItems = [
  {
    id: 1,
    image: "/assets/site-sancao.png",
    alt: "Site Sanção",
    name: "Site Institucional - Sanção",
    challenge: "Precisavam de uma presença online profissional para atender clientes do setor de segurança.",
    solution: "Site focado em credibilidade e conversão, entregue em 5 dias.",
    result: "Aumento de 60% nos contatos qualificados no primeiro mês.",
    client: "João Silva, proprietário",
    liveUrl: "https://sancao.com.br"
  },
  {
    id: 2,
    image: "/assets/site-hotledas.png",
    alt: "Site Hotledas",
    name: "E-commerce - Hotledas",
    challenge: "Empresa precisava expandir vendas online e melhorar a experiência do cliente.",
    solution: "Loja virtual completa com sistema de pagamentos, entregue em 8 dias.",
    result: "Vendas online aumentaram 120% no primeiro trimestre.",
    client: "Maria Santos, diretora comercial",
    liveUrl: "https://hotledas.com.br"
  },
  {
    id: 3,
    image: "/assets/site-engicore.png",
    alt: "Site Engicore",
    name: "Site Corporativo - Engicore",
    challenge: "Empresa de engenharia precisava de um site que transmitisse confiança e expertise.",
    solution: "Site institucional com portfólio de projetos, entregue em 6 dias.",
    result: "Novos contratos aumentaram 45% através do site.",
    client: "Carlos Oliveira, CEO",
    liveUrl: "https://engicore.com.br"
  },
  {
    id: 4,
    image: "/assets/site-alive.png",
    alt: "Site Alive",
    name: "Landing Page - Alive",
    challenge: "Startup precisava de uma landing page para captar leads qualificados.",
    solution: "Página otimizada para conversão com formulário inteligente, entregue em 3 dias.",
    result: "Taxa de conversão de 8.5% - acima da média do setor.",
    client: "Ana Costa, fundadora",
    liveUrl: "https://alive.com.br"
  },
  {
    id: 5,
    image: "/assets/site-portifolio-francais.png",
    alt: "Site Francais",
    name: "Site Profissional - Francais",
    challenge: "Profissional liberal precisava de um site para atrair novos clientes.",
    solution: "Site pessoal com blog integrado, entregue em 4 dias.",
    result: "Agendamentos online aumentaram 80% no primeiro mês.",
    client: "Francais Silva, consultor",
    liveUrl: "https://francais.com.br"
  },
  {
    id: 6,
    image: "/assets/site-portifolio-mm.png",
    alt: "Site MM",
    name: "Site Institucional - MM",
    challenge: "Empresa familiar precisava modernizar sua presença digital.",
    solution: "Site responsivo com design moderno, entregue em 7 dias.",
    result: "Visibilidade online aumentou 200% em 30 dias.",
    client: "Marcos Mendes, proprietário",
    liveUrl: "https://mm.com.br"
  },
  {
    id: 7,
    image: "/assets/site-portifolio-conexao.png",
    alt: "Site Conexão",
    name: "Site de Serviços - Conexão",
    challenge: "Empresa de telecomunicações precisava de um site que explicasse seus serviços.",
    solution: "Site informativo com comparativo de planos, entregue em 5 dias.",
    result: "Vendas de planos aumentaram 35% através do site.",
    client: "Pedro Lima, gerente comercial",
    liveUrl: "https://conexao.com.br"
  },
  {
    id: 8,
    image: "/assets/site-portifolio-josue.png",
    alt: "Site Josué",
    name: "Site Pessoal - Josué",
    challenge: "Profissional precisava de um portfólio online para mostrar seu trabalho.",
    solution: "Portfólio profissional com galeria de projetos, entregue em 4 dias.",
    result: "Novas oportunidades de trabalho aumentaram 150%.",
    client: "Josué Almeida, designer",
    liveUrl: "https://josue.com.br"
  },
  {
    id: 9,
    image: "/assets/site-portifolio-poramor.png",
    alt: "Site Por Amor",
    name: "Site Institucional - Por Amor",
    challenge: "ONG precisava de um site para aumentar doações e voluntários.",
    solution: "Site emocional com sistema de doações, entregue em 6 dias.",
    result: "Doações online aumentaram 90% no primeiro mês.",
    client: "Lucia Ferreira, diretora",
    liveUrl: "https://poramor.org.br"
  },
];

function splitInColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => {
    columns[i % cols].push(item);
  });
  return columns;
}

export function PortfolioSection() {
  // Detecta se está em mobile (largura <= 640px)
  const [isMobile, setIsMobile] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const numCols = isMobile ? 2 : 3;
  const columns = splitInColumns(portfolioItems, numCols).map(col => [...col, ...col]);
  
  return (
    <section id="portfolio" className="w-full relative min-h-[600px] md:min-h-[80vh] flex items-center justify-center overflow-hidden bg-neutral-950">
      {/* Slides verticais como background absoluto */}
      <div className="absolute inset-0 w-full h-full z-10 pointer-events-auto">
        <div className={`relative w-full h-full flex items-stretch ${numCols === 2 ? 'gap-x-2' : 'gap-x-1'}`}> 
          {columns.map((col, colIdx) => (
            <div
              key={"col-" + colIdx}
              className="overflow-hidden h-full flex flex-col gap-4"
              style={{ minWidth: 0, width: `${100 / numCols}%` }}
            >
              <div
                className="flex flex-col gap-4 animate-portfolio-slide"
                style={{
                  animationDirection: colIdx % 2 === 1 ? "reverse" : "normal",
                  animationDelay: `${colIdx * 2}s`,
                  animationDuration: "18s",
                  height: "200%",
                }}
              >
                {col.map((item, i) => (
                  <div 
                    key={item.id + '-' + i} 
                    className="w-full h-[437px] flex items-center justify-center bg-neutral-900/60 rounded-lg shadow-xl overflow-hidden group relative"
                  >
                    <img
                      src={item.image}
                      alt={item.alt}
                      loading={i < 6 ? "lazy" : "lazy"}
                      fetchPriority={i < 3 ? "high" : "auto"}
                      className="w-full h-full object-cover object-top object-center transition-transform duration-300 group-hover:scale-105"
                      style={{ display: "block" }}
                    />

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Overlay degradê escuro sutil */}
        <div className="absolute inset-0 z-5 pointer-events-none" style={{background: 'linear-gradient(0deg, rgba(20,20,20,0.96) 0%, rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.60) 70%, rgba(20,20,20,0.0) 100%)'}} />
      </div>
      
      {/* Conteúdo centralizado acima do background */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full max-w-2xl px-4 py-8 text-center">
        <Badge className="mb-8 bg-[#9CD653] text-black text-base px-5 py-2 shadow-lg mx-auto" style={{fontWeight:700, fontSize:'1rem', letterSpacing:'0.04em', boxShadow:'0 2px 16px 0 #9CD653aa'}}>Portfólio</Badge>
        <div className="relative w-full flex justify-center overflow-visible">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white text-center px-6 py-3 rounded-2xl overflow-visible drop-shadow-lg" style={{overflow: 'visible', position: 'relative', zIndex: 1}}>
            Criando sites <span className="glow-text text-[#9CD653] relative">incríveis</span> para nossos clientes
          </h2>
        </div>
        <p className="text-base md:text-xl text-white/90 mb-10 drop-shadow max-w-2xl mx-auto text-center leading-relaxed">
          Desenvolvemos sites personalizados e modernos que destacam sua marca e geram resultados. Cada projeto é um case de sucesso com métricas reais de crescimento.
        </p>
        <a
          href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o portfólio de vocês e quero saber mais sobre como criar meu site profissional.')}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', width: '100%' }}
        >
          <RainbowButton
            background="white"
            className="w-full max-w-xs md:max-w-sm h-14 text-base sm:text-lg md:text-xl font-extrabold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 border-2 border-[#9CD653] hover:bg-[#9CD653] hover:text-black focus:ring-2 focus:ring-[#9CD653] focus:ring-offset-2"
            style={{letterSpacing:'0.02em'}}
          >
            <span className="hidden sm:inline">Quero meu site agora 🚀</span>
            <span className="sm:hidden">Meu site agora 🚀</span>
          </RainbowButton>
        </a>
      </div>



      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} plano="orcamento" />
      <style>{`
        @keyframes portfolio-slide {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-portfolio-slide {
          animation-name: portfolio-slide;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .glow-text {
          position: relative;
          z-index: 1;
          display: inline-block;
        }
        .glow-text::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 180%;
          height: 120%;
          border-radius: 2rem;
          background: radial-gradient(ellipse at center, rgba(156,214,83,0.35) 0%, rgba(156,214,83,0.10) 60%, transparent 100%);
          filter: blur(22px);
          z-index: 0;
          pointer-events: none;
        }
        

      `}</style>
    </section>
  );
} 