import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/csrf.server", () => ({
  verifyCsrfToken: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    $transaction: vi.fn(),
    story: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    reaction: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
    reflectionEntry: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { action as storyAction } from "~/routes/stories.$storyId";
import { requireUser } from "~/utils/auth.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
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

describe("Story notification producers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(verifyCsrfToken).mockResolvedValue(true);
    vi.mocked(db.$transaction as any).mockImplementation(async (operations: any[]) =>
      Promise.all(operations),
    );
  });

  it("creates story comment and mention notifications", async () => {
    vi.mocked(db.story.findFirst).mockResolvedValue({
      id: "story-1",
      title: "My Story",
      authorId: "author-1",
    } as any);
    vi.mocked(db.comment.create).mockResolvedValue({ id: "comment-1" } as any);
    vi.mocked(db.story.update).mockResolvedValue({ id: "story-1" } as any);
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: "user-3", username: "alex", displayName: "Alex" },
    ] as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-1" } as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as any);

    const request = postRequest("http://localhost/stories/story-1", {
      intent: "share-reflection",
      csrfToken: "csrf-token",
      content: "Thank you for this story @alex",
    });

    const result = await storyAction({
      request,
      params: { storyId: "story-1" },
      context: {},
    } as any);

    expect(db.comment.create).toHaveBeenCalledWith({
      data: {
        storyId: "story-1",
        authorId: "user-1",
        content: "Thank you for this story @alex",
      },
    });

    expect(db.story.update).toHaveBeenCalledWith({
      where: { id: "story-1" },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "author-1",
          actorId: "user-1",
          type: "STORY_COMMENT",
          resourceId: "story-1",
          resourceType: "story",
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
            resourceId: "story-1",
            resourceType: "story",
          }),
        ]),
      }),
    );

    expect(result).toEqual({
      success: "Reflection shared successfully.",
      values: { content: "" },
    });
  });

  it("creates a story reaction notification for the author", async () => {
    vi.mocked(db.story.findFirst).mockResolvedValue({
      id: "story-1",
      title: "My Story",
      authorId: "author-1",
    } as any);
    vi.mocked(db.reaction.findMany).mockResolvedValue([] as any);
    vi.mocked(db.story.update).mockResolvedValue({ id: "story-1" } as any);
    vi.mocked(db.reaction.create).mockResolvedValue({ id: "reaction-1" } as any);
    vi.mocked(db.notification.create).mockResolvedValue({ id: "notif-2" } as any);

    const request = postRequest("http://localhost/stories/story-1", {
      intent: "react-story",
      csrfToken: "csrf-token",
      reactionType: "CELEBRATE",
    });

    const result = await storyAction({
      request,
      params: { storyId: "story-1" },
      context: {},
    } as any);

    expect(db.reaction.create).toHaveBeenCalledWith({
      data: {
        storyId: "story-1",
        userId: "user-1",
        type: "CELEBRATE",
      },
    });

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "author-1",
          actorId: "user-1",
          type: "STORY_REACTION",
          resourceId: "story-1",
          resourceType: "story",
        }),
      }),
    );

    expect(result).toEqual({
      success: "Reaction saved.",
      values: { content: "" },
    });
  });
});
