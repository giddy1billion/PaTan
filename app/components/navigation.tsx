import { Form, Link, NavLink, useRouteLoaderData } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionUser } from '~/utils/auth.server';

type NavItem = {
  label: string;
  href: string;
};

type NavigationVariant = 'default' | 'dashboard';

type OnboardingProgress = {
  isRequired: boolean;
  step: 1 | 2;
  resumeHref: string;
};

const guestMenuItems = [
  { label: 'Discover Stories', href: '/discover' },
  { label: 'Journeys', href: '/journeys' },
  { label: 'Aspirations', href: '/aspirations' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
] satisfies NavItem[];

const memberPrimaryMenuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Profile', href: '/profile' },
] satisfies NavItem[];

const memberSecondaryMenuItems = [
  { label: 'Discover', href: '/discover' },
  { label: 'Journeys', href: '/journeys' },
  { label: 'Aspirations', href: '/aspirations' },
  { label: 'Community', href: '/community' },
] satisfies NavItem[];

function getProviderLabel(provider: SessionUser['provider']) {
  if (provider === 'google') return 'Google';
  if (provider === 'facebook') return 'Facebook';
  return 'Email';
}

function getDisplayName(user: SessionUser) {
  if (user.name?.trim()) return user.name.trim();
  return user.email;
}

