import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    follow: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { action as messagesAction } from "~/routes/messages";
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

describe("Messages integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });
  });

  it("sends message notifications and mention notifications", async () => {
    vi.mocked(db.user.findFirst)
      .mockResolvedValueOnce({
        id: "user-2",
        username: "jane",
        displayName: "Jane",
      } as any)
      .mockResolvedValueOnce(null as any);

    vi.mocked(db.message.create).mockResolvedValue({ id: "msg-1" } as any);
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: "user-3", username: "alex", displayName: "Alex" },
    ] as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-1" } as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as any);

    const request = postRequest("http://localhost/messages", {
      intent: "send-message",
      recipientId: "user-2",
      content: "Hi there @alex",
    });

    const result = await messagesAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.message.create).toHaveBeenCalledWith({
      data: {
        senderId: "user-1",
        receiverId: "user-2",
        content: "Hi there @alex",
      },
      select: {
        id: true,
      },
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-2",
          actorId: "user-1",
          type: "MESSAGE",
          resourceId: "user-1",
          resourceType: "message",
        }),
      }),
    );

    expect(db.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: "user-3",
            actorId: "user-1",
            type: "MENTION",
            resourceId: "user-1",
            resourceType: "message",
          }),
        ]),
      }),
    );

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe(
      "/messages?with=user-2&sent=1",
    );
  });
});
