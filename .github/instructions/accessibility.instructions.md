---
applyTo: "**/*.tsx,**/*.jsx,**/*.css"
description: "WCAG 2.2 accessibility patterns for PaTan™: semantic HTML, ARIA, keyboard navigation, screen readers, color contrast, focus management"
---

# Accessibility Standards for PaTan™

## Writing Compliance

- Never use em dash or en dash punctuation in generated content.
- Use commas, periods, parentheses, or a colon instead.
- Apply this rule to UI copy, comments, labels, and documentation.

## Production Implementation Standard

- Accessibility work must be implemented end to end, not as lightweight patch additions.
- Changes must include semantic structure, keyboard behavior, focus management, and assistive announcement coverage where applicable.
- Do not leave TODO markers, placeholder ARIA labels, or incomplete interaction states.
- Validate accessibility behavior in integrated flows, not only in isolated components.

PaTan™ must be WCAG 2.2 Level AA compliant. Every user: including those using screen readers, keyboard navigation, or high contrast modes: should fully access all storytelling features.

## Semantic HTML First

Use native elements before ARIA:

```tsx
// ✅ Good
<button onClick={handleSubmit}>Share Story</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<article>...</article>

// ❌ Avoid
<div onClick={handleSubmit} role="button">Share Story</div>
```

## Headings

Maintain logical hierarchy: never skip levels:

```tsx
<h1>Discover Stories</h1>
  <h2>Trending This Week</h2>
    <h3>Story Title</h3>
  <h2>Categories</h2>
```

## Forms

Every input needs an associated label:

```tsx
<label htmlFor="story-title">Story Title</label>
<input id="story-title" type="text" required aria-describedby="title-hint" />
<span id="title-hint">A compelling title helps others find your story</span>
```

Error messages must be announced:

```tsx
<input aria-invalid={!!error} aria-describedby="title-error" />;
{
  error && (
    <span id="title-error" role="alert">
      {error}
    </span>
  );
}
```

## Focus Management

### Visible Focus

Never remove focus outlines without replacement:

```css
/* ✅ Custom focus style */
:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* ❌ Never do this */
:focus {
  outline: none;
}
```

### Focus Trapping

Trap focus in modals and dialogs:

```tsx
<dialog ref={dialogRef} aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Share Your Story</h2>
  {/* focusable content */}
</dialog>
```

### Skip Links

Provide skip navigation:

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

## Color and Contrast

- **Text contrast**: 4.5:1 minimum (3:1 for large text)
- **UI components**: 3:1 against adjacent colors
- **Never rely on color alone**: use icons, patterns, or text

```tsx
// ✅ Status with icon + text
<span className="status-achieved">
  <CheckIcon aria-hidden="true" /> Achieved
</span>

// ❌ Color only
<span className="text-green">Achieved</span>
```

## Images and Media

```tsx
// Informative image
<img src={photo} alt="Sarah smiling after completing her first marathon" />

// Decorative image
<img src={decoration} alt="" role="presentation" />

// Video with captions
<video>
  <track kind="captions" src="captions.vtt" srcLang="en" label="English" />
</video>
```

## Interactive Elements

### Buttons vs Links

- **Button**: Triggers an action
- **Link**: Navigates to a location

```tsx
<button type="button" onClick={celebrateStory}>
  <HeartIcon aria-hidden="true" /> Celebrate
</button>

<Link to={`/stories/${id}`}>Read full story</Link>
```

### Loading States

Announce loading to screen readers:

```tsx
<button disabled={isSubmitting} aria-busy={isSubmitting}>
  {isSubmitting ? "Publishing..." : "Publish Story"}
</button>;

{
  isLoading && (
    <div role="status" aria-live="polite">
      Loading stories...
    </div>
  );
}
```

## Engagement Actions

PaTan engagement buttons need clear labels:

```tsx
<button
  aria-label={`Celebrate this story. ${celebrateCount} celebrations`}
  aria-pressed={hasCelebrated}
>
  <CelebrateIcon aria-hidden="true" />
  <span>{celebrateCount}</span>
</button>
```

## Motion and Animation

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Tailwind reduced motion
<div className="
  transition-transform duration-300
  motion-reduce:transition-none
  motion-reduce:transform-none
">
```

## Mobile Accessibility

### Touch Targets

Minimum touch target sizes for mobile accessibility:

- **Apple HIG**: 44×44px
- **Material Design**: 48×48dp
- **Minimum spacing**: 8px between targets

```tsx
// ✅ Touch-optimized interactive elements
<button className="min-h-[44px] min-w-[44px] px-6 py-3">
  Share Story
</button>

<Link className="min-h-[44px] flex items-center px-4">
  Read More
</Link>

// ❌ Too small for touch
<button className="px-2 py-1 text-xs">Save</button>
```

### Mobile Form Inputs

```tsx
<input
  type="email"
  inputMode="email"           // Mobile keyboard optimization
  autoComplete="email"        // Autofill support
  autoCapitalize="none"       // Prevent auto-caps for email
  className="
    min-h-[44px]              // Touch-friendly height
    text-base                  // 16px prevents iOS zoom
    px-4 py-3
  "
/>

<input
  type="tel"
  inputMode="tel"             // Numeric keypad
  autoComplete="tel"
/>
```

### Viewport and Zoom

- Never disable zoom: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Use `text-base` (16px) minimum for inputs to prevent iOS auto-zoom
- Ensure content is readable at 200% zoom

### Mobile Screen Reader Considerations

```tsx
// Provide context for swipe gestures
<div
  role="region"
  aria-label="Story carousel. Swipe left or right to navigate."
>
  <Carousel />
</div>

// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true">
  {feedbackMessage}
</div>
```

## Testing Checklist

### Desktop

- [ ] Navigate entire flow with keyboard only
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Check color contrast ratios (4.5:1 text, 3:1 UI)
- [ ] Verify focus is visible on all interactive elements
- [ ] Confirm all images have appropriate alt text
- [ ] Test at 200% zoom
- [ ] Validate heading hierarchy

### Mobile

- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Verify touch targets are 44px+ minimum
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] Check landscape orientation support
- [ ] Verify pinch-to-zoom works
- [ ] Test swipe gestures are accessible
- [ ] Confirm form inputs don't cause zoom
- [ ] Test with Dynamic Type (iOS) / Font scaling (Android)

### Cross-Device

- [ ] Test on 320px viewport width
- [ ] Verify content doesn't overflow horizontally
- [ ] Check interactive elements have adequate spacing
- [ ] Confirm reduced motion preferences are respected
