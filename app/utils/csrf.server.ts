import { randomBytes, timingSafeEqual } from "node:crypto";
import { createCookie } from "react-router";

const CSRF_TOKEN_FIELD_NAME = "csrfToken";
const CSRF_TOKEN_BYTES = 32;

const csrfCookie = createCookie("__patan_csrf", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 6,
});

function generateCsrfToken() {
  return randomBytes(CSRF_TOKEN_BYTES).toString("base64url");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function getCsrfTokenFieldName() {
  return CSRF_TOKEN_FIELD_NAME;
}

export async function issueCsrfToken(request: Request, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  const cookieValue = await csrfCookie.parse(request.headers.get("Cookie"));

  const existingToken = typeof cookieValue === "string" && cookieValue.length >= 32
    ? cookieValue
    : null;

  const csrfToken = existingToken ?? generateCsrfToken();

  if (!existingToken) {
    responseHeaders.append("Set-Cookie", await csrfCookie.serialize(csrfToken));
  }

  return {
    csrfToken,
    headers: responseHeaders,
  };
}

export async function verifyCsrfToken({
  request,
  submittedToken,
}: {
  request: Request;
  submittedToken: string | null | undefined;
}) {
  if (!submittedToken) {
    return false;
  }

  const cookieValue = await csrfCookie.parse(request.headers.get("Cookie"));
  if (typeof cookieValue !== "string" || cookieValue.length < 32) {
    return false;
  }

  return safeCompare(cookieValue, submittedToken);
}
