import { createHash } from "node:crypto";
import { pool } from "~/utils/db.server";
import { buildSignedWebhookHeaders } from "~/utils/webhook-signing.server";

export type AuthSecuritySeverity = "info" | "warn" | "high" | "critical";

export type AuthSecurityEventType =
  | "login_success"
  | "login_failure"
  | "signup_success"
  | "signup_failure"
  | "oauth_start"
  | "oauth_failure"
  | "oauth_success"
  | "password_reset_requested"
  | "password_reset_success"
  | "password_reset_failure"
  | "rate_limit_block"
  | "csrf_failure"
  | "bot_challenge_required"
  | "bot_challenge_failure"
  | "email_verification_sent"
  | "email_verified"
  | "mfa_challenge_created"
  | "mfa_challenge_failure"
  | "mfa_challenge_success"
  | "mfa_enrollment_enabled"
  | "mfa_enrollment_disabled"
  | "high_risk_login_detected";

type AuthSecurityEventRow = {
  id: number;
  event_type: string;
  severity: string;
  outcome: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  route: string | null;
  risk_score: number | null;
  metadata: unknown;
  created_at: string;
};

export type LoginRiskAssessment = {
  score: number;
  highRisk: boolean;
  reasons: string[];
};

export type AuthAuditDashboardData = {
  totals: {
    last24hEvents: number;
    last24hFailures: number;
    last24hHighSeverity: number;
    last24hRateLimited: number;
  };
  topFailureIps: Array<{
    ipAddress: string;
    failures: number;
  }>;
  recentHighRiskEvents: Array<{
    id: number;
    eventType: string;
    severity: string;
    outcome: string;
    ipAddress: string | null;
    email: string | null;
    riskScore: number | null;
    createdAt: string;
  }>;
};

const SCHEMA_CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const EVENT_RETENTION_MS = 45 * 24 * 60 * 60 * 1000;

let schemaReadyPromise: Promise<void> | null = null;
let lastCleanupAtMs = 0;

function normalizeIp(ip: string | null | undefined) {
  if (!ip) {
    return "unknown";
  }

  const first = ip.split(",")[0]?.trim();
  if (!first) {
    return "unknown";
  }

  return first.slice(0, 64);
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return normalizeIp(
    forwarded ??
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-real-ip") ??
      null,
  );
}

function hashUserAgent(value: string | null) {
  const source = value?.trim() || "unknown";
  return createHash("sha256").update(source, "utf8").digest("hex").slice(0, 24);
}

