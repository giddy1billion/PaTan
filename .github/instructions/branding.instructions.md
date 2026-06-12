---
applyTo: "**/*.css,**/tailwind.config.*,**/theme.*"
description: "PaTan brand design tokens: colors, typography, spacing, animations for CSS and Tailwind with mobile-first responsive system"
---

# PaTan Brand Color System

Based on the **Tree of Light identity**: Reflection, Hope, Trust, Growth, and Human Connection.

## The Four Pillars Rule

1. **White** creates space for reflection
2. **Midnight Blue** establishes trust and wisdom
3. **Golden Light** signals hope and celebration
4. **Forest Green** represents growth and renewal

Everything else exists to support these four pillars.

## Usage Ratio

- **70%** Neutral colors (White, Surface, Borders)
- **20%** Midnight Blue (structure and authority)
- **7%** Golden Light (celebration and emphasis)
- **3%** Forest Green (growth and success)

This ratio prevents the experience from feeling overly religious, overly corporate, or overly gamified.

---

## BASE COLORS (Always Use)

| Color | Hex | Usage |
|-------|-----|-------|
| Page Background | `#FFFFFF` | Every page, every story, every reflection |
| Card/Surface | `#F8FAFC` | Story cards, aspiration cards, modals, sidebar widgets |
| Border/Divider | `#E2E8F0` | Section dividers, card borders, input fields, tables |

---

## TYPOGRAPHY COLORS

| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Primary Text | `#0D2B45` | `--color-text-primary` | H1-H6 headings, story titles, nav links |
| Body Text | `#334155` | `--color-text-body` | Story content, descriptions, long-form |
| Secondary Text | `#64748B` | `--color-text-secondary` | Author names, timestamps, categories |
| Muted Text | `#94A3B8` | `--color-text-muted` | Captions, helper text, disclaimers |

