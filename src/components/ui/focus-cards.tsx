import React, { useState } from "react";
import { cn } from "@/lib/utils";

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
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onClick={onClick}
      className={cn(
        "relative rounded-md bg-gray-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-300 ease-out",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="w-full h-full object-cover rounded-md"
        loading="lazy"
      />
      <div
        className={cn(
          "absolute inset-0 bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300",
          hovered === index ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
          {card.title}
        </div>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type Card = {
  title: string;
  src: string;
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
        Veja alguns exemplos de sites criados para nossos clientes. Design moderno, responsivo e pronto para gerar resultados.
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
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
            >
              <span style={{ fontSize: 24, fontWeight: 'bold', lineHeight: 1 }}>×</span>
            </button>
            <img
              src={selected.src}
              alt={selected.title}
              className="max-w-full max-h-[80vh] object-cover rounded-md mx-auto"
            />
            <div className="text-center text-white text-xl font-bold mt-4 drop-shadow-lg">
              {selected.title}
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 