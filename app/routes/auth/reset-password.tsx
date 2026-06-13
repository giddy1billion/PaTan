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
import { getAuthErrorMessage } from "~/utils/auth-errors";
import { SubmitButton } from "~/components/ui";
import {
  isBotChallengeRequired,
  logAuthSecurityEvent,
} from "~/utils/auth-security.server";
import { verifyBotDefenseToken } from "~/utils/bot-defense.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  consumePasswordResetToken,
  validatePasswordResetToken,
} from "~/utils/password-reset.server";
import { validateSecurePassword } from "~/utils/password-security.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
import { hashLocalPassword } from "~/utils/users.server";
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
export const meta: MetaFunction = () => {
  return [
    { title: "Set New Password | PaTan" },
    {
      name: "description",
      content: "Set a new password for your PaTan account.",
    },
  ];
};
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return redirect("/login?error=invalid-reset-token");
  }
  const validation = await validatePasswordResetToken(token);
  if (!validation.valid) {
    return redirect("/login?error=invalid-reset-token");
  }
  const challengeRequired = await isBotChallengeRequired({
    request,
    identifier: validation.email,
    scope: "password-reset",
  });
  return { token, emailHint: maskEmail(validation.email), challengeRequired };
}
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const csrfToken = String(formData.get("csrfToken") ?? "");
  const botDefenseToken = String(formData.get("botDefenseToken") ?? "");
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
      route: "/reset-password",
    });
    return redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=invalid-csrf`,
    );
  }
  const tokenState = await validatePasswordResetToken(token);
  if (!tokenState.valid) {
    await logAuthSecurityEvent({
      request,
      eventType: "password_reset_failure",
      severity: "warn",
      outcome: "invalid-token",
      route: "/reset-password",
    });
    return redirect("/login?error=invalid-reset-token");
  }
  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "password-reset",
    identifier: tokenState.email,
  });
  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      route: "/reset-password",
      email: tokenState.email,
    });
    return redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=rate-limited`,
      { headers: rateLimit.headers },
    );
  }
  const challengeRequired = await isBotChallengeRequired({
    request,
    identifier: tokenState.email,
    scope: "password-reset",
  });
  if (challengeRequired) {
    const challengeResult = await verifyBotDefenseToken({
      token: botDefenseToken,
      request,
    });
    if (!challengeResult.ok) {
      await logAuthSecurityEvent({
        request,
        eventType: "bot_challenge_failure",
        severity: "warn",
        outcome: challengeResult.reason,
        route: "/reset-password",
        email: tokenState.email,
      });
      const errorCode =
        challengeResult.reason === "provider-unconfigured"
          ? "captcha-unavailable"
          : "captcha-failed";
      return redirect(
        `/reset-password?token=${encodeURIComponent(token)}&error=${errorCode}&challenge=required`,
        { headers: rateLimit.headers },
      );
    }
  }
  if (password !== confirmPassword) {
    return redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=reset-password-mismatch`,
      { headers: rateLimit.headers },
    );
  }
  const securePassword = await validateSecurePassword({
    password,
    email: tokenState.email,
  });
  if (!securePassword.valid) {
    const errorCode =
      securePassword.breachedCount > 0 ? "breached-password" : "weak-password";
    return redirect(
      `/reset-password?token=${encodeURIComponent(token)}&error=${errorCode}`,
      { headers: rateLimit.headers },
    );
  }
  const consumed = await consumePasswordResetToken(token);
  if (!consumed.ok) {
    await logAuthSecurityEvent({
      request,
      eventType: "password_reset_failure",
      severity: "warn",
      outcome: "token-consume-failed",
      route: "/reset-password",
      email: tokenState.email,
    });
    return redirect("/login?error=invalid-reset-token");
  }
  await db.user.update({
    where: { id: consumed.userId },
    data: { passwordHash: hashLocalPassword(password) },
  });
  await logAuthSecurityEvent({
    request,
    eventType: "password_reset_success",
    severity: "info",
    outcome: "success",
    userId: consumed.userId,
    email: consumed.email,
    route: "/reset-password",
  });
  return redirect("/login?error=reset-password-success", {
    headers: rateLimit.headers,
  });
}
export default function ResetPasswordRoute() {
  const { token, emailHint, challengeRequired } =
    useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<{
    csrfToken?: string;
    csrfFieldName?: string;
    botDefense?: {
      enabled: boolean;
      provider: "turnstile" | "recaptcha";
      siteKey: string;
    };
  }>("root");
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");
  const authError = getAuthErrorMessage(errorCode);
  const navigation = useNavigation();
  const isUpdatingPassword = navigation.state === "submitting";
  const csrfToken = rootData?.csrfToken ?? "";
  const csrfFieldName = rootData?.csrfFieldName ?? "csrfToken";
  const shouldRenderBotChallenge =
    Boolean(rootData?.botDefense?.enabled) &&
    (challengeRequired ||
      searchParams.get("challenge") === "required" ||
      errorCode === "captcha-required" ||
      errorCode === "captcha-failed");
  return (
    <div className="min-h-screen page-modern flex flex-col">
      {" "}
      <header className="p-4">
        {" "}
        <Link
          to="/"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded-lg"
          aria-label="Back to home"
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
              Set a New Password
            </h1>{" "}
            <p className="mt-2 text-center text-[#64748B]">
              Account: {emailHint}
            </p>{" "}
            <AutoDismissAlert
              tone="error"
              message={authError}
              className="mt-4"
            />{" "}
            <Form method="post" className="form-modern mt-8 space-y-6">
              {" "}
              <input type="hidden" name="token" value={token} />{" "}
              <input type="hidden" name={csrfFieldName} value={csrfToken} />{" "}
              <input
                type="hidden"
                name="botDefenseToken"
                data-bot-token-input
                value=""
              />{" "}
              <div>
                {" "}
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-night"
                >
                  New password
                </label>{" "}
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="At least 12 characters"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-night"
                >
                  Confirm password
                </label>{" "}
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="Repeat your password"
                />{" "}
              </div>{" "}
              {shouldRenderBotChallenge ? (
                <div className="space-y-2" aria-live="polite">
                  {" "}
                  <p className="text-sm text-night/70">
                    Complete the verification challenge to continue.
                  </p>{" "}
                  {rootData?.botDefense?.provider === "turnstile" ? (
                    <div
                      className="cf-turnstile"
                      data-sitekey={rootData.botDefense.siteKey}
                      data-callback="onAuthBotDefenseToken"
                    />
                  ) : (
                    <div
                      className="g-recaptcha"
                      data-sitekey={rootData?.botDefense?.siteKey}
                      data-callback="onAuthBotDefenseToken"
                    />
                  )}{" "}
                  <script
                    dangerouslySetInnerHTML={{
                      __html:
                        "window.onAuthBotDefenseToken = function(token){ document.querySelectorAll('[data-bot-token-input]').forEach(function(input){ input.value = token; }); };",
                    }}
                  />{" "}
                </div>
              ) : null}{" "}
              <SubmitButton
                className="w-full btn-primary py-3 text-base"
                busy={isUpdatingPassword}
                pendingLabel="Updating password…"
              >
                {" "}
                Update Password{" "}
              </SubmitButton>{" "}
            </Form>{" "}
          </div>{" "}
        </div>{" "}
      </main>{" "}
    </div>
  );
}
