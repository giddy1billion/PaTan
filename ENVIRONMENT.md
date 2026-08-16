# PaTan — Platform Environment & Configuration Reference

This is an **authoritative, code-grounded** inventory of every environment variable and
configuration setting the PaTan platform reads at runtime. Every variable below was
extracted directly from `process.env.*` references in `app/`, `scripts/`, `prisma/`,
`Dockerfile`, and the build configs — **no assumptions, no fabricated names**.

A `✅ Required` tag means the application will fail fast or break without it in production.
`⚙️ Optional` means a safe default exists. `🔁 Alias` means it's a fallback for another var.

> ⚠️ **Doc drift notice:** The existing `README.md` env tables and `.env.example` are out of
> sync with the code. Known mismatches are flagged inline with `[DOC DRIFT]`. This file is
> the source of truth; resolve README/.env.example against it.

---

## 1. Core runtime

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `SESSION_SECRET` | ✅ in production | `dev-mfa-secret` fallback chain (dev only) | `app/utils/auth.server.ts:25`, `mfa.server.ts:38` | HMAC secret for session cookies + JWT signing. **App throws on boot in `NODE_ENV=production` if unset.** Also doubles as the MFA code secret when `MFA_CODE_SECRET` is absent. Generate with `openssl rand -base64 32`. |
| `DATABASE_URL` | ✅ | — | `app/utils/db.server.ts:11`, `prisma.config.ts` | PostgreSQL connection string. Prisma datasource + app pool both read it. App logs a fatal warning if unset. Format: `postgresql://user:pass@host:5432/db?sslmode=require` |
| `APP_ORIGIN` | ✅ (for email links + AI origin) | none — falls back to request origin where possible | `password-reset.server.ts:43`, `email-verification.server.ts:236`, `routes/api.ai.story-suggestion.ts:58` | Base URL used to build verification/reset links. Set to your canonical origin, e.g. `https://patan.site` |
| `NODE_ENV` | ✅ | `development` | `auth.server.ts:25`, `root.tsx:78`, `routes/api.health.ts:116` | `production` enables secure cookies, HSTS, and the SESSION_SECRET fail-fast guard. Dockerfile hard-sets `production`. |

### Container / serve config (from `Dockerfile`)
| Setting | Value | Source |
|---|---|---|
| `NODE_ENV` | `production` (ENV) | `Dockerfile:21` |
| `PORT` | `8080` (ENV) | `Dockerfile:22` |
| Start command | `react-router-serve ./build/server/index.js` | `package.json` `start` script |

`react-router-serve` honors `PORT` (defaults to 3000 if unset); the Dockerfile pins 8080.

---

## 2. Email delivery — Resend (primary)

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `RESEND_API_KEY` | ✅ (or webhook fallback) | — | `security-email.server.ts:40,53` | Resend API key (`re_…`). If absent, the auth-email system marks delivery as unconfigured unless the webhook fallback is set. |
| `AUTH_EMAIL_FROM` | ✅ when email is used | — | `security-email.server.ts:35` | RFC-5322 From header, e.g. `PaTan Security <security@notifications.patan.app>` |

### Email delivery — webhook fallback (optional)

Used only if `AUTH_EMAIL_WEBHOOK_URL` is present. Receives signed email payloads.

| Variable | Required | Default | Source |
|---|---|---|---|
| `AUTH_EMAIL_WEBHOOK_URL` | ⚙️ | — | `security-email.server.ts:49,102` |
| `AUTH_EMAIL_WEBHOOK_SECRET` | ⚙️ (with URL) | — | `security-email.server.ts:103` | HMAC secret for payload signatures |
| `AUTH_EMAIL_WEBHOOK_KEY_ID` | ⚙️ (with URL) | — | `security-email.server.ts:104` | Key id for rotation |

---

## 3. Security alert webhook (optional)

High/critical auth events are POSTed here.

| Variable | Required | Default | Source |
|---|---|---|---|
| `SECURITY_ALERT_WEBHOOK_URL` | ⚙️ | — | `auth-security.server.ts:181` |
| `SECURITY_ALERT_WEBHOOK_SECRET` | ⚙️ (with URL) | — | `auth-security.server.ts:182` |
| `SECURITY_ALERT_WEBHOOK_KEY_ID` | ⚙️ (with URL) | — | `auth-security.server.ts:183` |

---

## 4. Notification delivery webhook (optional)

Delivers in-app notification fan-out via an external webhook.

