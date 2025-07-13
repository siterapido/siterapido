import { buttonVariants } from "./button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import React, { useState, useRef } from "react";
// @ts-ignore
import confetti from "canvas-confetti";
import { GlowCard } from "@/components/ui/spotlight-card";
import { RainbowButton } from "@/components/ui/rainbow-button";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  // Função para formatar em reais
  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
  }

  // Função para calcular desconto anual (20%) ou valor fixo para o Essencial
  function getAnnualDiscount(plan: PricingPlan & { annualFixed?: number }) {
    const mensal = Number(plan.price);
    if (plan.name === "PLANO ESSENCIAL") {
      // Desconto de 31% para o Essencial
      const anual = 997;
      const mensalComDesconto = Math.round(anual / 12);
      const desconto = Math.round((mensal * 12) - anual);
      return {
        anual,
        mensalComDesconto,
        desconto
      };
    } else if (plan.name === "PLANO EMPRESARIAL" && plan.annualFixed) {
      // Desconto de 30% para o Empresarial
      const anual = Math.round(mensal * 12 * 0.7);
      const mensalComDesconto = Math.round(anual / 12);
      const desconto = Math.round((mensal * 12) - anual);
      return {
        anual,
        mensalComDesconto,
        desconto
      };
    } else {
      // Starter ou outros gratuitos
      return {
        anual: 0,
        mensalComDesconto: 0,
        desconto: 0
      };
    }
  }

  return (
    <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          {description}
        </p>
      </div>
      <div className="flex justify-center mb-10">
        <label className="relative inline-flex items-center cursor-pointer">
          <Label>
            <Switch
              ref={switchRef as any}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="relative"
            />
          </Label>
        </label>
        <span className="ml-2 font-semibold">
          Cobrança anual <span className="text-primary">(Economize 30%)</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
        {plans.map((plan, index) => {
          const isFree = Number(plan.price) === 0;
          const annual = getAnnualDiscount(plan);
          const cardZ = plan.isPopular ? 'z-20' : (index === 2 ? 'z-10' : 'z-0');
          const cardContent = (
            <div
              className={cn(
                `rounded-2xl border-[1px] p-6 text-center lg:flex lg:flex-col lg:justify-center relative`,
                plan.isPopular ? "border-primary border-2 bg-black text-white" : "border-border bg-background text-foreground",
                "flex flex-col",
                !plan.isPopular && "mt-5",
                index === 0 && "origin-right",
                index === 2 && "origin-left",
                cardZ
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                  <Star className="text-primary-foreground h-4 w-4 fill-current" />
                  <span className="text-primary-foreground ml-1 font-sans font-semibold">
                    Popular
                  </span>
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <p className={cn("text-base font-semibold", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {plan.name}
                </p>
                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className={cn("text-5xl font-bold tracking-tight", plan.isPopular ? "text-white" : "text-foreground")}>
                    {isMonthly || isFree ? (
                      formatBRL(Number(plan.price))
                    ) : (
                      <>
                        {formatBRL(annual.mensalComDesconto)}
                      </>
                    )}
                  </span>
                  {!isFree && (
                    <span className={cn("text-sm font-semibold leading-6 tracking-wide", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                      /mês
                    </span>
                  )}
                </div>
                {!isFree && !isMonthly && (
                  <div className={cn("text-xs mt-1", plan.isPopular ? "text-white" : "text-green-700")}>
                    {`Total anual: ${formatBRL(annual.anual)} | Você economiza ${formatBRL(annual.desconto)}`}
                  </div>
                )}
                <p className={cn("text-xs leading-5", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {isMonthly ? (isFree ? "" : "cobrado mensalmente") : (isFree ? "" : "cobrado anualmente com desconto")}
                </p>
                <ul className="mt-5 gap-2 flex flex-col">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={cn("h-4 w-4 mt-1 flex-shrink-0", plan.isPopular ? "text-green-500" : "text-primary")} />
                      <span className={plan.isPopular ? "text-white" : "text-left"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* Botão de ação */}
                { plan.isPopular && (
                  <RainbowButton background="white" className="w-full font-bold text-lg mt-4">
                    Quero meu site agora 🚀
                  </RainbowButton>
                )}
                <hr className={cn("w-full my-4", plan.isPopular ? "border-white/30" : "")} />
                { !plan.isPopular && (
                  <a
                    href={plan.href}
                    className={cn(
                      buttonVariants({
                        variant: plan.isPopular ? "default" : "outline",
                      }),
                      "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                      "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1",
                      plan.isPopular
                        ? "bg-white text-black hover:bg-neutral-200"
                        : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    {plan.buttonText}
                  </a>
                )}
                <p className={cn("mt-6 text-xs leading-5 whitespace-pre-line", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>
            </div>
          );
          return plan.isPopular ? (
            <GlowCard key={index} glowColor="green" className={cardZ + " w-full h-full"}>
              {cardContent}
            </GlowCard>
          ) : (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: 0,
                      opacity: 1,
                      x: index === 2 ? -30 : index === 0 ? 30 : 0,
                      scale: 0.94,
                    }
                  : {}
              }
              viewport={{ once: true }}
              transition={{
                duration: 1.6,
                type: "spring",
                stiffness: 100,
                damping: 30,
                delay: 0.4,
                opacity: { duration: 0.5 },
              }}
              className={cn(
                `rounded-2xl border-[1px] p-6 text-center lg:flex lg:flex-col lg:justify-center relative`,
                "border-border bg-background text-foreground",
                "flex flex-col",
                "mt-5",
                index === 0 && "origin-right",
                index === 2 && "origin-left",
                cardZ
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                  <Star className="text-primary-foreground h-4 w-4 fill-current" />
                  <span className="text-primary-foreground ml-1 font-sans font-semibold">
                    Popular
                  </span>
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <p className={cn("text-base font-semibold", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {plan.name}
                </p>
                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className={cn("text-5xl font-bold tracking-tight", plan.isPopular ? "text-white" : "text-foreground")}>
                    {isMonthly || isFree ? (
                      formatBRL(Number(plan.price))
                    ) : (
                      <>
                        {formatBRL(annual.mensalComDesconto)}
                      </>
                    )}
                  </span>
                  {!isFree && (
                    <span className={cn("text-sm font-semibold leading-6 tracking-wide", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                      /mês
                    </span>
                  )}
                </div>
                {!isFree && !isMonthly && (
                  <div className={cn("text-xs mt-1", plan.isPopular ? "text-white" : "text-green-700")}>
                    {`Total anual: ${formatBRL(annual.anual)} | Você economiza ${formatBRL(annual.desconto)}`}
                  </div>
                )}
                <p className={cn("text-xs leading-5", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {isMonthly ? (isFree ? "" : "cobrado mensalmente") : (isFree ? "" : "cobrado anualmente com desconto")}
                </p>
                <ul className="mt-5 gap-2 flex flex-col">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className={cn("h-4 w-4 mt-1 flex-shrink-0", plan.isPopular ? "text-green-500" : "text-primary")} />
                      <span className={plan.isPopular ? "text-white" : "text-left"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <hr className={cn("w-full my-4", plan.isPopular ? "border-white/30" : "")} />
                <a
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: plan.isPopular ? "default" : "outline",
                    }),
                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                    "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1",
                    plan.isPopular
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {plan.buttonText}
                </a>
                <p className={cn("mt-6 text-xs leading-5 whitespace-pre-line", plan.isPopular ? "text-white" : "text-muted-foreground")}>
                  {plan.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 