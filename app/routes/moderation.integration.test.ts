import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
    },
    report: {
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    moderationAction: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

import { action as moderationAction } from "~/routes/moderation.reports";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

function postRequest(url: string, params: Record<string, string>) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
}

describe("Moderation report lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "moderator-1",
      email: "mod@example.com",
      provider: "local",
    });

    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "MODERATOR" } as any);
    vi.mocked(db.$transaction).mockImplementation(async (operations: any[]) => Promise.all(operations));
  });

  it("moves a report to resolved and writes moderation log", async () => {
    vi.mocked(db.report.findUnique).mockResolvedValue({
      id: "report-1",
      status: "PENDING",
      reporterId: "reporter-1",
    } as any);
    vi.mocked(db.report.update).mockResolvedValue({ id: "report-1" } as any);
    vi.mocked(db.moderationAction.create).mockResolvedValue({ id: "mod-action-1" } as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-1" } as any);

    const request = postRequest("http://localhost/moderation/reports", {
      intent: "set-report-status",
      reportId: "report-1",
      nextStatus: "RESOLVED",
      resolution: "Handled with content removal.",
    });

    const result = await moderationAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-1" },
        data: expect.objectContaining({
          status: "RESOLVED",
          resolvedBy: "moderator-1",
          resolution: "Handled with content removal.",
        }),
      }),
    );

    expect(db.moderationAction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          moderatorId: "moderator-1",
          targetType: "report",
          targetId: "report-1",
        }),
      }),
    );

    expect(result).toEqual({ success: "Report updated to RESOLVED." });
  });
});
