import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  plano?: 'mensal' | 'pro' | 'anual' | 'orcamento';
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ open, onClose, plano = 'mensal' }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  // Tema único: branco com detalhes pretos e botão verde para ambos os planos
  const borderColor = '#111';
  const bgColor = '#fff';
  const textColor = '#111';
  const inputBg = '#fff';
  const inputText = '#111';
  const labelColor = '#111';
  const placeholderColor = '#555';
  const buttonBg = '#84CC15';
  const buttonText = '#111';
  const buttonBorder = '#84CC15';
  const buttonHoverBg = '#111';
  const buttonHoverText = '#84CC15';
  const buttonHoverBorder = '#84CC15';
  const planoLabel = plano === 'mensal' ? 'Mensal' : plano === 'anual' ? 'Anual' : plano === 'pro' ? 'Pro' : 'Orçamento personalizado';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!nome || !email || !whatsapp) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('leads').insert([
      { nome, email, whatsapp, instagram, plano: planoLabel }
    ]);
    setLoading(false);
    if (error) {
      setError('Erro ao enviar. Tente novamente.');
      return;
    }
    // Log e mensagem de sucesso
    console.log(`Lead enviado para o plano: ${planoLabel}`);
    setSuccess(`Formulário enviado para o plano: ${planoLabel}`);
    setTimeout(() => {
      const numero = '+5584999810711';
      const mensagem = encodeURIComponent(`Olá! Meu nome é ${nome} e quero saber mais sobre o plano ${planoLabel}.`);
      window.location.href = `https://wa.me/${numero.replace(/\D/g, '')}?text=${mensagem}`;
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div
        className="relative w-full max-w-md rounded-xl border-2"
        style={{ borderColor: borderColor, background: bgColor }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl font-bold focus:outline-none"
          style={{ color: textColor, transition: 'color 0.2s' }}
          aria-label="Fechar"
        >
          ×
        </button>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>Solicite seu site</h2>
          <div className="mb-2 text-sm font-semibold" style={{ color: buttonBorder }}>
            Plano selecionado: {planoLabel}
          </div>
          <input type="hidden" name="plano" value={planoLabel} />
          <label className="text-sm font-medium" style={{ color: labelColor }}>
            Nome*
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className={`mt-1 w-full rounded-md px-4 py-2 border-2 focus:outline-none transition placeholder:text-[#555] border-[#111] focus:border-[#111]`}
              style={{ background: inputBg, color: inputText, borderColor: borderColor }}
              placeholder="Seu nome"
              required
            />
          </label>
          <label className="text-sm font-medium" style={{ color: labelColor }}>
            Email*
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`mt-1 w-full rounded-md px-4 py-2 border-2 focus:outline-none transition placeholder:text-[#555] border-[#111] focus:border-[#111]`}
              style={{ background: inputBg, color: inputText, borderColor: borderColor }}
              placeholder="seu@email.com"
              required
            />
          </label>
          <label className="text-sm font-medium" style={{ color: labelColor }}>
            WhatsApp*
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              className={`mt-1 w-full rounded-md px-4 py-2 border-2 focus:outline-none transition placeholder:text-[#555] border-[#111] focus:border-[#111]`}
              style={{ background: inputBg, color: inputText, borderColor: borderColor }}
              placeholder="(99) 99999-9999"
              required
            />
          </label>
          <label className="text-sm font-medium" style={{ color: labelColor }}>
            Instagram da empresa
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className={`mt-1 w-full rounded-md px-4 py-2 border-2 focus:outline-none transition placeholder:text-[#555] border-[#111] focus:border-[#111]`}
              style={{ background: inputBg, color: inputText, borderColor: borderColor }}
              placeholder="@suaempresa"
            />
          </label>
          {error && <div className="text-sm font-medium" style={{ color: buttonBorder }}>{error}</div>}
          {success && <div className="text-sm font-medium" style={{ color: buttonBorder }}>{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md font-bold py-2 transition border-2 focus:outline-none shadow-md"
            style={{
              background: 'linear-gradient(90deg, #84CC15 0%, #b6e35a 100%)',
              color: buttonText,
              borderColor: buttonBorder,
              transition: 'all 0.2s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111';
              (e.currentTarget as HTMLButtonElement).style.color = '#84CC15';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#84CC15';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(90deg, #84CC15 0%, #b6e35a 100%)';
              (e.currentTarget as HTMLButtonElement).style.color = buttonText;
              (e.currentTarget as HTMLButtonElement).style.borderColor = buttonBorder;
            }}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}; 