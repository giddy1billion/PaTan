---
description: "Generate PaTan design tokens for CSS, Tailwind, or Figma"
---

Generate design tokens for PaTan using the official brand system.

## Output Format: ${format:CSS Variables|Tailwind Config|Figma Tokens JSON}

## Include:
- Foundation colors (Page #FFFFFF, Surface #F8FAFC, Border #E2E8F0)
- Primary colors (Midnight Blue #0D2B45, Golden Light #F5B942, Forest Green #2E6F40)
- Supporting colors (Golden Glow #FDF3D6, Forest Mist #EAF5EC, Sky Reflection #EDF6FB)
- Semantic colors (success #2E6F40, warning #F59E0B, error #DC2626, info #2563EB)
- Reaction colors (celebrate #F5B942, uplift #2E6F40, empathy #A855F7)
- Typography scale (display through small)
- Font families (Merriweather for headings, Inter for body)
- Interactive states (focus #F5B942, selected bg #EDF6FB, selected border #0D2B45)

Also include button rules:
- Primary button: background #0D2B45, text #FFFFFF, hover #123A5A
- Secondary button: background #F5B942, text #0D2B45, hover #E4A72E
- Tertiary button: transparent background, text #0D2B45

Ensure WCAG AA contrast ratios for text combinations.
