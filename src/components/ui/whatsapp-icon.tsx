import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { gerarLinkWhatsApp } from '@/lib/utils';

export function WhatsAppFloatingButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={gerarLinkWhatsApp('5584999810711', 'Olá! Vi o site de vocês e quero saber mais sobre os serviços.')}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer animate-pulse-whatsapp"
      >
        {/* Efeito de brilho pulsante */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full opacity-75 animate-ping"></div>
        
        {/* Ícone do WhatsApp */}
        <FaWhatsapp className="relative z-10 text-2xl" />
        
        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Falar no WhatsApp
          <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black"></div>
        </div>
      </a>
    </div>
  );
} 