import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { commitSession, createUserSession, getSession } from "~/utils/auth.server";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { fetchOAuthProfile, OAuthConfigError, OAuthFlowError, parseOAuthProvider } from "~/utils/oauth.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
import { getPostAuthRedirectForUser, upsertOAuthUser } from "~/utils/users.server";

function getSafeAuthRoute(route: string | undefined) {
  return route === "/signup" ? "/signup" : "/login";
}

function getSafeRedirectTarget(redirectTo: string | undefined) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }

  return redirectTo;
}

async function redirectWithError({
  route,
  code,
  session,
  headers,
}: {
  route: string;
  code: string;
  session: Awaited<ReturnType<typeof getSession>>;
  headers?: HeadersInit;
}) {
  session.unset("oauth:state");
  session.unset("oauth:provider");
  session.unset("oauth:redirectTo");
  session.unset("oauth:fallbackRoute");

  const responseHeaders = new Headers(headers);
  responseHeaders.set("Set-Cookie", await commitSession(session));

  return redirect(`${route}?error=${encodeURIComponent(code)}`, {
    headers: responseHeaders,
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const session = await getSession(request);

  const fallbackRoute = getSafeAuthRoute(session.get("oauth:fallbackRoute") as string | undefined);
  const storedState = session.get("oauth:state") as string | undefined;
  const storedProvider = parseOAuthProvider(session.get("oauth:provider") as string | undefined);
  const redirectTo = getSafeRedirectTarget(session.get("oauth:redirectTo") as string | undefined);

  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "oauth-callback",
  });

  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      route: "/oauth/callback",
    });

    return redirectWithError({
      route: fallbackRoute,
      code: "rate-limited",
      session,
      headers: rateLimit.headers,
    });
  }

  const providerError = url.searchParams.get("error");
  if (providerError) {
    const mapped = providerError === "access_denied" ? "oauth-cancelled" : "oauth-denied";

    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: mapped,
      route: "/oauth/callback",
    });

    return redirectWithError({ route: fallbackRoute, code: mapped, session, headers: rateLimit.headers });
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (!storedProvider || !storedState) {
    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "session-expired",
      route: "/oauth/callback",
    });

    return redirectWithError({ route: fallbackRoute, code: "oauth-session-expired", session, headers: rateLimit.headers });
  }

  if (!state || state !== storedState) {
    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "invalid-state",
      route: "/oauth/callback",
    });

    return redirectWithError({ route: fallbackRoute, code: "oauth-invalid-state", session, headers: rateLimit.headers });
  }

  if (!code) {
    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "missing-code",
      route: "/oauth/callback",
    });

    return redirectWithError({ route: fallbackRoute, code: "oauth-missing-code", session, headers: rateLimit.headers });
  }

  try {
    const profile = await fetchOAuthProfile({ provider: storedProvider, code });

    if (!profile.email) {
      await logAuthSecurityEvent({
        request,
        eventType: "oauth_failure",
        severity: "warn",
        outcome: "missing-email",
        route: "/oauth/callback",
      });

      return redirectWithError({ route: fallbackRoute, code: "oauth-email-missing", session, headers: rateLimit.headers });
    }

    const user = await upsertOAuthUser(profile);
    const postAuthRedirect = await getPostAuthRedirectForUser(user.id, redirectTo);

    await logAuthSecurityEvent({
      request,
      eventType: "oauth_success",
      severity: "info",
      outcome: "authenticated",
      userId: user.id,
      email: user.email,
      route: "/oauth/callback",
      metadata: {
        provider: storedProvider,
      },
    });

    session.unset("oauth:state");
    session.unset("oauth:provider");
    session.unset("oauth:redirectTo");
    session.unset("oauth:fallbackRoute");

    return createUserSession({
      request,
      user,
      redirectTo: postAuthRedirect,
      remember: true,
      headers: rateLimit.headers,
      session,
    });
  } catch (error: unknown) {
    if (error instanceof OAuthConfigError) {
      await logAuthSecurityEvent({
        request,
        eventType: "oauth_failure",
        severity: "high",
        outcome: "misconfigured",
        route: "/oauth/callback",
      });

      return redirectWithError({ route: fallbackRoute, code: "oauth-misconfigured", session, headers: rateLimit.headers });
    }

    if (error instanceof OAuthFlowError) {
      await logAuthSecurityEvent({
        request,
        eventType: "oauth_failure",
        severity: "warn",
        outcome: error.code,
        route: "/oauth/callback",
      });

      return redirectWithError({ route: fallbackRoute, code: "oauth-callback-failed", session, headers: rateLimit.headers });
    }

    if (error instanceof Error && error.message === "oauth-email-missing") {
      await logAuthSecurityEvent({
        request,
        eventType: "oauth_failure",
        severity: "warn",
        outcome: "missing-email",
        route: "/oauth/callback",
      });

      return redirectWithError({ route: fallbackRoute, code: "oauth-email-missing", session, headers: rateLimit.headers });
    }

    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "callback-failed",
      route: "/oauth/callback",
    });

    return redirectWithError({ route: fallbackRoute, code: "oauth-callback-failed", session, headers: rateLimit.headers });
  }
}

export default function OAuthCallbackRoute() {
  return null;
}
