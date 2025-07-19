#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeBundle() {
  try {
    console.log('🔍 Analisando bundle...');
    
    const result = await build({
      configFile: resolve(__dirname, 'vite.config.ts'),
      mode: 'production',
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              ui: ['framer-motion', 'lucide-react', 'react-icons'],
              animations: ['gsap', 'lenis', '@studio-freight/lenis'],
              supabase: ['@supabase/supabase-js'],
            },
          },
        },
      },
    });

    console.log('✅ Bundle analisado com sucesso!');
    console.log('📊 Resultados:');
    
    if (result && 'output' in result) {
      const output = result.output;
      if (Array.isArray(output)) {
        output.forEach(chunk => {
          if (chunk.type === 'chunk') {
            console.log(`📦 ${chunk.fileName}: ${(chunk.code.length / 1024).toFixed(2)} KB`);
          } else if (chunk.type === 'asset') {
            console.log(`🖼️  ${chunk.fileName}: ${(chunk.source.length / 1024).toFixed(2)} KB`);
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro ao analisar bundle:', error);
  }
}

analyzeBundle(); 