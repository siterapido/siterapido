"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string | React.ReactNode;
  content: React.ReactNode;
  numero?: number;
  ref?: any; // aceitar função ou objeto
}

interface TimelineProps {
  data: TimelineEntry[];
  vertical?: boolean;
  activeIndex?: number;
}

export const Timeline = ({ data, vertical = false, activeIndex }: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-transparent font-sans md:px-10"
      ref={containerRef}
    >
      {/* Título e descrição removidos para controle externo */}
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          vertical ? (
            <div key={index} className="pt-10 md:pt-40" ref={item.ref}>
              {/* Desktop: card embaixo do título */}
              <div className="hidden md:flex flex-row items-start gap-8">
                {/* Bola numerada centralizada */}
                <div className="relative flex flex-col items-center min-w-[32px] w-[32px]">
                  {item.numero && (
                    <div className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full font-bold text-base shadow-sm mb-0 border border-gray-200 ${activeIndex === index ? 'bg-[#9CD653] text-black dark:text-white sticky top-8' : 'bg-gray-100 text-neutral-500'} ${activeIndex === index ? '' : 'mb-2'}`} style={{marginTop: '-6px'}}>
                      {item.numero}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  {item.title}
                  {item.content}
                </div>
              </div>
              {/* Mobile: layout padrão (linha e bola menores) */}
              <div className="flex md:hidden justify-start gap-6">
                <div className="relative flex flex-col items-center min-w-[28px] w-[28px]">
                  {item.numero && (
                    <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full font-bold text-sm shadow-sm mb-0 border border-gray-200 ${activeIndex === index ? 'bg-[#9CD653] text-black dark:text-white sticky top-4' : 'bg-gray-100 text-neutral-500'} ${activeIndex === index ? '' : 'mb-2'}`} style={{marginTop: '-4px'}}>
                      {item.numero}
                    </div>
                  )}
                </div>
                <div className="w-full space-y-4">
                  {item.title}
                  {item.content}
                </div>
              </div>
            </div>
          ) : (
            <div
              key={index}
              className="flex justify-start pt-10 md:pt-40 md:gap-12"
            >
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center z-[999]">
                  <div className="h-6 w-6 rounded-full bg-[#E3F584] border-4 border-[#E3F584] z-[999]" />
                </div>
                <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 dark:text-neutral-500 ">
                  {item.title}
                </h3>
              </div>
              <div className="relative pl-20 pr-4 md:pl-4 w-full space-y-4">
                <h3 className="md:hidden block text-2xl mb-6 text-left font-bold text-neutral-500 dark:text-neutral-500">
                  {item.title}
                </h3>
                {item.content} {" "}
              </div>
            </div>
          )
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%]  [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0  w-[2px] bg-gradient-to-t from-[#E3F584] via-[#E3F584] to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}; 