import { Timeline } from "@/components/ui/timeline";
import { Rocket, Code2, Lightbulb } from "lucide-react";

export function ComoFuncionaSection() {
  const data = [
    {
      title: (
        <>
          <div className="block text-3xl md:text-5xl font-extrabold text-neutral-500 mb-2">Planejamento</div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} className="text-green-600" />
            <span className="text-green-600 font-bold text-lg md:text-xl">Análise Personalizada</span>
          </div>
        </>
      ),
      content: (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-5 md:p-6 mt-0">
          <ul className="list-disc pl-5 text-neutral-800 text-base md:text-lg font-normal space-y-1">
            <li>Entendimento dos objetivos e público-alvo</li>
            <li>Estratégia de design e conteúdo sob medida</li>
            <li>Aprovação do escopo antes de iniciar</li>
          </ul>
        </div>
      ),
    },
    {
      title: (
        <>
          <div className="block text-3xl md:text-5xl font-extrabold text-neutral-500 mb-2">Desenvolvimento</div>
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={24} className="text-green-600" />
            <span className="text-green-600 font-bold text-lg md:text-xl">Criação de Excelência</span>
          </div>
        </>
      ),
      content: (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-5 md:p-6 mt-0">
          <ul className="list-disc pl-5 text-neutral-800 text-base md:text-lg font-normal space-y-1">
            <li>Design moderno e responsivo</li>
            <li>Elementos que convertem visitantes</li>
            <li>Otimização para carregamento rápido e SEO</li>
          </ul>
        </div>
      ),
    },
    {
      title: (
        <>
          <div className="block text-3xl md:text-5xl font-extrabold text-neutral-500 mb-2">Entrega</div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket size={24} className="text-green-600" />
            <span className="text-green-600 font-bold text-lg md:text-xl">Lançamento e Suporte</span>
          </div>
        </>
      ),
      content: (
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-5 md:p-6 mt-0">
          <ul className="list-disc pl-5 text-neutral-800 text-base md:text-lg font-normal space-y-1">
            <li>Configuração de domínio e hospedagem</li>
            <li>Integração com ferramentas de análise e marketing</li>
            <li>Treinamento e suporte contínuo após o lançamento</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <section id="como-funciona" className="w-full bg-white border-b border-neutral-200 py-20 md:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-neutral-900">Como funciona</h2>
          <p className="text-lg text-neutral-600">Veja como é simples ter seu site pronto com a Site Rápido:</p>
        </div>
        <Timeline data={data} />
      </div>
    </section>
  );
} 