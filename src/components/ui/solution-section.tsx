import CheckIcon from "./check-icon";

const benefits = [
  "Acompanhe as visitas do seu site",
  "Tudo incluso: hospedagem dedicada",
  "Integração com o whatsapp",
  "Suporte e atualizações",
];

export function SolutionSection() {
  return (
    <section className="w-full py-16 md:py-32 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 z-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex justify-center">
          {/* Conteúdo centralizado */}
          <div className="flex flex-col gap-8 md:gap-12 max-w-4xl">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-black dark:text-white text-left leading-tight">
              Site Rápido: Presença online profissional sem enrolação
            </h2>
            <p className="text-lg md:text-2xl font-semibold text-black dark:text-white mt-2 text-left leading-relaxed">
              Imagine ter um site bonito, funcional e que gera resultados por menos do que você gasta com delivery no mês.<br/>
              Enquanto outras agências complicam, nós simplificamos:
            </p>
            <ul className="mt-6 divide-y border-y *:flex *:items-center *:gap-4 *:py-4">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-start gap-4 py-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 text-xl font-bold mt-0.5">
                    <CheckIcon size={20} color="#22c55e" />
                  </span>
                  <span className="text-base md:text-xl text-gray-800 dark:text-gray-200 font-medium text-left leading-relaxed">
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