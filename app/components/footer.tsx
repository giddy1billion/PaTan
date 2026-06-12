import { Link } from 'react-router';

type FooterVariant = 'default' | 'dashboard';

type FooterProps = {
  variant?: FooterVariant;
};

const marketingLinks = {
  discover: [
    { label: 'Discover Stories', href: '/discover' },
    { label: 'Journeys', href: '/journeys' },
    { label: 'Aspirations', href: '/aspirations' },
    { label: 'Community', href: '/community' },
  ],
  platform: [
    { label: 'About', href: '/about' },
    { label: 'Guidelines', href: '/guidelines' },
    { label: 'Help Center', href: '/help' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Data Deletion', href: '/data-deletion' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Sign In', href: '/login' },
  ],
} as const;

const dashboardLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Discover', href: '/discover' },
  { label: 'My Profile', href: '/profile' },
  { label: 'Security Audit', href: '/security/auth-audit' },
] as const;

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
] as const;

function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-midnight text-white" role="contentinfo">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-[15%] top-0 h-80 w-80 rounded-full bg-golden/10 blur-[120px]" />
        <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-forest/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
              aria-label="PaTan home"
            >
              <img
                src="/brand/logos/logo-sm.png"
                alt=""
                className="h-11 w-auto brightness-0 invert"
                aria-hidden="true"
              />
              <span className="font-heading text-2xl font-bold">PaTan</span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              A story-first space for gratitude, resilience, and transformation. Reflect deeply,
              connect honestly, and keep growing.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Social media links">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/80 transition-colors duration-200 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-golden">Discover</h2>
                <ul className="mt-4 space-y-3" role="list">
                  {marketingLinks.discover.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-golden">Platform</h2>
                <ul className="mt-4 space-y-3" role="list">
                  {marketingLinks.platform.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-golden">Legal</h2>
                <ul className="mt-4 space-y-3" role="list">
                  {marketingLinks.legal.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="inline-flex min-h-[44px] items-center text-sm text-white/75 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6">
          <div className="flex flex-col gap-2 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright {new Date().getFullYear()} PaTan. All rights reserved.</p>
            <p className="font-medium tracking-[0.18em]">REFLECT • INSPIRE • CONNECT</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DashboardFooter() {
  return (
    <footer
      className="border-t border-midnight/10 bg-white/85 backdrop-blur-sm"
      role="contentinfo"
      aria-label="Dashboard footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-base font-bold text-midnight sm:text-lg">PaTan Dashboard</span>
              <span className="rounded-full border border-midnight/15 bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-midnight/80 sm:px-2.5 sm:text-[11px]">
                Trusted space
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-secondary sm:text-sm">
              Keep your reflection flow active with quick access to notifications, profile settings,
              and story tools.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="list" aria-label="Dashboard quick links">
            {dashboardLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-midnight/15 bg-white px-3 text-[13px] font-semibold text-midnight transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden sm:justify-start sm:px-3.5 sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-midnight/10 pt-3.5 sm:mt-5 sm:pt-4">
          <div className="flex flex-col gap-2 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright {new Date().getFullYear()} PaTan.</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/help"
                className="hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Help
              </Link>
              <Link
                to="/privacy"
                className="hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Footer({ variant = 'default' }: FooterProps) {
  if (variant === 'dashboard') {
    return <DashboardFooter />;
  }

  return <MarketingFooter />;
}
