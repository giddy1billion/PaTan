import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { commitSession, getSession } from "~/utils/auth.server";
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
    return "/discover";
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

  if (!provider) {
    return redirect(`${safeAuthRoute}?error=oauth-invalid-provider`);
  }

  const session = await getSession(request);
  const state = createOAuthState();

  session.set("oauth:state", state);
  session.set("oauth:provider", provider);
  session.set("oauth:redirectTo", redirectTo);
  session.set("oauth:fallbackRoute", safeAuthRoute);

  try {
    const authorizationUrl = createOAuthAuthorizationUrl({ provider, state });
    return redirect(authorizationUrl, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error: unknown) {
    if (error instanceof OAuthConfigError) {
      return redirect(`${safeAuthRoute}?error=oauth-misconfigured`);
    }

    return redirect(`${safeAuthRoute}?error=oauth-start-failed`);
  }
}

export default function OAuthProviderRoute() {
  return null;
}
