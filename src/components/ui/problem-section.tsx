"use client";
import type { FC } from "react";
import { RevealText } from "@/components/ui/reveal-text";

const bullets = [
  "Orçamentos de R$3.000 a R$10.000 só para começar",
  "Promessas de 30 dias que viram 3 meses",
  '"Pacotes básicos" que não incluem nada do que você precisa',
  "Linguagem técnica que mais confunde do que esclarece",
  "Falta de suporte depois que o site fica pronto",
];

export function ProblemSection() {
  return (
    <section className="w-full py-16 md:py-32 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Coluna Esquerda: Título, subtítulo e bullets */}
          <div className="flex flex-col gap-6 md:gap-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-black text-center">
              Cansado de promessas falsas e orçamentos astronômicos?
            </h2>
            <p className="text-lg md:text-2xl font-semibold text-black dark:text-white mt-2 text-left">
              Se você já tentou criar um site, provavelmente já se deparou com isso:
            </p>
            <ul className="mt-4 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              {bullets.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-500 text-xl font-bold">
                    ✖
                  </span>
                  <span className="text-base md:text-xl text-gray-800 dark:text-gray-200 font-medium text-left">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {/* Coluna Direita: Imagem */}
          <div className="flex items-center justify-center">
            <img
              src="/assets/site-problema-cena-problema.png"
              alt="Ilustração problema"
              className="w-full max-w-xl h-auto md:w-[380px] md:max-w-none lg:w-[420px] xl:w-[480px] rounded-none object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProblemSectionInverted() {
  return (
    <section className="w-full py-16 md:py-32 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Coluna Esquerda: Imagem */}
          <div className="flex items-center justify-center">
            <img
              src="/assets/site-problema-cena-problema.png"
              alt="Ilustração problema"
              className="w-full max-w-xl h-auto md:w-[380px] md:max-w-none lg:w-[420px] xl:w-[480px] rounded-none object-contain"
              loading="lazy"
            />
          </div>
          {/* Coluna Direita: Título, subtítulo e bullets */}
          <div className="flex flex-col gap-6 md:gap-10">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-black dark:text-white text-left leading-tight">
              Cansado de promessas falsas e orçamentos astronômicos?
            </h2>
            <p className="text-lg md:text-2xl font-semibold text-black dark:text-white mt-2 text-left">
              Se você já tentou criar um site, provavelmente já se deparou com isso:
            </p>
            <ul className="mt-4 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              {bullets.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-500 text-xl font-bold">
                    ✖
                  </span>
                  <span className="text-base md:text-xl text-gray-800 dark:text-gray-200 font-medium text-left">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
} 