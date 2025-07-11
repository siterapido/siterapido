import React from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";

const portfolioItems = [
  { id: 1, image: "/assets/site - sancao.png" },
  { id: 2, image: "/assets/site - hotledas.png" },
  { id: 3, image: "/assets/site - engicore.png" },
  { id: 4, image: "/assets/site - alive.png" },
  { id: 5, image: "/assets/site - sancao.png" },
  { id: 6, image: "/assets/site - hotledas.png" },
];

function getColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => {
    columns[i % cols].push(item);
  });
  return columns;
}

export function PortfolioSection() {
  const columns = getColumns([...portfolioItems, ...portfolioItems], 3); // duplicado para loop
  return (
    <section className="w-full bg-neutral-950 overflow-hidden relative min-h-[792px] h-[792px] flex items-center justify-center">
      {/* Overlay degradê cobrindo toda a sessão para legibilidade */}
      <div className="pointer-events-none absolute inset-0 z-20" style={{background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.60) 70%, rgba(0,0,0,0.0) 100%)'}} />
      {/* Imagens de fundo */}
      <div className="w-full h-full absolute inset-0 z-10">
        <div className="relative flex w-full h-full items-stretch gap-x-1 pb-16">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className="flex flex-col gap-4 animate-portfolio-slide"
              style={{
                width: '33.3333%',
                animationDirection: colIdx % 2 === 1 ? "reverse" : "normal",
                animationDelay: `${colIdx * 2}s`,
                animationDuration: "18s",
              }}
            >
              {col.map((item, i) => (
                <div key={item.id + '-' + i} className="w-full">
                  <img
                    src={item.image}
                    alt={"Projeto " + item.id}
                    loading="lazy"
                    className="w-full h-[300px] object-contain rounded-3xl shadow-xl"
                    style={{ display: "block" }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Bloco centralizado no meio da sessão */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full max-w-2xl px-2 py-4 rounded-3xl bg-transparent text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">Criando sites incríveis para nossos clientes</h2>
        <p className="text-base md:text-xl text-white/90 mb-6 drop-shadow max-w-2xl">Desenvolvemos sites personalizados e modernos que destacam sua marca e geram resultados. Soluções completas de design e desenvolvimento para o seu negócio decolar na internet.</p>
        <RainbowButton className="pointer-events-auto mx-auto" background="white">
          Quero meu site agora 🚀
        </RainbowButton>
      </div>
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