---
description: "Generate the complete PaTan™ homepage with all 13 sections"
---

Build the complete PaTan™ homepage following the information architecture.

## Sections to Generate

1. **Navigation** — Sticky nav, logo, menu items, Login/Get Started
2. **Hero** — "Every Story Has the Power to Light Someone Else's Path"
3. **Featured Stories** — 3 testimony preview cards
4. **How It Works** — Reflect → Inspire → Connect
5. **AI Assistant** — Story confidence builder
6. **Thematic Journeys** — 8-category grid
7. **Aspirations** — Goal tracking showcase
8. **Community Metrics** — Animated counters
9. **Testimonials** — User quote carousel
10. **Mobile Experience** — PWA showcase
11. **FAQ** — 7-question accordion
12. **Final CTA** — "Someone May Need the Story Only You Can Tell"
13. **Footer** — Product, Company, Resources, Social columns

## File Structure

```
app/routes/
├── _index.tsx              # Homepage route
├── _index/
│   ├── hero.tsx
│   ├── featured-stories.tsx
│   ├── how-it-works.tsx
│   ├── ai-assistant.tsx
│   ├── thematic-journeys.tsx
│   ├── aspirations.tsx
│   ├── community-metrics.tsx
│   ├── testimonials.tsx
│   ├── mobile-experience.tsx
│   ├── faq.tsx
│   └── final-cta.tsx
app/components/
├── navigation.tsx
└── footer.tsx
```

## Data Requirements

- Featured stories loader (3 stories)
- Community metrics loader (counters)
- Testimonials loader (quotes)
- FAQ content (can be static)

## Performance

- LCP (Largest Contentful Paint) < 2.5s
- CLS (Cumulative Layout Shift) < 0.1
- FID (First Input Delay) < 100ms
- Lazy load below-fold sections
- Optimize images with srcset and `loading="lazy"`
- Use `fetchpriority="high"` for hero images
- Preload critical fonts (Merriweather, Inter)
- Use React Suspense for data-dependent sections

## Mobile-First Design

### Responsive Breakpoints
```tsx
// ALWAYS start mobile, enhance up
<section className="
  px-4 py-12                   /* Mobile (0-639px) */
  sm:px-6 sm:py-16             /* 640px+ */
  md:px-8 md:py-20             /* 768px+ */
  lg:px-12 lg:py-24            /* 1024px+ */
">
```

### Typography Scale
```tsx
// Hero headline
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">

// Section titles
<h2 className="text-2xl sm:text-3xl md:text-4xl">
```

### Touch Targets
- Minimum 44×44px for buttons and interactive elements
- 8px+ spacing between touch targets
- Thumb-friendly zones for primary CTAs

### Mobile Navigation
- Bottom navigation bar for mobile (md:hidden)
- Hamburger menu or full nav for tablet+

## SEO

- Title: "PaTan™ | Share Your Story. Inspire Humanity."
- Meta description
- Open Graph image (og-image.png from brand assets)
- Structured data for Organization
