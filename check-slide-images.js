import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Suporte para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos principais
const slidesDir = path.join(__dirname, 'src/components/sections');
const publicAssetsDir = path.join(__dirname, 'public/assets');
const buildAssetsDir = path.join(__dirname, 'dist/assets');

// Regex para encontrar caminhos de imagens nos slides
const imageRegex = /['"`](\.?\/?assets\/[a-zA-Z0-9\-_.]+?\.(png|jpg|jpeg|avif|svg))['"`]/g;

// Função para buscar imagens nos arquivos dos slides
function getImagePathsFromSlides() {
  if (!fs.existsSync(slidesDir)) {
    console.log(`❌ Pasta de slides não encontrada: ${slidesDir}`);
    return [];
  }
  const files = fs.readdirSync(slidesDir).filter(f => f.endsWith('.tsx'));
  const imagePaths = new Set();

  files.forEach(file => {
    const content = fs.readFileSync(path.join(slidesDir, file), 'utf8');
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      imagePaths.add(match[1]);
    }
  });

  return Array.from(imagePaths);
}

// Função para checar existência das imagens
function checkImages(imagePaths, baseDir) {
  return imagePaths.map(imgPath => {
    const cleanPath = imgPath.replace(/^\.?\//, ''); // remove ./ ou /
    const fullPath = path.join(baseDir, cleanPath.replace('assets/', ''));
    return {
      imgPath,
      exists: fs.existsSync(fullPath),
      fullPath
    };
  });
}

// Execução
console.log('🔎 Verificando imagens dos slides verticais...\n');

const imagePaths = getImagePathsFromSlides();

if (imagePaths.length === 0) {
  console.log('Nenhuma imagem encontrada nos slides.');
  process.exit(0);
}

console.log(`Imagens encontradas nos slides:`);
imagePaths.forEach(p => console.log(' -', p));

console.log('\nVerificando existência em public/assets:');
const publicCheck = checkImages(imagePaths, publicAssetsDir);
publicCheck.forEach(res => {
  console.log(`${res.imgPath}: ${res.exists ? '✅' : '❌ NÃO ENCONTRADA'} (${res.fullPath})`);
});

console.log('\nVerificando existência em dist/assets:');
const buildCheck = checkImages(imagePaths, buildAssetsDir);
buildCheck.forEach(res => {
  console.log(`${res.imgPath}: ${res.exists ? '✅' : '❌ NÃO ENCONTRADA'} (${res.fullPath})`);
});

console.log('\n✅ Verificação concluída!'); 