**Rule**: Never use pure black (#000) for body text.

---

## PRIMARY BRAND COLORS

| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Midnight Blue | `#0D2B45` | `--color-midnight` | Top nav, footer, primary CTAs, hero overlays |
| Golden Light | `#F5B942` | `--color-golden` | Celebration, achievements, featured labels |
| Forest Green | `#2E6F40` | `--color-forest` | Success, milestones, growth indicators |
| Night Sky | `#1C2230` | `--color-night` | Dark mode, expanded nav panels |

---

## SUPPORTING COLORS

| Color | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Golden Glow | `#FDF3D6` | `--color-golden-glow` | Celebration callouts, featured panels |
| Forest Mist | `#EAF5EC` | `--color-forest-mist` | Success banners, aspiration updates |
| Sky Reflection | `#EDF6FB` | `--color-sky-reflection` | Educational content, AI guidance |
| Primary Hover | `#123A5A` | `--color-midnight-hover` | Primary button hover |
| Secondary Hover | `#E4A72E` | `--color-golden-hover` | Secondary button hover |

---

## BUTTON SYSTEM

### Primary Button (Most Important Action)
- **Background**: `#0D2B45` (Midnight Blue)
- **Text**: `#FFFFFF` (White)
- **Hover**: `#123A5A`

**Use for**: Get Started, Share Your Story, Join the Community, Create Account, Submit Aspiration

```tsx
<button className="btn-primary">Share Your Story</button>
```

### Secondary Button (Supporting Action)
- **Background**: `#F5B942` (Golden Light)
- **Text**: `#0D2B45` (Midnight Blue)
- **Hover**: `#E4A72E`

**Use for**: Explore Stories, Read More, Learn More, Discover Journeys

**Rule**: Only use when a primary CTA already exists.

```tsx
<button className="btn-secondary">Explore Stories</button>
```

### Tertiary Button (Subtle Action)
- **Background**: Transparent
- **Text**: `#0D2B45` (Midnight Blue)

**Use for**: Cancel, Back, Inline actions

```tsx
<button className="btn-tertiary">Cancel</button>
```

---

## LINK COLORS

| State | Hex | Usage |
|-------|-----|-------|
| Default | `#2E6F40` | Story tags, inline hyperlinks, related stories |
| Hover | `#0D2B45` | Hover state |

**Rule**: Links should signal exploration without competing with primary actions.

---

## REACTION COLORS

| Reaction | Hex | Represents |
|----------|-----|------------|
| Celebrate | `#F5B942` | Joy, Recognition |
| Uplift | `#2E6F40` | Growth, Support |
| Empathy | `#A855F7` | Understanding, Connection |

---

## INTERACTION STATES

| State | Color/Hex | Usage |
|-------|-----------|-------|
| Focus Ring | `#F5B942` | Keyboard navigation |
| Selected Background | `#EDF6FB` | Selected items |
| Selected Border | `#0D2B45` | Selected item borders |
| Disabled Background | `#E2E8F0` | Disabled elements |
| Disabled Text | `#94A3B8` | Disabled text |

---

## STATUS COLORS

| Status | Color | Background |
|--------|-------|------------|
| Success | `#2E6F40` | `#EAF5EC` |
| Warning | `#F59E0B` | `#FEF3C7` |
| Error | `#DC2626` | `#FEE2E2` |
| Information | `#2563EB` | `#DBEAFE` |

---

## SPECIAL CONTENT ELEMENTS

### Reflection Block
- **Left Border**: `#0D2B45`
- **Background**: `#F8FAFC`
- **Text**: `#0D2B45`

**Use for**: Featured insights, editor's reflections, story takeaways

```tsx
<div className="reflection-block">
  <p>Insightful content here...</p>
</div>
```

### Hope Highlight Box
- **Background**: `#FDF3D6`
- **Border**: `#F5B942`
- **Text**: `#0D2B45`

**Use for**: Encouraging moments, community wins, positive reminders

```tsx
<div className="hope-highlight">
  <p>Uplifting content here...</p>
</div>
```

### Growth Callout Box
- **Background**: `#EAF5EC`
- **Border**: `#2E6F40`
- **Text**: `#0D2B45`

**Use for**: Transformation insights, aspiration updates, journey milestones

```tsx
<div className="growth-callout">
  <p>Growth-related content here...</p>
</div>
```

---

## AI ASSISTANT COLORS

| Element | Hex | Usage |
|---------|-----|-------|
| AI Background | `#EDF6FB` | AI prompt containers |
| AI Border | `#B8E3F3` | AI element borders |
| AI Accent | `#0D2B45` | AI text emphasis |
| AI Suggestion | `#FDF3D6` | Highlighted suggestions |

```tsx
<div className="ai-container">
  <div className="ai-suggestion">Suggestion text</div>
</div>
```

---

## TYPOGRAPHY

### Font Families
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

---

## MOBILE-FIRST BREAKPOINTS

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

---

## SPACING SCALE (Mobile-First)

| Token | Size | Usage |
|-------|------|-------|
| `space-4` | 16px | Component padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Element gaps |
| `space-12` | 48px | Section padding (mobile) |
| `space-16` | 64px | Section padding (tablet) |
| `space-20` | 80px | Section padding (desktop) |
| `space-24` | 96px | Hero spacing |

```tsx
// Section spacing (mobile-first)
<section className="py-12 sm:py-16 md:py-20 lg:py-24">
```

---

## ANIMATION TOKENS

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

---

## INTERACTIVE ELEMENT STANDARDS

### Touch Targets
- Minimum size: 44×44px (iOS) / 48×48dp (Android)
- Minimum spacing between targets: 8px

```tsx
<button className="min-h-[44px] min-w-[44px] px-6 py-3">
```

### Hover States
```tsx
<button className="
  hover:-translate-y-0.5
  hover:shadow-lg
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

---

## BRAND VOICE IN MICROCOPY

| Context | Example |
|---------|---------|
| Empty state | "Your story is waiting to be told" |
| Success | "Your light has been shared" |
| Loading | "Gathering inspiration..." |
| Error | "Something went wrong. Let's try again." |
| CTA | "Share Your Story" not "Post Now" |
| Encouragement | "You're not alone" not "Join thousands" |

---

## CONSTRAINTS

- ✅ ALWAYS use mobile-first responsive patterns
- ✅ ALWAYS include touch-friendly sizing on mobile
- ✅ ALWAYS provide hover, focus, and active states
- ✅ ALWAYS respect `prefers-reduced-motion`
- ❌ NEVER use fixed pixel widths for layouts
- ❌ NEVER use colors outside the brand palette
- ❌ NEVER use fonts outside the type system
- ❌ NEVER use pure black (#000) for text

---

## QUICK REFERENCE — ALL HEX CODES

```
#FFFFFF — Page Background
#F8FAFC — Card/Surface Background
#E2E8F0 — Border/Divider
#0D2B45 — Primary Text + Midnight Blue
#334155 — Body Text
#64748B — Secondary Text
#94A3B8 — Muted Text
#F5B942 — Golden Light Accent
#FDF3D6 — Golden Glow Background
#2E6F40 — Forest Growth Accent
#EAF5EC — Forest Mist Background
#EDF6FB — Sky Reflection Background
#1C2230 — Night Sky
#123A5A — Primary Hover
#E4A72E — Secondary Hover
#A855F7 — Empathy Reaction
#F59E0B — Warning
#FEF3C7 — Warning Background
#DC2626 — Error
#FEE2E2 — Error Background
#2563EB — Information
#DBEAFE — Information Background
```
