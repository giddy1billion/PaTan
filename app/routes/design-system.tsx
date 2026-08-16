import type { MetaFunction } from 'react-router';
import { Button, Alert, StatusBadge, Card } from '~/components/ui';
import { Icon, type IconName, type IconMotion } from '~/components/icon';
import { ThemeToggle } from '~/components/theme-toggle';

export const meta: MetaFunction = () => [
  { title: 'Design System | PaTan™' },
  {
    name: 'description',
    content:
      'Living reference for the PaTan™ unified design system: tokens, glass surfaces, buttons, icons, forms, and motion.',
  },
];

const tokenSwatches: { name: string; className: string; note: string }[] = [
  { name: 'midnight', className: 'bg-midnight text-white', note: 'Primary authority' },
  { name: 'dawn', className: 'bg-dawn text-midnight', note: 'Dark-mode surface text' },
  { name: 'golden', className: 'bg-golden text-midnight', note: 'Accent / CTA' },
  { name: 'forest', className: 'bg-forest text-white', note: 'Success / safe' },
  { name: 'surface', className: 'bg-surface text-midnight border border-mist', note: 'Card bg (light)' },
  { name: 'page', className: 'bg-page text-midnight border border-mist', note: 'App background' },
  { name: 'mist', className: 'bg-mist text-midnight', note: 'Subtle bg / divider' },
  { name: 'warning', className: 'bg-warning text-white', note: 'Caution' },
  { name: 'error', className: 'bg-error text-white', note: 'Destructive' },
];

const iconCatalog: { name: IconName; motion: IconMotion }[] = [
  { name: 'check', motion: 'none' },
  { name: 'heart', motion: 'pulse' },
  { name: 'bell', motion: 'wiggle' },
  { name: 'sparkles', motion: 'bounce' },
  { name: 'star', motion: 'none' },
  { name: 'shield-check', motion: 'none' },
  { name: 'clock', motion: 'pulse' },
  { name: 'sun', motion: 'spin' },
  { name: 'moon', motion: 'none' },
  { name: 'users', motion: 'none' },
  { name: 'globe', motion: 'none' },
  { name: 'book-open', motion: 'none' },
  { name: 'compass', motion: 'none' },
  { name: 'message', motion: 'none' },
  { name: 'mail', motion: 'none' },
  { name: 'lock', motion: 'none' },
];

