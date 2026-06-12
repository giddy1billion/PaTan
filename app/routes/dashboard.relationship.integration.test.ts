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
    follow: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    circle: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    circleMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { action as dashboardAction } from "~/routes/dashboard";
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

describe("Dashboard relationship actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(db.$transaction).mockImplementation(async (operations: any[]) => Promise.all(operations));
  });

  it("follows a suggested person and creates a notification", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-2", deletedAt: null } as any);
    vi.mocked(db.follow.findUnique).mockResolvedValue(null as any);
    vi.mocked(db.follow.create).mockResolvedValue({ id: "follow-1" } as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-1" } as any);

    const request = postRequest("http://localhost/dashboard", {
      intent: "follow-user",
      targetUserId: "user-2",
    });

    const result = await dashboardAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.follow.create).toHaveBeenCalledWith({
      data: {
        followerId: "user-1",
        followingId: "user-2",
      },
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-2",
          actorId: "user-1",
          type: "NEW_FOLLOWER",
        }),
      }),
    );

    expect(result).toEqual({ success: "You are now following this person." });
  });

  it("joins a suggested circle and increments member count", async () => {
    vi.mocked(db.circle.findUnique).mockResolvedValue({
      id: "circle-1",
      name: "Hope Circle",
      isPrivate: false,
      deletedAt: null,
    } as any);
    vi.mocked(db.circleMember.findUnique).mockResolvedValue(null as any);
    vi.mocked(db.circleMember.create).mockResolvedValue({ id: "member-1" } as any);
    vi.mocked(db.circle.update).mockResolvedValue({ id: "circle-1" } as any);

    const request = postRequest("http://localhost/dashboard", {
      intent: "join-circle",
      circleId: "circle-1",
    });

    const result = await dashboardAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.circleMember.create).toHaveBeenCalledWith({
      data: {
        circleId: "circle-1",
        userId: "user-1",
        role: "member",
      },
    });

    expect(db.circle.update).toHaveBeenCalledWith({
      where: { id: "circle-1" },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    expect(result).toEqual({ success: "You joined Hope Circle." });
  });
});
