import { useState } from 'react';
import { Badge } from "./badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "./button";
import { CheckCircle, Star, CreditCard, ShieldCheck, Barcode, DollarSign, PhoneCall, MoveRight } from "lucide-react";
import { LeadFormModal } from './LeadFormModal';

type PlanoType = 'mensal' | 'anual';

interface Plan {
  name: string;
  price: string;
  description: string;
  benefits: string[];
  cta: string;
  featured: boolean;
  suffix: string;
  plano: PlanoType;
}

const plans: Plan[] = [
  {
    name: "Mensal",
    price: "R$ 120,00",
    description: "Tenha seu site profissional no ar em até 7 dias, com suporte completo e atualizações inclusas.",
    benefits: [
      "Site profissional pronto em até 7 dias",
      "Hospedagem inclusa",
      "Suporte técnico ilimitado",
      "Atualizações e melhorias contínuas",
      "Painel para editar textos, imagens e portfólio",
      "Integração com WhatsApp e redes sociais",
      "Certificado SSL e site seguro",
      "Otimização para Google (SEO)",
    ],
    cta: "Quero meu site rápido",
    featured: false,
    suffix: "/mês",
    plano: 'mensal',
  },
  {
    name: "Anual",
    price: "R$ 997,00",
    description: "Economize 4 meses e garanta seu site no ar o ano inteiro, com todos os benefícios do plano mensal e vantagens exclusivas.",
    benefits: [
      "Tudo do plano Mensal",
      "4 meses grátis (economize R$443,00)",
      "Prioridade no suporte",
      "Consultoria de marketing digital inclusa",
      "Relatórios de desempenho trimestrais",
      "Sessão estratégica de onboarding personalizada",
      "Acesso antecipado a novos recursos da plataforma",
    ],
    cta: "Quero economizar e crescer",
    featured: true,
    suffix: "/ano",
    plano: 'anual',
  },
];

export function PricingSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<PlanoType>('mensal');

  return (
    <section id="planos" className="relative w-full py-20 lg:py-32 bg-background overflow-hidden">
      {/* Faixa de grade ao fundo, horizontal e ocupando toda a largura, com fade nas bordas */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 w-full h-[420px] md:h-[440px] flex items-center justify-center pointer-events-none">
        {/* Grid overlay com fade nas bordas */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.zinc.200)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.zinc.200)_1px,transparent_1px)] bg-[size:40px_40px]"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            maskImage:
              'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        />
      </div>
      <div className="container mx-auto flex flex-col items-center relative z-10">
        <Badge className="mb-4 bg-black text-white">Planos</Badge>
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-black text-center">
          Preços que fazem sentido para o seu negócio
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mb-12">
          Escolha o plano ideal para você. Transparência, sem taxas escondidas e com todos os recursos inclusos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                `border rounded-2xl shadow-md transition-all duration-300 ` +
                (plan.featured
                  ? "shadow-lg scale-105 border-[3px] bg-black text-white"
                  : "bg-white border-zinc-200 text-black hover:shadow-lg")
              }
              style={plan.featured ? { borderColor: '#84CC18', boxShadow: '0 8px 32px 0 #84CC1833' } : {}}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                  {plan.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#84CC18', color: '#000' }}>
                      <Star className="w-4 h-4" style={{ color: '#000' }} /> Popular
                    </span>
                  )}
                </div>
                <CardDescription className={plan.featured ? 'text-zinc-200' : ''}>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.featured ? "text-zinc-300" : "text-base text-muted-foreground"}>{plan.suffix}</span>
                </div>
                <ul className="flex flex-col gap-3 mb-6">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-base">
                      <span className={plan.featured ? "inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#84CC18]/20 shadow-sm" : "inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#84CC18]/10 shadow-sm"}>
                        <CheckCircle className="w-5 h-5" style={{ color: '#84CC18', filter: 'drop-shadow(0 1px 2px #84CC1855)' }} />
                      </span>
                      <span className={plan.featured ? 'text-zinc-100' : ''}>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className={
                    plan.featured
                      ? "w-full relative overflow-hidden border-2 border-[#84CC18] animate-gradient-bg"
                      : "w-full bg-black text-white border-black hover:bg-zinc-900"
                  }
                  variant={plan.featured ? "default" : "outline"}
                  style={
                    plan.featured
                      ? { background: 'linear-gradient(270deg, #84CC18, #d1fae5, #84CC18)', color: '#000', borderColor: '#84CC18' }
                      : {}
                  }
                  onClick={() => { setSelectedPlano(plan.plano); setModalOpen(true); }}
                >
                  <span className="flex items-center justify-center w-full h-full relative">
                    {plan.cta}
                    <MoveRight className="w-5 h-5 ml-2 inline-block align-middle" />
                    {plan.featured && (
                      <span className="absolute inset-0 z-[-1] animate-gradient-move bg-[linear-gradient(270deg,#84CC18,#d1fae5,#84CC18)] bg-[length:200%_200%] opacity-60" />
                    )}
                  </span>
                </Button>
                {/* Garantias e meios de pagamento */}
                <div className="flex flex-col items-center gap-1 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-[#84CC18]" />
                    7 dias de garantia
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Bandeiras de cartão */}
                    <span className="inline-flex items-center gap-1 align-middle">
                      {/* Visa */}
                      <svg width="24" height="16" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-0.5"><rect width="32" height="20" rx="3" fill="#fff"/><text x="16" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1A1F71">VISA</text></svg>
                      {/* MasterCard */}
                      <svg width="24" height="16" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-0.5"><rect width="32" height="20" rx="3" fill="#fff"/><circle cx="13" cy="10" r="5" fill="#EB001B"/><circle cx="19" cy="10" r="5" fill="#F79E1B" fillOpacity="0.9"/></svg>
                      {/* Elo */}
                      <svg width="24" height="16" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-0.5"><rect width="32" height="20" rx="3" fill="#231F20"/><text x="16" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">Elo</text></svg>
                    </span>
                    <span className="align-middle">Pagamento via Cartão</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} plano={selectedPlano} />
    </section>
  );
} 