import { createHash, randomBytes } from "node:crypto";
import { db } from "~/utils/db.server";
import { sendSecurityEmail } from "~/utils/security-email.server";
import { pool } from "~/utils/db.server";

const EMAIL_VERIFICATION_TTL_MS = Number(process.env.AUTH_EMAIL_VERIFICATION_TTL_MS ?? `${24 * 60 * 60 * 1000}`);

let schemaReadyPromise: Promise<void> | null = null;

type VerificationTokenRow = {
  user_id: string;
  email: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateToken() {
  return randomBytes(32).toString("base64url");
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
    })();
  }

  await schemaReadyPromise;
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
}) {
  await ensureSchema();

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

  await sendSecurityEmail({
    to: email,
    subject: "Verify your PaTan account email",
    category: "email-verification",
    text: `Please verify your email by opening this link: ${verifyUrl}`,
    metadata: {
      userId,
      verifyUrl,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return {
    verifyUrl,
    expiresAt,
  };
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

  return {
    ok: true,
    userId: row.user_id,
    email: row.email,
  };
}
