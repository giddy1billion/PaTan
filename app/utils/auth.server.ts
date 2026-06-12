import { createCookieSessionStorage, createCookie, redirect } from "react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "~/utils/db.server";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: "local" | "google" | "facebook";
};

const USER_SESSION_KEY = "user";
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const SESSION_COOKIE_SECRET = process.env.SESSION_SECRET ?? "dev-session-secret-change-me";

const authTokenCookie = createCookie("__patan_auth", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: THIRTY_DAYS_IN_SECONDS,
});

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

type JwtPayload = {
  sub: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: "local" | "google" | "facebook";
  iat: number;
  exp: number;
};

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signJwt(payload: JwtPayload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const tokenData = `${encodedHeader}.${encodedPayload}`;

  const signature = createHmac("sha256", SESSION_COOKIE_SECRET)
    .update(tokenData)
    .digest("base64url");

  return `${tokenData}.${signature}`;
}

function verifyJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", SESSION_COOKIE_SECRET)
    .update(tokenData)
    .digest("base64url");

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(fromBase64Url(encodedHeader)) as { alg?: string; typ?: string };
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<JwtPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as JwtPayload;
  } catch {
    return null;
  }
}

function safeRedirect(to: string | null | undefined, defaultRedirect = "/dashboard") {
  if (!to || typeof to !== "string") return defaultRedirect;
  if (!to.startsWith("/")) return defaultRedirect;
  if (to.startsWith("//")) return defaultRedirect;
  return to;
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function commitSession(
  session: Awaited<ReturnType<typeof getSession>>,
  options?: { maxAge?: number },
) {
  return sessionStorage.commitSession(session, options);
}

export async function getUser(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("Cookie");
  const token = await authTokenCookie.parse(cookieHeader);

  if (!token || typeof token !== "string") {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
    provider: payload.provider,
  };
}

export async function requireUser(request: Request, redirectTo?: string) {
  const user = await getUser(request);

  if (!user) {
    const url = new URL(request.url);
    const target = safeRedirect(
      redirectTo ?? `${url.pathname}${url.search}`,
      "/dashboard",
    );
    throw redirect(`/login?redirectTo=${encodeURIComponent(target)}`);
  }

  return user;
}

export async function requireVerifiedUser(request: Request, redirectTo?: string) {
  const user = await requireUser(request, redirectTo);

  const verificationState = await db.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  });

  if (!verificationState) {
    throw redirect("/login?error=session-expired");
  }

  if (!verificationState.emailVerified) {
    const url = new URL(request.url);
    const target = safeRedirect(
      redirectTo ?? `${url.pathname}${url.search}`,
      "/dashboard",
    );
    throw redirect(`/verify-email?redirectTo=${encodeURIComponent(target)}`);
  }

  return user;
}

export async function createUserSession({
  request,
  user,
  redirectTo,
  remember = false,
  headers,
  session,
}: {
  request: Request;
  user: SessionUser;
  redirectTo?: string | null;
  remember?: boolean;
  headers?: HeadersInit;
  session?: Awaited<ReturnType<typeof getSession>>;
}) {
  const sessionToUse = session ?? (await getSession(request));

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (remember ? THIRTY_DAYS_IN_SECONDS : 60 * 60 * 24);
  const token = signJwt({
    sub: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    iat: now,
    exp,
  });

  const responseHeaders = new Headers(headers);
  responseHeaders.append(
    "Set-Cookie",
    await authTokenCookie.serialize(token, {
      maxAge: remember ? THIRTY_DAYS_IN_SECONDS : 60 * 60 * 24,
    }),
  );

  responseHeaders.append(
    "Set-Cookie",
    await sessionStorage.commitSession(sessionToUse),
  );

  return redirect(safeRedirect(redirectTo), {
    headers: responseHeaders,
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);

  return redirect("/login?error=signed-out", {
    headers: new Headers([
      ["Set-Cookie", await sessionStorage.destroySession(session)],
      [
        "Set-Cookie",
        await authTokenCookie.serialize("", {
          maxAge: 0,
          expires: new Date(0),
        }),
      ],
    ]),
  });
}
