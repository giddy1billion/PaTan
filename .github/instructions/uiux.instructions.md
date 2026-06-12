---
applyTo: "**/*.tsx,**/*.jsx,**/*.css,**/tailwind.config.*"
description: "Modern UI/UX design patterns with mobile-first responsiveness, micro-interactions, and expert-level frontend engineering practices"
---

# PaTan™ UI/UX Design System

Expert-level design patterns from 20+ years of UI/UX and frontend engineering experience. Every component must feel premium, performant, and emotionally resonant.

## Core Design Philosophy

**Mobile-first, human-centered, emotionally intelligent design.**

- Design for the smallest screen first, then enhance progressively
- Prioritize content and functionality over decoration
- Create emotional safety through thoughtful interactions
- Reduce cognitive load with clear visual hierarchy
- Build trust through consistency and polish

## Mobile-First Breakpoints

ALWAYS start with mobile styles as base, then layer responsive enhancements:

```css
/* Mobile-first breakpoint system */
/* Base: 0-639px (mobile) - DEFAULT STYLES */
/* sm: 640px+ (large phones, small tablets) */
/* md: 768px+ (tablets) */
/* lg: 1024px+ (laptops) */
/* xl: 1280px+ (desktops) */
/* 2xl: 1536px+ (large screens) */
```

### Mobile-First Pattern

```tsx
// ✅ CORRECT: Mobile-first responsive
<div className="
  px-4 py-6                    /* Mobile base */
  sm:px-6 sm:py-8              /* Large phones */
  md:px-8 md:py-10             /* Tablets */
  lg:px-12 lg:py-16            /* Laptops */
  xl:max-w-7xl xl:mx-auto      /* Desktops */
">

// ❌ WRONG: Desktop-first (never do this)
<div className="px-12 py-16 md:px-8 sm:px-4">
```

### Mobile Typography Scale

```tsx
// Headlines scale down for mobile
<h1 className="
  text-3xl leading-tight       /* Mobile: 30px */
  sm:text-4xl                  /* 640px+: 36px */
  md:text-5xl                  /* 768px+: 48px */
  lg:text-6xl                  /* 1024px+: 60px */
  xl:text-7xl                  /* 1280px+: 72px */
">
```

### Mobile Touch Targets

- Minimum touch target: 44×44px (Apple HIG) / 48×48dp (Material)
- Spacing between targets: minimum 8px
- Thumb-friendly zones for primary actions

```tsx
// Mobile-optimized buttons
<button className="
  min-h-[44px] min-w-[44px]    /* Touch target */
  px-6 py-3                    /* Generous padding */
  text-base                    /* Readable text */
  sm:min-h-0 sm:min-w-0        /* Relax on larger screens */
">
```

## Spacing System

Use consistent spacing scale for visual rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight grouping, icon padding |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Form groups |
| `space-4` | 16px | Section padding (mobile) |
| `space-6` | 24px | Card padding, element spacing |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Major section breaks |
| `space-16` | 64px | Page section spacing |
| `space-20` | 80px | Hero spacing |
| `space-24` | 96px | Major page divisions |

### Container Widths

```tsx
// Content containers
<div className="
  w-full                       /* Full width mobile */
  max-w-sm mx-auto             /* Centered on small */
  sm:max-w-md                  /* 640px */
  md:max-w-2xl                 /* 768px */
  lg:max-w-4xl                 /* 1024px */
  xl:max-w-6xl                 /* 1280px */
  2xl:max-w-7xl                /* 1536px */
">
```

## Modern Component Patterns

### Cards with Depth

```tsx
<article className="
  /* Base card */
  bg-white dark:bg-night 
  rounded-2xl                  /* Generous radius */
  
  /* Layered shadows for depth */
  shadow-sm 
  hover:shadow-lg 
  hover:-translate-y-1
  
  /* Smooth transitions */
  transition-all duration-300 ease-out
  
  /* Mobile padding */
  p-4 sm:p-6 lg:p-8
  
  /* Border for definition */
  border border-mist/50 dark:border-midnight/50
">
```

### Glassmorphism (Use Sparingly)

```tsx
<div className="
  bg-white/80 dark:bg-night/80
  backdrop-blur-xl
  border border-white/20
  rounded-2xl
  shadow-xl shadow-black/5
">
```

### Gradient Overlays

```tsx
// Hero gradient overlay
<div className="
  absolute inset-0
  bg-gradient-to-b 
  from-midnight/90 
  via-midnight/70 
  to-transparent
">

// Text gradient (sparingly)
<span className="
  bg-gradient-to-r from-golden via-[#FDF3D6] to-golden
  bg-clip-text text-transparent
">
```

## Micro-Interactions

### Button States

Use pre-built CSS classes: `.btn-primary`, `.btn-secondary`, `.btn-tertiary`

