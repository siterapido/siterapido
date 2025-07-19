import { FocusCards } from "@/components/ui/focus-cards";

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