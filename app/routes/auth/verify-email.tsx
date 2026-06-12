import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getUser } from "~/utils/auth.server";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { consumeEmailVerificationToken } from "~/utils/email-verification.server";

function getSafeRedirectTarget(target: string | null | undefined) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }

  return target;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectTo = getSafeRedirectTarget(url.searchParams.get("redirectTo"));
  const sessionUser = await getUser(request);
  if (!token) {
    return redirect(
      sessionUser
        ? `/verify-email?error=invalid-email-verification&redirectTo=${encodeURIComponent(redirectTo)}`
        : "/login?error=invalid-email-verification",
    );
  }
  const result = await consumeEmailVerificationToken(token);
  if (!result.ok) {
    await logAuthSecurityEvent({
      request,
      eventType: "email_verified",
      severity: "warn",
      outcome: "invalid-token",
      route: "/auth/verify-email",
    });
    return redirect(
      sessionUser
        ? `/verify-email?error=invalid-email-verification&redirectTo=${encodeURIComponent(redirectTo)}`
        : "/login?error=invalid-email-verification",
    );
  }
  await logAuthSecurityEvent({
    request,
    eventType: "email_verified",
    severity: "info",
    outcome: "verified",
    userId: result.userId,
    email: result.email,
    route: "/auth/verify-email",
  });
  if (sessionUser?.id === result.userId) {
    return redirect(
      `/verify-email?security=email-verified&redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }

  return redirect("/login?error=email-verified");
}
export default function VerifyEmailRoute() {
  return null;
}
