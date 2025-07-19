import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configurações de otimização por imagem
const imageConfigs = {
  'site-hero-cerna-hero-v2.png': { width: 360, height: 360, quality: 85 },
  'site-engicore.png': { width: 760, height: 492, quality: 85 },
  'site-sancao.png': { width: 760, height: 492, quality: 85 },
  'site-hotledas.png': { width: 760, height: 492, quality: 85 },
  'site-alive.png': { width: 420, height: 272, quality: 85 },
  'logo-principal-preta.png': { width: 228, height: 48, quality: 90 },
  'logo-footer.png': { width: 228, height: 48, quality: 90 },
};

// Otimizar imagem para WebP
async function optimizeImage(inputPath, outputPath, width, height, quality) {
  try {
    await sharp(inputPath)
      .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.log(`❌ Erro ao otimizar ${inputPath}:`, error.message);
    return false;
  }
}

// Processar imagens
async function processImages() {
  const assetsDir = path.join(process.cwd(), 'public/assets');
  const optimizedDir = path.join(process.cwd(), 'public/assets/optimized');
  
  // Criar diretório otimizado se não existir
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  
  console.log('🔄 Iniciando otimização de imagens...');
  
  for (const [filename, config] of Object.entries(imageConfigs)) {
    const inputPath = path.join(assetsDir, filename);
    const outputPath = path.join(optimizedDir, filename.replace('.png', '.webp'));
    
    if (fs.existsSync(inputPath)) {
      console.log(`📸 Otimizando ${filename}...`);
      
      if (await optimizeImage(inputPath, outputPath, config.width, config.height, config.quality)) {
        const originalSize = fs.statSync(inputPath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ ${filename}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% economia)`);
      }
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${filename}`);
    }
  }
  
  console.log('🎉 Otimização concluída!');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  processImages();
} 