import type { LpTemplate } from '@/types/crm';

export const LP_TEMPLATES: LpTemplate[] = [
  {
    id: 'moderno-profissional',
    nome: 'Moderno Profissional',
    descricao: 'Landing page moderna com hero em tela cheia, gradientes e animações suaves. Ideal para prestadores de serviços e profissionais liberais.',
    estilo: 'moderno',
    thumbnail: '/templates/moderno-profissional.png',
    features: ['Hero animado', 'Gradiente', 'Cards de serviços', 'Depoimentos', 'Contato com WhatsApp'],
    secoes_padrao: ['hero', 'sobre', 'servicos', 'depoimentos', 'contato'],
  },
  {
    id: 'classico-elegante',
    nome: 'Clássico Elegante',
    descricao: 'Layout tradicional com tipografia elegante e cores sóbrias. Perfeito para advogados, consultórios e negócios tradicionais.',
    estilo: 'classico',
    thumbnail: '/templates/classico-elegante.png',
    features: ['Header clássico', 'Layout simétrico', 'Tipografia elegante', 'Galeria de fotos', 'Formulário de contato'],
    secoes_padrao: ['hero', 'sobre', 'galeria', 'contato'],
  },
  {
    id: 'clean-minimal',
    nome: 'Clean Minimal',
    descricao: 'Design minimalista com muito espaço branco e foco no conteúdo. Ideal para portfólios, fotógrafos e criativos.',
    estilo: 'minimalista',
    thumbnail: '/templates/clean-minimal.png',
    features: ['Layout limpo', 'Tipografia destacada', 'Grid de portfólio', 'Modo escuro', 'Links sociais'],
    secoes_padrao: ['hero', 'portfolio', 'sobre', 'contato'],
  },
  {
    id: 'criativo-impacto',
    nome: 'Criativo Impacto',
    descricao: 'Design ousado com elementos visuais marcantes, animações e cores vibrantes. Para marcas que querem se destacar.',
    estilo: 'criativo',
    thumbnail: '/templates/criativo-impacto.png',
    features: ['Hero com animação', 'Cores vibrantes', 'Elementos 3D', 'Contador de stats', 'CTA em destaque'],
    secoes_padrao: ['hero', 'servicos', 'portfolio', 'depoimentos', 'contato'],
  },
  {
    id: 'corporativo-b2b',
    nome: 'Corporativo B2B',
    descricao: 'Layout sério e profissional com cases, números e chamada para orçamento. Ideal para agências, consultorias e empresas B2B.',
    estilo: 'corporativo',
    thumbnail: '/templates/corporativo-b2b.png',
    features: ['Header corporativo', 'Seção de cases', 'Números/resultados', 'FAQ', 'CTA de orçamento'],
    secoes_padrao: ['hero', 'sobre', 'servicos', 'faq', 'contato'],
  },
];

export function getTemplateForBriefing(estilo: string): LpTemplate | undefined {
  const match = LP_TEMPLATES.find((t) => t.estilo === estilo);
  return match ?? LP_TEMPLATES[0];
}