| Variable | Required | Default | Source |
|---|---|---|---|
| `NOTIFICATION_DELIVERY_WEBHOOK_URL` | ⚙️ | — | `notifications.server.ts:274` |
| `NOTIFICATION_DELIVERY_WEBHOOK_SECRET` | ⚙️ (with URL) | — | `notifications.server.ts:281` |
| `NOTIFICATION_DELIVERY_WEBHOOK_KEY_ID` | ⚙️ (with URL) | — | `notifications.server.ts:282` |

---

## 5. Bot defense (CAPTCHA)

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `BOT_DEFENSE_ENABLED` | ⚙️ | `true` | `bot-defense.server.ts:49` | Set to literal `false` to disable. Any other value = enabled. |
| `BOT_DEFENSE_PROVIDER` | ⚙️ | `turnstile` | `bot-defense.server.ts:40-45` | Only `turnstile` or `recaptcha` are recognized; anything else → `turnstile`. **[DOC DRIFT]** README lists `hcaptcha` — not supported by code. |
| `BOT_DEFENSE_MIN_SCORE` | ⚙️ | `0.5` | `bot-defense.server.ts:62,69` | Numeric threshold for scored challenges. Non-numeric → `0.5`. |

**Provider keys (chosen by `BOT_DEFENSE_PROVIDER`):**

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `TURNSTILE_SITE_KEY` | ✅ if provider=turnstile | — | `bot-defense.server.ts:54` | **[DOC DRIFT]** README calls this `BOT_DEFENSE_SITE_KEY` — that name is **not** read by code. |
| `TURNSTILE_SECRET_KEY` | ✅ if provider=turnstile | — | `bot-defense.server.ts:59` | **[DOC DRIFT]** README calls this `BOT_DEFENSE_SECRET_KEY` — not read by code. |
| `RECAPTCHA_SITE_KEY` | ✅ if provider=recaptcha | — | `bot-defense.server.ts:54` | |
| `RECAPTCHA_SECRET_KEY` | ✅ if provider=recaptcha | — | `bot-defense.server.ts:59` | |

### Bot challenge thresholds (failed attempts in rolling window)

| Variable | Required | Default | Source |
|---|---|---|---|
| `BOT_CHALLENGE_LOGIN_FAILURE_THRESHOLD` | ⚙️ | `3` | `auth-security.server.ts:311` |
| `BOT_CHALLENGE_SIGNUP_FAILURE_THRESHOLD` | ⚙️ | `2` | `auth-security.server.ts:313` |
| `BOT_CHALLENGE_PASSWORD_RESET_THRESHOLD` | ⚙️ | `2` | `auth-security.server.ts:314` |

---

## 6. Password policy

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `AUTH_PASSWORD_MIN_LENGTH` | ⚙️ | `12` | `password-security.server.ts:9` | Parsed via `Number()`. |
| `AUTH_BREACHED_PASSWORD_CHECK` | ⚙️ | `true` | `password-security.server.ts:10` | Set to literal `false` to disable have-I-been-pwned checks. |

> **[DOC DRIFT]** README documents `AUTH_PASSWORD_REQUIRE_MIXED_CASE`, `_REQUIRE_DIGIT`,
> `_REQUIRE_SYMBOL`, and `_CHECK_BREACH_DATABASE`. **None of these are read by code.**
> Mixed-case/digit/symbol rules are enforced in code, not env-configurable. The breach flag
> is `AUTH_BREACHED_PASSWORD_CHECK`.

---

## 7. Auth risk scoring

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `AUTH_HIGH_RISK_SCORE_THRESHOLD` | ⚙️ | `60` | `auth-security.server.ts:434` | Numeric; a session scoring ≥ this is flagged high-risk. |

---

## 8. Multi-factor auth (MFA)

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `MFA_CODE_SECRET` | ⚙️ | falls back to `SESSION_SECRET`, then `dev-mfa-secret` | `mfa.server.ts:38` | Dedicated secret for TOTP/code signing. Set a distinct value in production. |
| `AUTH_MFA_CODE_TTL_MS` | ⚙️ | `600000` (10 min) | `mfa.server.ts:5` | Code lifetime. |
| `AUTH_MFA_MAX_ATTEMPTS` | ⚙️ | `5` | `mfa.server.ts:6` | Max verification attempts before lockout. |

---

## 9. Token lifetimes

| Variable | Required | Default | Bounds | Source |
|---|---|---|---|---|
| `AUTH_EMAIL_VERIFICATION_TTL_MS` | ⚙️ | `86400000` (24h) | 5 min – 30 days | `email-verification.server.ts:32-37` |
| `AUTH_PASSWORD_RESET_TTL_MS` | ⚙️ | `3600000` (1h) | — (parsed via `Number`) | `password-reset.server.ts:5` |

