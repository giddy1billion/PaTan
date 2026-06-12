import { createHash, randomBytes } from "node:crypto";
import { pool } from "~/utils/db.server";
import { sendSecurityEmail } from "~/utils/security-email.server";

const PASSWORD_RESET_TTL_MS = Number(process.env.AUTH_PASSWORD_RESET_TTL_MS ?? `${60 * 60 * 1000}`);

let schemaReadyPromise: Promise<void> | null = null;

type PasswordResetTokenRow = {
  user_id: string;
  email: string;
};

type ValidatePasswordResetTokenResult =
  | {
      valid: false;
    }
  | {
      valid: true;
      userId: string;
      email: string;
    };

type ConsumePasswordResetTokenResult =
  | {
      ok: false;
    }
  | {
      ok: true;
      userId: string;
      email: string;
    };

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function generateToken() {
  return randomBytes(32).toString("base64url");
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
        CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          consumed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS auth_password_reset_tokens_user_idx
        ON auth_password_reset_tokens (user_id, consumed_at, expires_at)
      `);
    })();
  }

  await schemaReadyPromise;
}

export async function issuePasswordResetToken({
  userId,
  email,
  requestUrl,
}: {
  userId: string;
  email: string;
  requestUrl?: string;
}) {
  await ensureSchema();

  await pool.query(
    `
      DELETE FROM auth_password_reset_tokens
      WHERE user_id = $1
        OR consumed_at IS NOT NULL
        OR expires_at < NOW()
    `,
    [userId],
  );

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await pool.query(
    `
      INSERT INTO auth_password_reset_tokens (token_hash, user_id, email, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [tokenHash, userId, email.toLowerCase(), expiresAt],
  );

  const resetUrl = `${getAppOrigin(requestUrl)}/reset-password?token=${encodeURIComponent(token)}`;

  await sendSecurityEmail({
    to: email,
    subject: "Reset your PaTan password",
    category: "password-reset",
    text: `Use this link to reset your password: ${resetUrl}`,
    metadata: {
      userId,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return {
    resetUrl,
    expiresAt,
  };
}

export async function validatePasswordResetToken(token: string): Promise<ValidatePasswordResetTokenResult> {
  await ensureSchema();

  const tokenHash = hashToken(token);

  const result = await pool.query<PasswordResetTokenRow>(
    `
      SELECT user_id, email
      FROM auth_password_reset_tokens
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) {
    return {
      valid: false,
    };
  }

  return {
    valid: true,
    userId: row.user_id,
    email: row.email,
  };
}

export async function consumePasswordResetToken(token: string): Promise<ConsumePasswordResetTokenResult> {
  await ensureSchema();

  const tokenHash = hashToken(token);

  const result = await pool.query<PasswordResetTokenRow>(
    `
      UPDATE auth_password_reset_tokens
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
    };
  }

  return {
    ok: true,
    userId: row.user_id,
    email: row.email,
  };
}
