import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useNavigation,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import { getAuthErrorMessage } from "~/utils/auth-errors";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { issueEmailVerification } from "~/utils/email-verification.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";

function getSafeRedirectTarget(target: string | null | undefined) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }

  return target;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Verify Email | PaTan" },
    {
      name: "description",
      content:
        "Verify your PaTan email to complete account security and continue to your destination.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const redirectTo = getSafeRedirectTarget(url.searchParams.get("redirectTo"));

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      displayName: true,
    },
  });

  if (!profile || !profile.email) {
    throw redirect("/login?error=session-expired");
  }

  return {
    profile,
    redirectTo,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const csrfToken = String(formData.get("csrfToken") ?? "");
  const redirectTo = getSafeRedirectTarget(String(formData.get("redirectTo") ?? ""));

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
      userId: user.id,
      email: user.email,
      route: "/verify-email",
    });

    return redirect(
      `/verify-email?error=invalid-csrf&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  if (intent !== "resend") {
    return redirect(`/verify-email?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  if (!profile || !profile.email) {
    return redirect("/login?error=session-expired");
  }

  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "mfa",
    identifier: profile.email,
  });

  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      userId: profile.id,
      email: profile.email,
      route: "/verify-email",
    });

    return redirect(
      `/verify-email?error=rate-limited&redirectTo=${encodeURIComponent(redirectTo)}`,
      { headers: rateLimit.headers },
    );
  }

  if (profile.emailVerified) {
    return redirect(
      `/verify-email?security=email-already-verified&redirectTo=${encodeURIComponent(redirectTo)}`,
      { headers: rateLimit.headers },
    );
  }

  try {
    await issueEmailVerification({
      userId: profile.id,
      email: profile.email,
      requestUrl: request.url,
      redirectTo,
    });

    await logAuthSecurityEvent({
      request,
      eventType: "email_verification_sent",
      severity: "info",
      outcome: "verify-page-resend",
      userId: profile.id,
      email: profile.email,
      route: "/verify-email",
    });

    return redirect(
      `/verify-email?security=verification-email-sent&redirectTo=${encodeURIComponent(redirectTo)}`,
      { headers: rateLimit.headers },
    );
  } catch {
    await logAuthSecurityEvent({
      request,
      eventType: "email_verification_sent",
      severity: "warn",
      outcome: "verify-page-send-failed",
      userId: profile.id,
      email: profile.email,
      route: "/verify-email",
    });

    return redirect(
      `/verify-email?error=email-verification-send-failed&redirectTo=${encodeURIComponent(redirectTo)}`,
      { headers: rateLimit.headers },
    );
  }
}

export default function VerifyEmailStatusRoute() {
  const { profile, redirectTo } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const rootData = useRouteLoaderData<{
    csrfToken?: string;
    csrfFieldName?: string;
  }>("root");
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");
  const securityCode = searchParams.get("security");
  const authError = getAuthErrorMessage(errorCode);
  const csrfToken = rootData?.csrfToken ?? "";
  const csrfFieldName = rootData?.csrfFieldName ?? "csrfToken";
  const destination = getSafeRedirectTarget(searchParams.get("redirectTo") ?? redirectTo);
  const isRefreshing = navigation.state === "loading";

  const statusMessage =
    securityCode === "verification-email-sent"
      ? "A fresh verification link has been sent to your inbox."
      : securityCode === "email-already-verified"
        ? "Your email is already verified."
        : securityCode === "email-verified"
          ? "Your email has been verified. You can continue now."
          : null;

  const isVerified = Boolean(profile.emailVerified);

  return (
    <div className="min-h-screen page-modern flex flex-col">
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
            PaTan
          </span>
        </Link>
      </header>

      <main
        id="main-content"
        className="page-modern flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-2xl">
          <div className="page-hero-modern p-6 sm:p-8">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-midnight text-center">
              Verify Your Email
            </h1>
            <p className="mt-2 text-center text-[#64748B]">
              Keep your account secure before accessing the full PaTan experience.
            </p>

            {authError ? (
              <div
                className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
                role="alert"
                aria-live="polite"
              >
                {authError}
              </div>
            ) : null}

            {statusMessage ? (
              <div
                className="mt-4 rounded-xl border border-[#2E6F40]/30 bg-[#DCFCE7]/60 px-4 py-3 text-sm text-[#14532D]"
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </div>
            ) : null}

            <section className="mt-6 rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6" aria-labelledby="verification-status-heading">
              <h2
                id="verification-status-heading"
                className="font-heading text-xl text-midnight"
              >
                Verification Status
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">Email</dt>
                  <dd className="mt-1 font-medium text-midnight break-all">{profile.email}</dd>
                </div>
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">Status</dt>
                  <dd className="mt-1 font-medium text-midnight">
                    {isVerified ? "Verified" : "Pending verification"}
                  </dd>
                </div>
              </dl>

              {isVerified ? (
                <Link
                  to={destination}
                  className="mt-4 inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-xl bg-midnight px-4 py-2 text-sm font-semibold text-white hover:bg-[#123A5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                >
                  Continue to your destination
                </Link>
              ) : (
                <Form method="post" className="mt-4 space-y-2">
                  <input type="hidden" name="intent" value="resend" />
                  <input type="hidden" name="redirectTo" value={destination} />
                  <input type="hidden" name={csrfFieldName} value={csrfToken} />
                  <button
                    type="submit"
                    className="min-h-[44px] w-full sm:w-auto rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                    aria-label="Resend verification link"
                  >
                    Resend verification link
                  </button>
                  <p className="text-xs text-night/60">
                    We always keep only the newest verification link active for your account.
                  </p>
                </Form>
              )}

              <Form method="get" className="mt-3" aria-live="polite">
                <input type="hidden" name="redirectTo" value={destination} />
                <button
                  type="submit"
                  className="min-h-[44px] w-full sm:w-auto rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="Check verification status again"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Checking status..." : "Check again"}
                </button>
              </Form>
            </section>

            <section className="mt-6 rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6" aria-labelledby="troubleshooting-heading">
              <h2 id="troubleshooting-heading" className="font-heading text-xl text-midnight">
                Troubleshooting
              </h2>
              <ol className="mt-4 list-decimal pl-5 space-y-2 text-sm text-night/80">
                <li>Check your spam, junk, and promotions folders for the latest message.</li>
                <li>Search your inbox for messages from your configured security sender address.</li>
                <li>Wait one to two minutes, then request a fresh link if the first message is delayed.</li>
                <li>Open only the most recent link, older links are replaced for account safety.</li>
                <li>If delivery still fails, visit Help for support guidance, or sign out and log in again.</li>
              </ol>
            </section>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/help"
                className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
              >
                Open help center
              </Link>
              <Form method="post" action="/logout" className="w-full">
                <input type="hidden" name={csrfFieldName} value={csrfToken} />
                <button
                  type="submit"
                  className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2"
                >
                  Sign out
                </button>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
