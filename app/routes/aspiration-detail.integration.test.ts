import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    $transaction: vi.fn(),
    aspiration: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    aspirationSupport: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    aspirationMilestone: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    aspirationUpdate: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { action as aspirationDetailAction } from "~/routes/aspirations.$id";
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

describe("Aspiration detail actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(db.$transaction).mockImplementation(async (operations: any[]) => Promise.all(operations));
  });

  it("supports an aspiration and notifies the owner", async () => {
    vi.mocked(db.aspiration.findUnique).mockResolvedValue({
      id: "asp-1",
      title: "Run a marathon",
      authorId: "author-2",
      status: "PENDING",
      deletedAt: null,
      privacy: "PUBLIC",
    } as any);
    vi.mocked(db.aspirationSupport.findUnique).mockResolvedValue(null as any);
    vi.mocked(db.aspirationSupport.create).mockResolvedValue({ id: "support-1" } as any);
    vi.mocked(db.aspiration.update).mockResolvedValue({ id: "asp-1" } as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-1" } as any);

    const request = postRequest("http://localhost/aspirations/asp-1", {
      intent: "support-aspiration",
      supportMessage: "You can do this",
    });

    const result = await aspirationDetailAction({
      request,
      params: { id: "asp-1" },
      context: {},
    } as any);

    expect(db.aspirationSupport.create).toHaveBeenCalledWith({
      data: {
        aspirationId: "asp-1",
        userId: "user-1",
        message: "You can do this",
      },
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "author-2",
          actorId: "user-1",
          type: "ASPIRATION_SUPPORT",
        }),
      }),
    );

    expect(result).toEqual({ success: "Support added successfully.", values: { supportMessage: "" } });
  });

  it("posts an aspiration update and notifies supporters", async () => {
    vi.mocked(db.aspiration.findUnique).mockResolvedValue({
      id: "asp-1",
      title: "Run a marathon",
      authorId: "user-1",
      status: "IN_PROGRESS",
      deletedAt: null,
      privacy: "PUBLIC",
    } as any);
    vi.mocked(db.aspirationUpdate.create).mockResolvedValue({ id: "update-1" } as any);
    vi.mocked(db.aspirationSupport.findMany).mockResolvedValue([{ userId: "supporter-1" }] as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as any);

    const request = postRequest("http://localhost/aspirations/asp-1", {
      intent: "post-update",
      updateMessage: "I completed my 10k run this week.",
    });

    const result = await aspirationDetailAction({
      request,
      params: { id: "asp-1" },
      context: {},
    } as any);

    expect(db.aspirationUpdate.create).toHaveBeenCalledWith({
      data: {
        aspirationId: "asp-1",
        authorId: "user-1",
        content: "I completed my 10k run this week.",
      },
    });

    expect(db.notification.createMany).toHaveBeenCalled();
    expect(result).toEqual({
      success: "Update posted to your aspiration journey.",
      values: { updateMessage: "" },
    });
  });

  it("toggles milestone completion and recalculates status", async () => {
    vi.mocked(db.aspiration.findUnique).mockResolvedValue({
      id: "asp-1",
      title: "Run a marathon",
      authorId: "user-1",
      status: "IN_PROGRESS",
      deletedAt: null,
      privacy: "PUBLIC",
    } as any);
    vi.mocked(db.aspirationMilestone.findFirst).mockResolvedValue({
      id: "milestone-1",
      title: "Complete 5k",
      isCompleted: false,
    } as any);
    vi.mocked(db.aspirationMilestone.update).mockResolvedValue({ id: "milestone-1" } as any);
    vi.mocked(db.aspirationMilestone.findMany).mockResolvedValue([{ isCompleted: true }] as any);
    vi.mocked(db.aspiration.update).mockResolvedValue({ id: "asp-1" } as any);
    vi.mocked(db.aspirationSupport.findMany).mockResolvedValue([{ userId: "supporter-1" }] as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as any);

    const request = postRequest("http://localhost/aspirations/asp-1", {
      intent: "toggle-milestone",
      milestoneId: "milestone-1",
    });

    const result = await aspirationDetailAction({
      request,
      params: { id: "asp-1" },
      context: {},
    } as any);

    expect(db.aspirationMilestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "milestone-1" },
        data: expect.objectContaining({
          isCompleted: true,
        }),
      }),
    );

    expect(db.aspiration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACHIEVED" }),
      }),
    );

    expect(result).toEqual({ success: "Milestone marked complete." });
  });
});