---

## 10. Email-verification retry worker tuning

All parsed as positive integers and clamped to bounds (`readPositiveIntEnv`).

| Variable | Required | Default | Bounds | Source |
|---|---|---|---|---|
| `AUTH_EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS` | ⚙️ | `120000` | 5s – 1h | `email-verification.server.ts:38-43` |
| `AUTH_EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS` | ⚙️ | `6` | 1 – 20 | `:44-49` |
| `AUTH_EMAIL_VERIFICATION_RETRY_BATCH_SIZE` | ⚙️ | `20` | 1 – 200 | `:50-55` |
| `AUTH_EMAIL_VERIFICATION_RETRY_LOOP_MS` | ⚙️ | `60000` | 5s – 10 min | `:56-61` |
| `AUTH_EMAIL_VERIFICATION_RETRY_CONCURRENCY` | ⚙️ | `5` | 1 – 20 | `:62-67` |
| `AUTH_EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS` | ⚙️ | `15000` | 2s – 2 min | `:68-73` |
| `AUTH_EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS` | ⚙️ | `90000` | 10s – 10 min | `:74-79` |
| `AUTH_EMAIL_VERIFICATION_RETRY_DELIVERED_RETENTION_DAYS` | ⚙️ | `30` | 1 – 365 | `:80-85` |

---

## 11. Rate limiting (per scope × dimension × field)

**Format:** `AUTH_RATE_LIMIT_<SCOPE>_<DIMENSION>_<FIELD>`
- **Scopes:** `LOGIN`, `SIGNUP`, `OAUTH_INIT`, `OAUTH_CALLBACK`, `PASSWORD_RESET`, `MFA`, `AI_SUGGEST`
- **Dimensions:** `IP`, `IDENTIFIER` (only scopes that track by identifier read the `IDENTIFIER_*` vars)
- **Fields:** `WINDOW_MS`, `MAX`, `BLOCK_MS`

All optional; parsed via `readNumberEnv` (must be finite and > 0, else default). Source:
`app/utils/rate-limit.server.ts:111-135`.

### Default policies (used when env unset)

| Scope | Dimension | WINDOW_MS | MAX | BLOCK_MS |
|---|---|---|---|---|
| `LOGIN` | IP | 900000 (15m) | 20 | 1800000 (30m) |
| `LOGIN` | IDENTIFIER | 900000 (15m) | 8 | 1800000 (30m) |
| `SIGNUP` | IP | 3600000 (1h) | 12 | 7200000 (2h) |
| `SIGNUP` | IDENTIFIER | 86400000 (24h) | 3 | 86400000 (24h) |
| `OAUTH_INIT` | IP | 900000 (15m) | 30 | 1800000 (30m) |
| `OAUTH_CALLBACK` | IP | 900000 (15m) | 40 | 1800000 (30m) |
| `PASSWORD_RESET` | IP | 3600000 (1h) | 8 | 3600000 (1h) |
| `PASSWORD_RESET` | IDENTIFIER | 21600000 (6h) | 3 | 21600000 (6h) |
| `MFA` | IP | 900000 (15m) | 12 | 1800000 (30m) |
| `MFA` | IDENTIFIER | 900000 (15m) | 8 | 1800000 (30m) |
| `AI_SUGGEST` | IP | 600000 (10m) | 40 | 1200000 (20m) |
| `AI_SUGGEST` | IDENTIFIER | 600000 (10m) | 20 | 1200000 (20m) |

**Example overrides (all 18 possible per IP + per identifier):**
```ini
AUTH_RATE_LIMIT_LOGIN_IP_WINDOW_MS=900000
AUTH_RATE_LIMIT_LOGIN_IP_MAX=20
AUTH_RATE_LIMIT_LOGIN_IP_BLOCK_MS=1800000
AUTH_RATE_LIMIT_LOGIN_IDENTIFIER_WINDOW_MS=900000
AUTH_RATE_LIMIT_LOGIN_IDENTIFIER_MAX=8
AUTH_RATE_LIMIT_LOGIN_IDENTIFIER_BLOCK_MS=1800000
# …repeat for SIGNUP, OAUTH_INIT, OAUTH_CALLBACK, PASSWORD_RESET, MFA, AI_SUGGEST
```

> **[DOC DRIFT]** README documents `AUTH_RATE_LIMIT_LOGIN_MAX_ATTEMPTS` and
> `AUTH_RATE_LIMIT_WINDOW_MS`. **Neither is read by code.** Use the
> `<SCOPE>_<DIMENSION>_<FIELD>` format above.

