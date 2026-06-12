import { Link, NavLink } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';

const menuItems = [
  { label: 'Discover Stories', href: '/discover' },
  { label: 'Journeys', href: '/journeys' },
  { label: 'Aspirations', href: '/aspirations' },
  { label: 'Community', href: '/community' },
  { label: 'About', href: '/about' },
];

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  // Memoized close handler for performance
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    // Return focus to menu button
    menuButtonRef.current?.focus();
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      const timer = setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  // Close menu when clicking/touching outside
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

  // Handle Escape key
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

  // Focus trap within mobile menu
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

  // Prevent body scroll when menu is open
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
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded-lg group min-h-[44px] shrink-0"
            aria-label="PaTan home"
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
            <span className={`font-heading text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-300 motion-reduce:transition-none ${isScrolled ? 'text-midnight' : 'text-white drop-shadow-sm'}`}>
              PaTan
            </span>
          </Link>

          {/* Desktop Menu */}
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

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Link
              to="/login"
              className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded-xl min-h-[44px] inline-flex items-center ${
                isScrolled 
                  ? 'text-text-secondary hover:text-midnight hover:bg-surface' 
                  : 'text-white hover:text-golden hover:bg-white/10 drop-shadow-sm'
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
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            className={`lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden transition-all duration-200 motion-reduce:transition-none ${
              isScrolled 
                ? 'text-text-secondary hover:text-midnight hover:bg-surface active:bg-border' 
                : 'text-white hover:text-golden hover:bg-white/10 active:bg-white/20 drop-shadow-sm'
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
                  isMenuOpen ? 'top-[7px] rotate-45' : 'top-0'
                }`}
              />
              <span 
                className={`absolute left-0 top-[7px] w-5 h-0.5 bg-current rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                }`}
              />
              <span 
                className={`absolute left-0 w-5 h-0.5 bg-current rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  isMenuOpen ? 'top-[7px] -rotate-45' : 'top-[14px]'
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`
          fixed inset-0 top-16 sm:top-18 bg-midnight/10 backdrop-blur-sm
          transition-opacity duration-300 motion-reduce:transition-none lg:hidden z-40
          ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
        onClick={closeMenu}
      />

      {/* Mobile Menu Panel */}
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
          
          {/* Mobile Auth Actions */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
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
          </div>
        </nav>
      </div>
    </header>
  );
}