function getInitials(user: SessionUser) {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function NotificationBellLink({
  unreadCount,
  compact = false,
  onClick,
}: {
  unreadCount: number;
  compact?: boolean;
  onClick?: () => void;
}) {
  const count = Math.max(0, unreadCount);
  const hasUnread = count > 0;
  const badgeText = count > 99 ? '99+' : String(count);

  return (
    <Link
      to="/notifications"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight shadow-sm transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-surface hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
        compact ? 'min-h-[44px] min-w-[44px]' : 'min-h-[46px] min-w-[46px]'
      }`}
      aria-label={
        hasUnread
          ? `Open notifications, ${badgeText} unread`
          : 'Open notifications, no unread items'
      }
      title={hasUnread ? `${badgeText} unread notifications` : 'No unread notifications'}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 18a2.5 2.5 0 0 1-5 0" />
        <path d="M5.8 15.2h12.4c-.9-1.1-1.7-2.7-1.7-5V9a4.5 4.5 0 1 0-9 0v1.2c0 2.3-.8 3.9-1.7 5Z" />
      </svg>
      {hasUnread ? (
        <span
          className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center bg-golden px-1 text-[10px] font-bold text-midnight ring-2 ring-white [clip-path:polygon(16%_0,100%_0,100%_100%,0_100%,0_22%)]"
          aria-hidden="true"
        >
          {badgeText}
        </span>
      ) : null}
    </Link>
  );
}

function UserProfileBadge({
  user,
  compact = false,
}: {
  user: SessionUser;
  compact?: boolean;
}) {
  const providerLabel = getProviderLabel(user.provider);
  const displayName = getDisplayName(user);
  const initials = getInitials(user);
  const accessibleLabel = `Signed in as ${displayName} via ${providerLabel}`;

  if (compact) {
    return (
      <div
        className="relative h-9 w-9 overflow-hidden rounded-full border border-midnight/20 bg-midnight text-white shadow-sm"
        role="img"
        aria-label={accessibleLabel}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Profile avatar for ${displayName}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wide">
            {initials}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl border border-midnight/10 bg-white px-2.5 py-1.5 shadow-sm"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <div className="relative h-9 w-9 overflow-hidden rounded-full border border-midnight/20 bg-midnight text-white">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Profile avatar for ${displayName}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wide">
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] leading-tight text-[#64748B]">Signed in</p>
        <p className="max-w-[11rem] truncate text-sm font-semibold leading-tight text-midnight">
          {displayName}
        </p>
      </div>
    </div>
  );
}

export function Navigation({
  user,
  onboarding,
  notificationUnreadCount = 0,
  variant = 'default',
}: {
  user: SessionUser | null;
  onboarding: OnboardingProgress;
  notificationUnreadCount?: number;
  variant?: NavigationVariant;
}) {
  const rootData = useRouteLoaderData<{ csrfToken?: string; csrfFieldName?: string }>('root');
  const csrfToken = rootData?.csrfToken ?? '';
  const csrfFieldName = rootData?.csrfFieldName ?? 'csrfToken';

  const primaryMenuItems = user ? memberPrimaryMenuItems : guestMenuItems;
  const secondaryMenuItems = user ? memberSecondaryMenuItems : [];

  const isDashboardShell = variant === 'dashboard' && Boolean(user);
  const shouldRenderTopNavMenu = !isDashboardShell;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const timer = setTimeout(() => {
      firstMenuItemRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const headerClasses = isDashboardShell
    ? 'sticky top-0 z-50 border-b border-midnight/10 bg-white/95 shadow-[0_8px_30px_rgba(13,43,69,0.08)] backdrop-blur-xl'
    : `sticky top-0 z-50 transition-all duration-300 motion-reduce:transition-none ${
        isScrolled
          ? 'border-b border-midnight/5 bg-white/98 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl'
          : 'bg-gradient-to-b from-midnight/20 to-transparent'
      }`;

  const navShellClasses = isDashboardShell
    ? 'mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:h-20 lg:px-8'
    : 'mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:h-20 lg:px-8';

  const brandWordmarkClasses = isDashboardShell
    ? 'font-heading text-xl font-bold tracking-tight text-midnight sm:text-2xl'
    : 'font-heading text-2xl font-bold tracking-tight text-midnight';

  return (
    <header className={headerClasses}>
      <nav className={navShellClasses} aria-label="Main navigation">
        <div className={`flex items-center ${isDashboardShell ? 'gap-2.5' : 'gap-3'}`}>
          <Link
            to={user ? '/dashboard' : '/'}
            className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
            aria-label="PaTan™ home"
            onClick={() => isMenuOpen && closeMenu()}
          >
            <span
              className={`relative flex items-center justify-center ${
                isDashboardShell ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-11 sm:w-11'
              }`}
            >
              <img
                src="/brand/logos/logo-sm.png"
                alt=""
                className="h-full w-auto transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                aria-hidden="true"
              />
            </span>
            <span className={brandWordmarkClasses}>PaTan™</span>
          </Link>

          {isDashboardShell ? (
            <p className="hidden rounded-full border border-midnight/10 bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-midnight/80 md:inline-flex">
              Dashboard
            </p>
          ) : null}
        </div>

        {shouldRenderTopNavMenu ? (
          <ul className="hidden items-center gap-1.5 lg:flex" role="list">
            {primaryMenuItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `inline-flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
                      isScrolled
                        ? isActive
                          ? 'bg-surface text-midnight'
                          : 'text-text-secondary hover:bg-surface/80 hover:text-midnight'
                        : isActive
                          ? 'bg-white/15 text-golden'
                          : 'text-white drop-shadow-sm hover:bg-white/10 hover:text-golden'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}

            {secondaryMenuItems.length > 0 ? (
              <>
                <li aria-hidden="true" className="mx-2 h-7 w-px bg-midnight/15" />
                {secondaryMenuItems.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `inline-flex min-h-[44px] items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
                          isScrolled
                            ? isActive
                              ? 'bg-surface text-midnight'
                              : 'text-[#526277] hover:bg-surface/85 hover:text-midnight'
                            : isActive
                              ? 'bg-white/15 text-golden'
                              : 'text-white drop-shadow-sm hover:bg-white/10 hover:text-golden'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </>
            ) : null}
          </ul>
        ) : null}

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {onboarding.isRequired ? (
                <Link
                  to={onboarding.resumeHref}
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-forest/20 bg-[#ECF9F0] px-3.5 py-2 text-sm font-semibold text-forest transition-colors duration-200 hover:bg-[#DDF2E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                  aria-label={`Resume onboarding, step ${onboarding.step} of 2`}
                >
                  Continue setup {onboarding.step}/2
                </Link>
              ) : null}

              <NotificationBellLink unreadCount={notificationUnreadCount} />

              <Link
                to="/profile"
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                aria-label="Open your profile"
              >
                <UserProfileBadge user={user} />
              </Link>

              <Form method="post" action="/logout">
                <input type="hidden" name={csrfFieldName} value={csrfToken} />
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-midnight/15 bg-white px-4 py-2.5 text-sm font-medium text-midnight transition-colors duration-200 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                  aria-label="Sign out and switch account"
                >
                  Sign Out
                </button>
              </Form>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`inline-flex min-h-[44px] items-center rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
                  isScrolled
                    ? 'text-secondary hover:bg-surface hover:text-midnight'
                    : 'text-midnight drop-shadow-sm hover:bg-white/10 hover:text-golden'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className={`inline-flex min-h-[44px] items-center rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
                  isScrolled
                    ? 'bg-midnight text-white shadow-sm hover:-translate-y-0.5 hover:bg-midnight-hover hover:shadow-md'
                    : 'bg-white text-midnight shadow-lg hover:-translate-y-0.5 hover:bg-golden hover:text-midnight hover:shadow-xl'
                }`}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          {user ? (
            <>
              <NotificationBellLink unreadCount={notificationUnreadCount} compact />
              <Link
                to="/profile"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                aria-label="Open your profile"
              >
                <UserProfileBadge user={user} compact />
              </Link>
            </>
          ) : null}

          <button
            ref={menuButtonRef}
            type="button"
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${
              isScrolled || isDashboardShell
                ? 'text-secondary hover:bg-surface hover:text-midnight active:bg-border'
                : 'text-midnight drop-shadow-sm hover:bg-midnight hover:text-golden active:bg-white/20'
            } ${isMenuOpen ? 'bg-surface' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
            <div className="relative h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${
                  isMenuOpen ? 'top-[7px] h-1 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${
                  isMenuOpen ? 'h-1 scale-x-0 opacity-0' : 'scale-x-100 opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 motion-reduce:transition-none ${
                  isMenuOpen ? 'top-[7px] h-1 -rotate-45' : 'top-[14px]'
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 ${isDashboardShell ? 'top-[4.25rem] sm:top-[4.5rem]' : 'top-16'} bg-midnight/10 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none lg:hidden z-40 ${
          isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={user ? 'Account and navigation menu' : 'Navigation menu'}
        className={`fixed inset-x-4 ${isDashboardShell ? 'top-[4.75rem] sm:top-20' : 'top-[4.5rem]'} z-50 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-midnight/5 transition-all duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          isMenuOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        <nav className="max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain p-3" aria-label="Mobile navigation">
          {shouldRenderTopNavMenu ? (
            <>
              <ul className="space-y-1" role="list">
                {primaryMenuItems.map((item, index) => (
                  <li key={item.href}>
                    <NavLink
                      ref={index === 0 ? firstMenuItemRef : undefined}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex min-h-[52px] items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200 motion-reduce:transition-none ${
                          isActive
                            ? 'bg-golden-glow text-midnight'
                            : 'text-text-body hover:bg-surface hover:text-midnight active:bg-border'
                        }`
                      }
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {secondaryMenuItems.length > 0 ? (
                <>
                  <p
                    className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]"
                    id="mobile-explore-label"
                  >
                    Explore
                  </p>
                  <ul className="mt-2 space-y-1" role="list" aria-labelledby="mobile-explore-label">
                    {secondaryMenuItems.map((item) => (
                      <li key={item.href}>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 motion-reduce:transition-none ${
                              isActive
                                ? 'bg-golden-glow text-midnight'
                                : 'text-text-body hover:bg-surface hover:text-midnight active:bg-border'
                            }`
                          }
                          onClick={closeMenu}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          ) : null}

          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {user ? (
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    onClick={closeMenu}
                    aria-label="Open your profile"
                  >
                    <UserProfileBadge user={user} compact />
                  </Link>
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B]">Signed in via {getProviderLabel(user.provider)}</p>
                    <p className="truncate text-sm font-semibold text-midnight">{getDisplayName(user)}</p>
                  </div>
                </div>

                <Link
                  ref={!shouldRenderTopNavMenu ? firstMenuItemRef : undefined}
                  to="/notifications"
                  className="mt-3 inline-flex w-full min-h-[44px] items-center justify-between rounded-xl border border-midnight/15 bg-white px-3 py-2.5 text-sm font-semibold text-midnight transition-colors duration-200 hover:bg-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                  onClick={closeMenu}
                >
                  Notifications
                  {notificationUnreadCount > 0 ? (
                    <span className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-golden px-1 text-[10px] font-bold text-midnight">
                      {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[#64748B]">All read</span>
                  )}
                </Link>

                {onboarding.isRequired ? (
                  <Link
                    to={onboarding.resumeHref}
                    className="mt-3 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-forest/20 bg-[#ECF9F0] text-sm font-semibold text-forest transition-colors duration-200 hover:bg-[#DDF2E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    onClick={closeMenu}
                    aria-label={`Resume onboarding, step ${onboarding.step} of 2`}
                  >
                    Resume setup ({onboarding.step}/2)
                  </Link>
                ) : null}

                <Form method="post" action="/logout" className="mt-3">
                  <input type="hidden" name={csrfFieldName} value={csrfToken} />
                  <button
                    type="submit"
                    className="w-full min-h-[44px] rounded-xl border border-midnight/15 bg-white px-4 py-2.5 text-sm font-medium text-midnight transition-colors duration-200 hover:bg-border/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    aria-label="Sign out and switch account"
                    onClick={closeMenu}
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border px-4 py-3.5 text-base font-medium text-text-body transition-all duration-200 motion-reduce:transition-none hover:bg-surface hover:text-midnight active:bg-border"
                  onClick={closeMenu}
                  ref={!shouldRenderTopNavMenu ? firstMenuItemRef : undefined}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-midnight px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 motion-reduce:transition-none hover:bg-midnight-hover"
                  onClick={closeMenu}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
