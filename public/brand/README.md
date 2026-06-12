# PaTan™ Brand Assets

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Generate all brand assets (SVG)
npm run generate:brand

# Convert SVGs to PNG (requires sharp)
npm run generate:png
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run generate:brand` | Generate all SVG assets |
| `npm run generate:logos` | Generate logo suite only |
| `npm run generate:icons` | Generate PWA icons + manifest |
| `npm run generate:social` | Generate social media kit |
| `npm run generate:png` | Convert SVGs to PNG format |

## Generated Assets

### Logos (`public/brand/logos/`)

| File | Description |
|------|-------------|
| `logo-primary.svg` | Full lockup: Tree + wordmark + tagline (dark) |
| `logo-primary-light.svg` | Full lockup for dark backgrounds |
| `logo-horizontal.svg` | Horizontal layout |
| `symbol-midnight.svg` | Tree symbol only (Midnight Blue) |
| `symbol-golden.svg` | Tree symbol only (Golden Light) |
| `symbol-forest.svg` | Tree symbol only (Deep Forest) |
| `wordmark-midnight.svg` | "PaTan™" text only |
| `tagline-midnight.svg` | "REFLECT • INSPIRE • CONNECT" |

### PWA Icons (`public/icons/`)

- Icons in sizes: 16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512px
- `apple-touch-icon.svg` - iOS home screen
- `maskable-icon-512x512.svg` - Android adaptive icon
- `favicon.svg` - Modern favicon

### Social Media Kit (`public/brand/social/`)

| File | Size | Platform |
|------|------|----------|
| `og-image.svg` | 1200×630 | Open Graph / Facebook |
| `twitter-card.svg` | 1200×600 | Twitter/X |
| `profile-400x400.svg` | 400×400 | Profile picture |
| `twitter-banner.svg` | 1500×500 | Twitter header |
| `facebook-cover.svg` | 820×312 | Facebook cover |
| `linkedin-banner.svg` | 1584×396 | LinkedIn banner |
| `youtube-banner.svg` | 2560×1440 | YouTube banner |

### Manifest (`public/manifest.webmanifest`)

PWA manifest with brand colors, icons, and shortcuts.

## Brand Tokens

All brand tokens are defined in:

- **Scripts**: `scripts/generate-brand-assets.ts` (source of truth)
- **CSS**: `app/app.css` (Tailwind v4 theme)
- **Docs**: `.github/instructions/branding.instructions.md`

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Midnight Blue | `#0D2B45` | Primary, trust, headers |
| Golden Light | `#F5B942` | Accents, CTAs, celebration |
| Deep Forest | `#2E6F40` | Growth, success |
| Dawn Cream | `#FDF9F2` | Backgrounds |
| Mist Gray | `#E8ECF0` | Borders, dividers |

### Typography

- **Headings**: Merriweather (timeless, reflective)
- **Body/UI**: Inter (modern, readable)

## Customization

Edit `scripts/generate-brand-assets.ts` to modify:

- Logo symbol design (Tree of Light)
- Color palette
- Typography
- Asset dimensions

Then regenerate: `npm run generate:brand`
