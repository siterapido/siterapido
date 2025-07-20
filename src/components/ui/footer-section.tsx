"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Instagram, Phone, Mail, Clock, MoveRight } from "lucide-react"
import { gerarLinkWhatsApp } from "@/lib/utils"

function Footerdemo() {
  // Removido: const [isDarkMode, setIsDarkMode] = React.useState(true)
  // Removido: useEffect para alternância de tema

  return (
    <footer className="relative border-t bg-black text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-16 md:px-6 lg:px-8">
        <div className="grid gap-16 md:grid-cols-4 items-start">
          {/* Logo e contato */}
          <div className="flex flex-col items-start gap-6">
            <img
              src="/assets/optimized/logo-footer.webp"
              alt="Logo Site Rápido"
              className="h-7 w-auto mb-2"
            />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>WhatsApp: (84) 99981-0711</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email: contato@siterapido.tech</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atendimento: Seg a Sex, 8h às 18h</span>
            </div>
          </div>
          {/* Links rápidos */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Links rápidos</h3>
            <nav className="space-y-3 text-sm">
              <a href="#hero" className="block transition-colors hover:text-[#9CD653] text-white">Início</a>
              <a href="#como-funciona" className="block transition-colors hover:text-[#9CD653] text-white">Como funciona</a>
              <a href="#portfolio" className="block transition-colors hover:text-[#9CD653] text-white">Portfólio</a>
              <a href="#faq" className="block transition-colors hover:text-[#9CD653] text-white">FAQ</a>
              <a href="#contato" className="block transition-colors hover:text-[#9CD653] text-white">Contato</a>
            </nav>
          </div>
          {/* Redes sociais */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Redes sociais</h3>
            <div className="mb-8 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://instagram.com/siterapido.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-black border-none flex items-center justify-center h-10 w-10 group"
                      aria-label="Instagram @siterapido.tech"
                    >
                      <Instagram className="h-4 w-4 text-white group-hover:text-[#9CD653] transition-colors" />
                      <span className="sr-only">Instagram</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>@siterapido.tech</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* Alternância de tema removida */}
          </div>
          {/* Formulário de contato removido */}
        </div>
        
        {/* Botão de Call-to-Action */}
        <div className="mt-16 flex flex-col items-center justify-center gap-6 border-t pt-12">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-6 text-white">Pronto para começar seu projeto?</h3>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
              Entre em contato conosco e vamos criar o site perfeito para seu negócio
            </p>
            <a
              href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o site de vocês e quero começar meu projeto. Pode me ajudar?')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#9CD653] hover:bg-[#9CD653]/90 text-black font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Falar no WhatsApp
              <MoveRight className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t pt-12 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 Site Rápido. Todos os direitos reservados.
          </p>
          <nav className="flex gap-6 text-sm">
            <a href="#" className="transition-colors hover:text-[#9CD653] text-white">Política de Privacidade</a>
            <a href="#" className="transition-colors hover:text-[#9CD653] text-white">Termos de Uso</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo } 