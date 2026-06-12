import { createHash, randomBytes } from "node:crypto";
import { db, pool } from "~/utils/db.server";
import {
  getSecurityEmailServiceStatus,
  sendSecurityEmail,
} from "~/utils/security-email.server";

function readPositiveIntEnv({
  name,
  fallback,
  min,
  max,
}: {
  name: string;
  fallback: number;
  min: number;
  max: number;
}) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

const EMAIL_VERIFICATION_TTL_MS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_TTL_MS",
  fallback: 24 * 60 * 60 * 1000,
  min: 5 * 60 * 1000,
  max: 30 * 24 * 60 * 60 * 1000,
});
const EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS",
  fallback: 2 * 60 * 1000,
  min: 5 * 1000,
  max: 60 * 60 * 1000,
});
const EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS",
  fallback: 6,
  min: 1,
  max: 20,
});
const EMAIL_VERIFICATION_RETRY_BATCH_SIZE = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_BATCH_SIZE",
  fallback: 20,
  min: 1,
  max: 200,
});
const EMAIL_VERIFICATION_RETRY_LOOP_MS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_LOOP_MS",
  fallback: 60 * 1000,
  min: 5 * 1000,
  max: 10 * 60 * 1000,
});
const EMAIL_VERIFICATION_RETRY_CONCURRENCY = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_CONCURRENCY",
  fallback: 5,
  min: 1,
  max: 20,
});
const EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS",
  fallback: 15 * 1000,
  min: 2 * 1000,
  max: 2 * 60 * 1000,
});
const EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS",
  fallback: 90 * 1000,
  min: 10 * 1000,
  max: 10 * 60 * 1000,
});
const EMAIL_VERIFICATION_RETRY_DELIVERED_RETENTION_DAYS = readPositiveIntEnv({
  name: "AUTH_EMAIL_VERIFICATION_RETRY_DELIVERED_RETENTION_DAYS",
  fallback: 30,
  min: 1,
  max: 365,
});

type VerificationTokenRow = {
  user_id: string;
  email: string;
};

type VerificationRetryRow = {
  id: number;
  user_id: string;
  email: string;
  token_hash: string;
  verify_url: string;
  expires_at: Date;
  attempt_count: number;
  max_attempts: number;
};

type VerificationCandidateUser = {
  id: string;
  email: string | null;
  emailVerified: Date | null;
  deletedAt?: Date | null;
};

type EmailVerificationWorkerState = {
  started: boolean;
  active: boolean;
  timer: ReturnType<typeof setInterval> | null;
  lastRunStartedAt: string | null;
  lastRunFinishedAt: string | null;
  lastRunDurationMs: number | null;
  lastRunOutcome: "success" | "failed" | null;
  lastRunError: string | null;
};

type VerificationRetryCountRow = {
  pending: string;
  due: string;
  locked: string;
  exhausted: string;
  delivered_24h: string;
};

export type EmailVerificationIssueStatus =
  | "sent"
  | "queued"
  | "already-verified"
  | "failed";

export type EmailVerificationIssueResult = {
  status: EmailVerificationIssueStatus;
  verifyUrl: string;
  expiresAt: Date;
  queuedForRetry: boolean;
  queueId?: number;
  provider?: "resend" | "webhook" | "console" | "none";
  failureReason?: string;
};

export type EmailVerificationRetryWorkerStatus = {
  started: boolean;
  active: boolean;
  loopIntervalMs: number;
  retryBaseDelayMs: number;
  maxAttempts: number;
  batchSize: number;
  concurrency: number;
  deliveryTimeoutMs: number;
  runTimeoutMs: number;
  lastRunStartedAt: string | null;
  lastRunFinishedAt: string | null;
  lastRunDurationMs: number | null;
  lastRunOutcome: "success" | "failed" | null;
  lastRunError: string | null;
};

export type EmailVerificationRetryQueueStats = {
  pending: number;
  due: number;
  locked: number;
  exhausted: number;
  deliveredLast24Hours: number;
};

