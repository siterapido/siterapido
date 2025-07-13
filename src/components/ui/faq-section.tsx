import { PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "O que é a Site Rápido?",
    answer: "A Site Rápido é um serviço de criação de sites profissionais para pequenos negócios, autônomos e empresas que precisam estar online de forma rápida, sem dor de cabeça e com um valor acessível."
  },
  {
    question: "Quanto custa?",
    answer: "Apenas R$120 por mês. Esse valor inclui criação, hospedagem, suporte técnico, atualizações e pequenas alterações mensais. Sem taxa de criação, sem fidelidade, sem letras miúdas."
  },
  {
    question: "Em quanto tempo meu site fica pronto?",
    answer: "Seu site pode ficar no ar em até 7 dias úteis após o envio das informações básicas e do pagamento inicial. É rápido mesmo!"
  },
  {
    question: "O que está incluso no plano?",
    answer: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Criação do site personalizado</li>
        <li>Hospedagem dedicada</li>
        <li>Integração com WhatsApp</li>
        <li>Painel de visitas (Google Analytics)</li>
        <li>Suporte e manutenção</li>
        <li>Atualizações mensais (textos, imagens, etc.)</li>
      </ul>
    )
  },
  {
    question: "E se eu quiser cancelar?",
    answer: "Sem problema. Você pode cancelar a qualquer momento. O site sai do ar, mas você pode voltar quando quiser."
  },
  {
    question: "Posso ter um e-mail com meu domínio?",
    answer: "Sim! A gente pode configurar e-mail profissional com seu domínio, como contato@suaempresa.com.br. Você escolhe se quer pelo Gmail (G Suite), Zoho ou outro serviço."
  },
  {
    question: "Posso usar meu domínio que já tenho?",
    answer: "Claro! Se você já tem um domínio, a gente só faz a configuração. Se não tiver, podemos registrar um pra você."
  },
  {
    question: "Vocês fazem o conteúdo ou eu preciso enviar?",
    answer: "Você pode enviar o conteúdo (textos e imagens), mas também ajudamos com sugestões de copy, estrutura e design, se precisar."
  },
  {
    question: "O site é responsivo?",
    answer: "Sim, todos os sites feitos pela Site Rápido funcionam perfeitamente em celular, tablet e computador."
  },
  {
    question: "Vocês fazem loja virtual?",
    answer: "Nosso foco principal é site institucional, mas podemos integrar com soluções simples de pagamento ou redirecionar para o WhatsApp. Para loja com carrinho, recomendamos planos sob medida."
  },
];

function FAQ() {
  return (
    <section id="faq" className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">FAQ</Badge>
              </div>
              <div className="flex gap-2 flex-col">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Perguntas mais frequentes
                </h4>
                <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
                  Tire suas dúvidas sobre nossos serviços e planos. Se precisar de mais informações, fale com a gente!
                </p>
              </div>
              <div className="">
                <Button className="gap-4" variant="outline">
                  Falar no WhatsApp <PhoneCall className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={"index-" + index}>
                <AccordionTrigger>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

export { FAQ }; 