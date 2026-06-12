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
