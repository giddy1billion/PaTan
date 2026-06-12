import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { commitSession, createUserSession, getSession } from "~/utils/auth.server";
import { fetchOAuthProfile, OAuthConfigError, OAuthFlowError, parseOAuthProvider } from "~/utils/oauth.server";
import { upsertOAuthUser } from "~/utils/users.server";

function getSafeAuthRoute(route: string | undefined) {
  return route === "/signup" ? "/signup" : "/login";
}

function getSafeRedirectTarget(redirectTo: string | undefined) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/discover";
  }

  return redirectTo;
}

async function redirectWithError({
  route,
  code,
  session,
}: {
  route: string;
  code: string;
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  session.unset("oauth:state");
  session.unset("oauth:provider");
  session.unset("oauth:redirectTo");
  session.unset("oauth:fallbackRoute");

  return redirect(`${route}?error=${encodeURIComponent(code)}`, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const session = await getSession(request);

  const fallbackRoute = getSafeAuthRoute(session.get("oauth:fallbackRoute") as string | undefined);
  const storedState = session.get("oauth:state") as string | undefined;
  const storedProvider = parseOAuthProvider(session.get("oauth:provider") as string | undefined);
  const redirectTo = getSafeRedirectTarget(session.get("oauth:redirectTo") as string | undefined);

  const providerError = url.searchParams.get("error");
  if (providerError) {
    const mapped = providerError === "access_denied" ? "oauth-cancelled" : "oauth-denied";
    return redirectWithError({ route: fallbackRoute, code: mapped, session });
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (!storedProvider || !storedState) {
    return redirectWithError({ route: fallbackRoute, code: "oauth-session-expired", session });
  }

  if (!state || state !== storedState) {
    return redirectWithError({ route: fallbackRoute, code: "oauth-invalid-state", session });
  }

  if (!code) {
    return redirectWithError({ route: fallbackRoute, code: "oauth-missing-code", session });
  }

  try {
    const profile = await fetchOAuthProfile({ provider: storedProvider, code });

    if (!profile.email) {
      return redirectWithError({ route: fallbackRoute, code: "oauth-email-missing", session });
    }

    const user = await upsertOAuthUser(profile);

    session.unset("oauth:state");
    session.unset("oauth:provider");
    session.unset("oauth:redirectTo");
    session.unset("oauth:fallbackRoute");

    return createUserSession({
      request,
      user,
      redirectTo,
      remember: true,
      session,
    });
  } catch (error: unknown) {
    if (error instanceof OAuthConfigError) {
      return redirectWithError({ route: fallbackRoute, code: "oauth-misconfigured", session });
    }

    if (error instanceof OAuthFlowError) {
      return redirectWithError({ route: fallbackRoute, code: "oauth-callback-failed", session });
    }

    if (error instanceof Error && error.message === "oauth-email-missing") {
      return redirectWithError({ route: fallbackRoute, code: "oauth-email-missing", session });
    }

    return redirectWithError({ route: fallbackRoute, code: "oauth-callback-failed", session });
  }
}

export default function OAuthCallbackRoute() {
  return null;
}
