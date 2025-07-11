import { motion, useInView } from "framer-motion";
import { FullpageSection } from "@/components/layout/FullpageSection";
import type { FullpageSectionProps } from "@/components/layout/FullpageSection";
import { useEffect, useRef } from "react";

const showcaseSites = [
  {
    src: "/assets/site - sancao.png",
    alt: "Site Sancao",
    title: "Sancao"
  },
  {
    src: "/assets/site - hotledas.png",
    alt: "Site Hotledas", 
    title: "Hotledas"
  },
  {
    src: "/assets/site - engicore.png",
    alt: "Site Engicore",
    title: "Engicore"
  },
  {
    src: "/assets/site - alive.png",
    alt: "Site Alive",
    title: "Alive"
  },
];

export interface ShowcaseSectionProps {
  isActive?: boolean;
  isLeaving?: boolean;
  isEntering?: boolean;
  className?: string;
  onEntering?: (isEntering: boolean) => void;
}

export function ShowcaseSection(props: ShowcaseSectionProps) {
  // Remover props de animação
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className={props.className ?? "w-full min-h-screen flex flex-col justify-center items-center bg-neutral-50 dark:bg-neutral-900"}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-4">
            Sites que já entregamos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Veja alguns exemplos de sites criados para nossos clientes
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 min-h-[320px]">
          {showcaseSites.map((site, index) => (
            <motion.div
              key={site.title}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-all duration-300 xl:block hidden"
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.8,
                ease: [0.2, 0.8, 0.2, 1],
                delay: 0.15 * index,
              }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={site.src}
                  alt={site.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  draggable={false}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-black dark:text-white text-center">
                  {site.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 