async function ensureAuthSecuritySchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_security_events (
          id BIGSERIAL PRIMARY KEY,
          event_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          outcome TEXT NOT NULL,
          user_id TEXT,
          email TEXT,
          ip_address TEXT,
          user_agent_hash TEXT,
          route TEXT,
          risk_score INTEGER,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_security_events_created_at_idx
        ON auth_security_events (created_at DESC)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_security_events_event_type_idx
        ON auth_security_events (event_type)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_security_events_user_idx
        ON auth_security_events (user_id)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_security_events_ip_idx
        ON auth_security_events (ip_address)
      `);
    })();
  }

  await schemaReadyPromise;
}

async function maybeCleanupOldEvents() {
  const nowMs = Date.now();
  if (nowMs - lastCleanupAtMs < SCHEMA_CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanupAtMs = nowMs;

  await pool.query(
    `
      DELETE FROM auth_security_events
      WHERE created_at < NOW() - ($1::bigint * INTERVAL '1 millisecond')
    `,
    [EVENT_RETENTION_MS],
  );
}

async function sendSecurityAlert(payload: {
  eventType: AuthSecurityEventType;
  severity: AuthSecuritySeverity;
  outcome: string;
  userId?: string | null;
  email?: string | null;
  ipAddress: string;
  route?: string;
  riskScore?: number;
  metadata?: Record<string, unknown>;
}) {
  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.SECURITY_ALERT_WEBHOOK_SECRET?.trim();
  const webhookKeyId = process.env.SECURITY_ALERT_WEBHOOK_KEY_ID?.trim();

  if (!webhookUrl) {
    console.warn("[security-alert]", payload);
    return;
  }

  const requestPayload = JSON.stringify({
    source: "auth-security",
    timestamp: new Date().toISOString(),
    ...payload,
  });

  try {
    const headers = webhookSecret
      ? buildSignedWebhookHeaders({
          body: requestPayload,
          secret: webhookSecret,
          event: payload.eventType,
          source: "auth-security",
          keyId: webhookKeyId,
        })
      : new Headers({
          "Content-Type": "application/json",
          "X-PaTan-Webhook-Source": "auth-security",
          "X-PaTan-Webhook-Event": payload.eventType,
        });

    await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: requestPayload,
    });
  } catch {
    console.warn("[security-alert-failed]", payload);
  }
}

export async function logAuthSecurityEvent({
  request,
  eventType,
  severity = "info",
  outcome,
  userId,
  email,
  route,
  riskScore,
  metadata,
}: {
  request: Request;
  eventType: AuthSecurityEventType;
  severity?: AuthSecuritySeverity;
  outcome: string;
  userId?: string | null;
  email?: string | null;
  route?: string;
  riskScore?: number;
  metadata?: Record<string, unknown>;
}) {
  const ipAddress = getClientIp(request);
  const userAgentHash = hashUserAgent(request.headers.get("user-agent"));

  try {
    await ensureAuthSecuritySchema();
    await maybeCleanupOldEvents();

    await pool.query(
      `
        INSERT INTO auth_security_events (
          event_type,
          severity,
          outcome,
          user_id,
          email,
          ip_address,
          user_agent_hash,
          route,
          risk_score,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      `,
      [
        eventType,
        severity,
        outcome,
        userId ?? null,
        email ?? null,
        ipAddress,
        userAgentHash,
        route ?? null,
        riskScore ?? null,
        JSON.stringify(metadata ?? {}),
      ],
    );

    if (severity === "high" || severity === "critical") {
      await sendSecurityAlert({
        eventType,
        severity,
        outcome,
        userId,
        email,
        ipAddress,
        route,
        riskScore,
        metadata,
      });
    }
  } catch {
    // Security telemetry should never break auth flow.
  }
}

export async function isBotChallengeRequired({
  request,
  identifier,
  scope,
}: {
  request: Request;
  identifier?: string | null;
  scope: "login" | "signup" | "password-reset";
}) {
  const ipAddress = getClientIp(request);
  const normalizedIdentifier = identifier?.trim().toLowerCase() ?? null;

  const defaultThreshold =
    scope === "login"
      ? Number(process.env.BOT_CHALLENGE_LOGIN_FAILURE_THRESHOLD ?? "3")
      : scope === "signup"
        ? Number(process.env.BOT_CHALLENGE_SIGNUP_FAILURE_THRESHOLD ?? "2")
        : Number(process.env.BOT_CHALLENGE_PASSWORD_RESET_THRESHOLD ?? "2");

  const threshold = Number.isFinite(defaultThreshold) ? defaultThreshold : 3;

  try {
    await ensureAuthSecuritySchema();

    const result = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM auth_security_events
        WHERE created_at >= NOW() - INTERVAL '20 minutes'
          AND event_type IN ('login_failure', 'signup_failure', 'password_reset_failure')
          AND (
            ip_address = $1
            OR ($2::text IS NOT NULL AND email = $2)
          )
      `,
      [ipAddress, normalizedIdentifier],
    );

    const count = Number.parseInt(result.rows[0]?.count ?? "0", 10);
    return Number.isFinite(count) && count >= threshold;
  } catch {
    return false;
  }
}

