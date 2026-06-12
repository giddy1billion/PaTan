import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/utils/auth.server", () => ({
  requireUser: vi.fn(),
}));

vi.mock("~/utils/db.server", () => ({
  db: {
    story: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

import { loader as discoverLoader } from "~/routes/discover";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

describe("Discover loader integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(requireUser).mockResolvedValue({
      id: "user-1",
      email: "user1@example.com",
      provider: "local",
    });

    vi.mocked(db.story.findMany).mockResolvedValue([
      {
        id: "story-1",
        title: "Finding Light",
        excerpt: "Short excerpt",
        publishedAt: new Date("2026-06-01T00:00:00.000Z"),
        readingTimeMinutes: 4,
        reactionCount: 23,
        commentCount: 7,
        isAnonymous: false,
        author: {
          displayName: "Jane Doe",
        },
        category: {
          name: "Hope and Faith",
          slug: "hope-and-faith",
        },
      },
    ] as any);

    vi.mocked(db.category.findMany).mockResolvedValue([
      { name: "Hope and Faith", slug: "hope-and-faith" },
    ] as any);
  });

  it("normalizes legacy category slugs and applies tag plus search filters", async () => {
    const result = await discoverLoader({
      request: new Request(
        "http://localhost/discover?category=hope-faith&tag=Breakthrough!&q=grace&welcome=onboarding-complete&published=story",
      ),
      params: {},
      context: {},
    } as any);

    const storyQuery = vi.mocked(db.story.findMany).mock.calls[0]?.[0] as any;
    expect(storyQuery.where.OR).toEqual([
      { privacy: "PUBLIC" },
      { authorId: "user-1" },
    ]);
    expect(storyQuery.where.AND).toEqual(
      expect.arrayContaining([
        { category: { slug: "hope-and-faith" } },
        { tags: { some: { tag: { slug: "breakthrough" } } } },
        {
          OR: [
            { title: { contains: "grace", mode: "insensitive" } },
            { excerpt: { contains: "grace", mode: "insensitive" } },
            { content: { contains: "grace", mode: "insensitive" } },
          ],
        },
      ]),
    );

    expect((result as any).selectedCategory).toBe("hope-and-faith");
    expect((result as any).selectedTag).toBe("breakthrough");
    expect((result as any).searchQuery).toBe("grace");
    expect((result as any).showOnboardingWelcome).toBe(true);
    expect((result as any).showStoryPublishedNotice).toBe(true);
  });

  it("keeps visibility checks for category discovery query", async () => {
    await discoverLoader({
      request: new Request("http://localhost/discover?category=gratitude"),
      params: {},
      context: {},
    } as any);

    const categoryQuery = vi.mocked(db.category.findMany).mock.calls[0]?.[0] as any;
    expect(categoryQuery.where.stories.some.OR).toEqual([
      { privacy: "PUBLIC" },
      { authorId: "user-1" },
    ]);
  });

  it("normalizes noisy tag inputs and trims long search queries", async () => {
    const longQuery = "x".repeat(120);

    const result = await discoverLoader({
      request: new Request(
        `http://localhost/discover?tag=%23HeaLing__Now!!!&q=${encodeURIComponent(longQuery)}`,
      ),
      params: {},
      context: {},
    } as any);

    expect((result as any).selectedTag).toBe("healingnow");
    expect((result as any).searchQuery).toHaveLength(80);

    const storyQuery = vi.mocked(db.story.findMany).mock.calls[0]?.[0] as any;
    expect(storyQuery.where.AND).toEqual(
      expect.arrayContaining([{ tags: { some: { tag: { slug: "healingnow" } } } }]),
    );
  });
});
