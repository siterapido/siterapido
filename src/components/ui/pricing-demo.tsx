import { Pricing } from "./pricing";

const demoPlans = [
  {
    name: "STARTER",
    price: "50",
    yearlyPrice: "40",
    period: "por mês",
    features: [
      "Até 10 projetos",
      "Análises básicas",
      "Suporte em até 48h",
      "Acesso API limitado",
      "Suporte da comunidade",
    ],
    description: "Perfeito para indivíduos e pequenos projetos",
    buttonText: "Comece grátis",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PROFISSIONAL",
    price: "99",
    yearlyPrice: "79",
    period: "por mês",
    features: [
      "Projetos ilimitados",
      "Análises avançadas",
      "Suporte em até 24h",
      "Acesso total à API",
      "Suporte prioritário",
      "Colaboração em equipe",
      "Integrações customizadas",
    ],
    description: "Ideal para equipes e negócios em crescimento",
    buttonText: "Comece agora",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "EMPRESARIAL",
    price: "299",
    yearlyPrice: "239",
    period: "por mês",
    features: [
      "Tudo do Profissional",
      "Soluções customizadas",
      "Gerente de conta dedicado",
      "Suporte em até 1h",
      "Autenticação SSO",
      "Segurança avançada",
      "Contratos customizados",
      "Acordo SLA",
    ],
    description: "Para grandes organizações com necessidades específicas",
    buttonText: "Fale com vendas",
    href: "/contact",
    isPopular: false,
  },
];

function PricingBasic() {
  return (
    <div className="h-[800px] overflow-y-auto rounded-lg">
      <Pricing 
        plans={demoPlans}
        title="Preços simples e transparentes"
        description="Escolha o plano que funciona para você\nTodos os planos incluem acesso à plataforma, ferramentas de geração de leads e suporte dedicado."
      />
    </div>
  );
}

export { PricingBasic }; 