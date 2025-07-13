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
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Coluna Esquerda: Espaço para ilustração */}
          <div className="flex items-center justify-center order-1 md:order-none">
            <img
              src="/assets/site-solucao.png"
              alt="Ilustração solução Site Rápido"
              className="w-full max-w-xl h-auto md:w-[380px] md:max-w-none lg:w-[420px] xl:w-[480px] rounded-none object-contain"
              loading="lazy"
            />
          </div>
          {/* Coluna Direita: Título, copy e benefícios */}
          <div className="flex flex-col gap-6 md:gap-10 order-2 md:order-none">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-black dark:text-white text-left leading-tight">
              Site Rápido: Presença online profissional sem enrolação
            </h2>
            <p className="text-lg md:text-2xl font-semibold text-black dark:text-white mt-2 text-left">
              Imagine ter um site bonito, funcional e que gera resultados por menos do que você gasta com delivery no mês.<br/>
              Enquanto outras agências complicam, nós simplificamos:
            </p>
            <ul className="mt-4 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              {benefits.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600 text-xl font-bold">
                    <CheckIcon size={20} color="#22c55e" />
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