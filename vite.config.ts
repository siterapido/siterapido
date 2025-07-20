import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    compression({
      algorithms: ['gzip'],
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithms: ['brotliCompress'],
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2017', // Atualizado para suporte moderno
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // Aumentado para mais otimizações
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        // Otimizações adicionais
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        if_return: true,
        join_vars: true,
        sequences: true,
        side_effects: true,
        unused: true,
        dead_code: true,
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        loops: true,
        toplevel: true,
        // Removido top_retain pois causa erro
      },
      mangle: {
        safari10: true,
        // Mangle mais agressivo
        toplevel: true,
      },
      format: {
        comments: false,
        // Remover espaços desnecessários
        beautify: false,
        indent_level: 0,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks mais granulares
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            if (id.includes('framer-motion')) {
              // Separar Framer Motion em chunks menores
              if (id.includes('framer-motion/dist/framer-motion')) {
                return 'vendor-framer-core';
              }
              if (id.includes('framer-motion/dist/dom')) {
                return 'vendor-framer-dom';
              }
              return 'vendor-framer';
            }
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('lenis') || id.includes('@studio-freight')) {
              return 'vendor-lenis';
            }
            if (id.includes('@supabase')) {
              // Separar Supabase em chunks menores
              if (id.includes('@supabase/supabase-js')) {
                return 'vendor-supabase-core';
              }
              if (id.includes('@supabase/auth')) {
                return 'vendor-supabase-auth';
              }
              return 'vendor-supabase';
            }
            if (id.includes('@radix-ui')) {
              // Separar Radix UI por componentes
              if (id.includes('@radix-ui/react-dialog')) {
                return 'vendor-radix-dialog';
              }
              if (id.includes('@radix-ui/react-dropdown-menu')) {
                return 'vendor-radix-dropdown';
              }
              if (id.includes('@radix-ui/react-navigation-menu')) {
                return 'vendor-radix-navigation';
              }
              return 'vendor-radix';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react-icons')) {
              return 'vendor-react-icons';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
            // Outros módulos node_modules
            return 'vendor-other';
          }
          
          // Chunks específicos da aplicação mais granulares
          if (id.includes('/components/admin/')) {
            if (id.includes('Login')) {
              return 'admin-login';
            }
            if (id.includes('LeadsList')) {
              return 'admin-leads';
            }
            return 'admin';
          }
          if (id.includes('/components/sections/')) {
            if (id.includes('PortfolioSection')) {
              return 'sections-portfolio';
            }
            if (id.includes('AboutSection')) {
              return 'sections-about';
            }
            if (id.includes('ComoFuncionaSection')) {
              return 'sections-como-funciona';
            }
            return 'sections';
          }
          if (id.includes('/components/ui/')) {
            if (id.includes('animated-hero')) {
              return 'ui-hero';
            }
            if (id.includes('pricing-section') || id.includes('pricing.tsx')) {
              return 'ui-pricing';
            }
            if (id.includes('header')) {
              return 'ui-header';
            }
            if (id.includes('LeadFormModal')) {
              return 'ui-lead-form';
            }
            return 'ui-components';
          }
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/lib/')) {
            if (id.includes('supabaseClient')) {
              return 'lib-supabase';
            }
            if (id.includes('performance')) {
              return 'lib-performance';
            }
            return 'lib';
          }
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name
          if (!name) return 'assets/[name]-[hash][extname]'
          const info = name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Desabilitar sourcemaps em produção
    // Otimizações adicionais
    cssCodeSplit: true,
    reportCompressedSize: false, // Melhora performance do build
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'gsap',
      '@studio-freight/lenis',
    ],
    // Excluir dependências que não precisam ser pré-bundladas
    exclude: [
      'canvas-confetti', // Carregar sob demanda
    ],
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
})
