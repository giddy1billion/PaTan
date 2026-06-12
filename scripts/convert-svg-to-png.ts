/**
 * PaTan™ SVG to PNG Converter
 * 
 * Converts generated SVG assets to PNG format using Sharp.
 * Run after generate:brand to create production-ready PNGs.
 * 
 * Usage:
 *   npm run generate:png
 * 
 * Requires: npm install sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');

interface ConversionTask {
  input: string;
  output: string;
  width?: number;
  height?: number;
}

async function convertSvgToPng(): Promise<void> {
  // Dynamic import for sharp (may not be installed)
  let sharp: typeof import('sharp');
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('❌ Sharp is not installed. Run: npm install sharp');
    console.log('\nAlternatively, use an online tool or design software to convert SVGs to PNG.');
    process.exit(1);
  }

  const tasks: ConversionTask[] = [];

  // Collect all SVG files from icons directory
  const iconsDir = path.join(PUBLIC_DIR, 'icons');
  if (fs.existsSync(iconsDir)) {
    const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'));
    for (const file of iconFiles) {
      const match = file.match(/icon-(\d+)x(\d+)\.svg/);
      if (match) {
        const size = parseInt(match[1]);
        tasks.push({
          input: path.join(iconsDir, file),
          output: path.join(iconsDir, file.replace('.svg', '.png')),
          width: size,
          height: size,
        });
      } else if (file.includes('maskable') || file.includes('apple-touch')) {
        tasks.push({
          input: path.join(iconsDir, file),
          output: path.join(iconsDir, file.replace('.svg', '.png')),
        });
      }
    }
  }

  // Convert social media assets
  const socialDir = path.join(PUBLIC_DIR, 'brand', 'social');
  if (fs.existsSync(socialDir)) {
    const socialFiles = fs.readdirSync(socialDir).filter(f => f.endsWith('.svg'));
    for (const file of socialFiles) {
      tasks.push({
        input: path.join(socialDir, file),
        output: path.join(socialDir, file.replace('.svg', '.png')),
      });
    }
  }

  // Convert logos
  const logosDir = path.join(PUBLIC_DIR, 'brand', 'logos');
  if (fs.existsSync(logosDir)) {
    const logoFiles = fs.readdirSync(logosDir).filter(f => f.endsWith('.svg'));
    for (const file of logoFiles) {
      tasks.push({
        input: path.join(logosDir, file),
        output: path.join(logosDir, file.replace('.svg', '.png')),
      });
    }
  }

  // Convert favicon
  const faviconSvg = path.join(PUBLIC_DIR, 'favicon.svg');
  if (fs.existsSync(faviconSvg)) {
    // Generate multiple favicon sizes
    const faviconSizes = [16, 32, 48];
    for (const size of faviconSizes) {
      tasks.push({
        input: faviconSvg,
        output: path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`),
        width: size,
        height: size,
      });
    }
  }

  console.log(`\n🎨 Converting ${tasks.length} SVG files to PNG...\n`);

  let converted = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      const svgBuffer = fs.readFileSync(task.input);
      let sharpInstance = sharp(svgBuffer);

      if (task.width && task.height) {
        sharpInstance = sharpInstance.resize(task.width, task.height);
      }

      await sharpInstance.png().toFile(task.output);
      converted++;
      console.log(`  ✓ ${path.basename(task.output)}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ ${path.basename(task.input)}: ${error}`);
    }
  }

  console.log(`\n✨ Converted ${converted} files (${failed} failed)\n`);
}

convertSvgToPng().catch(console.error);
