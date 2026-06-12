import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('~/utils/auth.server', () => ({
  getUser: vi.fn(),
  requireUser: vi.fn(),
  requireVerifiedUser: vi.fn(),
}));

vi.mock('~/utils/users.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/users.server')>();
  return {
    ...actual,
    getOnboardingProfile: vi.fn(),
  };
});

vi.mock('~/utils/db.server', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    follow: {
      count: vi.fn(),
    },
    userPreference: {
      findUnique: vi.fn(),
    },
    story: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    aspiration: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { loader as authenticatedLayoutLoader } from '~/routes/authenticated-layout';
import { loader as profileRedirectLoader } from '~/routes/profile.redirect';
import { loader as publicProfileLoader } from '~/routes/u.$username';
import { getUser, requireVerifiedUser } from '~/utils/auth.server';
import { getOnboardingProfile } from '~/utils/users.server';
import { db } from '~/utils/db.server';

describe('Route integration guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUser).mockResolvedValue(null);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      emailVerified: new Date('2026-06-12T00:00:00.000Z'),
    } as any);
    vi.mocked(requireVerifiedUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      provider: 'local',
    });
  });

  it('redirects unverified users to dedicated verify-email page before protected routes', async () => {
    vi.mocked(requireVerifiedUser).mockRejectedValue(
      new Response(null, {
        status: 302,
        headers: new Headers({
          Location: `/verify-email?redirectTo=${encodeURIComponent('/discover?category=gratitude')}`,
        }),
      }),
    );

    await expect(
      authenticatedLayoutLoader({
        request: new Request('http://localhost/discover?category=gratitude'),
        params: {},
        context: {},
      } as any),
    ).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });

    try {
      await authenticatedLayoutLoader({
        request: new Request('http://localhost/discover?category=gratitude'),
        params: {},
        context: {},
      } as any);
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      const location = (response as Response).headers.get('Location');
      expect(location).toContain('/verify-email?redirectTo=');
      expect(location).toContain(encodeURIComponent('/discover?category=gratitude'));
    }
  });

  it('redirects incomplete onboarding users from authenticated layout', async () => {
    vi.mocked(getOnboardingProfile).mockResolvedValue({
      id: 'user-1',
      displayName: 'User One',
      username: 'userone',
      bio: null,
      personalInterests: [],
      onboardingCompleted: false,
    });

    await expect(
      authenticatedLayoutLoader({
        request: new Request('http://localhost/discover?category=gratitude'),
        params: {},
        context: {},
      } as any),
    ).rejects.toMatchObject({
      status: 302,
      headers: expect.any(Headers),
    });

    try {
      await authenticatedLayoutLoader({
        request: new Request('http://localhost/discover?category=gratitude'),
        params: {},
        context: {},
      } as any);
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      const location = (response as Response).headers.get('Location');
      expect(location).toContain('/onboarding/profile?redirectTo=');
      expect(location).toContain(encodeURIComponent('/discover?category=gratitude'));
    }
  });

  it('returns 404 for unknown public profile usernames', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null as any);

    await expect(
      publicProfileLoader({
        request: new Request('http://localhost/u/missing-user'),
        params: { username: 'missing-user' },
        context: {},
      } as any),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('returns public profile payload for existing username', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-2',
      username: 'jane',
      displayName: 'Jane Doe',
      bio: 'A hopeful storyteller',
      profilePhotoUrl: null,
      city: 'Nairobi',
      country: 'Kenya',
      personalInterests: ['Gratitude'],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as any);

    vi.mocked(db.follow.count)
      .mockResolvedValueOnce(12 as any)
      .mockResolvedValueOnce(7 as any);

    vi.mocked(db.story.count).mockResolvedValue(4 as any);
    vi.mocked(db.aspiration.count).mockResolvedValue(2 as any);

    vi.mocked(db.story.findMany).mockResolvedValue([
      {
        id: 'story-1',
        title: 'Light in the Journey',
        excerpt: 'Short excerpt',
        publishedAt: new Date('2026-03-01T00:00:00.000Z'),
        reactionCount: 14,
        commentCount: 3,
        category: { name: 'Gratitude' },
      },
    ] as any);

    vi.mocked(db.aspiration.findMany).mockResolvedValue([
      {
        id: 'asp-1',
        title: 'Grow in kindness',
        status: 'IN_PROGRESS',
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    ] as any);

    const result = await publicProfileLoader({
      request: new Request('http://localhost/u/jane'),
      params: { username: 'jane' },
      context: {},
    } as any);

    expect((result as any).profile.username).toBe('jane');
    expect((result as any).stats.storyCount).toBe(4);
    expect((result as any).stories).toHaveLength(1);
    expect((result as any).aspirations).toHaveLength(1);
  });

  it('redirects legacy /profile/edit to canonical /profile preserving query params', async () => {
    try {
      await profileRedirectLoader({
        request: new Request('http://localhost/profile/edit?tab=security&from=legacy'),
        params: {},
        context: {},
      } as any);

      throw new Error('Expected redirect response');
    } catch (response) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(301);
      expect((response as Response).headers.get('Location')).toBe('/profile?tab=security&from=legacy');
    }
  });
});