---

## 12. OAuth providers

Providers are dynamically resolved by uppercasing the provider name (`GOOGLE`, `FACEBOOK`),
so only `google` and `facebook` are valid (`oauth.server.ts:55`). Each needs all three vars.

### Google

| Variable | Required | Default | Source |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ if Google enabled | — | `oauth.server.ts:68` |
| `GOOGLE_CLIENT_SECRET` | ✅ if Google enabled | — | `oauth.server.ts:69` |
| `GOOGLE_REDIRECT_URI` | ✅ if Google enabled | — | `oauth.server.ts:70` |

### Facebook

| Variable | Required | Default | Source |
|---|---|---|---|
| `FACEBOOK_CLIENT_ID` | ✅ if Facebook enabled | — | `oauth.server.ts:68` |
| `FACEBOOK_CLIENT_SECRET` | ✅ if Facebook enabled | — | `oauth.server.ts:69` |
| `FACEBOOK_REDIRECT_URI` | ✅ if Facebook enabled | — | `oauth.server.ts:70` |

Both callbacks route to `/oauth/callback`. Use `http://localhost:5173/oauth/callback` in dev.

---

## 13. AI service (server-side story suggestions)

Endpoint/model resolution in `app/utils/ai.server.ts:188-209`. The service is "configured"
only when an API key **and** at least one endpoint are present (`:247`).

| Variable | Required | Default | Bounds | Source | Notes |
|---|---|---|---|---|---|
| `AI_SERVICE_API_KEY` | ✅ (or alias) | — | — | `ai.server.ts:191` | Primary key. 🔁 Alias: falls back to `AZURE_OPENAI_API_KEY`. |
| `AI_PROJECT_ENDPOINT` | ✅ (or alias) | — | — | `ai.server.ts:206` | 🔁 Alias: falls back to `AZURE_AI_PROJECT_ENDPOINT`. |
| `AZURE_OPENAI_ENDPOINT` | ⚙️ | — | — | `ai.server.ts:208` | Additional endpoint (normalized). |
| `AI_PROJECT_API_VERSION` | ⚙️ | `2024-05-01-preview` | — | `ai.server.ts:540` | |
| `AI_MODEL` | ⚙️ | `gpt-4.1-mini` | — | `ai.server.ts:193` | |
| `AI_TIMEOUT_MS` | ⚙️ | `15000` | >0 | `ai.server.ts:194` | **[DOC DRIFT]** README says `30000`. |
| `AI_MAX_RETRIES` | ⚙️ | `2` | 0–5 | `ai.server.ts:195` | **[DOC DRIFT]** README says `3`. |
| `AI_RETRY_BASE_DELAY_MS` | ⚙️ | `300` | >0 | `ai.server.ts:196` | **[DOC DRIFT]** README says `1000`. |
| `AI_MAX_OUTPUT_TOKENS` | ⚙️ | `450` | 64–2000 | `ai.server.ts:197` | Not in README at all. |
| `AI_MAX_CONCURRENCY` | ⚙️ | `8` | 1–64 | `ai.server.ts:198` | **[DOC DRIFT]** README says `10`. |
| `AI_CIRCUIT_OPEN_AFTER_FAILURES` | ⚙️ | `5` | 1–20 | `ai.server.ts:200` | |
| `AI_CIRCUIT_RESET_MS` | ⚙️ | `45000` | >0 | `ai.server.ts:202` | Not in README. |
| `AI_TEMPERATURE` | ⚙️ | `0.4` | 0–1.5 | `ai.server.ts:203` | Not in README. |

**Aliases (legacy Azure names still honored):**
- `AZURE_OPENAI_API_KEY` → fallback for `AI_SERVICE_API_KEY`
- `AZURE_AI_PROJECT_ENDPOINT` → fallback for `AI_PROJECT_ENDPOINT`

---

## 14. Admin & health

| Variable | Required | Default | Source | Notes |
|---|---|---|---|---|
| `ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN` | ✅ for the admin health endpoint | — | `routes/api.admin.email-verification-retry-health.ts:70` | Bearer token guarding the retry-worker health endpoint. |
| `HEALTH_DB_CHECK_TIMEOUT_MS` | ⚙️ | `2500` | `routes/api.health.ts:15` | DB liveness probe timeout for `/api/health`. |

---

## 15. Build / framework config (not env vars, but platform config)

These are static config files the platform depends on — included for completeness.

