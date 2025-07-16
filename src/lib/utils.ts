import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera um link do WhatsApp com mensagem personalizada.
 * @param numero Número do WhatsApp (apenas dígitos, com DDI e DDD)
 * @param mensagem Mensagem a ser enviada (será url-encoded)
 * @returns URL pronta para abrir no WhatsApp
 */
export function gerarLinkWhatsApp(numero: string, mensagem: string) {
  const numeroLimpo = numero.replace(/\D/g, '');
  const mensagemEncoded = encodeURIComponent(mensagem);
  return `https://wa.me/${numeroLimpo}?text=${mensagemEncoded}`;
}
