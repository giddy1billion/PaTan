import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { commitSession, getSession } from "~/utils/auth.server";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";
import {
  createOAuthAuthorizationUrl,
  createOAuthState,
  OAuthConfigError,
  parseOAuthProvider,
} from "~/utils/oauth.server";

function getSafeAuthRoute(route: string | null | undefined) {
  return route === "/signup" ? "/signup" : "/login";
}

function getSafeRedirectTarget(redirectTo: string | null | undefined) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }

  return redirectTo;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const provider = parseOAuthProvider(params.provider);
  const requestUrl = new URL(request.url);
  const fallbackRoute =
    requestUrl.searchParams.get("mode") === "signup" ? "/signup" : "/login";
  const safeAuthRoute = getSafeAuthRoute(fallbackRoute);
  const redirectTo = getSafeRedirectTarget(requestUrl.searchParams.get("redirectTo"));

  const rateLimit = await enforceAuthRateLimit({
    request,
    scope: "oauth-init",
  });

  if (!rateLimit.allowed) {
    await logAuthSecurityEvent({
      request,
      eventType: "rate_limit_block",
      severity: "warn",
      outcome: "blocked",
      route: `/oauth/${params.provider ?? "unknown"}`,
    });

    return redirect(`${safeAuthRoute}?error=rate-limited`, {
      headers: rateLimit.headers,
    });
  }

  if (!provider) {
    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "invalid-provider",
      route: `/oauth/${params.provider ?? "unknown"}`,
    });

    return redirect(`${safeAuthRoute}?error=oauth-invalid-provider`, {
      headers: rateLimit.headers,
    });
  }

  const session = await getSession(request);
  const state = createOAuthState();

  session.set("oauth:state", state);
  session.set("oauth:provider", provider);
  session.set("oauth:redirectTo", redirectTo);
  session.set("oauth:fallbackRoute", safeAuthRoute);

  try {
    const authorizationUrl = createOAuthAuthorizationUrl({ provider, state });
    const responseHeaders = new Headers(rateLimit.headers);
    responseHeaders.set("Set-Cookie", await commitSession(session));

    await logAuthSecurityEvent({
      request,
      eventType: "oauth_start",
      severity: "info",
      outcome: "redirected",
      route: `/oauth/${provider}`,
      metadata: {
        fallbackRoute: safeAuthRoute,
      },
    });

    return redirect(authorizationUrl, {
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    if (error instanceof OAuthConfigError) {
      await logAuthSecurityEvent({
        request,
        eventType: "oauth_failure",
        severity: "high",
        outcome: "misconfigured",
        route: `/oauth/${provider}`,
      });

      return redirect(`${safeAuthRoute}?error=oauth-misconfigured`, {
        headers: rateLimit.headers,
      });
    }

    await logAuthSecurityEvent({
      request,
      eventType: "oauth_failure",
      severity: "warn",
      outcome: "start-failed",
      route: `/oauth/${provider}`,
    });

    return redirect(`${safeAuthRoute}?error=oauth-start-failed`, {
      headers: rateLimit.headers,
    });
  }
}

export default function OAuthProviderRoute() {
  return null;
}
