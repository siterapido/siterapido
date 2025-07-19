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
import { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadFormModal } from "@/components/ui/LeadFormModal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { OptimizedLogo } from "@/components/ui/OptimizedLogo";
import { useLazyLoad } from "@/hooks/useLazyLoad";
import { useSmoothScroll } from "@/hooks/useHeaderScroll";
import { gerarLinkWhatsApp } from "@/lib/utils";

// Constantes para evitar recriação
const NAVIGATION_ITEMS = [
    { title: "Início", href: "#hero", description: "Volte ao topo da página." },
    { title: "Como funciona", href: "#como-funciona", description: "Veja como é simples ter seu site pronto." },
    { title: "Planos", href: "#planos", description: "Veja nossos planos e preços." },
    { title: "Portfólio", href: "#portfolio", description: "Veja sites já entregues." },
    { title: "Sobre", href: "#about", description: "Conheça nossa equipe." },
    { title: "FAQ", href: "#faq", description: "Perguntas frequentes." },
] as const;

const WHATSAPP_MESSAGE = 'Olá! Vi o site de vocês e quero um orçamento personalizado para meu negócio. Pode me ajudar?';
const WHATSAPP_MESSAGE_MOBILE = 'Olá! Quero tirar uma dúvida sobre o serviço de vocês.';
const WHATSAPP_NUMBER = '5584999810711';

// Componente otimizado para o logo
const Logo = memo(() => <OptimizedLogo />);

// Componente otimizado para o botão WhatsApp
const WhatsAppButton = memo(({ isMobile = false }: { isMobile?: boolean }) => {
    const message = isMobile ? WHATSAPP_MESSAGE_MOBILE : WHATSAPP_MESSAGE;
    const href = gerarLinkWhatsApp(WHATSAPP_NUMBER, message);
    
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`block font-semibold flex items-center justify-center gap-2 rounded-xl transition-all duration-200 border-2 border-[#9CD653] focus:ring-2 focus:ring-[#9CD653] focus:ring-offset-2 ${
                isMobile 
                    ? 'w-full px-6 py-2 text-base bg-[#9CD653] hover:bg-[#9CD653]/90 text-black shadow'
                    : 'max-w-xs h-12 text-sm sm:text-base px-4 sm:px-6 py-2 bg-white text-[#9CD653] hover:bg-[#9CD653]/90 hover:text-white shadow-none'
            }`}
            style={{ letterSpacing: '0.01em' }}
        >
            <span className="relative z-10 flex items-center gap-2 text-center leading-tight">
                <WhatsAppIcon />
                <span className={isMobile ? '' : 'hidden sm:inline'}>
                    {isMobile ? 'Falar no WhatsApp' : 'Falar no WhatsApp'}
                </span>
                {!isMobile && <span className="sm:hidden">WhatsApp</span>}
            </span>
        </a>
    );
});

// Componente para navegação desktop
const DesktopNavigation = memo(({ onMenuClick }: { onMenuClick: (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void }) => (
    <div className="hidden md:flex items-center gap-x-10 xl:gap-x-16 font-[Coolvetica] text-lg">
        <NavigationMenu>
            <NavigationMenuList>
                {NAVIGATION_ITEMS.map((item) => (
                    <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink
                            href={item.href}
                            onClick={onMenuClick(item.href)}
                            className="cursor-pointer px-2 py-1 hover:text-primary transition-colors"
                        >
                            {item.title}
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    </div>
));

// Componente para menu mobile
const MobileMenu = memo(({ 
    isOpen, 
    onClose, 
    onMenuClick 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onMenuClick: (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-sm z-50 p-4 pt-20 text-neutral-900"
            >
                <div className="container mx-auto flex flex-col h-full">
                    <button 
                        onClick={onClose} 
                        className="absolute top-7 right-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <nav className="flex flex-col gap-6 text-center mt-8">
                        {NAVIGATION_ITEMS.map((item) => (
                            <div key={item.title}>
                                <a 
                                    href={item.href} 
                                    onClick={(e) => {
                                        onMenuClick(item.href)(e);
                                        onClose();
                                    }} 
                                    className="text-2xl font-bold hover:underline text-neutral-900 hover:text-primary transition-colors"
                                >
                                    {item.title}
                                </a>
                            </div>
                        ))}
                    </nav>
                    
                    <div className="mt-auto flex flex-col gap-3 pb-8">
                        <WhatsAppButton isMobile />
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));



// Componente principal do Header
function Header1() {
    const [isOpen, setOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const handleMenuClick = useSmoothScroll();

    // Gerenciar overflow do body
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

    return (
        <header className="w-full z-50 fixed top-0 left-0 flex justify-center items-center bg-transparent transition-colors duration-300 text-neutral-900">
            <div className="container mx-auto flex items-center justify-between px-2 md:px-6 py-2 min-h-20">
                <div className="w-full flex items-center justify-between bg-white shadow-lg rounded-full px-4 md:px-10 py-2 md:py-3 gap-2 md:gap-8 border border-neutral-100" 
                     style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)' }}>
                    
                    <Logo />

                    <DesktopNavigation onMenuClick={handleMenuClick} />
                    
                    <div className="hidden md:flex items-center gap-2 lg:gap-4">
                        <WhatsAppButton />
                    </div>

                    <div className="md:hidden flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(!isOpen)}
                            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
                            className="hover:bg-gray-100"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </Button>
                    </div>
                </div>
            </div>

            <MobileMenu 
                isOpen={isOpen} 
                onClose={() => setOpen(false)} 
                onMenuClick={handleMenuClick} 
            />
            
            <LeadFormModal open={modalOpen} onClose={() => setModalOpen(false)} plano="orcamento" />
        </header>
    );
}

export { Header1 }; 