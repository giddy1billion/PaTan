import { createHash } from "node:crypto";
import { redirect } from "react-router";
import { pool } from "~/utils/db.server";

export type AuthRateLimitScope =
  | "login"
  | "signup"
  | "oauth-init"
  | "oauth-callback"
  | "password-reset"
  | "mfa"
  | "ai-suggest";

type BucketPolicy = {
  windowMs: number;
  max: number;
  blockMs: number;
};

type ScopePolicy = {
  byIp: BucketPolicy;
  byIdentifier?: BucketPolicy;
};

type BucketState = {
  hits: number;
  blockedUntilMs: number | null;
};

type MemoryBucket = {
  hits: number;
  windowStartMs: number;
  blockedUntilMs: number | null;
};

type DbBucketRow = {
  hits: number;
  blocked_until: Date | string | null;
};

export type AuthRateLimitAllowedResult = {
  allowed: true;
  headers: Headers;
};

export type AuthRateLimitBlockedResult = {
  allowed: false;
  retryAfterSeconds: number;
  headers: Headers;
};

export type AuthRateLimitResult =
  | AuthRateLimitAllowedResult
  | AuthRateLimitBlockedResult;

const DEFAULT_RATE_LIMIT_POLICIES: Record<AuthRateLimitScope, ScopePolicy> = {
  login: {
    byIp: { windowMs: 15 * 60 * 1000, max: 20, blockMs: 30 * 60 * 1000 },
    byIdentifier: { windowMs: 15 * 60 * 1000, max: 8, blockMs: 30 * 60 * 1000 },
  },
  signup: {
    byIp: { windowMs: 60 * 60 * 1000, max: 12, blockMs: 2 * 60 * 60 * 1000 },
    byIdentifier: { windowMs: 24 * 60 * 60 * 1000, max: 3, blockMs: 24 * 60 * 60 * 1000 },
  },
  "oauth-init": {
    byIp: { windowMs: 15 * 60 * 1000, max: 30, blockMs: 30 * 60 * 1000 },
  },
  "oauth-callback": {
    byIp: { windowMs: 15 * 60 * 1000, max: 40, blockMs: 30 * 60 * 1000 },
  },
  "password-reset": {
    byIp: { windowMs: 60 * 60 * 1000, max: 8, blockMs: 60 * 60 * 1000 },
    byIdentifier: { windowMs: 6 * 60 * 60 * 1000, max: 3, blockMs: 6 * 60 * 60 * 1000 },
  },
  mfa: {
    byIp: { windowMs: 15 * 60 * 1000, max: 12, blockMs: 30 * 60 * 1000 },
    byIdentifier: { windowMs: 15 * 60 * 1000, max: 8, blockMs: 30 * 60 * 1000 },
  },
  "ai-suggest": {
    byIp: { windowMs: 10 * 60 * 1000, max: 40, blockMs: 20 * 60 * 1000 },
    byIdentifier: { windowMs: 10 * 60 * 1000, max: 20, blockMs: 20 * 60 * 1000 },
  },
};

const RATE_LIMIT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const memoryFallbackBuckets = new Map<string, MemoryBucket>();

let schemaReadyPromise: Promise<void> | null = null;
let lastCleanupRunAt = 0;

function getScopeEnvPrefix(scope: AuthRateLimitScope) {
  if (scope === "oauth-init") return "OAUTH_INIT";
  if (scope === "oauth-callback") return "OAUTH_CALLBACK";
  if (scope === "password-reset") return "PASSWORD_RESET";
  if (scope === "ai-suggest") return "AI_SUGGEST";
  return scope.toUpperCase();
}

function readNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPolicyByEnv(scope: AuthRateLimitScope): ScopePolicy {
  const defaultPolicy = DEFAULT_RATE_LIMIT_POLICIES[scope];
  const prefix = getScopeEnvPrefix(scope);

  const byIp: BucketPolicy = {
    windowMs: readNumberEnv(`AUTH_RATE_LIMIT_${prefix}_IP_WINDOW_MS`, defaultPolicy.byIp.windowMs),
    max: readNumberEnv(`AUTH_RATE_LIMIT_${prefix}_IP_MAX`, defaultPolicy.byIp.max),
    blockMs: readNumberEnv(`AUTH_RATE_LIMIT_${prefix}_IP_BLOCK_MS`, defaultPolicy.byIp.blockMs),
  };

  if (!defaultPolicy.byIdentifier) {
    return { byIp };
  }

  const byIdentifier: BucketPolicy = {
    windowMs: readNumberEnv(
      `AUTH_RATE_LIMIT_${prefix}_IDENTIFIER_WINDOW_MS`,
      defaultPolicy.byIdentifier.windowMs,
    ),
    max: readNumberEnv(`AUTH_RATE_LIMIT_${prefix}_IDENTIFIER_MAX`, defaultPolicy.byIdentifier.max),
    blockMs: readNumberEnv(
      `AUTH_RATE_LIMIT_${prefix}_IDENTIFIER_BLOCK_MS`,
      defaultPolicy.byIdentifier.blockMs,
    ),
  };

  return {
    byIp,
    byIdentifier,
  };
}

function buildErrorRoute(route: string, errorCode: string) {
  const separator = route.includes("?") ? "&" : "?";
  return `${route}${separator}error=${encodeURIComponent(errorCode)}`;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();

  const directIp =
    forwardedIp ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const normalized = directIp.replace(/[^a-zA-Z0-9:.\-]/g, "").slice(0, 64);
  return normalized || "unknown";
}

function normalizeIdentifier(identifier: string | null | undefined) {
  const normalized = identifier?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 32);
}

function buildBucketKey({
  scope,
  dimension,
  value,
}: {
  scope: AuthRateLimitScope;
  dimension: "ip" | "identifier";
  value: string;
}) {
  return `auth:${scope}:${dimension}:${value}`;
}

