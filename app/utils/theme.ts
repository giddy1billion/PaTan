/**
 * Theme management utilities.
 * Dark mode uses class-based switching on <html>.
 * Persists preference in localStorage, respects system preference as default.
 */

const STORAGE_KEY = 'patan-theme';

export type Theme = 'light' | 'dark' | 'system';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'system';
}

export function setStoredTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  if (theme === 'system') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyThemeClass(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Initialize theme on page load (call in root layout effect).
 * Returns the resolved theme for state tracking.
 */
export function initializeTheme(): 'light' | 'dark' {
  const stored = getStoredTheme();
  const resolved = resolveTheme(stored);
  applyThemeClass(resolved);
  return resolved;
}