export type BulkResendEmailVerificationOptions = {
  maxUsers?: number;
  batchSize?: number;
  concurrency?: number;
  dryRun?: boolean;
};

export type BulkResendEmailVerificationSummary = {
  scanned: number;
  targeted: number;
  sent: number;
  queued: number;
  alreadyVerified: number;
  failed: number;
};

let schemaReadyPromise: Promise<void> | null = null;

const globalState = globalThis as typeof globalThis & {
  __emailVerificationWorkerState?: EmailVerificationWorkerState;
};

if (!globalState.__emailVerificationWorkerState) {
  globalState.__emailVerificationWorkerState = {
    started: false,
    active: false,
    timer: null,
    lastRunStartedAt: null,
    lastRunFinishedAt: null,
    lastRunDurationMs: null,
    lastRunOutcome: null,
    lastRunError: null,
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateToken() {
  return randomBytes(32).toString("base64url");
}

function calculateBackoffMs(attemptCount: number) {
  const cappedAttempt = Math.max(0, Math.min(attemptCount, 10));
  return EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS * Math.pow(2, cappedAttempt);
}

function parseCount(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown-error";
}

function getAppOrigin(requestUrl?: string) {
  const explicit = process.env.APP_ORIGIN?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  return "http://localhost:5173";
}

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_email_verification_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          consumed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_email_verification_tokens_user_idx
        ON auth_email_verification_tokens (user_id, consumed_at, expires_at)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_email_verification_retry_queue (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          verify_url TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          next_attempt_at TIMESTAMPTZ NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL,
          last_error TEXT,
          last_attempt_at TIMESTAMPTZ,
          delivered_at TIMESTAMPTZ,
          locked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_email_verification_retry_queue_pending_idx
        ON auth_email_verification_retry_queue (next_attempt_at, delivered_at, attempt_count)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_email_verification_retry_queue_user_idx
        ON auth_email_verification_retry_queue (user_id, delivered_at)
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS auth_email_verification_retry_queue_unique_pending_idx
        ON auth_email_verification_retry_queue (token_hash)
        WHERE delivered_at IS NULL
      `);

      await pool.query(`
        CREATE OR REPLACE FUNCTION set_auth_email_verification_retry_queue_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);

      await pool.query(`
        DROP TRIGGER IF EXISTS auth_email_verification_retry_queue_set_updated_at
        ON auth_email_verification_retry_queue
      `);

      await pool.query(`
        CREATE TRIGGER auth_email_verification_retry_queue_set_updated_at
        BEFORE UPDATE ON auth_email_verification_retry_queue
        FOR EACH ROW
        EXECUTE FUNCTION set_auth_email_verification_retry_queue_updated_at()
      `);
    })();
  }

  await schemaReadyPromise;
}

