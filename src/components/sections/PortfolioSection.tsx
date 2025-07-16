import React from "react";
import { Badge } from "@/components/ui/badge";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { LeadFormModal } from "@/components/ui/LeadFormModal";

const portfolioItems = [
  { id: 1, image: "/assets/site-sancao.png", alt: "Site Sanção" },
  { id: 2, image: "/assets/site-hotledas.png", alt: "Site Hotledas" },
  { id: 3, image: "/assets/site-engicore.png", alt: "Site Engicore" },
  { id: 4, image: "/assets/site-alive.png", alt: "Site Alive" },
  { id: 5, image: "/assets/site-portifolio-francais.png", alt: "Site Francais" },
  { id: 6, image: "/assets/site-portifolio-mm.png", alt: "Site MM" },
  { id: 7, image: "/assets/site-portifolio-conexao.png", alt: "Site Conexão" },
  { id: 8, image: "/assets/site-portifolio-josue.png", alt: "Site Josué" },
  { id: 9, image: "/assets/site-portifolio-poramor.png", alt: "Site Por Amor" },
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
      <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
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
                  <div key={item.id + '-' + i} className="w-full h-[437px] flex items-center justify-center bg-neutral-900/60 rounded-lg shadow-xl overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.alt}
                      loading="lazy"
                      className="w-full h-full object-cover object-top object-center"
                      style={{ display: "block" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Overlay degradê escuro sutil */}
        <div className="absolute inset-0 z-20 pointer-events-none" style={{background: 'linear-gradient(0deg, rgba(20,20,20,0.96) 0%, rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.60) 70%, rgba(20,20,20,0.0) 100%)'}} />
      </div>
      {/* Conteúdo centralizado acima do background */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full max-w-2xl px-4 py-8 text-center">
        <Badge className="mb-6 bg-[#84CC15] text-black text-base px-5 py-2 shadow-lg mx-auto" style={{fontWeight:700, fontSize:'1rem', letterSpacing:'0.04em', boxShadow:'0 2px 16px 0 #84CC15aa'}}>Portfólio</Badge>
        <div className="relative w-full flex justify-center overflow-visible">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white text-center px-6 py-3 rounded-2xl overflow-visible drop-shadow-lg" style={{overflow: 'visible', position: 'relative', zIndex: 1}}>
            Criando sites <span className="glow-text text-[#84CC15] relative">incríveis</span> para nossos clientes
          </h2>
        </div>
        <p className="text-base md:text-xl text-white/90 mb-8 drop-shadow max-w-2xl mx-auto text-center">
          Desenvolvemos sites personalizados e modernos que destacam sua marca e geram resultados. Soluções completas de design e desenvolvimento para o seu negócio decolar na internet.
        </p>
        <RainbowButton
          background="white"
          className="w-full max-w-xs md:max-w-sm h-14 text-lg md:text-xl font-extrabold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 border-2 border-[#84CC15] hover:bg-[#84CC15] hover:text-black focus:ring-2 focus:ring-[#84CC15] focus:ring-offset-2"
          style={{letterSpacing:'0.02em'}}
          onClick={() => setModalOpen(true)}
        >
          Quero meu site agora 🚀
        </RainbowButton>
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
          background: radial-gradient(ellipse at center, rgba(132,204,21,0.35) 0%, rgba(132,204,21,0.10) 60%, transparent 100%);
          filter: blur(22px);
          z-index: 0;
          pointer-events: none;
        }
      `}</style>
    </section>
  );
} 