# Site Rápido

Uma aplicação React + Vite com Tailwind CSS 3.4 para desenvolvimento rápido de interfaces modernas.

## 🚀 Tecnologias

- **React 19.1.0** - Biblioteca para interfaces de usuário
- **Vite 7.0.3** - Build tool e dev server
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Tailwind CSS 3.4** - Framework CSS utility-first
- **Framer Motion** - Biblioteca para animações e efeitos parallax
- **PostCSS** - Processador de CSS
- **Autoprefixer** - Plugin para adicionar prefixos CSS automaticamente

## 🎨 Tailwind CSS

O projeto está configurado com Tailwind CSS 3.4, incluindo:

- ✅ Classes utilitárias para estilização rápida
- 🌙 Suporte nativo ao modo escuro
- 📱 Design responsivo com breakpoints
- 🎨 Gradientes e efeitos visuais
- ⚡ Purge automático para builds otimizados

## 🎬 Framer Motion

Integração completa com Framer Motion para animações avançadas:

- ✅ Efeitos de parallax no scroll
- 🎯 Animações suaves e fluidas
- 🔄 Transformações 3D
- 📊 Controle de progresso de scroll
- 🎪 Spring animations configuráveis

### Componente HeroParallax

O componente `HeroParallax` demonstra:

- **Parallax Effect**: Movimento diferenciado baseado no scroll
- **3D Transformations**: Perspectiva e rotações em 3D
- **Smooth Animations**: Animações suaves com spring physics
- **Responsive Design**: Adaptação automática para diferentes telas
- **Product Showcase**: Exibição dinâmica de produtos/projetos

### Funcionalidades demonstradas:

- **Dark Mode**: Toggle entre modo claro e escuro
- **Gradientes**: Backgrounds e textos com gradientes
- **Cards responsivos**: Layout adaptável para diferentes dispositivos
- **Hover effects**: Efeitos de interação suaves
- **Parallax scrolling**: Efeito de profundidade no scroll

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                    # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── sections/              # Seções da landing page
│   │   └── HeroParallax.tsx
│   ├── layout/                # Componentes de layout
│   └── forms/                 # Formulários
├── hooks/                     # Custom hooks
├── utils/                     # Utilitários e constantes
│   └── constants.ts
├── types/                     # Tipos TypeScript
│   └── index.ts
└── assets/                    # Imagens e recursos
```

## 🛠️ Instalação

1. **Clone o repositório:**
```bash
git clone [url-do-repositorio]
cd site-rapido
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse a aplicação:**
```
http://localhost:5173
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera o build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter

## 🎯 Checklist de Landing Page

Consulte o arquivo `LANDING_PAGE_CHECKLIST.md` para um guia completo de desenvolvimento de landing pages profissionais.

## 📚 Documentação de Componentes

Consulte `src/components/README.md` para informações detalhadas sobre a estrutura e uso dos componentes.

## 🔧 Configuração

### Tailwind CSS
- Configurado em `tailwind.config.js`
- Classes personalizadas em `src/utils/constants.ts`
- Suporte completo ao dark mode

### Framer Motion
- Configurações de animação em `src/utils/constants.ts`
- Tipos TypeScript em `src/types/index.ts`
- Exemplos de uso no componente `HeroParallax`

### TypeScript
- Tipos centralizados em `src/types/index.ts`
- Configuração strict habilitada
- Suporte completo a JSX

## 🚀 Deploy

O projeto está pronto para deploy em qualquer plataforma que suporte builds estáticos:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Configure GitHub Actions
- **Surge**: `surge dist/`

## 🎨 Personalização

### Cores e Temas
Edite `src/utils/constants.ts` para personalizar:
- Paleta de cores
- Configurações de animação
- Dados de demonstração
- Classes Tailwind reutilizáveis

### Componentes
Todos os componentes são modulares e reutilizáveis:
- Props tipadas com TypeScript
- Variantes configuráveis
- Suporte ao dark mode
- Responsividade automática

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia o guia de contribuição antes de enviar pull requests.

---

**Desenvolvido com ❤️ usando React, Tailwind CSS e Framer Motion**
Wed Jul 16 07:31:34 -03 2025
