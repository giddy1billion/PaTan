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

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | HMAC secret for session cookies and JWT signing (generate with `openssl rand -base64 32`) | `<32-char-random-string>` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/patan` |
| `APP_ORIGIN` | Application base URL | `https://patan.site` |

### OAuth Configuration

For Google and Facebook OAuth login:

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

### Bot Defense & Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_DEFENSE_PROVIDER` | CAPTCHA provider (`turnstile`, `recaptcha`, `hcaptcha`) | `turnstile` |
| `BOT_DEFENSE_SITE_KEY` | Site key for CAPTCHA provider | `<site-key>` |
| `BOT_DEFENSE_SECRET_KEY` | Secret key for CAPTCHA provider | `<secret>` |
| `AUTH_RATE_LIMIT_LOGIN_MAX_ATTEMPTS` | Max login attempts per window | `5` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `900000` (15 min) |

### Password Policy

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_PASSWORD_MIN_LENGTH` | Minimum password length | `12` |
| `AUTH_PASSWORD_REQUIRE_MIXED_CASE` | Require upper and lowercase | `true` |
| `AUTH_PASSWORD_REQUIRE_DIGIT` | Require at least one digit | `true` |
| `AUTH_PASSWORD_REQUIRE_SYMBOL` | Require at least one symbol | `true` |
| `AUTH_PASSWORD_CHECK_BREACH_DATABASE` | Check against known breaches | `true` |

### AI Service Configuration

For server-side AI story suggestions:

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_API_KEY` | AI service API key | - |
| `AI_PROJECT_ENDPOINT` | Azure AI project endpoint | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | - |
| `AI_MODEL` | Model name | `gpt-4.1-mini` |

Optional tuning:

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_TIMEOUT_MS` | Request timeout | `30000` |
| `AI_MAX_RETRIES` | Maximum retry attempts | `3` |
| `AI_RETRY_BASE_DELAY_MS` | Base delay for exponential backoff | `1000` |
| `AI_MAX_CONCURRENCY` | Concurrent request limit | `10` |
| `AI_CIRCUIT_OPEN_AFTER_FAILURES` | Failures before circuit opens | `5` |

### Admin & Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN` | Bearer token for health endpoint | `<secure-token>` |
| `NOTIFICATION_DELIVERY_WEBHOOK_URL` | Notification delivery webhook | `https://hooks.patan.site/notify` |
| `NOTIFICATION_DELIVERY_WEBHOOK_SECRET` | Webhook HMAC secret | `<secret>` |

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
