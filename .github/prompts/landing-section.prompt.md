---
description: "Generate a specific PaTan landing page section with brand styling, accessibility, and mobile-first responsiveness"
---

Generate landing page section **${section}** for PaTan.

## Section Options
- navigation: Sticky nav with logo, menu, Login/Get Started
- hero: Headline, CTAs, floating story cards, trust indicators
- featured-stories: 3 testimony preview cards
- how-it-works: Reflect → Inspire → Connect steps
- ai-assistant: Story confidence builder showcase
- thematic-journeys: 8-category grid
- aspirations: Goal tracking feature showcase
- community-metrics: Animated counters
- testimonials: User quote carousel
- mobile-experience: PWA showcase
- faq: Accordion with 7 questions
- final-cta: "Someone may need your story"
- footer: Links, social, copyright

## Mobile-First Requirements

### Responsive Breakpoints
```tsx
// ALWAYS mobile-first
<section className="
  px-4 py-12                   /* Mobile base (0-639px) */
  sm:px-6 sm:py-16             /* 640px+ */
  md:px-8 md:py-20             /* 768px+ */
  lg:px-12 lg:py-24            /* 1024px+ */
">
```

### Typography Scale (Mobile-First)
```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
<h2 className="text-2xl sm:text-3xl md:text-4xl">
<p className="text-sm sm:text-base md:text-lg">
```

### Touch Targets
- Minimum: 44×44px for all interactive elements
- Spacing: 8px+ between touch targets

## Design Requirements
- Use Tailwind with brand tokens (midnight, golden, forest, dawn)
- Merriweather for headings, Inter for body
- WCAG 2.2 AA compliant
- Keyboard navigable
- Semantic HTML (section, article, nav)
- Proper heading hierarchy
- Respect prefers-reduced-motion with `motion-reduce:` variants
- Include aria-labels on interactive elements
- Support dark mode

## Brand Voice
Compassionate, encouraging, genuine. No comparison language.

## Output
React component in TypeScript with:
- Mobile-first responsive styles (base → sm → md → lg → xl)
- Proper accessibility attributes
- Touch-optimized interactive elements
- Loading states where applicable
- Dark mode support
- SEO-friendly structure
