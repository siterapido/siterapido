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
            title: "Portfólio",
            href: "#portfolio",
            description: "Veja sites já entregues."
        },
        {
            title: "Planos",
            href: "#planos",
            description: "Veja nossos planos e preços."
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

    useEffect(() => {
        const handleMenuClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                const href = target.getAttribute('href')!;
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
                }
            }
        };
        document.addEventListener('click', handleMenuClick);
        return () => document.removeEventListener('click', handleMenuClick);
    }, []);

    return (
        <header className="w-full z-50 fixed top-0 left-0 bg-white/90 border-b border-neutral-200 shadow-md backdrop-blur-sm transition-colors duration-300 text-neutral-900">
            <div className="container mx-auto min-h-20 flex items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-4">
                  {logoSrc && (
                    <img 
                      src={logoSrc} 
                      alt="Logo Site Rápido" 
                      className="h-5 md:h-8 w-auto object-contain"
                    />
                  )}
                </div>

                {/* Menu Desktop */}
                <div className="hidden md:flex items-center gap-12">
                  <NavigationMenu>
                    <NavigationMenuList>
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    <NavigationMenuLink href={item.href} className="font-semibold text-base px-3 py-2 hover:underline focus:underline text-neutral-900 hover:text-primary">
                                        {item.title}
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                
                {/* Direita: Botões e tema (Desktop) */}
                <div className="hidden md:flex items-center gap-2 lg:gap-4">
                    <Button variant="outline" className="font-semibold px-6 py-2 rounded-xl text-base border-neutral-300 text-neutral-900 bg-white hover:bg-neutral-100">Entrar</Button>
                    <Button variant="default" className="font-semibold px-6 py-2 rounded-xl text-base bg-neutral-900 text-white hover:bg-neutral-800">Comece agora</Button>
                </div>

                {/* Botão de Menu (Mobile) */}
                <div className="flex md:hidden items-center gap-2">
                    <button onClick={() => setOpen(!isOpen)} className="p-2 rounded-md hover:bg-neutral-100 transition-colors">
                        <Menu className="w-6 h-6 text-neutral-900" />
                    </button>
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
                                <Button variant="outline" size="lg" className="font-semibold text-lg border-neutral-300 text-neutral-900 bg-white hover:bg-neutral-100">Entrar</Button>
                                <Button variant="default" size="lg" className="font-semibold text-lg bg-neutral-900 text-white hover:bg-neutral-800">Comece agora</Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

export { Header1 }; 