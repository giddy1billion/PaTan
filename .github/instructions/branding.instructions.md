---
applyTo: "**/*.css,**/tailwind.config.*,**/theme.*"
description: "PaTan brand design tokens: colors, typography, spacing, animations for CSS and Tailwind with mobile-first responsive system"
---

# PaTan Design Tokens

Use these exact values when styling PaTan. Do not introduce colors or fonts outside this system.

## Mobile-First Breakpoint System

ALWAYS design mobile-first, then layer responsive enhancements:

```css
/* Base: 0-639px (mobile) - DEFAULT STYLES */
/* sm: 640px+ (large phones, small tablets) */
/* md: 768px+ (tablets) */
/* lg: 1024px+ (laptops) */
/* xl: 1280px+ (desktops) */
/* 2xl: 1536px+ (large screens) */
```

```tsx
// ✅ Mobile-first pattern
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">

// ❌ Desktop-first (NEVER DO THIS)
<h1 className="text-7xl xl:text-6xl lg:text-5xl md:text-4xl sm:text-3xl">
```

## Colors

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-midnight-blue` | `#0D2B45` | Primary brand, trust, headers |
| `--color-golden-light` | `#F5B942` | Accents, CTAs, celebration |
| `--color-deep-forest` | `#2E6F40` | Growth, success states, nature |

### Secondary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-dawn-cream` | `#FDF9F2` | Backgrounds, cards |
| `--color-mist-gray` | `#E8ECF0` | Borders, dividers |
| `--color-night-sky` | `#1C2230` | Dark mode, text |
| `--color-soft-gold` | `#F8D98B` | Hover states, highlights |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#3FAE5A` | Achieved, positive feedback |
| `--color-warning` | `#F5B942` | Caution, pending |
| `--color-error` | `#D64545` | Errors, destructive |
| `--color-info` | `#3D84F5` | Information, links |

## CSS Custom Properties

```css
:root {
  /* Primary */
  --color-midnight-blue: #0D2B45;
  --color-golden-light: #F5B942;
  --color-deep-forest: #2E6F40;
  
  /* Secondary */
  --color-dawn-cream: #FDF9F2;
  --color-mist-gray: #E8ECF0;
  --color-night-sky: #1C2230;
  --color-soft-gold: #F8D98B;
  
  /* Semantic */
  --color-success: #3FAE5A;
  --color-warning: #F5B942;
  --color-error: #D64545;
  --color-info: #3D84F5;
  
  /* Typography */
  --font-heading: 'Merriweather', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
  
  /* Scale */
  --text-display: 3.5rem;   /* 56px */
  --text-h1: 3rem;          /* 48px */
  --text-h2: 2.5rem;        /* 40px */
  --text-h3: 2rem;          /* 32px */
  --text-h4: 1.5rem;        /* 24px */
  --text-body-lg: 1.125rem; /* 18px */
  --text-body: 1rem;        /* 16px */
  --text-caption: 0.875rem; /* 14px */
  --text-small: 0.75rem;    /* 12px */
}
```

## Tailwind Config Extension

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        midnight: '#0D2B45',
        golden: '#F5B942',
        forest: '#2E6F40',
        dawn: '#FDF9F2',
        mist: '#E8ECF0',
        night: '#1C2230',
        'soft-gold': '#F8D98B',
      },
      fontFamily: {
        heading: ['Merriweather', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

## Typography Pairing

- **Headings**: Merriweather — timeless, reflective, trustworthy
- **Body/UI**: Inter — modern, readable, accessible

### Mobile-First Typography Scale

```tsx
// Display (Hero headlines)
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading">

// H1 (Page titles)
<h1 className="text-3xl sm:text-4xl md:text-5xl font-heading">

// H2 (Section titles)
<h2 className="text-2xl sm:text-3xl md:text-4xl font-heading">

// H3 (Subsections)
<h3 className="text-xl sm:text-2xl md:text-3xl font-heading">

// Body large (Lead text)
<p className="text-base sm:text-lg md:text-xl">

// Body (Default)
<p className="text-sm sm:text-base">
```

## Spacing Scale (Mobile-First)

| Token | Mobile | Desktop | Usage |
|-------|--------|---------|-------|
| `space-4` | 16px | 16px | Component padding |
| `space-6` | 24px | 24px | Card padding |
| `space-8` | 32px | 32px | Element gaps |
| `space-12` | 48px | 48px | Section padding (mobile) |
| `space-16` | 64px | 64px | Section padding (tablet) |
| `space-20` | 80px | 80px | Section padding (desktop) |
| `space-24` | 96px | 96px | Hero spacing |

```tsx
// Section spacing (mobile-first)
<section className="py-12 sm:py-16 md:py-20 lg:py-24">
```

## Animation Tokens

```css
:root {
  /* Durations */
  --duration-fast: 150ms;    /* Hover effects */
  --duration-normal: 200ms;  /* Button interactions */
  --duration-slow: 300ms;    /* Panel animations */
  --duration-slower: 400ms;  /* Page transitions */

  /* Easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Interactive Element Standards

### Touch Targets

- Minimum size: 44×44px (iOS) / 48×48dp (Android)
- Minimum spacing between targets: 8px

```tsx
// Touch-optimized button
<button className="min-h-[44px] min-w-[44px] px-6 py-3">
```

### Hover States

```tsx
<button className="
  bg-golden text-midnight
  hover:bg-soft-gold hover:-translate-y-0.5
  hover:shadow-lg hover:shadow-golden/25
  transition-all duration-200
">
```

### Focus States (Required for Accessibility)

```tsx
<button className="
  focus-visible:outline-none
  focus-visible:ring-2 
  focus-visible:ring-golden
  focus-visible:ring-offset-2
">
```

### Active/Pressed States

```tsx
<button className="
  active:translate-y-0 
  active:scale-[0.98]
  active:shadow-sm
">
```

## Brand Voice in Microcopy

| Context | Example |
|---------|---------|
| Empty state | "Your story is waiting to be told" |
| Success | "Your light has been shared" |
| Loading | "Gathering inspiration..." |
| Error | "Something went wrong. Let's try again." |
| CTA | "Share Your Story" not "Post Now" |
| Encouragement | "You're not alone" not "Join thousands" |

## Constraints

- ALWAYS use mobile-first responsive patterns
- ALWAYS include touch-friendly sizing on mobile
- ALWAYS provide hover, focus, and active states
- ALWAYS respect `prefers-reduced-motion`
- ALWAYS support dark mode
- NEVER use fixed pixel widths for layouts
- NEVER use colors outside the brand palette
- NEVER use fonts outside the type system
- NEVER skip animation states on interactive elements
