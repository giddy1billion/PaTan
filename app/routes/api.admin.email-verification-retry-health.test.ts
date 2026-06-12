import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("~/utils/email-verification.server", () => ({
  startEmailVerificationRetryWorker: vi.fn(),
  getEmailVerificationRetryQueueStats: vi.fn(),
  getEmailVerificationRetryWorkerStatus: vi.fn(),
}));

import { loader } from "~/routes/api.admin.email-verification-retry-health";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import {
  getEmailVerificationRetryQueueStats,
  getEmailVerificationRetryWorkerStatus,
  startEmailVerificationRetryWorker,
} from "~/utils/email-verification.server";

describe("Admin retry worker health endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      provider: "local",
    });

    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as any);

    vi.mocked(getEmailVerificationRetryQueueStats).mockResolvedValue({
      pending: 4,
      due: 2,
      locked: 1,
      exhausted: 0,
      deliveredLast24Hours: 11,
    });

    vi.mocked(getEmailVerificationRetryWorkerStatus).mockReturnValue({
      started: true,
      active: false,
      loopIntervalMs: 60000,
      retryBaseDelayMs: 120000,
      maxAttempts: 6,
      batchSize: 20,
      concurrency: 5,
      deliveryTimeoutMs: 15000,
      runTimeoutMs: 90000,
      lastRunStartedAt: "2026-06-12T11:00:00.000Z",
      lastRunFinishedAt: "2026-06-12T11:00:01.200Z",
      lastRunDurationMs: 1200,
      lastRunOutcome: "success",
      lastRunError: null,
    });
  });

  it("returns retry queue metrics for admin user", async () => {
    const response = await loader({
      request: new Request("http://localhost/api/admin/email-verification-retry-health"),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(200);
    expect(startEmailVerificationRetryWorker).toHaveBeenCalledTimes(1);

    const json = await response.json();
    expect(json.metrics.pendingCount).toBe(4);
    expect(json.metrics.dueCount).toBe(2);
    expect(json.metrics.lastRun.startedAt).toBe("2026-06-12T11:00:00.000Z");
    expect(json.metrics.lastRun.durationMs).toBe(1200);
    expect(json.metrics.lastRun.outcome).toBe("success");
  });

  it("returns forbidden for non-admin users", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "MODERATOR" } as any);

    const response = await loader({
      request: new Request("http://localhost/api/admin/email-verification-retry-health"),
      params: {},
      context: {},
    } as any);

    expect(response.status).toBe(403);
    expect(getEmailVerificationRetryQueueStats).not.toHaveBeenCalled();
    expect(getEmailVerificationRetryWorkerStatus).not.toHaveBeenCalled();
  });
});
