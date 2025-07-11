import React from "react";
import { Pricing } from "@/components/ui/pricing";

const plans = [
  {
    name: "STARTER",
    price: "0",
    yearlyPrice: "0",
    period: "por mês",
    features: [
      "Link da bio gratuito",
      "Página única personalizada",
      "Adicione seus links principais (WhatsApp, Instagram, etc)",
      "Design responsivo (funciona em celular)",
      "Fácil de compartilhar",
      "Sem anúncios",
      "Ideal para redes sociais",
    ],
    description: "Ideal para quem quer começar sem custo e ter presença digital básica.",
    buttonText: "Comece grátis",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PLANO ESSENCIAL",
    price: "120",
    yearlyPrice: "120",
    period: "por mês",
    features: [
      "Site profissional com até 5 páginas",
      "Design responsivo (funciona em celular)",
      "Hospedagem premium inclusa",
      "Formulário de contato",
      "Integração com WhatsApp",
      "Suporte via WhatsApp",
      "Pequenos ajustes inclusos",
      "SSL (certificado de segurança)",
      "Otimização básica para Google",
    ],
    description: "O melhor custo-benefício para empresas e profissionais.\nSem taxa de entrada | Sem fidelidade | Cancele quando quiser",
    buttonText: "Assinar Essencial",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "PLANO EMPRESARIAL",
    price: "250",
    yearlyPrice: "250",
    period: "por mês",
    features: [
      "Tudo do Essencial",
      "Mais páginas e recursos customizados",
      "Atendimento prioritário",
      "Consultoria personalizada",
      "Integrações avançadas",
      "Domínio .com.br grátis no primeiro ano",
    ],
    description: "Para empresas que precisam de soluções sob medida.",
    buttonText: "Fale com vendas",
    href: "/contact",
    isPopular: false,
    annualFixed: 2000,
  },
];

export function PricingSection() {
  return (
    <section className="w-full bg-white py-20">
      <div className="container mx-auto">
        <Pricing
          plans={plans}
          title="PLANOS/PREÇOS"
          description={"Transparência total: sem letra miúda"}
        />
      </div>
    </section>
  );
} 