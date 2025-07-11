import { FeatureSteps } from "@/components/ui/feature-section";

const features = [
  {
    step: 'Passo 1',
    title: 'Você escolhe',
    content: 'Selecione um modelo ou envie suas ideias pelo WhatsApp.',
    image: '/assets/site - como funciona - cena 1.png',
  },
  {
    step: 'Passo 2',
    title: 'Nós criamos',
    content: 'Em até 48 horas, seu site está pronto com sua identidade visual.',
    image: '/assets/site - como funciona - cena 2.png',
  },
  {
    step: 'Passo 3',
    title: 'Você aprova',
    content: 'Fazemos ajustes necessários e colocamos no ar.',
    image: '/assets/site - como funciona - cena 3.png',
  },
  {
    step: 'Passo 4',
    title: 'Você relaxa',
    content: 'Suporte contínuo para tudo que precisar.',
    image: '/assets/site - como funciona - cena 4.png',
  },
];

export function FeatureStepsDemo() {
  return (
    <FeatureSteps
      features={features}
      title="Veja como é fácil ter seu site pronto com a Site Rápido:"
      autoPlayInterval={4000}
      imageHeight="h-[500px] md:h-[600px] lg:h-[700px]"
    />
  );
} 