```tsx
// Primary Button - Midnight Blue (most important action)
// USE: Get Started, Share Your Story, Join the Community, Create Account
<button className="btn-primary">Share Your Story</button>

// Secondary Button - Golden (supporting action)
// USE: Explore Stories, Read More, Learn More, Discover Journeys
// RULE: Only use when a primary CTA already exists
<button className="btn-secondary">Explore Stories</button>

// Tertiary Button - Transparent (subtle action)
// USE: Cancel, Back, Inline actions
<button className="btn-tertiary">Cancel</button>
```

For custom button styling from scratch:

```tsx
<button className="
  /* Base state - Midnight Blue primary */
  bg-midnight text-white font-medium
  rounded-xl px-6 py-3
  min-h-[44px]
  
  /* Hover - subtle lift */
  hover:bg-[#123A5A]
  hover:-translate-y-0.5
  hover:shadow-lg hover:shadow-midnight/25
  
  /* Active - press down */
  active:translate-y-0 
  active:shadow-sm
  active:scale-[0.98]
  
  /* Focus - golden ring */
  focus-visible:outline-none
  focus-visible:ring-2 
  focus-visible:ring-golden
  focus-visible:ring-offset-2
  
  /* Transition - smooth */
  transition-all duration-200 ease-out
  
  /* Disabled */
  disabled:opacity-50 
  disabled:cursor-not-allowed
  disabled:hover:translate-y-0
">
```

### Interactive Cards

```tsx
<Link className="
  block group                  /* Enable group hover */
  
  /* Card base */
  bg-white rounded-2xl p-6
  border border-mist/50
  
  /* Hover effects */
  hover:border-golden/50
  hover:shadow-xl hover:shadow-golden/10
  hover:-translate-y-1
  
  /* Smooth transitions */
  transition-all duration-300 ease-out
">
  {/* Content with group hover */}
  <h3 className="
    text-midnight 
    group-hover:text-golden 
    transition-colors duration-300
  ">
    {title}
  </h3>
  
  {/* Arrow indicator */}
  <span className="
    inline-block 
    transform group-hover:translate-x-1
    transition-transform duration-300
  ">
    →
  </span>
</Link>
```

### Loading States

```tsx
// Skeleton loading
<div className="animate-pulse">
  <div className="h-4 bg-mist rounded w-3/4 mb-4" />
  <div className="h-4 bg-mist rounded w-1/2" />
</div>

// Spinner with announcement
<div role="status" aria-live="polite">
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle 
      className="opacity-25" 
      cx="12" cy="12" r="10" 
      stroke="currentColor" strokeWidth="4" 
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
    />
  </svg>
  <span className="sr-only">Gathering inspiration...</span>
</div>
```

## Layout Patterns

### Hero Section

```tsx
<section className="
  relative 
  min-h-[100svh]               /* Use svh for mobile */
  flex items-center
  
  /* Mobile padding */
  px-4 py-16
  sm:px-6 sm:py-20
  lg:px-8 lg:py-24
">
```

### Grid Systems

```tsx
// Responsive card grid
<div className="
  grid gap-4                   /* Mobile: stack */
  sm:grid-cols-2 sm:gap-6      /* 2 columns */
  lg:grid-cols-3               /* 3 columns */
  xl:grid-cols-4               /* 4 columns */
">

// Feature grid with auto-fit
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3
  gap-6 lg:gap-8
">
```

### Stack Layout

```tsx
// Vertical stack with consistent spacing
<div className="flex flex-col gap-6">
  <Header />
  <Main />
  <Footer />
</div>
```

## Form Design

### Input Fields

```tsx
<div className="space-y-2">
  <label 
    htmlFor="story-title"
    className="block text-sm font-medium text-midnight dark:text-dawn"
  >
    Story Title
  </label>
  
  <input
    id="story-title"
    type="text"
    className="
      w-full 
      px-4 py-3
      rounded-xl
      border border-mist
      bg-white dark:bg-night
      text-midnight dark:text-dawn
      placeholder:text-midnight/40
      
      /* Focus */
      focus:outline-none
      focus:ring-2 focus:ring-golden
      focus:border-transparent
      
      /* Transitions */
      transition-all duration-200
      
      /* Error state */
      aria-invalid:border-error
      aria-invalid:ring-error/20
    "
    aria-describedby="title-hint"
  />
  
  <p id="title-hint" className="text-sm text-midnight/60">
    A compelling title helps others find your story
  </p>
</div>
```

### Text Areas

```tsx
<textarea
  className="
    w-full min-h-[200px]
    px-4 py-3
    rounded-xl
    border border-mist
    resize-y
    
    /* Auto-grow consideration */
    field-sizing-content        /* CSS native when supported */
  "
/>
```

## Navigation Patterns

### Mobile Navigation

