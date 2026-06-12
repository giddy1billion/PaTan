---
description: "Generate the emotional personalization onboarding flow for PaTan™ homepage"
---

Create the emotional personalization component for first-time PaTan™ visitors.

## Flow

### Step 1: Welcome Modal/Overlay

Prompt: "What are you seeking today?"

Options (as selectable cards):

- 🌅 Hope
- 🙏 Gratitude
- 💪 Encouragement
- 💚 Healing
- ✨ Inspiration
- 🧭 Purpose

### Step 2: Personalized Homepage

After selection:

- Store preference in localStorage/cookie
- Filter featured stories by emotional tag
- Update hero copy to match intent
- Show "Stories of {Selection}" section

### Step 3: Persistent Preference

- Small pill showing current mood filter
- Click to change anytime
- "Discover all stories" option

## Technical Requirements

```tsx
// Props
interface PersonalizationProps {
  onSelect: (mood: MoodType) => void;
  isFirstVisit: boolean;
}

type MoodType =
  | "hope"
  | "gratitude"
  | "encouragement"
  | "healing"
  | "inspiration"
  | "purpose";
```

## Accessibility

- Focus trap in modal
- Escape key closes
- Announce selection to screen readers
- Respect prefers-reduced-motion for animations

## UX Guidelines

- Don't block content entirely: allow "Skip" option
- Subtle entrance animation
- Selection should feel intentional, not forced
- Remember preference across sessions

## Brand Voice

- "We're here to help you find what you need"
- NOT "Tell us your preferences to serve you better"
