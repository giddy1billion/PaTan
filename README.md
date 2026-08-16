# PaTan™ — Storytelling Platform

A modern, production-ready full-stack React application built with React Router 7, Prisma ORM, PostgreSQL, and TypeScript. PaTan™ is a hope-filled storytelling platform where users can share experiences, discover community, and connect through meaningful narratives.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

### Core Platform
- 🚀 Server-side rendering with React Router 7.16
- ⚡️ Hot Module Replacement (HMR) via Vite 8
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations with loaders/actions
- 🔒 TypeScript 5.9 throughout
- 🎉 TailwindCSS 4 for styling
- 📖 [React Router docs](https://reactrouter.com/)

### Security & Authentication
- 🔐 Multi-factor authentication (email-based codes)
- 🛡️ CSRF protection with double-submit cookie pattern
- 🚫 Rate limiting per IP and per identifier
- 🤖 Bot defense with CAPTCHA integration
- 🔑 OAuth 2.0 (Google, Facebook)
- ✉️ Email verification with retry queue
- 🔒 Secure password policy (12+ chars, complexity requirements, breach detection)
- 📊 Security event logging and audit trail
- 🚫 Account status enforcement (ACTIVE, BLOCKED, SUSPENDED, PENDING_VERIFICATION)
- 🔄 Session revocation (single device, all devices, admin revocation)
- 🛡️ Secret redaction in all logs

### Database & ORM
- 🗄️ PostgreSQL with Prisma 7.8
- 🔌 @prisma/adapter-pg for connection pooling
- 📝 Type-safe database queries
- 🔁 Transactional migrations with rollback support

### AI-Powered Features
- 🤖 Server-side AI story suggestions
- 🔄 Automatic failover across endpoints
- 🛡️ Input validation and content filtering
- ♻️ Circuit breaker pattern for reliability

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL 14+
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

3. Configure required environment variables (see below)

4. Run database migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database (optional):

```bash
npx prisma db seed
```

6. Start development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Environment Variables

The complete, code-grounded reference for every variable the platform reads — with exact
defaults, bounds, and source locations — lives in **[`ENVIRONMENT.md`](./ENVIRONMENT.md)**.
That file is the source of truth; `.env.example` mirrors it. The tables below are a quick
reference for the most common settings.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | HMAC secret for session cookies + JWT signing (generate with `openssl rand -base64 32`). App throws on boot in production if unset. | `<32-char-random-string>` |
| `DATABASE_URL` | PostgreSQL connection string (read by app + Prisma CLI/migrations) | `postgresql://user:pass@localhost:5432/patan?sslmode=require` |
| `APP_ORIGIN` | Application base URL (builds verification/reset email links) | `https://patan.site` |
| `NODE_ENV` | `production` enables secure cookies, HSTS, and the SESSION_SECRET fail-fast guard | `production` |
| `PORT` | Port `react-router-serve` binds to (Dockerfile pins `8080`) | `8080` |

### OAuth Configuration

For Google and Facebook OAuth login. Only `google` and `facebook` providers are recognized;
each needs all three variables, and callbacks route to `/oauth/callback`.

| Variable | Description | Production Value |
|----------|-------------|-----------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `<your-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `<your-client-secret>` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `https://patan.site/oauth/callback` |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth client ID | `<your-client-id>` |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth client secret | `<your-client-secret>` |
| `FACEBOOK_REDIRECT_URI` | Facebook OAuth callback URL | `https://patan.site/oauth/callback` |

**Development:** Use `http://localhost:5173/oauth/callback` for redirect URIs.

### Email & Notifications

For account verification, MFA, and password reset emails:

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for email delivery | `re_<key>` |
| `AUTH_EMAIL_FROM` | Sender email address | `PaTan Security <security@notifications.patan.app>` |

Optional webhook fallback if Resend is unavailable:

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_EMAIL_WEBHOOK_URL` | Webhook endpoint for email delivery | `https://hooks.patan.site/email` |
| `AUTH_EMAIL_WEBHOOK_SECRET` | HMAC secret for webhook signatures | `<secret>` |
| `AUTH_EMAIL_WEBHOOK_KEY_ID` | Key identifier for rotation | `key-001` |

Optional notification-delivery webhook (in-app fan-out):

| Variable | Description | Example |
|----------|-------------|---------|
| `NOTIFICATION_DELIVERY_WEBHOOK_URL` | Notification delivery webhook | `https://hooks.patan.site/notify` |
| `NOTIFICATION_DELIVERY_WEBHOOK_SECRET` | Webhook HMAC secret | `<secret>` |
| `NOTIFICATION_DELIVERY_WEBHOOK_KEY_ID` | Key identifier for rotation | `key-001` |

### Bot Defense & Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_DEFENSE_ENABLED` | Enable CAPTCHA (any value other than `false` = enabled) | `true` |
| `BOT_DEFENSE_PROVIDER` | CAPTCHA provider (`turnstile` or `recaptcha`) | `turnstile` |
| `BOT_DEFENSE_MIN_SCORE` | Numeric threshold for scored challenges | `0.5` |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (required when provider=turnstile) | `<site-key>` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (required when provider=turnstile) | `<secret>` |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key (required when provider=recaptcha) | `<site-key>` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret (required when provider=recaptcha) | `<secret>` |
| `BOT_CHALLENGE_LOGIN_FAILURE_THRESHOLD` | Failed logins before challenge (rolling window) | `3` |
| `BOT_CHALLENGE_SIGNUP_FAILURE_THRESHOLD` | Failed signups before challenge | `2` |
| `BOT_CHALLENGE_PASSWORD_RESET_THRESHOLD` | Failed resets before challenge | `2` |

Rate limits are overridable per scope using the pattern
`AUTH_RATE_LIMIT_<SCOPE>_<DIMENSION>_<FIELD>` (e.g. `AUTH_RATE_LIMIT_LOGIN_IP_MAX`).
See `ENVIRONMENT.md` §11 for the full default policy table and all 7 scopes.

### Password Policy & Auth Risk

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_PASSWORD_MIN_LENGTH` | Minimum password length | `12` |
| `AUTH_BREACHED_PASSWORD_CHECK` | Check against known breaches (set `false` to disable) | `true` |
| `AUTH_HIGH_RISK_SCORE_THRESHOLD` | Session risk score ≥ threshold is flagged high-risk | `60` |

> Mixed-case/digit/symbol password rules are enforced in code and are **not**
> env-configurable.

### Multi-factor Auth

| Variable | Description | Default |
|----------|-------------|---------|
| `MFA_CODE_SECRET` | Secret for TOTP/code signing (falls back to `SESSION_SECRET`) | — |
| `AUTH_MFA_CODE_TTL_MS` | MFA code lifetime | `600000` (10 min) |
| `AUTH_MFA_MAX_ATTEMPTS` | Max verification attempts before lockout | `5` |

### Token Lifetimes

| Variable | Description | Default | Bounds |
|----------|-------------|---------|--------|
| `AUTH_EMAIL_VERIFICATION_TTL_MS` | Email verification token lifetime | `86400000` (24h) | 5 min – 30 days |
| `AUTH_PASSWORD_RESET_TTL_MS` | Password reset token lifetime | `3600000` (1h) | — |

### AI Service Configuration

For server-side AI story suggestions. The service is "configured" only when an API key
**and** at least one endpoint are present.

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_API_KEY` | AI service API key (alias: `AZURE_OPENAI_API_KEY`) | — |
| `AI_PROJECT_ENDPOINT` | Azure AI project endpoint (alias: `AZURE_AI_PROJECT_ENDPOINT`) | — |
| `AZURE_OPENAI_ENDPOINT` | Additional Azure OpenAI endpoint | — |
| `AI_PROJECT_API_VERSION` | Azure API version | `2024-05-01-preview` |
| `AI_MODEL` | Model name | `gpt-4.1-mini` |

Optional tuning (bounded — see `ENVIRONMENT.md` §13 for exact bounds):

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_TIMEOUT_MS` | Request timeout | `15000` |
| `AI_MAX_RETRIES` | Maximum retry attempts (0–5) | `2` |
| `AI_RETRY_BASE_DELAY_MS` | Base delay for exponential backoff | `300` |
| `AI_MAX_OUTPUT_TOKENS` | Max output tokens (64–2000) | `450` |
| `AI_MAX_CONCURRENCY` | Concurrent request limit (1–64) | `8` |
| `AI_CIRCUIT_OPEN_AFTER_FAILURES` | Failures before circuit opens (1–20) | `5` |
| `AI_CIRCUIT_RESET_MS` | Circuit reset interval | `45000` |
| `AI_TEMPERATURE` | Sampling temperature (0–1.5) | `0.4` |

### Email-Verification Retry Worker

All positive integers, clamped to bounds (see `ENVIRONMENT.md` §10):

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS` | Retry backoff base | `120000` |
| `AUTH_EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS` | Max delivery attempts | `6` |
| `AUTH_EMAIL_VERIFICATION_RETRY_BATCH_SIZE` | Rows per batch | `20` |
| `AUTH_EMAIL_VERIFICATION_RETRY_LOOP_MS` | Poll interval | `60000` |
| `AUTH_EMAIL_VERIFICATION_RETRY_CONCURRENCY` | Parallel deliveries | `5` |
| `AUTH_EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS` | Per-delivery timeout | `15000` |
| `AUTH_EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS` | Worker run cap | `90000` |
| `AUTH_EMAIL_VERIFICATION_RETRY_DELIVERED_RETENTION_DAYS` | Delivered-row retention | `30` |

### Admin & Monitoring

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN` | Bearer token for the retry-worker health endpoint | — |
| `HEALTH_DB_CHECK_TIMEOUT_MS` | DB liveness probe timeout for `/api/health` | `2500` |

Optional security-alert webhook (high/critical auth events):

| Variable | Description | Example |
|----------|-------------|---------|
| `SECURITY_ALERT_WEBHOOK_URL` | Security alert webhook | `https://hooks.patan.site/alerts` |
| `SECURITY_ALERT_WEBHOOK_SECRET` | Webhook HMAC secret | `<secret>` |
| `SECURITY_ALERT_WEBHOOK_KEY_ID` | Key identifier for rotation | `key-001` |

## Security Architecture

### Defense in Depth Layers

1. **Perimeter Security**
   - CSRF protection on all mutating endpoints
   - Rate limiting per IP and per identifier
   - Bot challenge system with CAPTCHA
   - Security headers (CSP, HSTS, X-Frame-Options, etc.)

2. **Authentication**
   - Stateful session management with database tracking
   - Account status validation on every request
   - Soft-delete detection for immediate access revocation
   - Multi-factor authentication support
   - OAuth with state parameter validation

3. **Authorization**
   - Role-based access control (USER, MODERATOR, ADMIN, SUPER_ADMIN)
   - User block enforcement in messaging
   - Content ownership validation
   - Elevated role checks for admin operations

4. **Data Protection**
   - Password hashing with scrypt
   - Token hashing at rest (reset tokens, verification tokens)
   - Single-use token consumption
   - Automatic secret redaction in logs
   - Parameterized queries (SQL injection prevention)

5. **Session Management**
   - Database-backed session records
   - Device fingerprinting
   - Session revocation capability
   - Automatic logout on password change
   - "Logout all devices" functionality

6. **Infrastructure**
   - Non-root Docker container execution
   - Read-only filesystem where possible
   - Health checks for orchestration
   - Minimal runtime image (Alpine-based)

### CSRF Protection

All POST, PUT, PATCH, and DELETE requests require CSRF token validation:

- Token generated per session in root loader
- Double-submit cookie pattern
- Signed tokens with HMAC-SHA256
- Timing-safe comparison
- SameSite=Lax cookie configuration

Protected routes include:
- Authentication (signup, login, logout, password reset)
- Story management (create, edit, delete)
- Aspirations (create, edit, delete)
- Messaging (send message)
- Profile updates
- Moderation actions
- Follow/unfollow/block operations

### Account Status Lifecycle

Users progress through account states:

```
PENDING_VERIFICATION → ACTIVE → (BLOCKED | SUSPENDED)
```

- **PENDING_VERIFICATION**: Email not yet verified; limited access
- **ACTIVE**: Full platform access
- **BLOCKED**: Immediate access denial; sessions revoked
- **SUSPENDED**: Temporary access denial; sessions revoked

Status changes trigger automatic session revocation for immediate effect.

### Session Revocation

Sessions can be revoked:
- By user (logout current device)
- By user (logout all other devices)
- By user (logout all devices including current)
- By administrator (any user's session)
- Automatically (password change, account block/suspend)

Session metadata tracked:
- Device fingerprint
- User agent
- IP address at creation
- Last activity timestamp
- Revocation timestamp and reason

## Database Migrations

### Running Migrations

Development:
```bash
npx prisma migrate dev --name <migration_name>
```

Production:
```bash
npx prisma migrate deploy
```

### Migration Safety

- All migrations are transactional
- Forward and backward compatibility maintained
- No destructive changes without explicit data migration
- Indexes added for performance
- Foreign key constraints enforced

### Schema Evolution

The schema evolves with these principles:
1. Nullable fields with defaults for backward compatibility
2. Separate data migration scripts when needed
3. Index creation for new query patterns
4. No modification of historical migrations

## Deployment

### Docker Deployment

Build and run:

```bash
docker build -t patan-app .
docker run -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e DATABASE_URL="postgresql://..." \
  patan-app
```

Container security features:
- Runs as non-root user (`node`)
- Health check endpoint configured
- Minimal Alpine-based runtime image
- Build tools excluded from runtime
- Proper file ownership with `--chown=node:node`

### Container Orchestration

For Kubernetes, ECS, or Cloud Run:

```yaml
# Example Kubernetes deployment snippet
spec:
  containers:
  - name: patan-app
    image: patan-app:latest
    securityContext:
      runAsNonRoot: true
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 30
```

### DIY Deployment

Build for production:

```bash
npm run build
```

Deploy the output structure:

```
├── package.json
├── package-lock.json
├── build/
│   ├── client/    # Static assets (serve via CDN)
│   └── server/    # Server-side code (Node.js entry point)
```

Start the server:

```bash
NODE_ENV=production node ./build/server/index.js
```

### Platform-Specific Guides

#### AWS ECS
1. Build and push ECR image
2. Create task definition with secrets from Secrets Manager
3. Deploy service with load balancer
4. Configure RDS PostgreSQL with private subnet

#### Google Cloud Run
1. Build container with Artifact Registry
2. Deploy to Cloud Run with Cloud SQL Proxy
3. Configure IAM for minimal permissions
4. Enable Cloud Monitoring alerts

#### Azure Container Apps
1. Containerize with Azure Container Registry
2. Deploy to Container Apps environment
3. Use Azure Database for PostgreSQL
4. Configure managed identity for secrets

## Testing

Run the test suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

### Security Test Coverage

Tests verify:
- CSRF token validation on all mutating routes
- Account status enforcement (BLOCKED/SUSPENDED denied)
- Session revocation effectiveness
- Rate limiting behavior
- Bot challenge flow
- Password policy enforcement
- Secret redaction in logs
- Migration integrity

## Development Workflow

### Code Style

```bash
npm run lint
npm run format
```

### Type Checking

```bash
npm run typecheck
```

### Database Operations

Reset database (development only):

```bash
npx prisma migrate reset
```

Generate Prisma client:

```bash
npx prisma generate
```

View database:

```bash
npx prisma studio
```

## Architecture Overview

### Directory Structure

```
/workspace
├── app/
│   ├── components/     # Reusable UI components
│   ├── routes/         # Route handlers (loaders/actions)
│   ├── utils/          # Server-side utilities
│   │   ├── auth.server.ts         # Session & JWT management
│   │   ├── csrf.server.ts         # CSRF protection
│   │   ├── rate-limit.server.ts   # Rate limiting
│   │   ├── bot-defense.server.ts  # Bot challenge system
│   │   ├── mfa.server.ts          # MFA implementation
│   │   ├── password-security.server.ts  # Password validation
│   │   ├── session.server.ts      # Session lifecycle
│   │   ├── logger-redaction.server.ts  # Log sanitization
│   │   └── ...
│   └── root.tsx        # Root component with providers
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Migration files
│   └── seed.ts         # Seed data
├── Dockerfile          # Container configuration
├── docker-compose.yml  # Local development services
├── vite.config.ts      # Build configuration
└── package.json        # Dependencies
```

### Request Flow

1. Browser sends request with CSRF token and session cookie
2. Root loader issues CSRF token if missing
3. Route action/loader executes:
   - CSRF verification (for mutations)
   - Session validation
   - Account status check
   - Rate limiting
   - Bot challenge (if triggered)
   - Business logic
4. Response with updated session if needed
5. Security events logged for audit

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

Proprietary — All rights reserved.

## Support

For issues and questions:
- GitHub Issues: [Link to repo issues]
- Email: support@patan.site
- Documentation: https://docs.patan.site

---

Built with ❤️ using React Router, Prisma, and PostgreSQL.
