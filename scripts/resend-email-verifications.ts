import "dotenv/config";

import {
  resendEmailVerificationsForExistingUsers,
  startEmailVerificationRetryWorker,
} from "../app/utils/email-verification.server";

function parseNumberArg(name: string) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) {
    return undefined;
  }

  const raw = arg.slice(prefix.length);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${raw}`);
  }

  return parsed;
}

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function run() {
  const dryRun = hasFlag("--dry-run");
  const force = hasFlag("--force");

  if (!dryRun && !force) {
    throw new Error(
      "Bulk resend requires --force. Use --dry-run first to inspect scope.",
    );
  }

  const maxUsers = parseNumberArg("--max");
  const batchSize = parseNumberArg("--batch-size");
  const concurrency = parseNumberArg("--concurrency");

  startEmailVerificationRetryWorker();

  const startedAt = Date.now();
  const summary = await resendEmailVerificationsForExistingUsers({
    dryRun,
    maxUsers,
    batchSize,
    concurrency,
  });

  const durationMs = Date.now() - startedAt;

  console.info("[resend-email-verifications] completed", {
    dryRun,
    maxUsers: maxUsers ?? null,
    batchSize: batchSize ?? null,
    concurrency: concurrency ?? null,
    durationMs,
    summary,
  });
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[resend-email-verifications] failed", {
      message: error instanceof Error ? error.message : "unknown-error",
    });
    process.exit(1);
  });
