export type PortfolioImage =
  | string
  | {
      mobile: string;
      tablet: string;
      desktop: string;
    };

export type PortfolioItem = {
  id: number;
  title: string;
  name: string;
  challenge: string;
  solution: string;
  result: string;
  alt: string;
  image: PortfolioImage;
  liveUrl?: string;
};

export type FocusCardItem = {
  title: string;
  src: string;
  name: string;
  challenge: string;
  solution: string;
  result: string;
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: "Site Sancao",
    image: {
      mobile: "/assets/responsive/site-sancao-mobile.webp",
      tablet: "/assets/responsive/site-sancao-tablet.webp",
      desktop: "/assets/optimized/site-sancao.webp",
    },
    alt: "Site Sanção",
    name: "Site Institucional - Sanção",
    challenge:
      "Precisavam de uma presença online profissional para atender clientes do setor de segurança.",
    solution: "Site focado em credibilidade e conversão, entregue em 5 dias.",
    result: "Aumento de 60% nos contatos qualificados no primeiro mês.",
    liveUrl: "https://sancao.com.br",
  },
  {
    id: 2,
    title: "Site Hotledas",
    image: {
      mobile: "/assets/responsive/site-hotledas-mobile.webp",
      tablet: "/assets/responsive/site-hotledas-tablet.webp",
      desktop: "/assets/optimized/site-hotledas.webp",
    },
    alt: "Site Hotledas",
    name: "E-commerce - Hotledas",
    challenge:
      "Empresa precisava expandir vendas online e melhorar a experiência do cliente.",
    solution: "Loja virtual completa com sistema de pagamentos, entregue em 8 dias.",
    result: "Vendas online aumentaram 120% no primeiro trimestre.",
    liveUrl: "https://hotledas.com.br",
  },
  {
    id: 3,
    title: "Site Engicore",
    image: {
      mobile: "/assets/responsive/site-engicore-mobile.webp",
      tablet: "/assets/responsive/site-engicore-tablet.webp",
      desktop: "/assets/optimized/site-engicore.webp",
    },
    alt: "Site Engicore",
    name: "Site Corporativo - Engicore",
    challenge:
      "Empresa de engenharia precisava de um site que transmitisse confiança e expertise.",
    solution: "Site institucional com portfólio de projetos, entregue em 6 dias.",
    result: "Novos contratos aumentaram 45% através do site.",
    liveUrl: "https://engicore.com.br",
  },
  {
    id: 4,
    title: "Site Alive",
    image: {
      mobile: "/assets/responsive/site-alive-mobile.webp",
      tablet: "/assets/responsive/site-alive-tablet.webp",
      desktop: "/assets/optimized/site-alive.webp",
    },
    alt: "Site Alive",
    name: "Landing Page - Alive",
    challenge: "Startup precisava de uma landing page para captar leads qualificados.",
    solution: "Página otimizada para conversão com formulário inteligente, entregue em 3 dias.",
    result: "Taxa de conversão de 8.5% - acima da média do setor.",
    liveUrl: "https://alive.com.br",
  },
  {
    id: 5,
    title: "Site Francais",
    image: "/assets/optimized/site-portifolio-francais.webp",
    alt: "Site Francais",
    name: "Site Profissional - Francais",
    challenge: "Profissional liberal precisava de um site para atrair novos clientes.",
    solution: "Site pessoal com blog integrado, entregue em 4 dias.",
    result: "Agendamentos online aumentaram 80% no primeiro mês.",
    liveUrl: "https://francais.com.br",
  },
  {
    id: 6,
    title: "Site MM",
    image: "/assets/optimized/site-portifolio-mm.webp",
    alt: "Site MM",
    name: "Site Institucional - MM",
    challenge: "Empresa familiar precisava modernizar sua presença digital.",
    solution: "Site responsivo com design moderno, entregue em 7 dias.",
    result: "Visibilidade online aumentou 200% em 30 dias.",
    liveUrl: "https://mm.com.br",
  },
  {
    id: 7,
    title: "Site Conexao",
    image: "/assets/optimized/site-portifolio-conexao.webp",
    alt: "Site Conexão",
    name: "Site de Serviços - Conexão",
    challenge:
      "Empresa de telecomunicações precisava de um site que explicasse seus serviços.",
    solution: "Site informativo com comparativo de planos, entregue em 5 dias.",
    result: "Vendas de planos aumentaram 35% através do site.",
    liveUrl: "https://conexao.com.br",
  },
  {
    id: 8,
    title: "Site Josue",
    image: "/assets/optimized/site-portifolio-josue.webp",
    alt: "Site Josué",
    name: "Site Pessoal - Josué",
    challenge: "Profissional precisava de um portfólio online para mostrar seu trabalho.",
    solution: "Portfólio profissional com galeria de projetos, entregue em 4 dias.",
    result: "Novas oportunidades de trabalho aumentaram 150%.",
    liveUrl: "https://josue.com.br",
  },
  {
    id: 9,
    title: "Site Poramor",
    image: "/assets/optimized/site-portifolio-poramor.webp",
    alt: "Site Por Amor",
    name: "Site Institucional - Por Amor",
    challenge: "ONG precisava de um site para aumentar doações e voluntários.",
    solution: "Site emocional com sistema de doações, entregue em 6 dias.",
    result: "Doações online aumentaram 90% no primeiro mês.",
    liveUrl: "https://poramor.org.br",
  },
];

function getDesktopImage(image: PortfolioImage): string {
  return typeof image === "string" ? image : image.desktop;
}

export function toFocusCard(item: PortfolioItem): FocusCardItem {
  return {
    title: item.title,
    src: getDesktopImage(item.image),
    name: item.name,
    challenge: item.challenge,
    solution: item.solution,
    result: item.result,
  };
}

export const focusCards = portfolioItems.map(toFocusCard);