async function queueVerificationRetry({
  userId,
  email,
  tokenHash,
  verifyUrl,
  expiresAt,
  failureReason,
}: {
  userId: string;
  email: string;
  tokenHash: string;
  verifyUrl: string;
  expiresAt: Date;
  failureReason: string;
}) {
  const nextAttempt = new Date(Date.now() + EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS);

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO auth_email_verification_retry_queue (
        user_id,
        email,
        token_hash,
        verify_url,
        expires_at,
        next_attempt_at,
        attempt_count,
        max_attempts,
        last_error,
        last_attempt_at,
        locked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, NOW(), NULL)
      ON CONFLICT (token_hash)
      WHERE delivered_at IS NULL
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        verify_url = EXCLUDED.verify_url,
        expires_at = EXCLUDED.expires_at,
        next_attempt_at = EXCLUDED.next_attempt_at,
        max_attempts = EXCLUDED.max_attempts,
        last_error = EXCLUDED.last_error,
        last_attempt_at = NOW(),
        locked_at = NULL,
        updated_at = NOW()
      RETURNING id::text
    `,
    [
      userId,
      email,
      tokenHash,
      verifyUrl,
      expiresAt,
      nextAttempt,
      EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS,
      failureReason,
    ],
  );

  const id = Number.parseInt(result.rows[0]?.id ?? "0", 10);
  return Number.isFinite(id) ? id : undefined;
}

async function markRetryDelivered(id: number) {
  await pool.query(
    `
      UPDATE auth_email_verification_retry_queue
      SET delivered_at = NOW(),
          locked_at = NULL,
          last_error = NULL,
          last_attempt_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `,
    [id],
  );
}

async function markRetryAttemptFailure({
  id,
  attemptCount,
  maxAttempts,
  failureReason,
}: {
  id: number;
  attemptCount: number;
  maxAttempts: number;
  failureReason: string;
}) {
  const nextAttemptCount = attemptCount + 1;
  const exhausted = nextAttemptCount >= maxAttempts;
  const delayMs = calculateBackoffMs(nextAttemptCount);
  const nextAttemptAt = new Date(Date.now() + delayMs);

  await pool.query(
    `
      UPDATE auth_email_verification_retry_queue
      SET attempt_count = $2,
          next_attempt_at = CASE
            WHEN $3::boolean THEN NOW() + INTERVAL '36500 days'
            ELSE $4
          END,
          last_error = $5,
          last_attempt_at = NOW(),
          locked_at = NULL,
          updated_at = NOW()
      WHERE id = $1
    `,
    [id, nextAttemptCount, exhausted, nextAttemptAt, failureReason],
  );
}

async function fetchRetryBatch() {
  const result = await pool.query<VerificationRetryRow>(
    `
      WITH due AS (
        SELECT id
        FROM auth_email_verification_retry_queue
        WHERE delivered_at IS NULL
          AND expires_at > NOW()
          AND attempt_count < max_attempts
          AND next_attempt_at <= NOW()
          AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '2 minutes')
        ORDER BY next_attempt_at ASC, id ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE auth_email_verification_retry_queue q
      SET locked_at = NOW(),
          updated_at = NOW()
      FROM due
      WHERE q.id = due.id
      RETURNING q.id,
                q.user_id,
                q.email,
                q.token_hash,
                q.verify_url,
                q.expires_at,
                q.attempt_count,
                q.max_attempts
    `,
    [EMAIL_VERIFICATION_RETRY_BATCH_SIZE],
  );

  return result.rows;
}

async function releaseRetryRowsForVerifiedOrExpiredUsers() {
  await pool.query(
    `
      DELETE FROM auth_email_verification_retry_queue q
      USING users u
      WHERE q.user_id = u.id
        AND q.delivered_at IS NULL
        AND (q.expires_at <= NOW() OR u.email_verified IS NOT NULL)
    `,
  );

  await pool.query(
    `
      DELETE FROM auth_email_verification_retry_queue
      WHERE delivered_at IS NULL
        AND expires_at <= NOW()
    `,
  );

  await pool.query(
    `
      DELETE FROM auth_email_verification_retry_queue
      WHERE delivered_at IS NOT NULL
        AND delivered_at < NOW() - ($1::int * INTERVAL '1 day')
    `,
    [EMAIL_VERIFICATION_RETRY_DELIVERED_RETENTION_DAYS],
  );
}

async function sendVerificationEmailWithTimeout(row: VerificationRetryRow) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<Awaited<ReturnType<typeof sendSecurityEmail>>>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        sent: false,
        status: "failed",
        provider: "none",
        failureReason: "delivery-unavailable",
      });
    }, EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      sendSecurityEmail({
        to: row.email,
        subject: "Verify your PaTan account email",
        category: "email-verification",
        text: `Please verify your email by opening this link: ${row.verify_url}`,
        metadata: {
          userId: row.user_id,
          verifyUrl: row.verify_url,
          expiresAt: row.expires_at.toISOString(),
          queueId: row.id,
          attempt: row.attempt_count + 1,
        },
        requireDelivery: true,
      }),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function processRetryRow({
  row,
  userById,
}: {
  row: VerificationRetryRow;
  userById: Map<string, VerificationCandidateUser>;
}) {
  const user = userById.get(row.user_id);

  if (!user || user.deletedAt || user.emailVerified || !user.email) {
    await pool.query(
      `
        DELETE FROM auth_email_verification_retry_queue
        WHERE id = $1
      `,
      [row.id],
    );
    return;
  }

  const delivery = await sendVerificationEmailWithTimeout(row);
  if (delivery.sent && delivery.status === "sent") {
    await markRetryDelivered(row.id);
    return;
  }

  await markRetryAttemptFailure({
    id: row.id,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    failureReason: delivery.failureReason ?? "delivery-unavailable",
  });
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`email-verification-worker-timeout-${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function retryPendingVerificationEmails() {
  await ensureSchema();

  const serviceStatus = getSecurityEmailServiceStatus();
  if (!serviceStatus.deliveryReady) {
    return;
  }

  await releaseRetryRowsForVerifiedOrExpiredUsers();

  const batch = await fetchRetryBatch();
  if (batch.length === 0) {
    return;
  }

  const userIds = Array.from(new Set(batch.map((row) => row.user_id)));
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      deletedAt: true,
    },
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  for (let index = 0; index < batch.length; index += EMAIL_VERIFICATION_RETRY_CONCURRENCY) {
    const group = batch.slice(index, index + EMAIL_VERIFICATION_RETRY_CONCURRENCY);
    const settled = await Promise.allSettled(
      group.map((row) => processRetryRow({ row, userById })),
    );

    for (const [position, result] of settled.entries()) {
      if (result.status === "rejected") {
        const row = group[position];
        await markRetryAttemptFailure({
          id: row.id,
          attemptCount: row.attempt_count,
          maxAttempts: row.max_attempts,
          failureReason: "delivery-unavailable",
        });
      }
    }
  }
}

export function startEmailVerificationRetryWorker() {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const state = globalState.__emailVerificationWorkerState;
  if (!state || state.started) {
    return;
  }

  state.started = true;

  const run = async () => {
    if (state.active) {
      return;
    }

    const runStartedAtMs = Date.now();
    state.active = true;
    state.lastRunStartedAt = new Date(runStartedAtMs).toISOString();
    state.lastRunFinishedAt = null;
    state.lastRunDurationMs = null;
    state.lastRunOutcome = null;
    state.lastRunError = null;

    try {
      await runWithTimeout(
        retryPendingVerificationEmails(),
        EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS,
      );

      state.lastRunOutcome = "success";
    } catch (error) {
      state.lastRunOutcome = "failed";
      state.lastRunError = toErrorMessage(error);
      console.warn("[email-verification-retry-worker] run failed", error);
    } finally {
      state.lastRunFinishedAt = new Date().toISOString();
      state.lastRunDurationMs = Date.now() - runStartedAtMs;
      state.active = false;
    }
  };

  void run();

  state.timer = setInterval(() => {
    void run();
  }, EMAIL_VERIFICATION_RETRY_LOOP_MS);

  if (typeof state.timer.unref === "function") {
    state.timer.unref();
  }
}

export function stopEmailVerificationRetryWorkerForTests() {
  const state = globalState.__emailVerificationWorkerState;
  if (!state) {
    return;
  }

  if (state.timer) {
    clearInterval(state.timer);
  }

  state.timer = null;
  state.started = false;
  state.active = false;
  state.lastRunStartedAt = null;
  state.lastRunFinishedAt = null;
  state.lastRunDurationMs = null;
  state.lastRunOutcome = null;
  state.lastRunError = null;
}

export function getEmailVerificationRetryWorkerStatus(): EmailVerificationRetryWorkerStatus {
  const state = globalState.__emailVerificationWorkerState;

  return {
    started: Boolean(state?.started),
    active: Boolean(state?.active),
    loopIntervalMs: EMAIL_VERIFICATION_RETRY_LOOP_MS,
    retryBaseDelayMs: EMAIL_VERIFICATION_RETRY_BASE_DELAY_MS,
    maxAttempts: EMAIL_VERIFICATION_RETRY_MAX_ATTEMPTS,
    batchSize: EMAIL_VERIFICATION_RETRY_BATCH_SIZE,
    concurrency: EMAIL_VERIFICATION_RETRY_CONCURRENCY,
    deliveryTimeoutMs: EMAIL_VERIFICATION_DELIVERY_TIMEOUT_MS,
    runTimeoutMs: EMAIL_VERIFICATION_WORKER_RUN_TIMEOUT_MS,
    lastRunStartedAt: state?.lastRunStartedAt ?? null,
    lastRunFinishedAt: state?.lastRunFinishedAt ?? null,
    lastRunDurationMs: state?.lastRunDurationMs ?? null,
    lastRunOutcome: state?.lastRunOutcome ?? null,
    lastRunError: state?.lastRunError ?? null,
  };
}

export async function getEmailVerificationRetryQueueStats(): Promise<EmailVerificationRetryQueueStats> {
  await ensureSchema();

  const result = await pool.query<VerificationRetryCountRow>(`
    SELECT
      COUNT(*) FILTER (
        WHERE delivered_at IS NULL
          AND attempt_count < max_attempts
      )::text AS pending,
      COUNT(*) FILTER (
        WHERE delivered_at IS NULL
          AND attempt_count < max_attempts
          AND next_attempt_at <= NOW()
      )::text AS due,
      COUNT(*) FILTER (
        WHERE delivered_at IS NULL
          AND locked_at IS NOT NULL
          AND locked_at > NOW() - INTERVAL '2 minutes'
      )::text AS locked,
      COUNT(*) FILTER (
        WHERE delivered_at IS NULL
          AND attempt_count >= max_attempts
      )::text AS exhausted,
      COUNT(*) FILTER (
        WHERE delivered_at IS NOT NULL
          AND delivered_at > NOW() - INTERVAL '24 hours'
      )::text AS delivered_24h
    FROM auth_email_verification_retry_queue
  `);

  const row = result.rows[0];

  return {
    pending: parseCount(row?.pending),
    due: parseCount(row?.due),
    locked: parseCount(row?.locked),
    exhausted: parseCount(row?.exhausted),
    deliveredLast24Hours: parseCount(row?.delivered_24h),
  };
}

export async function issueEmailVerification({
  userId,
  email,
  requestUrl,
  redirectTo,
}: {
  userId: string;
  email: string;
  requestUrl?: string;
  redirectTo?: string;
}): Promise<EmailVerificationIssueResult> {
  await ensureSchema();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new Error("email-verification-user-not-found");
  }

  if (user.emailVerified) {
    return {
      status: "already-verified",
      verifyUrl: "",
      expiresAt: new Date(),
      queuedForRetry: false,
      provider: "none",
    };
  }

  await pool.query(
    `
      DELETE FROM auth_email_verification_tokens
      WHERE user_id = $1
        OR expires_at < NOW()
        OR consumed_at IS NOT NULL
    `,
    [userId],
  );

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await pool.query(
    `
      INSERT INTO auth_email_verification_tokens (token_hash, user_id, email, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [tokenHash, userId, email.toLowerCase(), expiresAt],
  );

  const safeRedirectTo =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;

  const verifyParams = new URLSearchParams({
    token,
  });

  if (safeRedirectTo) {
    verifyParams.set("redirectTo", safeRedirectTo);
  }

  const verifyUrl = `${getAppOrigin(requestUrl)}/auth/verify-email?${verifyParams.toString()}`;

  const delivery = await sendSecurityEmail({
    to: email,
    subject: "Verify your PaTan account email",
    category: "email-verification",
    text: `Please verify your email by opening this link: ${verifyUrl}`,
    metadata: {
      userId,
      verifyUrl,
      expiresAt: expiresAt.toISOString(),
    },
    requireDelivery: true,
  });

  if (delivery.sent && delivery.status === "sent") {
    return {
      status: "sent",
      verifyUrl,
      expiresAt,
      queuedForRetry: false,
      provider: delivery.provider,
    };
  }

  const queueId = await queueVerificationRetry({
    userId,
    email: email.toLowerCase(),
    tokenHash,
    verifyUrl,
    expiresAt,
    failureReason: delivery.failureReason ?? "delivery-unavailable",
  });

  return {
    status: "queued",
    verifyUrl,
    expiresAt,
    queuedForRetry: true,
    queueId,
    provider: delivery.provider,
    failureReason: delivery.failureReason,
  };
}

export async function resendEmailVerificationsForExistingUsers(
  options: BulkResendEmailVerificationOptions = {},
): Promise<BulkResendEmailVerificationSummary> {
  const dryRun = Boolean(options.dryRun);
  const batchSize = Math.min(
    200,
    Math.max(1, options.batchSize ?? EMAIL_VERIFICATION_RETRY_BATCH_SIZE),
  );
  const concurrency = Math.min(
    20,
    Math.max(1, options.concurrency ?? EMAIL_VERIFICATION_RETRY_CONCURRENCY),
  );
  const maxUsers =
    typeof options.maxUsers === "number" && Number.isFinite(options.maxUsers)
      ? Math.max(1, Math.floor(options.maxUsers))
      : null;

  const summary: BulkResendEmailVerificationSummary = {
    scanned: 0,
    targeted: 0,
    sent: 0,
    queued: 0,
    alreadyVerified: 0,
    failed: 0,
  };

  let cursorId: string | null = null;

  while (true) {
    if (maxUsers !== null && summary.targeted >= maxUsers) {
      break;
    }

    const users: VerificationCandidateUser[] = await db.user.findMany({
      where: {
        deletedAt: null,
        email: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
      take: batchSize,
      orderBy: {
        id: "asc",
      },
      ...(cursorId
        ? {
            cursor: {
              id: cursorId,
            },
            skip: 1,
          }
        : {}),
    });

    if (users.length === 0) {
      break;
    }

    cursorId = users[users.length - 1]?.id ?? null;

    const candidates = users.filter((user) => !user.emailVerified && Boolean(user.email));
    summary.scanned += users.length;
    summary.alreadyVerified += users.length - candidates.length;

    for (let index = 0; index < candidates.length; index += concurrency) {
      if (maxUsers !== null && summary.targeted >= maxUsers) {
        break;
      }

      const group = candidates.slice(index, index + concurrency);
      const allowed =
        maxUsers === null
          ? group
          : group.slice(0, Math.max(0, maxUsers - summary.targeted));

      summary.targeted += allowed.length;
      if (allowed.length === 0) {
        continue;
      }

      if (dryRun) {
        continue;
      }

      const settled = await Promise.allSettled(
        allowed.map((user) =>
          issueEmailVerification({
            userId: user.id,
            email: user.email ?? "",
            redirectTo: "/verify-email",
          }),
        ),
      );

      for (const result of settled) {
        if (result.status === "fulfilled") {
          if (result.value.status === "sent") {
            summary.sent += 1;
            continue;
          }

          if (result.value.status === "queued") {
            summary.queued += 1;
            continue;
          }

          if (result.value.status === "already-verified") {
            summary.alreadyVerified += 1;
            continue;
          }

          summary.failed += 1;
          continue;
        }

        summary.failed += 1;
      }
    }
  }

  return summary;
}

export async function consumeEmailVerificationToken(token: string) {
  await ensureSchema();

  const tokenHash = hashToken(token);

  const result = await pool.query<VerificationTokenRow>(
    `
      UPDATE auth_email_verification_tokens
      SET consumed_at = NOW()
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > NOW()
      RETURNING user_id, email
    `,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) {
    return {
      ok: false,
      code: "invalid-token" as const,
    };
  }

  await db.user.update({
    where: { id: row.user_id },
    data: {
      emailVerified: new Date(),
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  await pool.query(
    `
      UPDATE auth_email_verification_retry_queue
      SET delivered_at = NOW(),
          locked_at = NULL,
          updated_at = NOW()
      WHERE user_id = $1
        AND delivered_at IS NULL
    `,
    [row.user_id],
  );

  return {
    ok: true,
    userId: row.user_id,
    email: row.email,
  };
}
