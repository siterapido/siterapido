import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { XCircle, Sparkles } from 'lucide-react';

const frustrations = [
  "Orçamentos de R$3.000 a R$10.000 só para começar.",
  "Promessas de 30 dias que viram 3 meses.",
  "'Pacotes básicos' que não incluem nada do que você precisa.",
  "Linguagem técnica que mais confunde do que esclarece.",
  "Falta de suporte depois que o site fica pronto."
];

// Animação para o container da lista, que orquestra a animação dos filhos
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15, // Atraso de 0.15s entre cada item
    },
  },
};

// Animação para cada item da lista
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FrustrationSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
            Cansado de promessas falsas e orçamentos astronômicos?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Se você já tentou criar um site, provavelmente já se deparou com isso:
          </p>
        </div>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          {frustrations.map((text, index) => (
            <motion.li
              key={index}
              variants={itemVariants}
              className="flex items-center gap-4 p-5 sm:p-6 bg-card rounded-2xl border border-border/40 shadow-sm"
            >
              <XCircle className="w-7 h-7 sm:w-8 sm:h-8 text-destructive flex-shrink-0" />
              <span className="text-lg font-medium text-card-foreground">{text}</span>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <div className="relative p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border/30 shadow-2xl overflow-hidden">
            {/* Efeito de brilho pulsante */}
            <div 
              aria-hidden="true" 
              className="absolute inset-0 w-full h-full bg-primary/10 blur-3xl opacity-40 animate-pulse" 
            />
            
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <Sparkles className="w-10 h-10 text-primary" />
              <p className="text-xl md:text-2xl italic font-medium text-foreground">
                "A verdade é simples: você não precisa de um site perfeito. Você precisa de um site que funcione e traga resultados."
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
} 