export async function assessLoginRisk({
  request,
  userId,
  email,
}: {
  request: Request;
  userId: string;
  email: string;
}): Promise<LoginRiskAssessment> {
  const reasons: string[] = [];
  let score = 0;
  const ipAddress = getClientIp(request);
  const userAgentHash = hashUserAgent(request.headers.get("user-agent"));

  try {
    await ensureAuthSecuritySchema();

    const profile = await pool.query<{
      distinct_ips: string[] | null;
      distinct_agents: string[] | null;
      recent_success_ip: string | null;
      recent_success_at: string | null;
      recent_failures: string;
    }>(
      `
        WITH success_events AS (
          SELECT ip_address, user_agent_hash, created_at
          FROM auth_security_events
          WHERE user_id = $1
            AND event_type = 'login_success'
            AND created_at >= NOW() - INTERVAL '45 days'
        ), failure_events AS (
          SELECT COUNT(*)::text AS total
          FROM auth_security_events
          WHERE event_type = 'login_failure'
            AND created_at >= NOW() - INTERVAL '20 minutes'
            AND (ip_address = $2 OR email = $3)
        ), latest_success AS (
          SELECT ip_address, created_at
          FROM success_events
          ORDER BY created_at DESC
          LIMIT 1
        )
        SELECT
          ARRAY(SELECT DISTINCT ip_address FROM success_events WHERE ip_address IS NOT NULL) AS distinct_ips,
          ARRAY(SELECT DISTINCT user_agent_hash FROM success_events WHERE user_agent_hash IS NOT NULL) AS distinct_agents,
          (SELECT ip_address FROM latest_success) AS recent_success_ip,
          (SELECT created_at::text FROM latest_success) AS recent_success_at,
          (SELECT total FROM failure_events) AS recent_failures
      `,
      [userId, ipAddress, email.toLowerCase()],
    );

    const row = profile.rows[0];
    if (!row) {
      return { score: 0, highRisk: false, reasons: [] };
    }

    const knownIps = row.distinct_ips ?? [];
    const knownAgents = row.distinct_agents ?? [];

    if (knownIps.length > 0 && !knownIps.includes(ipAddress)) {
      score += 35;
      reasons.push("new-ip-address");
    }

    if (knownAgents.length > 0 && !knownAgents.includes(userAgentHash)) {
      score += 25;
      reasons.push("new-device-signature");
    }

    const recentFailures = Number.parseInt(row.recent_failures ?? "0", 10);
    if (Number.isFinite(recentFailures) && recentFailures >= 4) {
      score += 30;
      reasons.push("multiple-recent-failures");
    }

    if (row.recent_success_at && row.recent_success_ip && row.recent_success_ip !== ipAddress) {
      const recentSuccessTime = Date.parse(row.recent_success_at);
      if (Number.isFinite(recentSuccessTime) && Date.now() - recentSuccessTime < 30 * 60 * 1000) {
        score += 20;
        reasons.push("rapid-ip-change");
      }
    }
  } catch {
    return {
      score: 0,
      highRisk: false,
      reasons: [],
    };
  }

  const threshold = Number(process.env.AUTH_HIGH_RISK_SCORE_THRESHOLD ?? "60");
  const highRisk = score >= (Number.isFinite(threshold) ? threshold : 60);

  return {
    score,
    highRisk,
    reasons,
  };
}

export async function getAuthAuditDashboardData(): Promise<AuthAuditDashboardData> {
  await ensureAuthSecuritySchema();

  const [totalsResult, topIpsResult, recentResult] = await Promise.all([
    pool.query<{
      last24h_events: string;
      last24h_failures: string;
      last24h_high_severity: string;
      last24h_rate_limited: string;
    }>(`
      SELECT
        COUNT(*)::text AS last24h_events,
        COUNT(*) FILTER (WHERE event_type IN ('login_failure', 'signup_failure', 'oauth_failure', 'mfa_challenge_failure'))::text AS last24h_failures,
        COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))::text AS last24h_high_severity,
        COUNT(*) FILTER (WHERE event_type = 'rate_limit_block')::text AS last24h_rate_limited
      FROM auth_security_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `),
    pool.query<{ ip_address: string | null; failures: string }>(`
      SELECT ip_address, COUNT(*)::text AS failures
      FROM auth_security_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND event_type IN ('login_failure', 'signup_failure', 'oauth_failure', 'password_reset_failure')
      GROUP BY ip_address
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `),
    pool.query<AuthSecurityEventRow>(`
      SELECT id, event_type, severity, outcome, user_id, email, ip_address, route, risk_score, metadata, created_at::text
      FROM auth_security_events
      WHERE created_at >= NOW() - INTERVAL '48 hours'
        AND (severity IN ('high', 'critical') OR event_type = 'high_risk_login_detected')
      ORDER BY created_at DESC
      LIMIT 40
    `),
  ]);

  const totalsRow = totalsResult.rows[0];

  return {
    totals: {
      last24hEvents: Number.parseInt(totalsRow?.last24h_events ?? "0", 10) || 0,
      last24hFailures: Number.parseInt(totalsRow?.last24h_failures ?? "0", 10) || 0,
      last24hHighSeverity: Number.parseInt(totalsRow?.last24h_high_severity ?? "0", 10) || 0,
      last24hRateLimited: Number.parseInt(totalsRow?.last24h_rate_limited ?? "0", 10) || 0,
    },
    topFailureIps: topIpsResult.rows.map((row) => ({
      ipAddress: row.ip_address ?? "unknown",
      failures: Number.parseInt(row.failures, 10) || 0,
    })),
    recentHighRiskEvents: recentResult.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      severity: row.severity,
      outcome: row.outcome,
      ipAddress: row.ip_address,
      email: row.email,
      riskScore: row.risk_score,
      createdAt: row.created_at,
    })),
  };
}
