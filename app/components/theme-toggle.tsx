/**
 * ThemeToggle — animated sun/moon switch for the PaTan™ design system.
 *
 * Reads/writes `patan-theme` in localStorage and toggles the `dark` class on
 * <html>. The no-flash init script in root.tsx applies the stored/preferred
 * theme before first paint, so this component only needs to sync state on mount.
 * The icon swap animates via the `icon-motion-*` classes (reduced-motion safe).
 */

import { useEffect, useState } from 'react';
import { Icon } from '~/components/icon';

const STORAGE_KEY = 'patan-theme';

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(isDarkMode());
  }, []);

  const toggle = () => {
    const next = !isDarkMode();
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // localStorage may be unavailable (private mode); class still applied.
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border border-midnight/10 bg-surface/60 text-midnight backdrop-blur-md transition-all hover:bg-surface hover:shadow-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-dawn dark:hover:bg-white/10 ${className}`}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} motion="spin" />
    </button>
  );
}
