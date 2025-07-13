import React from "react";
import { useState } from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";

const portfolioItems = [
  { id: 1, image: "/assets/site-sancao.png" },
  { id: 2, image: "/assets/site-hotledas.png" },
  { id: 3, image: "/assets/site-engicore.png" },
  { id: 4, image: "/assets/site-alive.png" },
  { id: 5, image: "/assets/site-portifolio-francais.png" },
  { id: 6, image: "/assets/site-portifolio-mm.png" },
  { id: 7, image: "/assets/site-portifolio-conexao.png" },
  { id: 8, image: "/assets/site-portifolio-josue.png" },
  { id: 9, image: "/assets/site-portifolio-poramor.png" },
];

function getColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => {
    columns[i % cols].push(item);
  });
  // Duplicar os itens de cada coluna para loop visual perfeito
  return columns.map(col => [...col, ...col]);
}

export function PortfolioSection() {
  const [selectedItem, setSelectedItem] = useState<null | { id: number; image: string }>(null);
  // Novo: state para número de colunas
  const [numCols, setNumCols] = useState(3);

  // Atualiza número de colunas conforme o tamanho da tela
  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 640) {
        setNumCols(2);
      } else {
        setNumCols(3);
      }
    }
    handleResize(); // inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = getColumns(portfolioItems, numCols);
  return (
    <section id="portfolio" className={`w-full bg-neutral-950 overflow-hidden relative min-h-[150vw] h-[150vw] sm:min-h-screen sm:h-screen flex items-center justify-center${selectedItem ? ' backdrop-blur-md' : ''}`}>
      {/* Overlay degradê cobrindo toda a sessão para legibilidade */}
      <div className={`${selectedItem ? '' : 'pointer-events-none'} absolute inset-0 z-20`} style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.60) 70%, rgba(0,0,0,0.0) 100%)'}} />
      {/* Imagens de fundo */}
      <div className="w-full h-full absolute inset-0 z-10">
        <div className="relative flex w-full h-full items-stretch gap-x-1 pb-16">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col gap-4 animate-portfolio-slide w-full sm:w-1/2 lg:w-1/3"
              style={{
                width: '100%',
                animationDirection: colIdx % 2 === 1 ? "reverse" : "normal",
                animationDelay: `${colIdx * 2}s`,
                animationDuration: "18s",
              }}
            >
              {col.map((item, i) => (
                <div key={item.id + '-' + i} className="w-full h-[120vw] sm:h-[300px] flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={"Projeto " + item.id}
                    loading="lazy"
                    className="w-full h-full object-contain rounded-lg shadow-xl"
                    style={{ display: "block" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Bloco centralizado no meio da sessão */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full max-w-2xl px-2 py-4 rounded-lg bg-transparent text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Criando sites incríveis para nossos clientes</h2>
        <p className="text-base md:text-xl text-white/90 mb-6 drop-shadow max-w-2xl">Desenvolvemos sites personalizados e modernos que destacam sua marca e geram resultados. Soluções completas de design e desenvolvimento para o seu negócio decolar na internet.</p>
        <RainbowButton className="pointer-events-auto mx-auto" background="white">
          Quero meu site agora 🚀
        </RainbowButton>
      </div>
      {/* Modal de destaque do site */}
      {selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-lg transition-all">
          <div className="relative max-w-3xl w-full mx-4">
            <button onClick={() => setSelectedItem(null)} className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white text-black rounded-full p-2 shadow-lg">
              <span style={{fontSize: 24, fontWeight: 'bold', lineHeight: 1}}>×</span>
            </button>
            <img src={selectedItem.image} alt="Site em destaque" className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border-4 border-white" />
          </div>
        </div>
      )}
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
        @media (max-width: 1023px) {
          .flex-1 { min-width: 50%; }
        }
        @media (max-width: 767px) {
          .flex-1 { min-width: 100%; }
        }
      `}</style>
    </section>
  );
} 