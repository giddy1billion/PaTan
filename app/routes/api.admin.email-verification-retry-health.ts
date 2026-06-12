import { timingSafeEqual } from "node:crypto";
import type { LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import {
  getEmailVerificationRetryQueueStats,
  getEmailVerificationRetryWorkerStatus,
  startEmailVerificationRetryWorker,
} from "~/utils/email-verification.server";

type AdminRole = "ADMIN" | "SUPER_ADMIN";

const ADMIN_ROLES: Set<AdminRole> = new Set(["ADMIN", "SUPER_ADMIN"]);

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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function readBearerToken(request: Request) {
  const header = request.headers.get("Authorization")?.trim();
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function safeTokenCompare(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

async function ensureAuthorized(request: Request) {
  const apiToken = process.env.ADMIN_EMAIL_VERIFICATION_HEALTH_TOKEN?.trim();
  if (apiToken) {
    const bearerToken = readBearerToken(request);
    if (bearerToken && safeTokenCompare(apiToken, bearerToken)) {
      return { authorized: true as const };
    }

    return {
      authorized: false as const,
      response: jsonResponse(
        {
          error: "unauthorized",
          message: "Missing or invalid bearer token.",
        },
        401,
      ),
    };
  }

  const user = await requireUser(request);
  const roleLookup = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!roleLookup || !ADMIN_ROLES.has(roleLookup.role as AdminRole)) {
    return {
      authorized: false as const,
      response: jsonResponse(
        {
          error: "forbidden",
          message: "Admin role is required to access retry worker health metrics.",
        },
        403,
      ),
    };
  }

  return { authorized: true as const };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await ensureAuthorized(request);
  if (!auth.authorized) {
    return auth.response;
  }

  startEmailVerificationRetryWorker();

  const url = new URL(request.url);
  const strict = parseBooleanFlag(url.searchParams.get("strict"));
  const worker = getEmailVerificationRetryWorkerStatus();

  let queue = null as Awaited<ReturnType<typeof getEmailVerificationRetryQueueStats>> | null;
  let queueError: string | null = null;

  try {
    queue = await getEmailVerificationRetryQueueStats();
  } catch (error) {
    queueError = toErrorMessage(error);
  }

  const status = worker.started && !queueError ? "ok" : "degraded";
  const httpStatus = strict && status !== "ok" ? 503 : 200;

  return jsonResponse(
    {
      service: "patan-admin-email-verification-retry-health",
      status,
      strict,
      timestamp: new Date().toISOString(),
      metrics: {
        pendingCount: queue?.pending ?? 0,
        dueCount: queue?.due ?? 0,
        lockedCount: queue?.locked ?? 0,
        exhaustedCount: queue?.exhausted ?? 0,
        deliveredLast24Hours: queue?.deliveredLast24Hours ?? 0,
        lastRun: {
          startedAt: worker.lastRunStartedAt,
          finishedAt: worker.lastRunFinishedAt,
          durationMs: worker.lastRunDurationMs,
          outcome: worker.lastRunOutcome,
          error: worker.lastRunError,
        },
        worker: {
          started: worker.started,
          active: worker.active,
          loopIntervalMs: worker.loopIntervalMs,
          retryBaseDelayMs: worker.retryBaseDelayMs,
          batchSize: worker.batchSize,
          maxAttempts: worker.maxAttempts,
          concurrency: worker.concurrency,
        },
        queueError,
      },
    },
    httpStatus,
  );
}
