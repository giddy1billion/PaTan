# PaTan — Repository Memory

## Stack
- React Router 7 (SSR) + React 19 + TypeScript (strict) + Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`).
- Prisma 7 (`@prisma/adapter-pg` + `pg`). Resend for email. Sharp for asset generation.
- Scripts: `npm run dev` (port 5173), `build` = `prisma generate && react-router build`, `typecheck`, `test` (vitest).

## Design system architecture (as of 2026-08 audit)
- Global styles live in `app/app.css` (~2,628 lines). Tokens defined in a single `@theme` block.
- Brand palette = "Tree of Light": midnight `#0D2B45`, golden `#F5B942`, forest `#2E6F40`, night `#1C2230`, dawn/mist/soft-gold aliases. Usage ratio documented 70/20/7/3.
- TWO coexisting component systems in app.css:
  1. Legacy "Brand Components" (`.btn-*`, `.card`, `.badge-*`, `.input`, `.reflection-block`, etc.) — the actually-adopted one (`btn-primary` in 42 files).
  2. "Hybrid" system (`.bento-*`, `.glass-*`, `.m3-*`, `.fluent-*`, `.aurora-*`) — defined but adopted only in `app/routes/dashboard.tsx` + `app/components/ui.tsx`.
- React primitives in `app/components/ui.tsx` (Button, SubmitButton, EngagementButton, StatusBadge, Card, Input, Textarea, Skeleton, EmptyState, ProgressBar, Avatar, Dialog, Divider, Alert, BentoGrid/Item, GlassCard, Chip). NOTE: `ui.tsx` `Button` primary = golden/midnight, but CSS `.btn-primary` = midnight/white — semantics disagree.
- Dark mode = class-based (`.dark` on `<html>`), managed by `app/utils/theme.ts`. CSS overrides base classes under `.dark`, but most route markup uses raw Tailwind utilities with NO `dark:` variants (only 2 of 61 files do). Dark mode is effectively partial.

## Key gaps (see UI audit findings)
- Hardcoded hex colors in 22 route/component files (e.g. `#7C2D12`, `#F59E0B`, `#64748B`, `#FFF7E8`) duplicating existing tokens — bypasses theming/dark mode.
- No icon system — 29 files hand-inline raw `<svg>` with mixed viewBox/stroke/fill.
- No radius/shadow/spacing/z-index/motion token scale in `@theme`; 4 parallel elevation systems.
- Forms: 3 input styles coexist (raw Tailwind, `.input`, `.m3-input`, `.form-modern !important` overrides).

## Conventions
- Touch targets ≥ 44px (`min-h-[44px]`), visible `focus-visible` rings (golden), `prefers-reduced-motion` respected, skip link present, CSRF on all mutations, strict CSP in `root.tsx`.
- Headings = Merriweather (serif) via `font-heading`; body = Inter.
- Route file naming: flat + dot/param segments (`aspirations.$id.tsx`, `stories.$storyId.tsx`). Integration tests co-located as `*.integration.test.ts`.

## Do not
- Do not weaken CSP/CSRF/rate-limit/security headers when restyling.
- Do not remove `prefers-reduced-motion` guards or 44px touch targets.
