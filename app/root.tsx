import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { getBotDefenseClientConfig } from "~/utils/bot-defense.server";
import { issueCsrfToken } from "~/utils/csrf.server";

const GOOGLE_FONTS_STYLESHEET_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&display=swap";

function getSecurityCsp() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com https://api.pwnedpasswords.com",
    "frame-src 'self' https://challenges.cloudflare.com https://www.google.com",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

export async function loader({ request }: Route.LoaderArgs) {
  const csrf = await issueCsrfToken(request);
  const botDefense = getBotDefenseClientConfig();

  return data(
    {
      csrfToken: csrf.csrfToken,
      csrfFieldName: "csrfToken",
      botDefense,
    },
    {
      headers: csrf.headers,
    },
  );
}

export const headers: Route.HeadersFunction = ({ loaderHeaders, parentHeaders, actionHeaders }) => {
  const responseHeaders = new Headers(parentHeaders);

  const inheritedSetCookie = loaderHeaders.get("Set-Cookie");
  if (inheritedSetCookie) {
    responseHeaders.append("Set-Cookie", inheritedSetCookie);
  }

  const actionSetCookie = actionHeaders.get("Set-Cookie");
  if (actionSetCookie) {
    responseHeaders.append("Set-Cookie", actionSetCookie);
  }

  responseHeaders.set("Content-Security-Policy", getSecurityCsp());
  responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set("X-Frame-Options", "DENY");
  responseHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  if (process.env.NODE_ENV === "production") {
    responseHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return responseHeaders;
};

export const links: Route.LinksFunction = () => [
  // PWA Manifest
  { rel: "manifest", href: "/manifest.webmanifest" },

  // Favicons
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
  { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },

  // Fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: GOOGLE_FONTS_STYLESHEET_HREF,
    as: "style",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: GOOGLE_FONTS_STYLESHEET_HREF,
  },

  // Critical global branding asset used in navigation
  {
    rel: "preload",
    href: "/brand/logos/logo-sm.png",
    as: "image",
    type: "image/png",
    fetchPriority: "high",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<typeof loader>("root");
  const location = useLocation();

  const shouldLoadTurnstile = rootData?.botDefense.enabled && rootData.botDefense.provider === "turnstile";
  const shouldLoadRecaptcha = rootData?.botDefense.enabled && rootData.botDefense.provider === "recaptcha";
  const isHomeRoute = location.pathname === "/";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0D2B45" />
        <meta name="description" content="PaTan™ - Share transformative stories. Discover hope. Connect through authentic human experiences." />
        <Meta />
        <Links />
        {isHomeRoute ? (
          <link
            rel="preload"
            href="/brand/logos/logo-md.png"
            as="image"
            type="image/png"
            fetchPriority="high"
          />
        ) : null}
        {shouldLoadTurnstile ? (
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        ) : null}
        {shouldLoadRecaptcha ? (
          <script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer />
        ) : null}
      </head>
      <body>
        {/* Skip link for keyboard navigation, WCAG 2.2 */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
