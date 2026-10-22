import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

const SOURCE_CANDIDATES = [
  path.join(frontendDir, 'src/assets/source/rodrigo.jpg'),
  path.join(frontendDir, 'src/assets/source/rodrigo.png'),
  path.join(frontendDir, 'src/assets/source/rodrigo.jpeg'),
];

let sourceFile = SOURCE_CANDIDATES.find((p) => fs.existsSync(p));
if (!sourceFile) {
  console.error('❌ Error: No source image found in src/assets/source/ (checked .jpg, .png, .jpeg)');
  process.exit(1);
}

console.log(`📸 Found source image: ${path.relative(frontendDir, sourceFile)}`);

const WIDTHS = [480, 800, 1200];
const OUTPUT_DIRS = [path.join(frontendDir, 'public/assets/rodrigo')];

// Ensure output directories exist
for (const dir of OUTPUT_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const metadata = await sharp(sourceFile).metadata();
console.log(`ℹ️  Source dimensions: ${metadata.width}x${metadata.height} (${metadata.format})`);

const results = [];

for (const width of WIDTHS) {
  // Height maintaining aspect ratio
  const height = Math.round((width / metadata.width) * metadata.height);

  for (const format of ['avif', 'webp']) {
    const filename = `rodrigo-${width}.${format}`;

    for (const dir of OUTPUT_DIRS) {
      const outputPath = path.join(dir, filename);
      let pipeline = sharp(sourceFile).resize(width, height, {
        fit: 'cover',
        withoutEnlargement: false,
      });

      if (format === 'avif') {
        pipeline = pipeline.avif({ quality: 80, effort: 6 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality: 82, effort: 5 });
      }

      await pipeline.toFile(outputPath);
      const stat = fs.statSync(outputPath);
      results.push({
        dir: path.relative(frontendDir, dir),
        filename,
        width,
        height,
        format,
        sizeKb: (stat.size / 1024).toFixed(1),
      });
    }
  }
}

// Also generate a fallback JPG at 800px for ancient browsers
for (const dir of OUTPUT_DIRS) {
  const fallbackPath = path.join(dir, 'rodrigo-fallback.jpg');
  await sharp(sourceFile)
    .resize(800, Math.round((800 / metadata.width) * metadata.height))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(fallbackPath);
}

console.log('\n✅ Image Optimization Complete:');
console.table(
  results.filter((r) => r.dir.startsWith('public')).map((r) => ({
    File: r.filename,
    Dimensions: `${r.width}x${r.height}`,
    Format: r.format.toUpperCase(),
    Size: `${r.sizeKb} KB`,
  }))
);