export default function DesignSystemRoute() {
  return (
    <div className="min-h-screen bg-page text-ink-body">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-golden">
              PaTan™ Design System
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-midnight dark:text-dawn sm:text-4xl">
              Living Reference
            </h1>
            <p className="mt-2 max-w-xl text-subtle">
              The single source of truth for tokens, glass surfaces, components,
              icons, and motion. Toggle the theme to inspect every state.
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Glass surfaces */}
        <section className="mb-12">
          <SectionTitle index="01" title="Glass surfaces" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass-nav rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                .glass-nav
              </p>
              <p className="mt-1 text-sm text-ink-body">
                Translucent sticky header. Adapts to dark mode.
              </p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                .glass-panel
              </p>
              <p className="mt-1 text-sm text-ink-body">
                Generic overlay surface for dropdowns, popovers, hero captions.
              </p>
            </div>
            <div className="glass-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                .glass-card
              </p>
              <p className="mt-1 text-sm text-ink-body">
                Elevated interactive card with hover lift.
              </p>
            </div>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
                &lt;Card /&gt;
              </p>
              <p className="mt-1 text-sm text-ink-body">
                Token-backed solid surface (bg-surface).
              </p>
            </Card>
          </div>
        </section>

        {/* Color tokens */}
        <section className="mb-12">
          <SectionTitle index="02" title="Color tokens" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tokenSwatches.map((sw) => (
              <div
                key={sw.name}
                className={`flex flex-col justify-between rounded-xl p-4 shadow-1 ${sw.className}`}
              >
                <span className="font-mono text-xs font-semibold">{sw.name}</span>
                <span className="mt-2 text-xs opacity-80">{sw.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Elevation scale */}
        <section className="mb-12">
          <SectionTitle index="03" title="Elevation & radius" />
          <div className="flex flex-wrap gap-4">
            <div className="flex h-24 w-36 flex-col justify-center items-center rounded-2xl bg-surface border border-mist text-midnight shadow-0 dark:text-dawn">
              <span className="font-mono text-sm font-semibold">shadow-0</span>
            </div>
            <div className="flex h-24 w-36 flex-col justify-center items-center rounded-2xl bg-surface border border-mist text-midnight shadow-1 dark:text-dawn">
              <span className="font-mono text-sm font-semibold">shadow-1</span>
            </div>
            <div className="flex h-24 w-36 flex-col justify-center items-center rounded-2xl bg-surface border border-mist text-midnight shadow-2 dark:text-dawn">
              <span className="font-mono text-sm font-semibold">shadow-2</span>
            </div>
            <div className="flex h-24 w-36 flex-col justify-center items-center rounded-2xl bg-surface border border-mist text-midnight shadow-3 dark:text-dawn">
              <span className="font-mono text-sm font-semibold">shadow-3</span>
            </div>
            <div className="flex h-24 w-36 flex-col justify-center items-center rounded-2xl bg-surface border border-mist text-midnight shadow-4 dark:text-dawn">
              <span className="font-mono text-sm font-semibold">shadow-4</span>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <SectionTitle index="04" title="Button hierarchy" />
          <div className="glass-card flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <p className="mt-3 text-sm text-subtle">
            <span className="font-semibold">primary</span> = midnight/white authority ·{' '}
            <span className="font-semibold">accent</span> = golden CTA · glass/ghost for
            surfaces · danger for destructive.
          </p>
        </section>

        {/* Alerts & badges */}
        <section className="mb-12">
          <SectionTitle index="05" title="Alerts & status" />
          <div className="space-y-3">
            <Alert variant="success" title="Success">
              Your story was published.
            </Alert>
            <Alert variant="info" title="Info">
              A new comment arrived on your story.
            </Alert>
            <Alert variant="warning" title="Warning" dismissible>
              Your draft has unsaved changes.
            </Alert>
            <Alert variant="error" title="Error">
              Something went wrong. Please try again.
            </Alert>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status="pending">Pending</StatusBadge>
            <StatusBadge status="in-progress">In Progress</StatusBadge>
            <StatusBadge status="achieved">Achieved</StatusBadge>
            <StatusBadge status="granted">Granted</StatusBadge>
            <StatusBadge status="transformed">Transformed</StatusBadge>
          </div>
        </section>

        {/* Icons & motion */}
        <section className="mb-12">
          <SectionTitle index="06" title="Animated icons" />
          <div className="glass-panel grid grid-cols-4 gap-3 p-5 sm:grid-cols-8">
            {iconCatalog.map(({ name, motion }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-xl bg-surface/60 p-3 text-midnight dark:bg-white/5 dark:text-dawn"
              >
                <Icon name={name} size={22} motion={motion} />
                <span className="font-mono text-[10px] text-subtle">{name}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-subtle">
            Motion variants: none · pulse · bounce · spin · wiggle · draw ·
            fill-on-press. All gated behind <code>prefers-reduced-motion</code>.
          </p>
        </section>

        {/* Forms */}
        <section className="mb-12">
          <SectionTitle index="07" title="Forms & focus rings" />
          <form className="glass-card grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-body">Email</span>
              <input
                type="email"
                defaultValue="hello@patan.example"
                className="input"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-body">Password</span>
              <input type="password" className="input" placeholder="••••••••" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink-body">Bio</span>
              <textarea
                rows={3}
                className="input"
                placeholder="Tell us about yourself"
              />
            </label>
            <select className="input sm:col-span-2" defaultValue="published">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </form>
          <p className="mt-3 text-sm text-subtle">
            All inputs share <code>.input:focus</code> →{' '}
            <code>var(--shadow-focus)</code> (golden ring, reduced-motion safe).
          </p>
        </section>

        <footer className="border-t border-mist pt-6 text-sm text-subtle">
          <p>
            This page is generated from live components and tokens. If something
            looks wrong here, it is wrong everywhere — fix it at the source.
          </p>
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-baseline gap-3">
      <span className="font-mono text-sm font-semibold text-golden">{index}</span>
      <span className="font-heading text-xl font-semibold text-midnight dark:text-dawn">
        {title}
      </span>
    </h2>
  );
}
