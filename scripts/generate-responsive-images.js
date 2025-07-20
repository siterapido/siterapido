import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de tamanhos responsivos
const RESPONSIVE_SIZES = [
  { width: 320, suffix: 'xs' },
  { width: 480, suffix: 'sm' },
  { width: 640, suffix: 'md' },
  { width: 768, suffix: 'lg' },
  { width: 1024, suffix: 'xl' },
  { width: 1280, suffix: '2xl' },
];

// Imagens específicas mencionadas no relatório do Lighthouse
const CRITICAL_IMAGES = [
  {
    src: 'public/assets/optimized/site-hero-cerna-hero-v2.webp',
    sizes: [
      { width: 200, height: 200, suffix: 'mobile' }, // Para mobile (200x200)
      { width: 400, height: 400, suffix: 'tablet' }, // Para tablet
      { width: 600, height: 600, suffix: 'desktop' }, // Para desktop
    ],
    priority: true
  },
  {
    src: 'public/assets/optimized/site-engicore.webp',
    sizes: [
      { width: 190, height: 123, suffix: 'mobile' }, // 380x246 / 2
      { width: 380, height: 246, suffix: 'tablet' }, // Tamanho original
    ],
    priority: false
  },
  {
    src: 'public/assets/optimized/site-sancao.webp',
    sizes: [
      { width: 190, height: 123, suffix: 'mobile' },
      { width: 380, height: 246, suffix: 'tablet' },
    ],
    priority: false
  },
  {
    src: 'public/assets/optimized/site-hotledas.webp',
    sizes: [
      { width: 190, height: 123, suffix: 'mobile' },
      { width: 380, height: 246, suffix: 'tablet' },
    ],
    priority: false
  },
  {
    src: 'public/assets/optimized/site-alive.webp',
    sizes: [
      { width: 105, height: 68, suffix: 'mobile' }, // 210x136 / 2
      { width: 210, height: 136, suffix: 'tablet' },
    ],
    priority: false
  }
];

async function generateResponsiveImage(inputPath, outputDir, sizes) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Processando: ${inputPath}`);
    console.log(`Dimensões originais: ${metadata.width}x${metadata.height}`);
    
    for (const size of sizes) {
      const outputPath = path.join(
        outputDir,
        `${path.basename(inputPath, path.extname(inputPath))}-${size.suffix}.webp`
      );
      
      // Calcular altura mantendo aspect ratio se não especificada
      let targetWidth = size.width;
      let targetHeight = size.height;
      
      if (!targetHeight) {
        targetHeight = Math.round((targetWidth * metadata.height) / metadata.width);
      }
      
      await image
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ 
          quality: 80,
          effort: 6
        })
        .toFile(outputPath);
      
      const outputStats = await fs.stat(outputPath);
      const originalStats = await fs.stat(inputPath);
      const savings = ((originalStats.size - outputStats.size) / originalStats.size * 100).toFixed(1);
      
      console.log(`  ✓ ${path.basename(outputPath)} (${targetWidth}x${targetHeight}) - ${(outputStats.size / 1024).toFixed(1)}KB (${savings}% menor)`);
    }
  } catch (error) {
    console.error(`Erro ao processar ${inputPath}:`, error.message);
  }
}

async function createResponsiveImages() {
  console.log('🚀 Iniciando geração de imagens responsivas...\n');
  
  // Criar diretório para imagens responsivas
  const responsiveDir = 'public/assets/responsive';
  try {
    await fs.mkdir(responsiveDir, { recursive: true });
  } catch (error) {
    // Diretório já existe
  }
  
  // Processar imagens críticas
  for (const imageConfig of CRITICAL_IMAGES) {
    if (await fs.access(imageConfig.src).then(() => true).catch(() => false)) {
      await generateResponsiveImage(imageConfig.src, responsiveDir, imageConfig.sizes);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${imageConfig.src}`);
    }
  }
  
  console.log('\n✅ Geração de imagens responsivas concluída!');
  console.log(`📁 Imagens salvas em: ${responsiveDir}`);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createResponsiveImages().catch(console.error);
}

export { createResponsiveImages, CRITICAL_IMAGES }; 