import { Hero } from "@/components/ui/animated-hero"
import { TiltedScroll } from "@/components/ui/tilted-scroll"
import { TestimonialCarousel } from "@/components/ui/testimonial"
import { RainbowButton } from "@/components/ui/rainbow-button";
import { FocusCards } from "@/components/ui/focus-cards";
import { Pricing } from "@/components/ui/single-pricing-card-1";

function HeroDemo() {
  return (
    <div className="block">
      <Hero />
    </div>
  );
}

export { HeroDemo };

export function TiltedScrollDemo() {
  const customItems = [
    { id: "1", text: "Feature One" },
    { id: "2", text: "Feature Two" },
    { id: "3", text: "Feature Three" },
    { id: "4", text: "Feature Four" },
    { id: "5", text: "Feature Five" },
  ]

  return (
    <div className="space-y-8">
      <TiltedScroll 
        items={customItems}
        className="mt-8"
      />
    </div>
  )
} 

const TESTIMONIAL_DATA = [
  {
    id: 1,
    name: "João Silva",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=256&h=256&facepad=2",
    description: "Experiência incrível! O site ficou pronto muito rápido e superou minhas expectativas."
  },
  {
    id: 2,
    name: "Maria Oliveira",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=256&h=256&facepad=2",
    description: "Recomendo demais! Atendimento excelente e resultado profissional."
  },
  {
    id: 3,
    name: "Carlos Souza",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=256&h=256&facepad=2",
    description: "Qualidade e agilidade. Fiquei muito satisfeito com o serviço."
  }
]

export function TestimonialCarouselDemo() {
  return (
    <TestimonialCarousel 
      testimonials={TESTIMONIAL_DATA}
      className="max-w-2xl mx-auto"
    />
  )
} 

export function RainbowButtonDemo() {
  return <RainbowButton>Get Unlimited Access</RainbowButton>;
} 

export function FocusCardsDemo() {
  const cards = [
    {
      title: "Site Sancao",
      src: "/assets/site-sancao.png",
      name: "Site Institucional - Sanção",
      challenge: "Precisavam de uma presença online profissional para atender clientes do setor de segurança.",
      solution: "Site focado em credibilidade e conversão, entregue em 5 dias.",
      result: "Aumento de 60% nos contatos qualificados no primeiro mês."
    },
    {
      title: "Site Hotledas",
      src: "/assets/site-hotledas.png",
      name: "E-commerce - Hotledas",
      challenge: "Empresa precisava expandir vendas online e melhorar a experiência do cliente.",
      solution: "Loja virtual completa com sistema de pagamentos, entregue em 8 dias.",
      result: "Vendas online aumentaram 120% no primeiro trimestre."
    },
    {
      title: "Site Engicore",
      src: "/assets/site-engicore.png",
      name: "Site Corporativo - Engicore",
      challenge: "Empresa de engenharia precisava de um site que transmitisse confiança e expertise.",
      solution: "Site institucional com portfólio de projetos, entregue em 6 dias.",
      result: "Novos contratos aumentaram 45% através do site."
    },
    {
      title: "Site Alive",
      src: "/assets/site-alive.png",
      name: "Landing Page - Alive",
      challenge: "Startup precisava de uma landing page para captar leads qualificados.",
      solution: "Página otimizada para conversão com formulário inteligente, entregue em 3 dias.",
      result: "Taxa de conversão de 8.5% - acima da média do setor."
    },
    {
      title: "Site Francais",
      src: "/assets/site-portifolio-francais.png",
      name: "Site Profissional - Francais",
      challenge: "Profissional liberal precisava de um site para atrair novos clientes.",
      solution: "Site pessoal com blog integrado, entregue em 4 dias.",
      result: "Agendamentos online aumentaram 80% no primeiro mês."
    },
    {
      title: "Site MM",
      src: "/assets/site-portifolio-mm.png",
      name: "Site Institucional - MM",
      challenge: "Empresa familiar precisava modernizar sua presença digital.",
      solution: "Site responsivo com design moderno, entregue em 7 dias.",
      result: "Visibilidade online aumentou 200% em 30 dias."
    },
    {
      title: "Site Conexao",
      src: "/assets/site-portifolio-conexao.png",
      name: "Site de Serviços - Conexão",
      challenge: "Empresa de telecomunicações precisava de um site que explicasse seus serviços.",
      solution: "Site informativo com comparativo de planos, entregue em 5 dias.",
      result: "Vendas de planos aumentaram 35% através do site."
    },
    {
      title: "Site Josue",
      src: "/assets/site-portifolio-josue.png",
      name: "Site Pessoal - Josué",
      challenge: "Profissional precisava de um portfólio online para mostrar seu trabalho.",
      solution: "Portfólio profissional com galeria de projetos, entregue em 4 dias.",
      result: "Novas oportunidades de trabalho aumentaram 150%."
    },
    {
      title: "Site Poramor",
      src: "/assets/site-portifolio-poramor.png",
      name: "Site Institucional - Por Amor",
      challenge: "ONG precisava de um site para aumentar doações e voluntários.",
      solution: "Site emocional com sistema de doações, entregue em 6 dias.",
      result: "Doações online aumentaram 90% no primeiro mês."
    },
  ];

  return <FocusCards cards={cards} />;
} 

export default function DemoOne() {
  return <Pricing />;
} 