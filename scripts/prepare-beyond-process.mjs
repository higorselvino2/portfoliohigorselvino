import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('C:/Users/hhigo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, '..');
const sourceDir = path.join(siteRoot, 'assets', 'images', 'hq', 'drive-source', 'process-v2');
const outputDir = path.join(siteRoot, 'assets', 'images', 'hq', 'case-study');

const images = [
  ['p41-3d-5.png', 'process-p41-3d-main.webp', 1800],
  ['p41-3d-2.png', 'process-p41-3d-detail-a.webp', 1100],
  ['p41-3d-4.png', 'process-p41-3d-detail-b.webp', 1100],
  ['p41-sketch.png', 'process-p41-sketch.webp', 1400],
  ['p41-lineart.png', 'process-p41-lineart.webp', 1400],
  ['p41-final.png', 'process-p41-final.webp', 1400]
];

for (const [source, output, width] of images) {
  await sharp(path.join(sourceDir, source))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85, effort: 5 })
    .toFile(path.join(outputDir, output));
}

console.log(`Prepared ${images.length} process images.`);