### `react-router.config.ts`
- `ssr: true` (server-side rendering on)
- Future flags enabled: `v8_middleware`, `v8_passThroughRequests`, `v8_splitRouteModules`,
  `v8_trailingSlashAwareDataRequests`, `v8_viteEnvironmentApi`

### `prisma.config.ts`
- Imports `dotenv/config` (so `.env` is loaded for Prisma CLI/migrations)
- `schema: prisma/schema.prisma`, `migrations.path: prisma/migrations`
- `datasource.url` = `process.env.DATABASE_URL`

### `package.json` scripts
- `dev` → `react-router dev` (port 5173)
- `build` → `prisma generate && react-router build`
- `start` → `react-router-serve ./build/server/index.js` (honors `PORT`)
- `typecheck` → `react-router typegen && tsc`
- `test` → `vitest run`
- `emails:resend-verifications` → `tsx scripts/resend-email-verifications.ts --force`

### `Dockerfile`
- `ENV NODE_ENV=production`, `ENV PORT=8080`
- Builds via `npm run build`, runs via `npm start`

---

## 16. Minimal production `.env` (copy-paste starter)

Only the hard-required set. Everything else has a safe default.

```ini
NODE_ENV=production
PORT=8080
SESSION_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgresql://user:pass@host:5432/patan?sslmode=require
APP_ORIGIN=https://patan.site

# Email (Resend) — required for signup/password-reset flows
RESEND_API_KEY=re_xxx
AUTH_EMAIL_FROM=PaTan Security <security@notifications.patan.app>

# Bot defense (Turnstile) — required for signup/login challenge
BOT_DEFENSE_ENABLED=true
BOT_DEFENSE_PROVIDER=turnstile
TURNSTILE_SITE_KEY=<site-key>
TURNSTILE_SECRET_KEY=<secret>

# Admin health endpoint guard
ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN=<secure-token>
```

Add OAuth, AI, webhooks, MFA, and rate-limit overrides only as those features are enabled.

---

## Inventory cross-check

- **Total distinct env vars read by code:** 44 (incl. 2 AI aliases and the 18 rate-limit
  pattern slots across 7 scopes × {IP, IDENTIFIER} × {WINDOW_MS, MAX, BLOCK_MS}, less the
  scopes without an identifier dimension).
- **Vars in `.env.example` but NOT read by code:** none — every entry in `.env.example` is
  valid (but it omits ~24 vars the code does read; see sections 7, 8, 13, 14, 4, and the
  AI tuning block).
- **Vars in README but NOT read by code (doc drift):** `BOT_DEFENSE_SITE_KEY`,
  `BOT_DEFENSE_SECRET_KEY`, `AUTH_RATE_LIMIT_LOGIN_MAX_ATTEMPTS`,
  `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_PASSWORD_REQUIRE_MIXED_CASE`,
  `AUTH_PASSWORD_REQUIRE_DIGIT`, `AUTH_PASSWORD_REQUIRE_SYMBOL`,
  `AUTH_PASSWORD_CHECK_BREACH_DATABASE`.
- **Vars read by code but absent from both `.env.example` and README:** `DATABASE_URL`
  (only in README table, not .env.example), `NODE_ENV`, `PORT`, `MFA_CODE_SECRET`,
  `AUTH_MFA_CODE_TTL_MS`, `AUTH_MFA_MAX_ATTEMPTS`, `AUTH_HIGH_RISK_SCORE_THRESHOLD`,
  `AUTH_EMAIL_VERIFICATION_TTL_MS`, all 8 email-verification retry vars, all AI tuning vars
  (`AI_TIMEOUT_MS`, `AI_MAX_RETRIES`, `AI_RETRY_BASE_DELAY_MS`, `AI_MAX_OUTPUT_TOKENS`,
  `AI_MAX_CONCURRENCY`, `AI_CIRCUIT_OPEN_AFTER_FAILURES`, `AI_CIRCUIT_RESET_MS`,
  `AI_TEMPERATURE`, `AI_PROJECT_API_VERSION`, `AZURE_OPENAI_API_KEY`,
  `AZURE_OPENAI_ENDPOINT`, `AZURE_AI_PROJECT_ENDPOINT`), `ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN`,
  `HEALTH_DB_CHECK_TIMEOUT_MS`, `NOTIFICATION_DELIVERY_WEBHOOK_URL/SECRET/KEY_ID`,
  `SECURITY_ALERT_WEBHOOK_URL/SECRET/KEY_ID` (security-alert is in .env.example but not
  README; notification-delivery is in neither .env.example fully).

_Recommendation: sync `.env.example` and README env tables to this file, or generate both
from a single source of truth._
