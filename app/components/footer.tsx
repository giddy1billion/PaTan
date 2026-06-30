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
  {
    label: 'Instagram',
    href: 'https://instagram.com/patan',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/patan',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/patan',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@patan',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
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

            <ul className="mt-6 flex flex-wrap gap-3" role="list" aria-label="Social media links">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition-all duration-200 hover:bg-white/12 hover:text-white hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    aria-label={`Follow PaTan on ${link.label}`}
                  >
                    {link.icon}
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
