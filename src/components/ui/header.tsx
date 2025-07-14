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
    const [logoSrc, setLogoSrc] = useState('/assets/logo-principal-v2.png');

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
                          href="https://wa.me/5584999810711?text=Ol%C3%A1%2C%20quero%20falar%20sobre%20sites%20profissionais"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="font-semibold px-6 py-2 rounded-full text-base bg-lime-500 hover:bg-lime-600 text-black shadow transition-colors duration-150" style={{fontWeight: 700}}>
                            Falar no WhatsApp
                          </Button>
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
                                <div className="flex md:hidden w-full mt-4">
                                    <a
                                      href="https://wa.me/5584999810711?text=Ol%C3%A1%2C%20quero%20falar%20sobre%20sites%20profissionais"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full"
                                    >
                                      <Button className="w-full font-semibold px-6 py-2 rounded-full text-base bg-lime-500 hover:bg-lime-600 text-black shadow transition-colors duration-150" style={{fontWeight: 700}}>
                                        Falar no WhatsApp
                                      </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

export { Header1 }; 