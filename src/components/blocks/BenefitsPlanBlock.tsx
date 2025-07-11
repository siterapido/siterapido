import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  "New components every weekday",
  "New website templates",
  "New section components",
  "New pages",
];

export function BenefitsPlanBlock() {
  return (
    <section
      className="flex flex-col items-center w-full px-0 py-20 bg-gradient-to-br from-[#E9F7B5] via-[#D3ED35] to-[#A5C91C]"
      style={{ minHeight: "max(700px, 100vh)" }}
    >
      {/* Título e subtítulo principal */}
      <div className="max-w-2xl w-full flex flex-col items-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-4">Resolvemos o que te impede de ter um site profissional</h1>
        <p className="text-lg md:text-xl text-white/80 text-center font-medium">Veja como eliminamos as barreiras para você conquistar sua presença online de forma rápida e sem complicação.</p>
      </div>
      <div
        className={cn(
          "relative max-w-md w-full flex flex-col p-6",
        )}
      >
        {/* Círculo decorativo no topo esquerdo */}
        <div className="absolute left-8 top-8 w-20 h-20 rounded-full bg-white/15 flex items-center justify-center z-0">
          <div className="w-10 h-10 rounded-full bg-white/10" />
        </div>
        <h2 className="relative z-10 text-white text-3xl md:text-4xl font-extrabold mb-3 mt-4">O que resolvemos</h2>
        <p className="relative z-10 text-white/70 text-lg mb-7 leading-snug font-medium">
          Descubra como eliminamos os obstáculos para ter um site profissional no ar rapidamente.
        </p>
        <ul className="relative z-10 flex flex-col gap-5 mt-2">
          {benefits.map((benefit, i) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.15 + i * 0.13,
                duration: 0.5,
                type: "tween",
                ease: "easeOut",
              }}
              className="flex items-center gap-4 text-lg text-white font-medium"
            >
              <CheckCircle2
                size={28}
                strokeWidth={2.2}
                className="text-white/80 bg-white/10 rounded-full shadow-sm"
                style={{ minWidth: 28, minHeight: 28 }}
              />
              <span>{benefit}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
} 