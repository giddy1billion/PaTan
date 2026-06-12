import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { pool } from "~/utils/db.server";
import { sendSecurityEmail } from "~/utils/security-email.server";

const MFA_CODE_TTL_MS = Number(process.env.AUTH_MFA_CODE_TTL_MS ?? `${10 * 60 * 1000}`);
const MFA_MAX_ATTEMPTS = Number(process.env.AUTH_MFA_MAX_ATTEMPTS ?? "5");

let schemaReadyPromise: Promise<void> | null = null;

type MfaChallengeRow = {
  user_id: string;
  email: string;
  code_hash: string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
  attempt_count: number;
  max_attempts: number;
};

type MfaVerifyFailureCode =
  | "challenge-not-found"
  | "challenge-consumed"
  | "challenge-expired"
  | "too-many-attempts"
  | "invalid-code";

type VerifyMfaChallengeResult =
  | {
      ok: false;
      code: MfaVerifyFailureCode;
    }
  | {
      ok: true;
      email: string;
    };

function challengeSecret() {
  return process.env.MFA_CODE_SECRET?.trim() || process.env.SESSION_SECRET || "dev-mfa-secret";
}

function hashCode(challengeId: string, code: string) {
  return createHash("sha256")
    .update(`${challengeSecret()}:${challengeId}:${code}`)
    .digest("hex");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function generateChallengeId() {
  return randomBytes(24).toString("base64url");
}

function generateNumericCode() {
  const value = Math.floor(Math.random() * 900000) + 100000;
  return String(value);
}

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_mfa_challenges (
          challenge_id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          consumed_at TIMESTAMPTZ,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          max_attempts INTEGER NOT NULL DEFAULT 5,
          risk_score INTEGER,
          risk_reasons TEXT[],
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_mfa_challenges_user_idx
        ON auth_mfa_challenges (user_id, created_at DESC)
      `);
    })();
  }

  await schemaReadyPromise;
}

export async function createMfaChallenge({
  userId,
  email,
  riskScore,
  riskReasons,
}: {
  userId: string;
  email: string;
  riskScore: number;
  riskReasons: string[];
}) {
  await ensureSchema();

  await pool.query(
    `
      DELETE FROM auth_mfa_challenges
      WHERE user_id = $1
        OR expires_at < NOW()
        OR consumed_at IS NOT NULL
    `,
    [userId],
  );

  const challengeId = generateChallengeId();
  const code = generateNumericCode();
  const codeHash = hashCode(challengeId, code);
  const expiresAt = new Date(Date.now() + MFA_CODE_TTL_MS);

  await pool.query(
    `
      INSERT INTO auth_mfa_challenges (
        challenge_id,
        user_id,
        email,
        code_hash,
        expires_at,
        max_attempts,
        risk_score,
        risk_reasons
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      challengeId,
      userId,
      email.toLowerCase(),
      codeHash,
      expiresAt,
      Number.isFinite(MFA_MAX_ATTEMPTS) ? MFA_MAX_ATTEMPTS : 5,
      riskScore,
      riskReasons,
    ],
  );

  await sendSecurityEmail({
    to: email,
    subject: "Your PaTan verification code",
    category: "mfa",
    text: "Use this verification code to complete your sign-in.",
    metadata: {
      userId,
      code,
      challengeId,
      expiresAt: expiresAt.toISOString(),
      riskScore,
      riskReasons,
    },
  });

  return {
    challengeId,
    expiresAt,
  };
}

export async function verifyMfaChallenge({
  challengeId,
  userId,
  code,
}: {
  challengeId: string;
  userId: string;
  code: string;
}): Promise<VerifyMfaChallengeResult> {
  await ensureSchema();

  const result = await pool.query<MfaChallengeRow>(
    `
      SELECT user_id, email, code_hash, expires_at, consumed_at, attempt_count, max_attempts
      FROM auth_mfa_challenges
      WHERE challenge_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [challengeId, userId],
  );

  const challenge = result.rows[0];
  if (!challenge) {
    return { ok: false, code: "challenge-not-found" as const };
  }

  if (challenge.consumed_at) {
    return { ok: false, code: "challenge-consumed" as const };
  }

  const expiresAtMs = new Date(challenge.expires_at).getTime();
  if (Date.now() > expiresAtMs) {
    return { ok: false, code: "challenge-expired" as const };
  }

  if (challenge.attempt_count >= challenge.max_attempts) {
    return { ok: false, code: "too-many-attempts" as const };
  }

  const expectedHash = challenge.code_hash;
  const providedHash = hashCode(challengeId, code.trim());

  if (!safeCompare(expectedHash, providedHash)) {
    await pool.query(
      `
        UPDATE auth_mfa_challenges
        SET attempt_count = attempt_count + 1
        WHERE challenge_id = $1
      `,
      [challengeId],
    );

    return { ok: false, code: "invalid-code" as const };
  }

  await pool.query(
    `
      UPDATE auth_mfa_challenges
      SET consumed_at = NOW()
      WHERE challenge_id = $1
    `,
    [challengeId],
  );

  return {
    ok: true,
    email: challenge.email,
  };
}
