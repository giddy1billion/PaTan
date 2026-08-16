import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, Form, redirect, useNavigation, useRouteLoaderData, useSearchParams } from "react-router";
import { SubmitButton } from "~/components/ui";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
import { issuePasswordResetToken } from "~/utils/password-reset.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
import { db } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Reset Password | PaTan™" },
    {
      name: "description",
      content: "Reset your PaTan™ password to regain access to your account.",
    },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const csrfToken = String(formData.get("csrfToken") ?? "");

  // CSRF verification
  const hasValidCsrf = await verifyCsrfToken({
    request,
    submittedToken: csrfToken,
  });
  if (!hasValidCsrf) {
    await logAuthSecurityEvent({
      request,
      eventType: "csrf_failure",
      severity: "warn",
      outcome: "blocked",
      route: "/forgot-password",
      email: email || undefined,
    });
    return redirect("/forgot-password?error=invalid-csrf");
  }

  // Rate limiting
  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "password-reset",
    identifier: email || undefined,
  });
  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      route: "/forgot-password",
      email: email || undefined,
    });
    return redirect("/forgot-password?error=rate-limited", {
      headers: rateLimit.headers,
    });
  }

  if (!email) {
    return redirect("/forgot-password?error=invalid-email");
  }

  // Look up user by email
  const user = await db.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Always redirect to success page (prevents email enumeration)
  const redirectLocation = "/forgot-password?sent=true";

  if (!user) {
    return redirect(redirectLocation);
  }

  try {
    const result = await issuePasswordResetToken({
      userId: user.id,
      email: user.email,
      requestUrl: request.url,
    });

    await logAuthSecurityEvent({
      request,
      eventType: "password_reset_sent",
      severity: "info",
      outcome: "sent",
      userId: user.id,
      email: user.email,
      route: "/forgot-password",
      metadata: {
        expiresAt: result.expiresAt.toISOString(),
        provider: "resend",
      },
    });
  } catch {
    await logAuthSecurityEvent({
      request,
      eventType: "password_reset_sent",
      severity: "warn",
      outcome: "failed",
      email,
      route: "/forgot-password",
    });
  }

  return redirect(redirectLocation);
}

export async function loader() {
  return null;
}

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const rootData = useRouteLoaderData<{
    csrfToken?: string;
    csrfFieldName?: string;
  }>("root");
  const csrfToken = rootData?.csrfToken ?? "";
  const csrfFieldName = rootData?.csrfFieldName ?? "csrfToken";
  const isSending = navigation.state === "submitting";
  const isSent = searchParams.get("sent") === "true";
  
  return (
    <div className="min-h-screen page-modern flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded-lg"
          aria-label="Back to home"
        >
          <img
            src="/brand/logos/logo-sm.png"
            alt=""
            className="h-8 w-auto"
            aria-hidden="true"
          />
          <span className="font-heading text-lg font-bold text-midnight">
            PaTan™
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="page-modern flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-lg">
          <div className="page-hero-modern p-6 sm:p-8">
            <h1 className="font-heading text-2xl font-bold text-midnight text-center">
              Reset Your Password
            </h1>
            <p className="mt-2 text-center text-[#64748B]">
              Enter your email and we'll send you a reset link
            </p>

            {isSent && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center text-sm text-green-800">
                If an account exists with that email, you will receive a password reset link shortly.
              </div>
            )}

            <Form method="post" className="form-modern mt-8 space-y-6">
              <input type="hidden" name={csrfFieldName} value={csrfToken} />
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-night"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <SubmitButton
                className="w-full btn-primary py-3 text-base"
                busy={isSending}
                pendingLabel="Sending reset link…"
              >
                Send Reset Link
              </SubmitButton>
            </Form>

            <p className="mt-8 text-center text-sm text-night/60">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-medium text-[#2E6F40] hover:text-[#0D2B45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
