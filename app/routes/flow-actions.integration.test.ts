import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  getUser: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("~/utils/users.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/users.server")>();
  return {
    ...actual,
    blockUserByUsername: vi.fn(),
    reportUserByUsername: vi.fn(),
    getDashboardSummary: vi.fn(),
    getSuggestedFollows: vi.fn(),
    getProfileSafetySettings: vi.fn(),
  };
});

vi.mock("~/utils/db.server", () => ({
  db: {
    notification: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    story: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    storyTag: {
      upsert: vi.fn(),
    },
    aspiration: {
      create: vi.fn(),
    },
  },
}));

import { action as dashboardAction } from "~/routes/dashboard";
import { action as publicProfileAction } from "~/routes/u.$username";
import { action as storyAction } from "~/routes/stories.new";
import { action as aspirationAction } from "~/routes/aspirations.new";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { blockUserByUsername, reportUserByUsername } from "~/utils/users.server";

function postRequest(url: string, params: Record<string, string>) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
}

describe("Flow action behavior checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });
  });

  it("handles public profile block action end-to-end", async () => {
    const request = postRequest("http://localhost/u/jane", {
      intent: "block-user",
      username: "jane",
      blockReason: "safety",
    });

    const result = await publicProfileAction({
      request,
      params: { username: "jane" },
      context: {},
    } as any);

    expect(blockUserByUsername).toHaveBeenCalledWith({
      blockerId: "user-1",
      blockedUsername: "jane",
      reason: "safety",
    });
    expect(result).toEqual({ success: "You blocked @jane." });
  });

  it("handles public profile report action end-to-end", async () => {
    const request = postRequest("http://localhost/u/jane", {
      intent: "report-user",
      username: "jane",
      reportDescription: "harassment",
    });

    const result = await publicProfileAction({
      request,
      params: { username: "jane" },
      context: {},
    } as any);

    expect(reportUserByUsername).toHaveBeenCalledWith({
      reporterId: "user-1",
      reportedUsername: "jane",
      description: "harassment",
    });
    expect(result).toEqual({ success: "You reported @jane." });
  });

  it("marks one dashboard notification as read", async () => {
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 1 } as any);

    const request = postRequest("http://localhost/dashboard", {
      intent: "mark-notification-read",
      notificationId: "notif-1",
    });

    const result = await dashboardAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: "notif-1",
        userId: "user-1",
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ success: "Notification marked as read." });
  });

  it("creates and publishes a story with tags", async () => {
    vi.mocked(db.category.findFirst).mockResolvedValue({ id: "cat-1" } as any);
    vi.mocked(db.story.findUnique).mockResolvedValue(null as any);
    vi.mocked(db.story.create).mockResolvedValue({ id: "story-1" } as any);
    vi.mocked(db.tag.upsert).mockResolvedValue({ id: "tag-1" } as any);

    const request = postRequest("http://localhost/stories/new", {
      action: "publish",
      category: "Gratitude",
      title: "Finding Light",
      content: "Long form story content for testing.",
      tags: "hope, growth",
      privacy: "public",
      anonymous: "on",
      contentWarning: "on",
    });

    const result = await storyAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.story.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: "user-1",
          title: "Finding Light",
          categoryId: "cat-1",
          status: "PUBLISHED",
          isAnonymous: true,
          contentWarning: "self-marked",
        }),
      }),
    );

    expect(db.storyTag.upsert).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/discover?published=story");
  });

  it("generates an AI suggestion and creates an AI notification", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-ai-1" } as any);

    const request = postRequest("http://localhost/stories/new", {
      action: "ai-suggest",
      suggestionType: "structure",
      title: "Finding hope",
      content: "I felt overwhelmed at first, then I started rebuilding my routines.",
    });

    const result = await storyAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          type: "AI_SUGGESTION",
          resourceType: "story_draft",
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: "AI suggestion generated.",
        aiSuggestion: expect.any(String),
      }),
    );
  });

  it("creates an anonymous aspiration with milestones", async () => {
    vi.mocked(db.aspiration.create).mockResolvedValue({ id: "asp-1" } as any);

    const request = postRequest("http://localhost/aspirations/new", {
      title: "Run a marathon",
      category: "Health & Wellness",
      description: "Training every morning",
      targetDate: "2026-12-31",
      privacy: "followers",
      anonymous: "on",
      milestone1: "Buy running shoes",
      milestone2: "Run 5k",
      milestone3: "Run 10k",
    });

    const result = await aspirationAction({
      request,
      params: {},
      context: {},
    } as any);

    expect(db.aspiration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: "user-1",
          title: "Run a marathon",
          privacy: "FOLLOWERS_ONLY",
          isAnonymous: true,
          milestones: {
            create: [
              { title: "Buy running shoes", orderIndex: 0 },
              { title: "Run 5k", orderIndex: 1 },
              { title: "Run 10k", orderIndex: 2 },
            ],
          },
        }),
      }),
    );

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/aspirations?created=1");
  });
});
