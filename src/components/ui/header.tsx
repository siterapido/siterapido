"use client";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadFormModal } from "@/components/ui/LeadFormModal";
import { gerarLinkWhatsApp } from "@/lib/utils";


function Header1() {
    const navigationItems = [
        {
            title: "Início",
            href: "#hero",
            description: "Volte ao topo da página."
        },
        {
            title: "Como funciona",
            href: "#como-funciona",
            description: "Veja como é simples ter seu site pronto."
        },
        {
            title: "Planos",
            href: "#planos",
            description: "Veja nossos planos e preços."
        },
        {
            title: "Portfólio",
            href: "#portfolio",
            description: "Veja sites já entregues."
        },
        {
            title: "Sobre",
            href: "#about",
            description: "Conheça nossa equipe."
        },
        {
            title: "FAQ",
            href: "#faq",
            description: "Perguntas frequentes."
        },
    ];
    const [isOpen, setOpen] = useState(false);
    const [logoSrc, setLogoSrc] = useState('/assets/logo-principal-preta.png');
    const [modalOpen, setModalOpen] = useState(false);

    // Remover todos os efeitos relacionados ao tema escuro e troca de logo

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // Remover o event listener global e adicionar o scroll suave diretamente nos links do menu
    const handleMenuClick = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                e.preventDefault();
                const header = document.querySelector('header');
                const headerHeight = header ? header.getBoundingClientRect().height : 0;
                const sectionTop = (section as HTMLElement).getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: sectionTop - headerHeight - 8, // 8px de margem extra
                    behavior: 'smooth'
                });
                setOpen(false); // Fecha o menu mobile, se estiver aberto
            }
        }
    };

    return (
        <header className="w-full z-50 fixed top-0 left-0 flex justify-center items-center bg-transparent transition-colors duration-300 text-neutral-900">
            <div className="container mx-auto flex items-center justify-between px-2 md:px-6 py-2 min-h-20">
                <div className="w-full flex items-center justify-between bg-white shadow-lg rounded-full px-4 md:px-10 py-2 md:py-3 gap-2 md:gap-8 border border-neutral-100" style={{boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)'}}>
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                      {logoSrc && (
                        <img 
                          src={logoSrc} 
                          alt="Logo Site Rápido" 
                          className="h-6 md:h-8 w-auto object-contain"
                        />
                      )}
                    </div>

                    {/* Menu Desktop */}
                    <div className="hidden md:flex items-center gap-x-10 xl:gap-x-16 font-[Coolvetica] text-lg">
                      <NavigationMenu>
                        <NavigationMenuList>
                          {navigationItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                              <NavigationMenuLink
                                href={item.href}
                                onClick={handleMenuClick(item.href)}
                                className="cursor-pointer px-2 py-1"
                              >
                                {item.title}
                              </NavigationMenuLink>
                            </NavigationMenuItem>
                          ))}
                        </NavigationMenuList>
                      </NavigationMenu>
                    </div>
                    
                    {/* Direita: Botões e tema (Desktop) */}
                    <div className="hidden md:flex items-center gap-2 lg:gap-4">
                        {/* <Button variant="outline" className="font-semibold px-6 py-2 rounded-full text-base border-2 border-lime-500 text-lime-600 bg-white hover:bg-lime-50 shadow-none transition-colors duration-150">Entrar</Button> */}
                        <a
                          href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o site de vocês e quero um orçamento personalizado para meu negócio. Pode me ajudar?')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full max-w-xs h-12 text-base font-semibold flex items-center justify-center gap-2 rounded-full px-6 py-2 transition-all duration-200 border-2 border-[#84CC15] bg-white text-[#84CC15] hover:bg-[#84CC15]/90 hover:text-white focus:ring-2 focus:ring-[#84CC15] focus:ring-offset-2 whitespace-nowrap shadow-none"
                          style={{letterSpacing:'0.01em'}}>
                          <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.2 5.077 4.363.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.617h-.001a9.87 9.87 0 01-4.988-1.357l-.361-.214-3.709.982.991-3.617-.235-.372A9.86 9.86 0 012.1 12.045C2.073 6.504 6.915 1.661 12.457 1.661c2.637 0 5.112 1.027 6.988 2.896a9.825 9.825 0 012.916 6.965c-.003 5.542-4.845 10.385-10.39 10.377zm8.413-18.19A11.815 11.815 0 0012.457 0C5.604 0 .062 5.541.1 12.396c.021 2.205.577 4.354 1.637 6.242L0 24l5.463-1.459a11.82 11.82 0 006.994 2.229h.005c6.853 0 12.396-5.542 12.434-12.396a12.292 12.292 0 00-3.646-8.735z"/></svg>
                            Falar no WhatsApp
                          </span>
                        </a>
                    </div>

                    {/* Menu Mobile */}
                    <div className="md:hidden flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(!isOpen)}
                        aria-label="Abrir menu"
                      >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                      </Button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.nav
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 right-0 w-4/5 max-w-xs h-full bg-white z-50 shadow-lg flex flex-col gap-8 p-8 font-[Coolvetica] text-lg"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setOpen(false)}
                              aria-label="Fechar menu"
                              className="self-end"
                            >
                              <X size={24} />
                            </Button>
                            <ul className="flex flex-col gap-6 mt-8">
                              {navigationItems.map((item) => (
                                <li key={item.href}>
                                  <a
                                    href={item.href}
                                    onClick={handleMenuClick(item.href)}
                                    className="text-lg font-semibold text-neutral-900 hover:text-primary transition-colors cursor-pointer"
                                  >
                                    {item.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </motion.nav>
                        )}
                      </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Menu Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden fixed top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-sm z-50 p-4 pt-20 text-neutral-900"
                    >
                        <div className="container mx-auto flex flex-col h-full">
                            <button onClick={() => setOpen(false)} className="absolute top-7 right-4 p-2 rounded-md">
                                <X className="w-6 h-6" />
                            </button>
                            <nav className="flex flex-col gap-6 text-center mt-8">
                                {navigationItems.map((item) => (
                                    <div key={item.title}>
                                        <a href={item.href} onClick={() => setOpen(false)} className="text-2xl font-bold hover:underline text-neutral-900 hover:text-primary">{item.title}</a>
                                    </div>
                                ))}
                            </nav>
                             <div className="mt-auto flex flex-col gap-3 pb-8">
                                {/* <Button variant="outline" size="lg" className="font-semibold text-lg rounded-full border-2 border-lime-500 text-lime-600 bg-white hover:bg-lime-50 shadow-none transition-colors duration-150">Entrar</Button> */}
                                {/* Botão CTA (Mobile) */}
                                <a
                                  href={gerarLinkWhatsApp('5584999810711', 'Olá! Quero tirar uma dúvida sobre o serviço de vocês.')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full font-semibold px-6 py-2 rounded-full text-base bg-lime-500 hover:bg-lime-600 text-black shadow transition-colors duration-150" style={{fontWeight: 700}}
                                >
                                  Falar no WhatsApp
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Modal do formulário de orçamento personalizado */}
            <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} plano="orcamento" />
        </header>
    );
}

export { Header1 }; 