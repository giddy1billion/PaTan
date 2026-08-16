/**
 * PaTan™ Icon system
 *
 * One typed, tree-shakeable icon component with a shared 24px stroke vocabulary
 * (Lucide-compatible paths) and optional motion variants. Replaces the 29 files
 * of inconsistent inline <svg> (mixed viewBox/stroke/fill) with a single source
 * of truth. All motion is gated behind prefers-reduced-motion via the global
 * CSS guard in app.css.
 */

import type { SVGProps } from 'react';

export type IconName =
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-up'
  | 'arrow-right'
  | 'heart'
  | 'bell'
  | 'x'
  | 'menu'
  | 'sparkles'
  | 'shield'
  | 'shield-check'
  | 'star'
  | 'globe'
  | 'users'
  | 'clock'
  | 'mail'
  | 'lock'
  | 'user'
  | 'eye'
  | 'arrow-up-right'
  | 'plus'
  | 'trash'
  | 'edit'
  | 'settings'
  | 'search'
  | 'sun'
  | 'moon'
  | 'message'
  | 'book-open'
  | 'compass'
  | 'notification';

export type IconMotion =
  | 'none'
  | 'pulse'
  | 'bounce'
  | 'spin'
  | 'wiggle'
  | 'draw'
  | 'fill-on-press';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size; sets width/height. Default 20. */
  size?: number;
  /** Motion variant. Default 'none'. */
  motion?: IconMotion;
  /** Stroke width for outline icons. Default 1.75. */
  strokeWidth?: number;
  className?: string;
  /** Accessible label; when provided the icon is exposed to AT (not aria-hidden). */
  label?: string;
}

/**
 * Icon path data. Outline icons use fill="none" stroke="currentColor".
 * `filled` icons (heart, star) use fill="currentColor" for the fill-on-press motion.
 */
const ICON_PATHS: Record<IconName, { outline: string; filled?: string }> = {
  check: {
    outline: 'M20 6 9 17l-5-5',
  },
  'chevron-right': { outline: 'm9 18 6-6-6-6' },
  'chevron-left': { outline: 'm15 18-6-6 6-6' },
  'chevron-down': { outline: 'm6 9 6 6 6-6' },
  'arrow-up': { outline: 'M12 19V5M5 12l7-7 7 7' },
  'arrow-right': { outline: 'M5 12h14M12 5l7 7-7 7' },
  'arrow-up-right': { outline: 'M7 17 17 7M7 7h10v10' },
  heart: {
    outline:
      'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
    filled:
      'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
  },
  bell: {
    outline:
      'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  },
  x: { outline: 'M18 6 6 18M6 6l12 12' },
  menu: { outline: 'M4 6h16M4 12h16M4 18h16' },
  sparkles: {
    outline:
      'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
  },
  shield: { outline: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z' },
  'shield-check': {
    outline:
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4',
  },
  star: {
    outline:
      'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.971 0l-4.62 2.428a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L3.154 9.9a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
    filled:
      'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.971 0l-4.62 2.428a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L3.154 9.9a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  },
  globe: {
    outline:
      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  },
  users: {
    outline:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  clock: { outline: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' },
  mail: {
    outline:
      'm22 7-10 5L2 7M2 7v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z',
  },
  lock: {
    outline:
      'M19 11V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM12 15v2',
  },
  user: {
    outline:
      'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  eye: {
    outline:
      'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
  plus: { outline: 'M12 5v14M5 12h14' },
  trash: {
    outline:
      'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
  },
  edit: {
    outline:
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z',
  },
  settings: {
    outline:
      'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
  search: {
    outline: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  },
  sun: {
    outline:
      'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  },
  moon: { outline: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
  message: {
    outline:
      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
  'book-open': {
    outline:
      'M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  },
  compass: {
    outline:
      'M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  },
  notification: {
    outline:
      'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  },
};

const MOTION_CLASS: Record<IconMotion, string> = {
  none: '',
  pulse: 'icon-motion-pulse',
  bounce: 'icon-motion-bounce',
  spin: 'icon-motion-spin',
  wiggle: 'icon-motion-wiggle',
  draw: 'icon-motion-draw',
  'fill-on-press': 'icon-motion-fill',
};

/**
 * Animated, accessible icon. Decorative by default (aria-hidden); pass a
 * `label` to make it meaningful for assistive tech.
 */
export function Icon({
  name,
  size = 20,
  motion = 'none',
  strokeWidth = 1.75,
  className = '',
  label,
  ...props
}: IconProps) {
  const def = ICON_PATHS[name];
  if (!def) return null;

  const usesFill = motion === 'fill-on-press' && def.filled;
  const isLabeled = Boolean(label);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={usesFill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={isLabeled ? 'img' : undefined}
      aria-label={label}
      aria-hidden={isLabeled ? undefined : true}
      className={`patan-icon ${MOTION_CLASS[motion]} ${className}`.trim()}
      {...props}
    >
      <path d={usesFill ? def.filled! : def.outline} />
    </svg>
  );
}