```tsx
// Bottom navigation for mobile
<nav className="
  fixed bottom-0 inset-x-0
  bg-white/95 dark:bg-night/95
  backdrop-blur-lg
  border-t border-mist
  px-4 py-2
  
  /* Hide on larger screens */
  md:hidden
  
  /* Safe area for notched phones */
  pb-safe
">
  <ul className="flex justify-around items-center">
    <li><NavItem icon={<HomeIcon />} label="Home" /></li>
    <li><NavItem icon={<SearchIcon />} label="Discover" /></li>
    <li><NavItem icon={<PlusIcon />} label="Share" primary /></li>
    <li><NavItem icon={<HeartIcon />} label="Activity" /></li>
    <li><NavItem icon={<UserIcon />} label="Profile" /></li>
  </ul>
</nav>
```

### Header with Scroll Effect

```tsx
<header className={`
  fixed top-0 inset-x-0 z-50
  transition-all duration-300
  
  ${scrolled 
    ? 'bg-white/95 dark:bg-night/95 backdrop-blur-lg shadow-sm' 
    : 'bg-transparent'
  }
`}>
```

## Animation Guidelines

### Performance-First

```css
/* ✅ Use transform and opacity for animations */
.animate-enter {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ❌ Avoid animating layout properties */
/* Never animate: width, height, top, left, margin, padding */
```

### Easing Functions

```css
/* Natural motion */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Deceleration */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* Smooth */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bounce */
```

### Duration Guidelines

| Interaction | Duration |
|-------------|----------|
| Hover effects | 150-200ms |
| Button press | 100-150ms |
| Panel open | 250-350ms |
| Page transitions | 300-400ms |
| Modal appear | 200-300ms |

### Reduced Motion

```tsx
// Always respect user preferences
<div className="
  transition-transform duration-300
  motion-reduce:transition-none
  motion-reduce:transform-none
">
```

## Dark Mode

```tsx
// Component with dark mode support
<div className="
  /* Light mode */
  bg-white text-midnight border-mist
  
  /* Dark mode */
  dark:bg-night dark:text-dawn dark:border-midnight/50
  
  /* Consistent shadows */
  shadow-sm dark:shadow-black/20
">
```

## Performance Patterns

### Image Optimization

```tsx
<picture>
  <source 
    srcSet="/images/hero.avif" 
    type="image/avif" 
  />
  <source 
    srcSet="/images/hero.webp" 
    type="image/webp" 
  />
  <img
    src="/images/hero.jpg"
    alt="Descriptive alt text"
    loading="lazy"
    decoding="async"
    className="w-full h-auto object-cover"
  />
</picture>
```

### Lazy Loading

```tsx
// Lazy load below-fold sections
const FeaturedStories = lazy(() => import('./FeaturedStories'));

<Suspense fallback={<StoriesSkeleton />}>
  <FeaturedStories />
</Suspense>
```

### Virtualization

For long lists (50+ items), use virtualization:

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={stories.length}
  itemSize={120}
>
  {({ index, style }) => (
    <StoryCard story={stories[index]} style={style} />
  )}
</FixedSizeList>
```

## Component Checklist

Before shipping any component, verify:

- [ ] **Mobile-first**: Base styles work on 320px width
- [ ] **Touch targets**: Minimum 44×44px interactive areas
- [ ] **Loading states**: Skeleton or spinner with aria-live
- [ ] **Error states**: Clear visual + message
- [ ] **Empty states**: Encouraging microcopy
- [ ] **Hover states**: Visual feedback (desktop)
- [ ] **Focus states**: Visible outline (accessibility)
- [ ] **Dark mode**: Tested and consistent
- [ ] **Reduced motion**: Respects prefers-reduced-motion
- [ ] **Semantic HTML**: Correct elements and landmarks
- [ ] **ARIA labels**: Screen reader announcements
- [ ] **Keyboard nav**: Tab order and interactions work
- [ ] **Performance**: No layout shift, optimized images

## Anti-Patterns (Never Do)

```tsx
// ❌ Fixed pixel widths
<div className="w-[347px]">

// ❌ Hiding content from screen readers
<div className="hidden" aria-hidden="true">Important content</div>

// ❌ Non-interactive div with click handler
<div onClick={handleClick}>Click me</div>

// ❌ Missing alt text
<img src="/photo.jpg" />

// ❌ Desktop-first responsive
<div className="text-xl md:text-lg sm:text-base">

// ❌ Inline styles
<div style={{ color: 'blue' }}>

// ❌ Magic numbers
<div className="mt-[37px]">

// ❌ Removing focus outlines
<button className="focus:outline-none">

// ❌ Color-only indicators
<span className="text-green-500">Success</span>
```

## Constraints

- ALWAYS start with mobile styles, then add responsive breakpoints
- ALWAYS use design tokens, never hardcoded values
- ALWAYS include hover, focus, and active states
- ALWAYS support dark mode
- ALWAYS respect reduced motion preferences
- ALWAYS optimize for Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- NEVER use fixed pixel widths for layouts
- NEVER remove focus outlines without replacement
- NEVER skip heading levels
- NEVER use divs for interactive elements
