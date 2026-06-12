import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    $transaction: vi.fn(),
    story: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    storyVersion: {
      create: vi.fn(),
    },
    storyTag: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    aspiration: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    aspirationMilestone: {
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { action as storyEditAction } from "~/routes/stories.$storyId.edit";
import { action as aspirationEditAction } from "~/routes/aspirations.$id.edit";
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

describe("Edit flow integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => callback(db as any));
  });

  it("edits a story and creates a version snapshot", async () => {
    vi.mocked(db.story.findFirst).mockResolvedValue({
      id: "story-1",
      slug: "my-story",
      title: "Old title",
      content: "Old content",
      excerpt: "Old content",
      version: 2,
      categoryId: "cat-1",
      privacy: "PUBLIC",
      isAnonymous: false,
      contentWarning: null,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    } as any);
    vi.mocked(db.category.findFirst).mockResolvedValue({ id: "cat-2" } as any);
    vi.mocked(db.tag.upsert)
      .mockResolvedValueOnce({ id: "tag-1" } as any)
      .mockResolvedValueOnce({ id: "tag-2" } as any);

    const request = postRequest("http://localhost/stories/story-1/edit", {
      title: "Updated title",
      content: "Updated story content",
      category: "cat-2",
      tags: "hope, growth",
      privacy: "public",
      status: "PUBLISHED",
      anonymous: "",
      contentWarning: "",
    });

    const result = await storyEditAction({
      request,
      params: { storyId: "story-1" },
      context: {},
    } as any);

    expect(db.storyVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storyId: "story-1",
          version: 3,
          changedBy: "user-1",
        }),
      }),
    );

    expect(db.storyTag.createMany).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/stories/my-story?updated=1");
  });

  it("edits an aspiration with milestone updates", async () => {
    vi.mocked(db.aspiration.findFirst).mockResolvedValue({
      id: "asp-1",
      milestones: [{ id: "mile-1", orderIndex: 0 }],
    } as any);
    vi.mocked(db.aspirationMilestone.count).mockResolvedValue(1 as any);

    const request = postRequest("http://localhost/aspirations/asp-1/edit", {
      title: "Updated aspiration",
      description: "Updated details",
      targetDate: "2026-12-31",
      privacy: "followers",
      status: "IN_PROGRESS",
      milestoneId: "mile-1",
      milestoneTitle: "Reach first checkpoint",
      "milestoneCompleted-mile-1": "on",
      newMilestone1: "Reach second checkpoint",
      newMilestone2: "",
      newMilestone3: "",
    });

    const result = await aspirationEditAction({
      request,
      params: { id: "asp-1" },
      context: {},
    } as any);

    expect(db.aspiration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "asp-1" },
        data: expect.objectContaining({
          title: "Updated aspiration",
          privacy: "FOLLOWERS_ONLY",
          status: "IN_PROGRESS",
        }),
      }),
    );

    expect(db.aspirationMilestone.update).toHaveBeenCalled();
    expect(db.aspirationMilestone.createMany).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/aspirations/asp-1?updated=1");
  });
});