async function ensureRateLimitSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_rate_limit_buckets (
          bucket_key TEXT PRIMARY KEY,
          hits INTEGER NOT NULL,
          window_start TIMESTAMPTZ NOT NULL,
          blocked_until TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_rate_limit_buckets_updated_at_idx
        ON auth_rate_limit_buckets (updated_at)
      `);
    })();
  }

  await schemaReadyPromise;
}

async function maybeCleanupOldBuckets() {
  const now = Date.now();
  if (now - lastCleanupRunAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanupRunAt = now;

  await pool.query(
    `
      DELETE FROM auth_rate_limit_buckets
      WHERE updated_at < NOW() - ($1::bigint * INTERVAL '1 millisecond')
    `,
    [RATE_LIMIT_RETENTION_MS],
  );
}

async function consumeBucketInDatabase(bucketKey: string, policy: BucketPolicy): Promise<BucketState> {
  await ensureRateLimitSchema();
  await maybeCleanupOldBuckets();

  const result = await pool.query<DbBucketRow>(
    `
      INSERT INTO auth_rate_limit_buckets AS rl
        (bucket_key, hits, window_start, blocked_until, updated_at)
      VALUES
        ($1, 1, NOW(), NULL, NOW())
      ON CONFLICT (bucket_key) DO UPDATE
      SET
        hits = CASE
          WHEN rl.blocked_until IS NOT NULL AND rl.blocked_until > NOW() THEN rl.hits
          WHEN rl.window_start + ($2::bigint * INTERVAL '1 millisecond') <= NOW() THEN 1
          ELSE rl.hits + 1
        END,
        window_start = CASE
          WHEN rl.window_start + ($2::bigint * INTERVAL '1 millisecond') <= NOW() THEN NOW()
          ELSE rl.window_start
        END,
        blocked_until = CASE
          WHEN rl.blocked_until IS NOT NULL AND rl.blocked_until > NOW() THEN rl.blocked_until
          WHEN (
            CASE
              WHEN rl.window_start + ($2::bigint * INTERVAL '1 millisecond') <= NOW() THEN 1
              ELSE rl.hits + 1
            END
          ) > $3
            THEN NOW() + ($4::bigint * INTERVAL '1 millisecond')
          ELSE NULL
        END,
        updated_at = NOW()
      RETURNING hits, blocked_until
    `,
    [bucketKey, policy.windowMs, policy.max, policy.blockMs],
  );

  const row = result.rows[0];

  return {
    hits: row?.hits ?? 0,
    blockedUntilMs: row?.blocked_until ? new Date(row.blocked_until).getTime() : null,
  };
}

function consumeBucketInMemory(bucketKey: string, policy: BucketPolicy): BucketState {
  const now = Date.now();
  const existing = memoryFallbackBuckets.get(bucketKey);

  if (!existing) {
    const created: MemoryBucket = {
      hits: 1,
      windowStartMs: now,
      blockedUntilMs: null,
    };
    memoryFallbackBuckets.set(bucketKey, created);

    return {
      hits: created.hits,
      blockedUntilMs: created.blockedUntilMs,
    };
  }

  if (existing.blockedUntilMs && existing.blockedUntilMs > now) {
    return {
      hits: existing.hits,
      blockedUntilMs: existing.blockedUntilMs,
    };
  }

  if (now - existing.windowStartMs >= policy.windowMs) {
    existing.hits = 1;
    existing.windowStartMs = now;
    existing.blockedUntilMs = null;
  } else {
    existing.hits += 1;
    if (existing.hits > policy.max) {
      existing.blockedUntilMs = now + policy.blockMs;
    }
  }

  memoryFallbackBuckets.set(bucketKey, existing);

  return {
    hits: existing.hits,
    blockedUntilMs: existing.blockedUntilMs,
  };
}

async function consumeBucket(bucketKey: string, policy: BucketPolicy): Promise<BucketState> {
  try {
    return await consumeBucketInDatabase(bucketKey, policy);
  } catch {
    return consumeBucketInMemory(bucketKey, policy);
  }
}

function buildRateLimitHeaders({
  limit,
  remaining,
  retryAfterSeconds,
}: {
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
}) {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));

  if (typeof retryAfterSeconds === "number") {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return headers;
}

export async function enforceAuthRateLimit({
  request,
  scope,
  identifier,
}: {
  request: Request;
  scope: AuthRateLimitScope;
  identifier?: string | null;
}): Promise<AuthRateLimitResult> {
  const scopePolicy = getPolicyByEnv(scope);
  const clientIp = getClientIp(request);
  const normalizedIdentifier = normalizeIdentifier(identifier);

  const checks: Array<Promise<{ policy: BucketPolicy; state: BucketState }>> = [];

  checks.push(
    consumeBucket(
      buildBucketKey({
        scope,
        dimension: "ip",
        value: clientIp,
      }),
      scopePolicy.byIp,
    ).then((state) => ({ policy: scopePolicy.byIp, state })),
  );

  if (scopePolicy.byIdentifier && normalizedIdentifier) {
    checks.push(
      consumeBucket(
        buildBucketKey({
          scope,
          dimension: "identifier",
          value: hashIdentifier(normalizedIdentifier),
        }),
        scopePolicy.byIdentifier,
      ).then((state) => ({ policy: scopePolicy.byIdentifier as BucketPolicy, state })),
    );
  }

  const evaluations = await Promise.all(checks);

  const now = Date.now();
  let retryAfterMs = 0;
  let smallestLimit = Number.POSITIVE_INFINITY;
  let smallestRemaining = Number.POSITIVE_INFINITY;

  for (const { policy, state } of evaluations) {
    smallestLimit = Math.min(smallestLimit, policy.max);
    smallestRemaining = Math.min(smallestRemaining, policy.max - state.hits);

    if (state.blockedUntilMs && state.blockedUntilMs > now) {
      retryAfterMs = Math.max(retryAfterMs, state.blockedUntilMs - now);
    }
  }

  const limit =
    Number.isFinite(smallestLimit) && smallestLimit > 0
      ? smallestLimit
      : scopePolicy.byIp.max;
  const remaining =
    Number.isFinite(smallestRemaining) ? Math.max(0, smallestRemaining) : scopePolicy.byIp.max;

  if (retryAfterMs > 0) {
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      retryAfterSeconds,
      headers: buildRateLimitHeaders({
        limit,
        remaining,
        retryAfterSeconds,
      }),
    };
  }

  return {
    allowed: true,
    headers: buildRateLimitHeaders({
      limit,
      remaining,
    }),
  };
}

export function createRateLimitRedirect(route: string, result: AuthRateLimitBlockedResult) {
  return redirect(buildErrorRoute(route, "rate-limited"), {
    headers: result.headers,
  });
}