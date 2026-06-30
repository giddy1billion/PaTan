/**
 * PaTan™ UI Component Library
 * 
 * Brand-aligned, accessible components following PaTan™ design system.
 * Uses Tailwind v4 with custom brand tokens defined in app.css.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

/**
 * Primary button for main CTAs
 * Uses Golden Light for hope and celebration
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  const variants = {
    primary: 'bg-golden text-midnight hover:bg-soft-gold focus-visible:ring-golden',
    secondary: 'bg-transparent text-midnight border-2 border-midnight hover:bg-midnight hover:text-dawn focus-visible:ring-midnight dark:text-dawn dark:border-dawn dark:hover:bg-dawn dark:hover:text-midnight',
    ghost: 'bg-transparent text-midnight hover:bg-mist/50 focus-visible:ring-golden dark:text-dawn dark:hover:bg-midnight/50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

/**
 * Inline loading spinner used by action buttons.
 * Hidden when the user prefers reduced motion.
 */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin motion-reduce:animate-none ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this button's action is currently in flight. */
  busy?: boolean;
  /** Optional label shown while busy. Falls back to children when omitted. */
  pendingLabel?: ReactNode;
  children: ReactNode;
}

/**
 * Action button with a built-in, accessible loading state.
 *
 * Preserves the caller's existing className (e.g. `btn-primary`) so it can be
 * dropped into existing forms. When `busy` is true it disables the button,
 * sets `aria-busy`, and shows a spinner alongside an optional pending label.
 */
export function SubmitButton({
  busy = false,
  pendingLabel,
  disabled,
  children,
  className = '',
  type = 'submit',
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {busy ? <ButtonSpinner /> : null}
        <span>{busy ? (pendingLabel ?? children) : children}</span>
      </span>
    </button>
  );
}

// ============================================================================
// ENGAGEMENT BUTTONS
// ============================================================================

interface EngagementButtonProps {
  type: 'celebrate' | 'uplift' | 'empathy';
  count: number;
  pressed: boolean;
  onClick: () => void;
  storyTitle?: string;
}

const engagementIcons = {
  celebrate: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  uplift: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  empathy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
};

const engagementLabels = {
  celebrate: 'Celebrate',
  uplift: 'Uplift',
  empathy: 'Show empathy',
};

/**
 * Engagement reaction button (Celebrate, Uplift, Empathy)
 * Accessible with aria-label and aria-pressed states
 */
export function EngagementButton({
  type,
  count,
  pressed,
  onClick,
  storyTitle = 'this story',
}: EngagementButtonProps) {
  const label = `${engagementLabels[type]} ${storyTitle}. ${count} ${count === 1 ? 'person has' : 'people have'} ${type === 'celebrate' ? 'celebrated' : type === 'uplift' ? 'uplifted' : 'shown empathy'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden
        ${pressed
          ? 'bg-golden/20 text-midnight'
          : 'bg-mist/50 text-midnight hover:bg-mist dark:bg-midnight/30 dark:text-dawn'
        }
      `}
    >
      {engagementIcons[type]}
      <span>{count}</span>
    </button>
  );
}

// ============================================================================
// STATUS BADGES
// ============================================================================

interface BadgeProps {
  status: 'pending' | 'in-progress' | 'achieved' | 'granted' | 'transformed';
  children?: ReactNode;
}

const statusConfig = {
  pending: { bg: 'bg-mist', text: 'text-night/70', icon: '○' },
  'in-progress': { bg: 'bg-golden/10', text: 'text-golden', icon: '◐' },
  achieved: { bg: 'bg-success/10', text: 'text-success', icon: '✓' },
  granted: { bg: 'bg-forest/10', text: 'text-forest', icon: '★' },
  transformed: { bg: 'bg-golden/20', text: 'text-golden', icon: '✦' },
};

const statusLabels = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  achieved: 'Achieved',
  granted: 'Granted',
  transformed: 'Transformed',
};

/**
 * Aspiration status badge
 * Shows progress status with accessible icon + text
 */
export function StatusBadge({ status, children }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {children || statusLabels[status]}
    </span>
  );
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
}

/**
 * Card container with brand styling
 */
