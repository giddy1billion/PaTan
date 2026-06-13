import { useEffect, useRef } from "react";
import { Link } from "react-router";

type ErrorAction = {
  to: string;
  label: string;
  variant: "primary" | "secondary";
  external?: boolean;
};

type ErrorPageViewProps = {
  /** Large status glyph, e.g. "404". */
  code: string;
  /** Accessible, human-readable page title. */
  title: string;
  /** Supportive explanation in brand voice. */
  description: string;
  /** Optional smaller note (e.g. requested path or status text). */
  hint?: string;
  /** Navigation actions offered to the reader. */
  actions: ErrorAction[];
  /** Role for the live region wrapper. Defaults to "main" semantics. */
  tone?: "notFound" | "error";
};

/**
 * Shared, brand-compliant error surface.
 *
 * Accessibility:
 * - Renders a single <main> landmark with an h1 that receives focus on mount,
 *   so keyboard and screen-reader users are oriented immediately.
 * - Uses semantic headings and 44px+ touch targets with visible focus rings.
 * - The decorative status glyph is hidden from assistive tech.
 */
export function ErrorPageView({
  code,
  title,
  description,
  hint,
  actions,
  tone = "error",
}: ErrorPageViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main
      id="main-content"
      className="page-modern min-h-screen bg-dawn flex items-center"
    >
      <section
        className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24 text-center"
        aria-labelledby="error-heading"
      >
        <p
          aria-hidden="true"
          className="font-heading text-[5rem] leading-none font-black tracking-tight text-midnight/15 sm:text-[7rem] lg:text-[8rem]"
        >
          {code}
        </p>

        <span
          className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            tone === "notFound"
              ? "bg-golden-glow text-midnight"
              : "bg-[var(--color-error-bg)] text-[var(--color-error)]"
          }`}
        >
          {tone === "notFound" ? "Page not found" : "Something went wrong"}
        </span>

        <h1
          id="error-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 font-heading text-3xl font-bold text-midnight outline-none sm:text-4xl lg:text-5xl"
        >
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-night/75 sm:text-lg">
          {description}
        </p>

        {hint ? (
          <p className="mx-auto mt-3 max-w-xl break-words text-sm text-night/55">
            {hint}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          {actions.map((action) =>
            action.external ? (
              <a
                key={`${action.to}-${action.label}`}
                href={action.to}
                className={
                  action.variant === "primary"
                    ? "btn-primary min-h-[44px] w-full px-6 py-3 text-base sm:w-auto"
                    : "min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white px-6 py-3 text-base font-semibold text-midnight transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 sm:w-auto"
                }
              >
                {action.label}
              </a>
            ) : (
              <Link
                key={`${action.to}-${action.label}`}
                to={action.to}
                className={
                  action.variant === "primary"
                    ? "btn-primary min-h-[44px] w-full px-6 py-3 text-base sm:w-auto"
                    : "min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white px-6 py-3 text-base font-semibold text-midnight transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 sm:w-auto"
                }
              >
                {action.label}
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Brand-compliant 404 view. `isAuthenticated` tailors the primary action
 * toward the dashboard for signed-in members, or home for visitors.
 */
export function NotFoundView({
  isAuthenticated = false,
  hint,
}: {
  isAuthenticated?: boolean;
  hint?: string;
}) {
  const actions: ErrorAction[] = isAuthenticated
    ? [
        { to: "/dashboard", label: "Back to dashboard", variant: "primary" },
        { to: "/discover", label: "Discover stories", variant: "secondary" },
        { to: "/help", label: "Visit help center", variant: "secondary" },
      ]
    : [
        { to: "/", label: "Return home", variant: "primary" },
        { to: "/discover", label: "Discover stories", variant: "secondary" },
        { to: "/help", label: "Visit help center", variant: "secondary" },
      ];

  return (
    <ErrorPageView
      tone="notFound"
      code="404"
      title="We could not find that page"
      description="The page you are looking for may have moved, been renamed, or never existed. Let us help you find your way back to something meaningful."
      hint={hint}
      actions={actions}
    />
  );
}

/**
 * Brand-compliant view for unexpected (non-404) errors.
 */
export function GenericErrorView({
  isAuthenticated = false,
  description,
  hint,
}: {
  isAuthenticated?: boolean;
  description?: string;
  hint?: string;
}) {
  return (
    <ErrorPageView
      tone="error"
      code="500"
      title="Something went wrong on our end"
      description={
        description ??
        "An unexpected error interrupted your journey. Please try again in a moment, and reach out to support if it keeps happening."
      }
      hint={hint}
      actions={[
        {
          to: isAuthenticated ? "/dashboard" : "/",
          label: isAuthenticated ? "Back to dashboard" : "Return home",
          variant: "primary",
        },
        { to: "/help", label: "Visit help center", variant: "secondary" },
      ]}
    />
  );
}
