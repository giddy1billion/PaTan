import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { db } from '~/utils/db.server';
import { getPublicProfileVisibilitySettings } from '~/utils/users.server';

type PublicStory = {
  id: string;
  title: string;
  excerpt: string | null;
  categoryName: string;
  publishedAt: Date | null;
  reactionCount: number;
  commentCount: number;
};

type PublicAspiration = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
};

function formatDate(value: Date | null) {
  if (!value) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatMemberSince(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase();
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const username = params.username ?? '';

  if (!data) {
    return [
      { title: `@${username} - Profile Not Found | PaTan` },
      {
        name: 'description',
        content: 'This community profile is not available.',
      },
    ];
  }

  const profileDescription = data.visibility.bio
    ? data.profile.bio?.slice(0, 155)
    : null;

  return [
    { title: `${data.profile.displayName} (@${data.profile.username}) | PaTan` },
    {
      name: 'description',
      content: profileDescription || `Explore ${data.profile.displayName}'s stories and aspirations on PaTan.`,
    },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const username = params.username?.trim();

  if (!username) {
    throw new Response('Profile not found', { status: 404 });
  }

  const profile = await db.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive',
      },
      deletedAt: null,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      pronouns: true,
      profilePhotoUrl: true,
      city: true,
      country: true,
      personalInterests: true,
      createdAt: true,
    },
  });

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  const [followersCount, followingCount, storyCount, aspirationCount, recentStories, recentAspirations, visibility] =
    await Promise.all([
      db.follow.count({
        where: {
          followingId: profile.id,
        },
      }),
      db.follow.count({
        where: {
          followerId: profile.id,
        },
      }),
      db.story.count({
        where: {
          authorId: profile.id,
          status: 'PUBLISHED',
          privacy: 'PUBLIC',
          isAnonymous: false,
          deletedAt: null,
        },
      }),
      db.aspiration.count({
        where: {
          authorId: profile.id,
          privacy: 'PUBLIC',
          deletedAt: null,
        },
      }),
      db.story.findMany({
        where: {
          authorId: profile.id,
          status: 'PUBLISHED',
          privacy: 'PUBLIC',
          isAnonymous: false,
          deletedAt: null,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 6,
        select: {
          id: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          reactionCount: true,
          commentCount: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      db.aspiration.findMany({
        where: {
          authorId: profile.id,
          privacy: 'PUBLIC',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),
      getPublicProfileVisibilitySettings(profile.id),
    ]);

  const stories: PublicStory[] = recentStories.map((story) => ({
    id: story.id,
    title: story.title,
    excerpt: story.excerpt,
    categoryName: story.category.name,
    publishedAt: story.publishedAt,
    reactionCount: story.reactionCount,
    commentCount: story.commentCount,
  }));

  const aspirations: PublicAspiration[] = recentAspirations.map((aspiration) => ({
    id: aspiration.id,
    title: aspiration.title,
    status: formatStatus(aspiration.status),
    createdAt: aspiration.createdAt,
  }));

  return {
    profile,
    stats: {
      followersCount,
      followingCount,
      storyCount,
      aspirationCount,
    },
    visibility,
    stories,
    aspirations,
  };
}

export default function PublicUserProfileRoute() {
  const { profile, stats, visibility, stories, aspirations } = useLoaderData<typeof loader>();
  const locationText = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-10 sm:py-14" aria-labelledby="profile-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white/20 border border-white/30 text-white flex items-center justify-center text-xl font-semibold">
              {profile.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt={`Profile avatar for ${profile.displayName}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span aria-hidden="true">{getInitials(profile.displayName)}</span>
              )}
            </div>

            <div className="min-w-0">
              <h1 id="profile-heading" className="font-heading text-3xl sm:text-4xl font-bold leading-tight">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-dawn/75">@{profile.username}</p>
              <p className="mt-2 text-sm text-dawn/70">Member since {formatMemberSince(profile.createdAt)}</p>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm sm:text-base text-dawn/85 leading-relaxed">
            {visibility.bio
              ? profile.bio?.trim() || 'This storyteller has not added a bio yet.'
              : 'This storyteller keeps their bio private.'}
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-10 border-b border-midnight/10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Profile highlights</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Followers</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.followersCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Following</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.followingCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Published stories</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{visibility.stories ? stats.storyCount : 'Private'}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Public aspirations</p>
              <p className="mt-1 text-2xl font-bold text-midnight">
                {visibility.aspirations ? stats.aspirationCount : 'Private'}
              </p>
            </article>
          </div>

          <dl className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-midnight/10 p-3">
              <dt className="text-night/60">Location</dt>
              <dd className="mt-1 font-medium text-midnight">
                {visibility.location ? locationText || 'Not shared' : 'Private'}
              </dd>
            </div>
            <div className="rounded-xl border border-midnight/10 p-3">
              <dt className="text-night/60">Pronouns</dt>
              <dd className="mt-1 font-medium text-midnight">
                {visibility.pronouns ? profile.pronouns || 'Not shared' : 'Private'}
              </dd>
            </div>
            <div className="rounded-xl border border-midnight/10 p-3">
              <dt className="text-night/60">Interests</dt>
              <dd className="mt-1 font-medium text-midnight">
                {visibility.interests
                  ? profile.personalInterests.length > 0
                    ? profile.personalInterests.length
                    : 'None listed'
                  : 'Private'}
              </dd>
            </div>
          </dl>

          {visibility.interests && profile.personalInterests.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Personal interests">
              {profile.personalInterests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full bg-[#FDF3D6] text-[#7A5A00] px-3 py-1 text-xs font-semibold"
                >
                  {interest}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl text-midnight">Recent stories</h2>
            <Link
              to="/discover"
              className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-medium text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
            >
              Explore all stories
            </Link>
          </div>

          {!visibility.stories ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              This storyteller keeps story highlights private.
            </p>
          ) : stories.length === 0 ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              No published stories yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <article key={story.id} className="rounded-2xl border border-midnight/10 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-night/60">{story.categoryName}</p>
                  <h3 className="mt-2 font-heading text-lg text-midnight leading-tight">
                    <Link
                      to={`/stories/${story.id}`}
                      className="hover:text-golden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                    >
                      {story.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-night/75 leading-relaxed line-clamp-3">
                    {story.excerpt?.trim() || 'Read this reflection to discover more of this journey.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-night/60">
                    <span>{formatDate(story.publishedAt)}</span>
                    <span>
                      {story.reactionCount} reactions | {story.commentCount} comments
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl text-midnight">Recent aspirations</h2>

          {!visibility.aspirations ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              This storyteller keeps aspiration highlights private.
            </p>
          ) : aspirations.length === 0 ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              No public aspirations shared yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3" role="list">
              {aspirations.map((aspiration) => (
                <li key={aspiration.id} className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-midnight">{aspiration.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-night/60">
                    <span className="rounded-full bg-[#ECF9F0] text-forest px-2 py-0.5 font-semibold uppercase tracking-wide">
                      {aspiration.status}
                    </span>
                    <span>{formatDate(aspiration.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