export function Card({ children, className = '', as: Component = 'div' }: CardProps) {
  return (
    <Component
      className={`bg-white rounded-xl shadow-sm border border-mist p-6 dark:bg-night dark:border-midnight/30 ${className}`}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Accessible form input with label and error states
 */
export function Input({
  label,
  hint,
  error,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-midnight dark:text-dawn">
        {label}
      </label>
      
      <input
        id={inputId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        className={`
          w-full px-4 py-3 rounded-lg border
          bg-white dark:bg-night
          text-midnight dark:text-dawn
          placeholder:text-mist
          focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent
          ${error ? 'border-error' : 'border-mist'}
          ${className}
        `}
        {...props}
      />
      
      {hint && !error && (
        <p id={hintId} className="text-sm text-night/60 dark:text-dawn/60">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

/**
 * Accessible textarea for story content
 */
export function Textarea({
  label,
  hint,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-midnight dark:text-dawn">
        {label}
      </label>
      
      <textarea
        id={inputId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        className={`
          w-full px-4 py-3 rounded-lg border min-h-[120px] resize-y
          bg-white dark:bg-night
          text-midnight dark:text-dawn
          placeholder:text-mist
          focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent
          ${error ? 'border-error' : 'border-mist'}
          ${className}
        `}
        {...props}
      />
      
      {hint && !error && (
        <p id={hintId} className="text-sm text-night/60 dark:text-dawn/60">
          {hint}
        </p>
      )}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON LOADING COMPONENTS
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'heading' | 'avatar' | 'card' | 'custom';
  lines?: number;
}

/**
 * Progressive content loading placeholder.
 * Replaces spinners with layout-preserving shimmer shapes.
 */
export function Skeleton({ className = '', variant = 'custom', lines = 1 }: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton skeleton-text ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  const variantClass = {
    text: 'skeleton skeleton-text w-full',
    heading: 'skeleton skeleton-heading',
    avatar: 'skeleton skeleton-avatar',
    card: 'skeleton skeleton-card w-full',
    custom: 'skeleton',
  }[variant];

  return (
    <div className={`${variantClass} ${className}`} role="status" aria-label="Loading">
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Full card skeleton with header, body, and footer placeholders.
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card space-y-4 ${className}`} role="status" aria-label="Loading card">
      <div className="flex items-center gap-3">
        <div className="skeleton skeleton-avatar" />
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-1/3" />
          <div className="skeleton skeleton-text w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text w-full" />
        <div className="skeleton skeleton-text w-5/6" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="skeleton h-8 w-20 rounded-full" />
        <div className="skeleton h-8 w-16 rounded-full" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardized empty state for when no content exists.
 * Always provides guidance and a next action.
 */
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h3 className="empty-state-title">{title}</h3>
      {description ? <p className="empty-state-description">{description}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Accessible progress indicator with smooth transitions.
 */
export function ProgressBar({ value, max = 100, size = 'md', label, className = '' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClass = size === 'sm' ? 'progress-sm' : size === 'lg' ? 'progress-lg' : '';

  return (
    <div className={className}>
      {label ? (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-sm text-text-secondary">{Math.round(percentage)}%</span>
        </div>
      ) : null}
      <div
        className={`progress ${sizeClass}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div className="progress-bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ============================================================================
// AVATAR
// ============================================================================

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * User avatar with image or initials fallback.
 */
export function Avatar({ src, alt = '', fallback = '?', size = 'md', className = '' }: AvatarProps) {
  return (
    <span className={`avatar avatar-${size} ${className}`} role="img" aria-label={alt || 'User avatar'}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <span aria-hidden="true">{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

// ============================================================================
// DIALOG / MODAL
// ============================================================================

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible modal dialog with backdrop and proper ARIA roles.
 */
export function Dialog({ open, onClose, title, description, children, className = '' }: DialogProps) {
  if (!open) return null;

  return (
    <>
      <div className="dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        className={`dialog-panel ${className}`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="dialog-title" className="text-lg font-semibold text-text-primary font-heading">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-2 -mt-1"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        {description ? (
          <p id="dialog-description" className="text-sm text-text-secondary mb-4">{description}</p>
        ) : null}
        {children}
      </div>
    </>
  );
}

// ============================================================================
// DIVIDER
// ============================================================================

interface DividerProps {
  className?: string;
  label?: string;
}

/**
 * Visual content separator with optional inline label.
 */
export function Divider({ className = '', label }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`} role="separator">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return <hr className={`divider ${className}`} />;
}

// ============================================================================
// ALERT / NOTICE
// ============================================================================

interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const alertVariantConfig = {
  success: { bg: 'bg-success-bg', border: 'border-success/30', text: 'text-success-accessible', icon: '\u2713' },
  warning: { bg: 'bg-warning-bg', border: 'border-warning/30', text: 'text-[#7C2D12]', icon: '!' },
  error: { bg: 'bg-error-bg', border: 'border-error/30', text: 'text-error-accessible', icon: '\u2715' },
  info: { bg: 'bg-info-bg', border: 'border-info/30', text: 'text-info-accessible', icon: 'i' },
};

/**
 * Contextual alert banner for feedback messages.
 */
export function Alert({ variant, title, children, className = '', dismissible, onDismiss }: AlertProps) {
  const config = alertVariantConfig[variant];

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${config.bg} ${config.border} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 text-sm font-bold ${config.text}`} aria-hidden="true">
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          {title ? <p className={`text-sm font-semibold ${config.text}`}>{title}</p> : null}
          <div className={`text-sm ${config.text} ${title ? 'mt-0.5' : ''}`}>{children}</div>
        </div>
        {dismissible && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={`flex-shrink-0 btn-icon !min-h-[32px] !min-w-[32px] ${config.text}`}
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
