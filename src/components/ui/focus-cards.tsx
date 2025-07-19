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
    // Detecta se está em mobile
    const [isMobile, setIsMobile] = React.useState(false);
    
    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
      <div
        onMouseEnter={() => setHovered(index)}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
        className={cn(
          "relative rounded-md bg-gray-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 ease-out group",
          hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
        )}
      >
        <img
          src={card.src}
          alt={card.title}
          className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay apenas em mobile */}
        {isMobile && (
          <div
            className={cn(
              "absolute inset-0 bg-black/80 flex flex-col justify-center p-6 transition-opacity duration-300",
              hovered === index ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="text-white space-y-3">
              <h3 className="text-xl font-bold text-[#84CC15]">{card.name}</h3>
              <p className="text-sm text-white/80 line-clamp-2">{card.challenge}</p>
              <p className="text-sm font-semibold text-[#84CC15]">{card.solution}</p>
              <p className="text-sm italic text-white/90">"{card.result}"</p>
            </div>
          </div>
        )}
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
          className="inline-flex items-center justify-center gap-3 bg-[#84CC15] hover:bg-[#84CC15]/90 text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
        >
          Quero um site igual
          <MoveRight className="w-5 h-5" />
        </a>
      </div>
      
      {/* Modal de detalhes do projeto */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative max-w-5xl w-full bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">{selected.name}</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <span style={{ fontSize: 18, fontWeight: 'bold', lineHeight: 1 }}>×</span>
                </button>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Imagem do site */}
                <div className="flex justify-center">
                  <img
                    src={selected.src}
                    alt={selected.title}
                    className="w-full max-w-md h-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
                
                {/* Informações do case */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[#84CC15] font-semibold mb-2">O Desafio</h4>
                    <p className="text-neutral-700 dark:text-neutral-300">{selected.challenge}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-[#84CC15] font-semibold mb-2">A Solução Rápida</h4>
                    <p className="text-neutral-700 dark:text-neutral-300">{selected.solution}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-[#84CC15] font-semibold mb-2">O Resultado</h4>
                    <p className="text-neutral-900 dark:text-white italic text-lg">"{selected.result}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 