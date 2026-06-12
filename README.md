# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### OAuth Environment Variables

For Google and Facebook OAuth login, create a local `.env` file from `.env.example` and set:

- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI`

For production, set both redirect URIs to `https://PaTan™.site/oauth/callback`.
For local development, you can use `http://localhost:5173/oauth/callback`.

### Security Email Environment Variables

For account verification, MFA, and password reset emails, set:

- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM` (example: `PaTan Security <security@notifications.patan.app>`)

Optional fallback delivery if Resend is unavailable:

- `AUTH_EMAIL_WEBHOOK_URL`
- `AUTH_EMAIL_WEBHOOK_SECRET`
- `AUTH_EMAIL_WEBHOOK_KEY_ID`

### Webhook Signature Verification

Outbound security webhooks include these headers:

- `X-PaTan-Webhook-Source`
- `X-PaTan-Webhook-Event`
- `X-PaTan-Webhook-Timestamp` (unix seconds)
- `X-PaTan-Webhook-Signature` (`sha256=<hex>`)
- `X-PaTan-Webhook-Key-Id` (optional)

Signature is computed as HMAC-SHA256 over:

```text
${timestamp}.${rawBody}
```

Tiny receiver-side verification snippet:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPatanWebhookSignature({
	rawBody,
	timestamp,
	signatureHeader,
	secret,
	toleranceSeconds = 300,
}: {
	rawBody: string;
	timestamp: string | undefined;
	signatureHeader: string | undefined;
	secret: string;
	toleranceSeconds?: number;
}) {
	if (!timestamp || !signatureHeader?.startsWith("sha256=")) {
		return false;
	}

	const ts = Number(timestamp);
	if (!Number.isFinite(ts)) {
		return false;
	}

	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - ts) > toleranceSeconds) {
		return false;
	}

	const expected = createHmac("sha256", secret)
		.update(`${timestamp}.${rawBody}`)
		.digest("hex");

	const provided = signatureHeader.slice("sha256=".length);
	const expectedBuf = Buffer.from(expected, "hex");
	const providedBuf = Buffer.from(provided, "hex");

	return (
		expectedBuf.length === providedBuf.length &&
		timingSafeEqual(expectedBuf, providedBuf)
	);
}
```

Important: verify against the exact raw request body bytes before JSON parsing.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
