import { Form, Link, NavLink } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionUser } from '~/utils/auth.server';

const menuItems = [
  { label: 'Discover Stories', href: '/discover' },
  { label: 'Journeys', href: '/journeys' },
  { label: 'Aspirations', href: '/aspirations' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
];

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

type OnboardingProgress = {
  isRequired: boolean;
  step: 1 | 2;
  resumeHref: string;
};

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
        className="relative w-9 h-9 rounded-full overflow-hidden bg-midnight text-white border border-midnight/20 shadow-sm"
        role="img"
        aria-label={accessibleLabel}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Profile avatar for ${displayName}`}
            className="w-full h-full object-cover"
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
      className="inline-flex items-center gap-2 rounded-2xl border border-midnight/10 bg-white/95 px-2.5 py-1.5 min-h-[44px] shadow-sm"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-midnight text-white border border-midnight/20">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`Profile avatar for ${displayName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tracking-wide">
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#64748B] leading-tight">Signed in</p>
        <p className="text-sm font-semibold text-midnight leading-tight truncate max-w-[9rem] xl:max-w-[11rem]">
          {displayName}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-[#FDF3D6] text-[#996A00] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {providerLabel}
      </span>
    </div>
  );
}

export function Navigation({
  user,
  onboarding,
}: {
  user: SessionUser | null;
  onboarding: OnboardingProgress;
}) {
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
    if (isMenuOpen) {
      const timer = setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
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

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (!isMenuOpen || !menuRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`
        sticky top-0 z-50
        transition-all duration-300 motion-reduce:transition-none
        ${isScrolled
          ? 'bg-white/98 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] border-b border-midnight/5'
          : 'bg-gradient-to-b from-midnight/20 to-transparent'
        }
      `}
    >
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded-lg group min-h-[44px] shrink-0"
            aria-label="PaTan™ home"
            onClick={() => isMenuOpen && closeMenu()}
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <img
                src="/brand/logos/logo-sm.png"
                alt=""
                className="h-full w-auto transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                aria-hidden="true"
              />
            </div>
            <span className={`font-heading text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 motion-reduce:transition-none ${isScrolled ? 'text-midnight' : 'text-midnight drop-shadow-sm'}`}>
              PaTan™
            </span>
          </Link>

          <ul className="hidden lg:flex items-center gap-1 xl:gap-2" role="list">
            {menuItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 min-h-[44px] inline-flex items-center
                    after:absolute after:bottom-1 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:transition-all after:duration-200
                    ${isScrolled
                      ? isActive
                        ? 'text-midnight bg-surface after:bg-golden'
                        : 'text-text-secondary hover:text-midnight hover:bg-surface/80 after:bg-transparent hover:after:bg-midnight/10'
                      : isActive
                        ? 'text-golden bg-white/15 after:bg-golden drop-shadow-sm'
                        : 'text-white hover:text-golden hover:bg-white/10 after:bg-transparent hover:after:bg-white/30 drop-shadow-sm'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <UserProfileBadge user={user} />
                {onboarding.isRequired ? (
                  <Link
                    to={onboarding.resumeHref}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide text-forest border border-forest/20 bg-[#ECF9F0] hover:bg-[#DDF2E4] transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                    aria-label={`Resume onboarding, step ${onboarding.step} of 2`}
                  >
                    Setup {onboarding.step}/2
                  </Link>
                ) : null}
                <Form method="post" action="/logout">
                  <button
                    type="submit"
                    className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-midnight border border-midnight/15 bg-white/90 hover:bg-surface transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                    aria-label="Sign out and switch account"
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded-xl min-h-[44px] inline-flex items-center ${
                    isScrolled
                      ? 'text-secondary hover:text-midnight hover:bg-surface'
                      : 'text-midnight hover:text-golden hover:bg-white/10 drop-shadow-sm'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className={`
                    text-sm font-semibold min-h-[44px] px-6 py-2.5 rounded-xl inline-flex items-center
                    transition-all duration-300 motion-reduce:transition-none
                    ${isScrolled
                      ? 'bg-midnight text-white hover:bg-midnight-hover shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      : 'bg-white text-midnight hover:bg-golden hover:text-midnight shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2
                  `}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user ? <UserProfileBadge user={user} compact /> : null}

            <button
              ref={menuButtonRef}
              type="button"
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden transition-all duration-200 motion-reduce:transition-none ${
                isScrolled
                  ? 'text-secondary hover:text-midnight hover:bg-surface active:bg-border'
                  : 'text-midnight hover:text-golden hover:bg-midnight active:bg-white/20 drop-shadow-sm'
              } ${isMenuOpen ? 'bg-surface' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <div className="relative w-5 h-4">
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    isMenuOpen ? 'top-[7px] rotate-45 h-1' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] w-5 h-0.5 bg-current rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    isMenuOpen ? 'opacity-0 scale-x-0 h-1' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    isMenuOpen ? 'top-[7px] -rotate-45 h-1' : 'top-[14px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`
          fixed inset-0 top-16 sm:top-18 bg-midnight/10 backdrop-blur-sm
          transition-opacity duration-300 motion-reduce:transition-none lg:hidden z-40
          ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`
          fixed inset-x-4 top-[4.5rem] sm:top-[5rem] bg-white shadow-2xl rounded-2xl
          transition-all duration-300 ease-out motion-reduce:transition-none lg:hidden z-50
          max-h-[calc(100vh-6rem)] overflow-hidden
          ring-1 ring-midnight/5
          ${isMenuOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-[0.98] pointer-events-none'
          }
        `}
      >
        <nav className="overflow-y-auto overscroll-contain max-h-[calc(100vh-6rem)] p-3" aria-label="Mobile navigation">
          <ul className="space-y-1" role="list">
            {menuItems.map((item, index) => (
              <li key={item.href}>
                <NavLink
                  ref={index === 0 ? firstMenuItemRef : undefined}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 motion-reduce:transition-none min-h-[52px] ${
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

          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {user ? (
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center gap-3">
                  <UserProfileBadge user={user} compact />
                  <div className="min-w-0">
                    <p className="text-xs text-[#64748B]">Signed in via {getProviderLabel(user.provider)}</p>
                    <p className="text-sm font-semibold text-midnight truncate">{getDisplayName(user)}</p>
                  </div>
                </div>
                {onboarding.isRequired ? (
                  <Link
                    to={onboarding.resumeHref}
                    className="mt-3 w-full inline-flex min-h-[44px] items-center justify-center rounded-xl text-sm font-semibold text-forest border border-forest/20 bg-[#ECF9F0] hover:bg-[#DDF2E4] transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    onClick={closeMenu}
                    aria-label={`Resume onboarding, step ${onboarding.step} of 2`}
                  >
                    Resume setup ({onboarding.step}/2)
                  </Link>
                ) : null}
                <Form method="post" action="/logout" className="mt-3">
                  <button
                    type="submit"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-midnight border border-midnight/15 bg-white hover:bg-border/50 transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
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
                  className="flex items-center justify-center w-full px-4 py-3.5 rounded-xl text-base font-medium text-text-body hover:bg-surface hover:text-midnight active:bg-border transition-all duration-200 motion-reduce:transition-none min-h-[52px] border border-border"
                  onClick={closeMenu}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center w-full px-4 py-3.5 rounded-xl text-base font-semibold bg-midnight text-white hover:bg-midnight-hover transition-all duration-200 motion-reduce:transition-none min-h-[52px] shadow-sm"
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
