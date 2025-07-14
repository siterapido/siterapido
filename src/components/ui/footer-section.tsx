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
import { Instagram, Phone, Mail, Clock } from "lucide-react"

function Footerdemo() {
  // Removido: const [isDarkMode, setIsDarkMode] = React.useState(true)
  // Removido: useEffect para alternância de tema

  return (
    <footer className="relative border-t bg-black text-white transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4 items-start">
          {/* Logo e contato */}
          <div className="flex flex-col items-start gap-4">
            <img
              src="/assets/logo-footer.png"
              alt="Logo Site Rápido"
              className="h-7 w-auto mb-2"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>WhatsApp: (84) 99981-0711</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email: contato@siterapido.tech</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Atendimento: Seg a Sex, 8h às 18h</span>
            </div>
          </div>
          {/* Links rápidos */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Links rápidos</h3>
            <nav className="space-y-2 text-sm">
              <a href="#hero" className="block transition-colors hover:text-[#84CC15] text-white">Início</a>
              <a href="#como-funciona" className="block transition-colors hover:text-[#84CC15] text-white">Como funciona</a>
              <a href="#portfolio" className="block transition-colors hover:text-[#84CC15] text-white">Portfólio</a>
              <a href="#faq" className="block transition-colors hover:text-[#84CC15] text-white">FAQ</a>
              <a href="#contato" className="block transition-colors hover:text-[#84CC15] text-white">Contato</a>
            </nav>
          </div>
          {/* Redes sociais */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Redes sociais</h3>
            <div className="mb-6 flex space-x-4">
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
                      <Instagram className="h-4 w-4 text-white group-hover:text-[#84CC15] transition-colors" />
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
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 Site Rápido. Todos os direitos reservados.
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="#" className="transition-colors hover:text-[#84CC15] text-white">Política de Privacidade</a>
            <a href="#" className="transition-colors hover:text-[#84CC15] text-white">Termos de Uso</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo } 