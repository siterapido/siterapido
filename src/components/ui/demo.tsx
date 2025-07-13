import { Hero } from "@/components/ui/animated-hero"
import { TiltedScroll } from "@/components/ui/tilted-scroll"
import { TestimonialCarousel } from "@/components/ui/testimonial"
import { RainbowButton } from "@/components/ui/rainbow-button";
import { FocusCards } from "@/components/ui/focus-cards";

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
      src: "/assets/site - sancao.png",
    },
    {
      title: "Site Hotledas",
      src: "/assets/site - hotledas.png",
    },
    {
      title: "Site Engicore",
      src: "/assets/site - engicore.png",
    },
    {
      title: "Site Alive",
      src: "/assets/site - alive.png",
    },
    {
      title: "Site Francais",
      src: "/assets/site - portifolio - francais.png",
    },
    {
      title: "Site MM",
      src: "/assets/site - portifolio - mm.png",
    },
    {
      title: "Site Conexao",
      src: "/assets/site - portifolio - conexao.png",
    },
    {
      title: "Site Josue",
      src: "/assets/site - portifolio - josue.png",
    },
    {
      title: "Site Poramor",
      src: "/assets/site - portifolio - poramor.png",
    },
  ];

  return <FocusCards cards={cards} />;
} 