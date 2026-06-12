import type { LoaderFunctionArgs } from "react-router";
import { pool } from "~/utils/db.server";
import {
  getEmailVerificationRetryQueueStats,
  getEmailVerificationRetryWorkerStatus,
  startEmailVerificationRetryWorker,
} from "~/utils/email-verification.server";
import { getSecurityEmailServiceStatus } from "~/utils/security-email.server";

type CheckStatus = "up" | "down" | "degraded";
type OverallStatus = "ok" | "degraded" | "down";

const DB_CHECK_TIMEOUT_MS = Number(
  process.env.HEALTH_DB_CHECK_TIMEOUT_MS ?? "2500",
);

function parseBooleanFlag(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown-error";
}

async function checkDatabase(timeoutMs: number) {
  const startedAtMs = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`database-check-timeout-${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    await Promise.race([
      pool.query("SELECT 1"),
      timeoutPromise,
    ]);

    return {
      status: "up" as const,
      latencyMs: Date.now() - startedAtMs,
    };
  } catch (error) {
    return {
      status: "down" as const,
      latencyMs: Date.now() - startedAtMs,
      error: toErrorMessage(error),
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  startEmailVerificationRetryWorker();

  const url = new URL(request.url);
  const strict = parseBooleanFlag(url.searchParams.get("strict"));
  const now = new Date();

  const dbCheck = await checkDatabase(DB_CHECK_TIMEOUT_MS);
  const emailService = getSecurityEmailServiceStatus();
  const worker = getEmailVerificationRetryWorkerStatus();

  let retryQueueStatus: CheckStatus = "up";
  let retryQueueStats: Awaited<ReturnType<typeof getEmailVerificationRetryQueueStats>> | null = null;
  let retryQueueError: string | null = null;

  try {
    retryQueueStats = await getEmailVerificationRetryQueueStats();
  } catch (error) {
    retryQueueStatus = "degraded";
    retryQueueError = toErrorMessage(error);
  }

  const emailDeliveryStatus: CheckStatus = emailService.deliveryReady
    ? "up"
    : "degraded";
  const workerStatus: CheckStatus = worker.started ? "up" : "degraded";

  const overallStatus: OverallStatus =
    dbCheck.status === "down"
      ? "down"
      : emailDeliveryStatus === "up" && workerStatus === "up" && retryQueueStatus === "up"
        ? "ok"
        : "degraded";

  const httpStatus =
    overallStatus === "down" || (strict && overallStatus !== "ok") ? 503 : 200;

  const payload = {
    service: "patan-api",
    status: overallStatus,
    strict,
    timestamp: now.toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? "development",
    checks: {
      database: {
        status: dbCheck.status,
        latencyMs: dbCheck.latencyMs,
        timeoutMs: DB_CHECK_TIMEOUT_MS,
        error: dbCheck.status === "down" ? dbCheck.error : null,
      },
      emailDelivery: {
        status: emailDeliveryStatus,
        resendConfigured: emailService.resendConfigured,
        webhookConfigured: emailService.webhookConfigured,
      },
      workers: {
        emailVerificationRetry: {
          status: workerStatus,
          started: worker.started,
          active: worker.active,
          loopIntervalMs: worker.loopIntervalMs,
          retryBaseDelayMs: worker.retryBaseDelayMs,
          maxAttempts: worker.maxAttempts,
          batchSize: worker.batchSize,
          concurrency: worker.concurrency,
          deliveryTimeoutMs: worker.deliveryTimeoutMs,
          runTimeoutMs: worker.runTimeoutMs,
          queueStatus: retryQueueStatus,
          queue: retryQueueStats,
          queueError: retryQueueError,
        },
      },
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: httpStatus,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
