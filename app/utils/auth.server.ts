import { createCookieSessionStorage, redirect } from "react-router";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
};

const USER_SESSION_KEY = "user";
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__patan_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET ?? "dev-session-secret-change-me"],
    maxAge: THIRTY_DAYS_IN_SECONDS,
  },
});

function safeRedirect(to: string | null | undefined, defaultRedirect = "/discover") {
  if (!to || typeof to !== "string") return defaultRedirect;
  if (!to.startsWith("/")) return defaultRedirect;
  if (to.startsWith("//")) return defaultRedirect;
  return to;
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUser(request: Request): Promise<SessionUser | null> {
  const session = await getSession(request);
  const user = session.get(USER_SESSION_KEY);

  if (!user || typeof user !== "object" || !("id" in user) || !("email" in user)) {
    return null;
  }

  return user as SessionUser;
}

export async function requireUser(request: Request, redirectTo?: string) {
  const user = await getUser(request);

  if (!user) {
    const url = new URL(request.url);
    const target = redirectTo ?? `${url.pathname}${url.search}`;
    throw redirect(`/login?redirectTo=${encodeURIComponent(target)}`);
  }

  return user;
}

export async function createUserSession({
  request,
  user,
  redirectTo,
  remember = false,
}: {
  request: Request;
  user: SessionUser;
  redirectTo?: string | null;
  remember?: boolean;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, user);

  return redirect(safeRedirect(redirectTo), {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember ? THIRTY_DAYS_IN_SECONDS : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
