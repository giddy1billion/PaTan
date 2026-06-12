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
  useRouteLoaderData,
  useSearchParams,
} from "react-router";
import {
  commitSession,
  createUserSession,
  getSession,
} from "~/utils/auth.server";
import { getAuthErrorMessage } from "~/utils/auth-errors";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { createMfaChallenge, verifyMfaChallenge } from "~/utils/mfa.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
export const meta: MetaFunction = () => {
  return [
    { title: "Verification Required | PaTan" },
    {
      name: "description",
      content: "Complete multi-factor verification to finish signing in.",
    },
  ];
};
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}
function clearPreAuthSession(session: Awaited<ReturnType<typeof getSession>>) {
  session.unset("preAuth:userId");
  session.unset("preAuth:email");
  session.unset("preAuth:redirectTo");
  session.unset("preAuth:remember");
  session.unset("preAuth:challengeId");
  session.unset("preAuth:riskScore");
  session.unset("preAuth:riskReasons");
}
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const url = new URL(request.url);
  const challengeParam = url.searchParams.get("challenge");
  const challengeId = session.get("preAuth:challengeId") as string | undefined;
  const email = session.get("preAuth:email") as string | undefined;
  const userId = session.get("preAuth:userId") as string | undefined;
  if (!challengeId || !email || !userId) {
    return redirect("/login?error=mfa-session-expired");
  }
  if (challengeParam && challengeParam !== challengeId) {
    clearPreAuthSession(session);
    return redirect("/login?error=mfa-session-expired", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  return { challengeId, emailHint: maskEmail(email) };
}
export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "verify");
  const challengeId = String(formData.get("challengeId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const csrfToken = String(formData.get("csrfToken") ?? "");
  const userId = session.get("preAuth:userId") as string | undefined;
  const email = session.get("preAuth:email") as string | undefined;
  const redirectTo =
    (session.get("preAuth:redirectTo") as string | undefined) ?? "/dashboard";
  const remember = session.get("preAuth:remember") === "1";
  const sessionChallengeId = session.get("preAuth:challengeId") as
    | string
    | undefined;
  if (!userId || !email || !sessionChallengeId) {
    clearPreAuthSession(session);
    return redirect("/login?error=mfa-session-expired", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
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
      userId,
      email,
      route: "/auth/mfa",
    });
    return redirect(
      `/auth/mfa?challenge=${encodeURIComponent(sessionChallengeId)}&error=invalid-csrf`,
    );
  }
  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "mfa",
    identifier: email,
  });
  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      userId,
      email,
      route: "/auth/mfa",
    });
    return redirect(
      `/auth/mfa?challenge=${encodeURIComponent(sessionChallengeId)}&error=rate-limited`,
      { headers: rateLimit.headers },
    );
  }
  if (intent === "resend") {
    const riskScore =
      Number(session.get("preAuth:riskScore") as string | undefined) || 0;
    const riskReasonsValue = String(session.get("preAuth:riskReasons") ?? "");
    const riskReasons = riskReasonsValue
      ? riskReasonsValue.split(",").filter(Boolean)
      : [];
    const challenge = await createMfaChallenge({
      userId,
      email,
      riskScore,
      riskReasons,
    });
    session.set("preAuth:challengeId", challenge.challengeId);
    await logAuthSecurityEvent({
      request,
      eventType: "mfa_challenge_created",
      severity: "warn",
      outcome: "resent",
      userId,
      email,
      route: "/auth/mfa",
      riskScore,
    });
    const responseHeaders = new Headers(rateLimit.headers);
    responseHeaders.set("Set-Cookie", await commitSession(session));
    return redirect(
      `/auth/mfa?challenge=${encodeURIComponent(challenge.challengeId)}&error=mfa-code-resent`,
      { headers: responseHeaders },
    );
  }
  if (challengeId !== sessionChallengeId) {
    clearPreAuthSession(session);
    return redirect("/login?error=mfa-session-expired", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  const verified = await verifyMfaChallenge({ challengeId, userId, code });
  if (!verified.ok) {
    await logAuthSecurityEvent({
      request,
      eventType: "mfa_challenge_failure",
      severity: "warn",
      outcome: verified.code,
      userId,
      email,
      route: "/auth/mfa",
    });
    const errorCode =
      verified.code === "challenge-expired" ||
      verified.code === "too-many-attempts"
        ? "mfa-expired"
        : "mfa-invalid";
    return redirect(
      `/auth/mfa?challenge=${encodeURIComponent(sessionChallengeId)}&error=${errorCode}`,
      { headers: rateLimit.headers },
    );
  }
  const userProfile = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, profilePhotoUrl: true },
  });
  if (!userProfile?.email) {
    clearPreAuthSession(session);
    return redirect("/login?error=session-expired", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
  clearPreAuthSession(session);
  await logAuthSecurityEvent({
    request,
    eventType: "mfa_challenge_success",
    severity: "info",
    outcome: "verified",
    userId,
    email: userProfile.email,
    route: "/auth/mfa",
  });
  return createUserSession({
    request,
    user: {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.displayName,
      avatarUrl: userProfile.profilePhotoUrl ?? undefined,
      provider: "local",
    },
    redirectTo,
    remember,
    headers: rateLimit.headers,
    session,
  });
}
export default function MfaRoute() {
  const { challengeId, emailHint } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<{
    csrfToken?: string;
    csrfFieldName?: string;
  }>("root");
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");
  const authError = getAuthErrorMessage(errorCode);
  const csrfToken = rootData?.csrfToken ?? "";
  const csrfFieldName = rootData?.csrfFieldName ?? "csrfToken";
  return (
    <div className="min-h-screen page-modern flex flex-col">
      {" "}
      <header className="p-4">
        {" "}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded-lg"
          aria-label="Back to login"
        >
          {" "}
          <img
            src="/brand/logos/logo-sm.png"
            alt=""
            className="h-8 w-auto"
            aria-hidden="true"
          />{" "}
          <span className="font-heading text-lg font-bold text-midnight">
            PaTan
          </span>{" "}
        </Link>{" "}
      </header>{" "}
      <main
        id="main-content"
        className="page-modern flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        {" "}
        <div className="w-full max-w-lg">
          {" "}
          <div className="page-hero-modern p-6 sm:p-8">
            {" "}
            <h1 className="font-heading text-2xl font-bold text-midnight text-center">
              Verify Your Sign-In
            </h1>{" "}
            <p className="mt-2 text-center text-[#64748B]">
              We sent a verification code to {emailHint}
            </p>{" "}
            {authError ? (
              <div
                className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
                role="alert"
                aria-live="polite"
              >
                {" "}
                {authError}{" "}
              </div>
            ) : null}{" "}
            <Form method="post" className="form-modern mt-8 space-y-6">
              {" "}
              <input type="hidden" name="intent" value="verify" />{" "}
              <input type="hidden" name="challengeId" value={challengeId} />{" "}
              <input type="hidden" name={csrfFieldName} value={csrfToken} />{" "}
              <div>
                {" "}
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-night"
                >
                  Verification code
                </label>{" "}
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="Enter 6-digit code"
                />{" "}
              </div>{" "}
              <button
                type="submit"
                className="w-full btn-primary py-3 text-base"
              >
                {" "}
                Verify and Continue{" "}
              </button>{" "}
            </Form>{" "}
            <Form method="post" className="mt-4">
              {" "}
              <input type="hidden" name="intent" value="resend" />{" "}
              <input type="hidden" name="challengeId" value={challengeId} />{" "}
              <input type="hidden" name={csrfFieldName} value={csrfToken} />{" "}
              <button
                type="submit"
                className="w-full btn-tertiary py-3 text-base border border-mist rounded-lg"
              >
                {" "}
                Resend Code{" "}
              </button>{" "}
            </Form>{" "}
          </div>{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
