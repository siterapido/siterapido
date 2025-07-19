import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import { gerarLinkWhatsApp } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onClick,
  }: {
    card: Card;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onClick: () => void;
  }) => {

    return (
      <div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
        className={cn(
          "relative rounded-md bg-gray-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 ease-out group hover:shadow-2xl",
          hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
        )}
      >
        <img
          src={card.src}
          alt={card.title}
          className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
          loading={index < 3 ? "eager" : "lazy"}
          fetchPriority={index < 3 ? "high" : "auto"}
        />
        {/* Overlay com informações do projeto - funciona em desktop e mobile */}
        <div
          className={cn(
            "absolute inset-0 bg-black/80 flex flex-col justify-center p-4 md:p-6 transition-all duration-300 ease-in-out",
            hovered === index ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="text-white text-center space-y-4 md:space-y-5">
            <h3 className="text-lg md:text-xl font-bold text-[#9CD653] leading-tight">{card.name}</h3>
            <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
              <p className="text-white/90 leading-relaxed line-clamp-2">{card.challenge}</p>
              <p className="text-[#9CD653] font-semibold leading-relaxed">{card.solution}</p>
              <p className="text-white/95 italic font-medium leading-relaxed">"{card.result}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
  name: string;
  challenge: string;
  solution: string;
  result: string;
};

export function FocusCards({ cards }: { cards: Card[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  // Estado para controlar expansão no mobile
  const [expanded, setExpanded] = useState(false);

  // Lógica para mobile: mostra 3 ou todos
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  let visibleCards = cards.slice(0, 9);
  if (isMobile && !expanded) {
    visibleCards = cards.slice(0, 3);
  }

  return (
    <section className="w-full py-8 px-4 md:px-0 flex flex-col items-center">
      <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4 text-neutral-900 dark:text-neutral-100">Sites em Destaque</h2>
      <p className="text-lg md:text-2xl text-center text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl">
        Veja alguns exemplos de sites criados para nossos clientes. Cada projeto é um case de sucesso com métricas reais de crescimento.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 max-w-7xl mx-auto w-full">
        {visibleCards.map((card, index) => (
          <Card
            key={card.title}
            card={card}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
            onClick={() => setSelected(card)}
          />
        ))}
      </div>
      {/* Botão ver mais/ver menos apenas no mobile, se houver mais de 3 cards */}
      <div className="block md:hidden mt-6 w-full flex justify-center">
        {cards.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold shadow hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
            <span className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}>
              ▼
            </span>
          </button>
        )}
      </div>
      
      {/* Botão de Call-to-Action */}
      <div className="text-center mt-12">
        <a
          href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi os sites em destaque de vocês e quero um site igual para meu negócio. Pode me ajudar?')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-[#9CD653] hover:bg-[#9CD653]/90 text-black font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
        >
          Quero um site igual
          <MoveRight className="w-5 h-5" />
        </a>
      </div>
      
      {/* Modal de detalhes do projeto */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-4xl w-full bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
            {/* Container com scroll customizado */}
            <div className="flex flex-col h-full">
              {/* Header com imagem */}
              <div className="relative flex-shrink-0">
                <img
                  src={selected.src}
                  alt={selected.title}
                  className="w-full h-48 md:h-64 object-cover"
                />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <span style={{ fontSize: 18, fontWeight: 'bold', lineHeight: 1 }}>×</span>
                </button>
              </div>
              
              {/* Conteúdo com scroll */}
              <div className="flex-1 overflow-y-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#9CD653 #f1f1f1'
              }}>
                <div className="p-6 space-y-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">{selected.name}</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[#9CD653] font-semibold text-lg mb-3">O Desafio</h4>
                      <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">{selected.challenge}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-[#84CC15] font-semibold text-lg mb-3">A Solução Rápida</h4>
                      <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">{selected.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-[#84CC15] font-semibold text-lg mb-3">O Resultado</h4>
                      <p className="text-neutral-900 dark:text-white italic text-lg leading-relaxed">"{selected.result}"</p>
                    </div>
                    
                    <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
                      <a
                        href={gerarLinkWhatsApp('5584999810711', `Olá! Vi o projeto ${selected.name} e quero um site igual para meu negócio. Pode me ajudar?`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#9CD653] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#9CD653]/90 transition-colors"
                      >
                        Quero um site igual →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        /* Garantir que o hover funcione corretamente */
        .group:hover .absolute.inset-0 {
          opacity: 1 !important;
        }
        
        /* Melhorar a transição do overlay */
        .group .absolute.inset-0 {
          transition: opacity 0.3s ease-in-out, background-color 0.3s ease-in-out;
        }
        
        /* Garantir que o texto seja legível */
        .group:hover .absolute.inset-0 {
          background-color: rgba(0, 0, 0, 0.85) !important;
        }
        
        /* Melhorar a legibilidade do texto */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Scroll customizado para o modal */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #9CD653;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #84CC15;
        }
        
        /* Dark mode para o scroll */
        .dark .overflow-y-auto::-webkit-scrollbar-track {
          background: #374151;
        }
        
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #9CD653;
        }
        
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #84CC15;
        }
      `}</style>
    </section>
  );
} 