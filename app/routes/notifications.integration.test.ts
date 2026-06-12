import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    notification: {
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { action as notificationsAction } from "~/routes/notifications";
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

describe("Notifications integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });
  });

  it("marks filtered notifications as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 3 } as any);

    const request = postRequest("http://localhost/notifications", {
      intent: "mark-filter-read",
      view: "unread",
      type: "STORY_COMMENT",
    });

    const result = await notificationsAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        isRead: false,
        type: "STORY_COMMENT",
      },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    });

    expect(result).toEqual({ success: "Marked 3 filtered notifications as read." });
  });

  it("returns an error when mark-read has no id", async () => {
    const request = postRequest("http://localhost/notifications", {
      intent: "mark-read",
      notificationId: "",
    });

    const result = await notificationsAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(result).toEqual({ error: "Notification id is missing." });
  });
});
