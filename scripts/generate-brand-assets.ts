/**
 * PaTan Brand Asset Generator (from Source Logo)
 * 
 * Generates logo suite, PWA icons, social media assets from the source logo image.
 * 
 * Usage:
 *   npm run generate:brand       # Generate all assets
 *   npm run generate:logos       # Generate logo variations only
 *   npm run generate:icons       # Generate PWA icons only
 *   npm run generate:social      # Generate social media kit only
 * 
 * Source: public/patan-logo.PNG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const BRAND_DIR = path.join(PUBLIC_DIR, 'brand');

// Source logo file
const SOURCE_LOGO = path.join(PUBLIC_DIR, 'patan-logo.PNG');

// ============================================================================
// BRAND TOKENS
// ============================================================================

export const brand = {
  colors: {
    primary: {
      midnightBlue: '#0D2B45',
      goldenLight: '#F5B942',
      deepForest: '#2E6F40',
    },
    secondary: {
      dawnCream: '#FDF9F2',
      mistGray: '#E8ECF0',
      nightSky: '#1C2230',
      softGold: '#F8D98B',
    },
    semantic: {
      success: '#3FAE5A',
      warning: '#F5B942',
      error: '#D64545',
      info: '#3D84F5',
    },
  },
  typography: {
    heading: "'Merriweather', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
  },
  tagline: 'REFLECT • INSPIRE • CONNECT',
};

// Convert hex to RGB object for sharp
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// LOGO GENERATION
// ============================================================================

export async function generateLogos(): Promise<void> {
  const logosDir = path.join(BRAND_DIR, 'logos');
  ensureDir(logosDir);

  const metadata = await sharp(SOURCE_LOGO).metadata();
  console.log(`Source logo: ${metadata.width}x${metadata.height} ${metadata.format}`);

  // Copy original as primary logo
  await sharp(SOURCE_LOGO)
    .png()
    .toFile(path.join(logosDir, 'logo-primary.png'));

  // WebP version
  await sharp(SOURCE_LOGO)
    .webp({ quality: 95 })
    .toFile(path.join(logosDir, 'logo-primary.webp'));

  // Different sizes
  const sizes = [
    { name: 'logo-lg', width: 800 },
    { name: 'logo-md', width: 400 },
    { name: 'logo-sm', width: 200 },
    { name: 'logo-xs', width: 100 },
  ];

  for (const { name, width } of sizes) {
    // PNG
    await sharp(SOURCE_LOGO)
      .resize(width, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(logosDir, `${name}.png`));

    // WebP
    await sharp(SOURCE_LOGO)
      .resize(width, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(path.join(logosDir, `${name}.webp`));
  }

  // Symbol only (square crop - center of image)
  const symbolSize = Math.min(metadata.width || 512, metadata.height || 512);
  await sharp(SOURCE_LOGO)
    .resize(symbolSize, symbolSize, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(logosDir, 'symbol.png'));

  // Square versions at common sizes
  for (const size of [512, 256, 128, 64]) {
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(logosDir, `symbol-${size}.png`));
  }

  console.log(`✓ Generated logos in ${logosDir}`);
}

// ============================================================================
// PWA ICONS
// ============================================================================

export async function generatePWAIcons(): Promise<void> {
  const iconsDir = path.join(PUBLIC_DIR, 'icons');
  ensureDir(iconsDir);

  const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of sizes) {
    // Resize logo with transparent background
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  // Apple Touch Icon (180x180)
  await sharp(SOURCE_LOGO)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Maskable icon (512x512 with padding for safe zone)
  await sharp(SOURCE_LOGO)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));

  // Favicon
  await sharp(SOURCE_LOGO)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));

  // SVG favicon generated from source logo by embedding a transparent PNG payload
  const faviconSvgPayload = await sharp(SOURCE_LOGO)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="PaTan favicon">
  <image href="data:image/png;base64,${faviconSvgPayload.toString('base64')}" x="0" y="0" width="64" height="64"/>
</svg>
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');

  // Multi-size favicons
  for (const size of [16, 32, 48]) {
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
  }

  console.log(`✓ Generated PWA icons and favicon assets in ${iconsDir}`);
}

// ============================================================================
// WEB MANIFEST
// ============================================================================

export function generateWebManifest(): void {
  const manifest = {
    name: 'PaTan',
    short_name: 'PaTan',
    description: 'Share transformative stories. Discover hope. Connect through authentic human experiences.',
    start_url: '/',
    display: 'standalone',
    background_color: brand.colors.secondary.dawnCream,
    theme_color: brand.colors.primary.midnightBlue,
    orientation: 'portrait-primary',
    categories: ['social', 'lifestyle', 'entertainment'],
    icons: [
      { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Share Your Story', short_name: 'Share', url: '/stories/new', icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }] },
      { name: 'Discover Stories', short_name: 'Discover', url: '/discover', icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }] },
    ],
  };

  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('✓ Generated manifest.webmanifest');
}

// ============================================================================
// SOCIAL MEDIA KIT
// ============================================================================

export async function generateSocialKit(): Promise<void> {
  const socialDir = path.join(BRAND_DIR, 'social');
  ensureDir(socialDir);

  // Open Graph image (1200x630) - transparent background
  await sharp(SOURCE_LOGO)
    .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(socialDir, 'og-image.png'));

  // Twitter card (1200x600) - transparent background
  await sharp(SOURCE_LOGO)
    .resize(1200, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(socialDir, 'twitter-card.png'));

  // Profile pictures - transparent background
  for (const size of [400, 200, 110]) {
    await sharp(SOURCE_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(socialDir, `profile-${size}x${size}.png`));
  }

  // Banners - transparent background
  const banners = [
    { name: 'twitter-banner', width: 1500, height: 500 },
    { name: 'facebook-cover', width: 820, height: 312 },
    { name: 'linkedin-banner', width: 1584, height: 396 },
    { name: 'youtube-banner', width: 2560, height: 1440 },
  ];

  for (const { name, width, height } of banners) {
    await sharp(SOURCE_LOGO)
      .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(socialDir, `${name}.png`));
  }

  console.log(`✓ Generated social media kit in ${socialDir}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('\n🌳 PaTan Brand Asset Generator\n');
  console.log(`Source: ${SOURCE_LOGO}\n`);

  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    console.log('Please ensure the logo file exists at the specified path.');
    process.exit(1);
  }

  ensureDir(BRAND_DIR);

  try {
    switch (command) {
      case 'logos':
        await generateLogos();
        break;
      case 'icons':
        await generatePWAIcons();
        generateWebManifest();
        break;
      case 'social':
        await generateSocialKit();
        break;
      case 'all':
      default:
        await generateLogos();
        await generatePWAIcons();
        generateWebManifest();
        await generateSocialKit();
        break;
    }

    console.log('\n✨ Brand assets generated successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
