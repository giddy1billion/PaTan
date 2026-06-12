import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import { getUser, requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import {
  blockUserByUsername,
  getPublicProfileVisibilitySettings,
  reportUserByUsername,
} from "~/utils/users.server";
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

type ActionData = {
  error?: string;
  success?: string;
};
function formatDate(value: Date | null) {
  if (!value) {
    return "Recently";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
function formatMemberSince(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(value);
}
function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}
export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  const username = params.username ?? "";
  if (!data) {
    return [
      { title: `@${username}: Profile Not Found | PaTan` },
      {
        name: "description",
        content: "This community profile is not available.",
      },
    ];
  }
  const profileDescription = data.visibility.bio
    ? data.profile.bio?.slice(0, 155)
    : null;
  return [
    {
      title: `${data.profile.displayName} (@${data.profile.username}) | PaTan`,
    },
    {
      name: "description",
      content:
        profileDescription ||
        `Explore ${data.profile.displayName}'s stories and aspirations on PaTan.`,
    },
  ];
};
export async function loader({ params, request }: LoaderFunctionArgs) {
  const username = params.username?.trim();
  if (!username) {
    throw new Response("Profile not found", { status: 404 });
  }
  const profile = await db.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
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
    throw new Response("Profile not found", { status: 404 });
  }

  const viewer = await getUser(request);
  const [
    followersCount,
    followingCount,
    storyCount,
    aspirationCount,
    recentStories,
    recentAspirations,
    visibility,
  ] = await Promise.all([
    db.follow.count({ where: { followingId: profile.id } }),
    db.follow.count({ where: { followerId: profile.id } }),
    db.story.count({
      where: {
        authorId: profile.id,
        status: "PUBLISHED",
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
    }),
    db.aspiration.count({
      where: {
        authorId: profile.id,
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
    }),
    db.story.findMany({
      where: {
        authorId: profile.id,
        status: "PUBLISHED",
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        reactionCount: true,
        commentCount: true,
        category: { select: { name: true } },
      },
    }),
    db.aspiration.findMany({
      where: {
        authorId: profile.id,
        privacy: "PUBLIC",
        isAnonymous: false,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, status: true, createdAt: true },
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
  const aspirations: PublicAspiration[] = recentAspirations.map(
    (aspiration) => ({
      id: aspiration.id,
      title: aspiration.title,
      status: formatStatus(aspiration.status),
      createdAt: aspiration.createdAt,
    }),
  );
  return {
    profile,
    viewer,
    isOwner: viewer?.id === profile.id,
    stats: { followersCount, followingCount, storyCount, aspirationCount },
    visibility,
    stories,
    aspirations,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();

  const intent = String(formData.get("intent") ?? "");
  const username = String(formData.get("username") ?? params.username ?? "").trim();

  if (!username) {
    return { error: "Profile is unavailable for this action." } satisfies ActionData;
  }

  try {
    if (intent === "block-user") {
      const reason = String(formData.get("blockReason") ?? "").trim();
      await blockUserByUsername({
        blockerId: sessionUser.id,
        blockedUsername: username,
        reason,
      });

      return { success: `You blocked @${username}.` } satisfies ActionData;
    }

    if (intent === "report-user") {
      const description = String(formData.get("reportDescription") ?? "").trim();
      await reportUserByUsername({
        reporterId: sessionUser.id,
        reportedUsername: username,
        description,
      });

      return { success: `You reported @${username}.` } satisfies ActionData;
    }

    return { error: "Unsupported profile action." } satisfies ActionData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "cannot-block-self" || error.message === "cannot-report-self") {
        return { error: "You cannot perform this action on your own profile." } satisfies ActionData;
      }

      if (error.message === "user-not-found") {
        return { error: "This profile no longer exists." } satisfies ActionData;
      }
    }

    return { error: "We could not complete that action right now." } satisfies ActionData;
  }
}

export default function PublicUserProfileRoute() {
  const { profile, viewer, isOwner, stats, visibility, stories, aspirations } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const locationText = [profile.city, profile.country]
    .filter(Boolean)
    .join(", ");
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {" "}
      <section
        className="bg-midnight text-dawn py-10 sm:py-14"
        aria-labelledby="profile-heading"
      >
        {" "}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {" "}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white/20 border border-white/30 text-white flex items-center justify-center text-xl font-semibold">
              {" "}
              {profile.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt={`Profile avatar for ${profile.displayName}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span aria-hidden="true">
                  {getInitials(profile.displayName)}
                </span>
              )}{" "}
            </div>{" "}
            <div className="min-w-0">
              {" "}
              <h1
                id="profile-heading"
                className="font-heading text-3xl sm:text-4xl font-bold leading-tight"
              >
                {" "}
                {profile.displayName}{" "}
              </h1>{" "}
              <p className="mt-1 text-dawn/75">@{profile.username}</p>{" "}
              <p className="mt-2 text-sm text-dawn/70">
                Member since {formatMemberSince(profile.createdAt)}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <p className="mt-5 max-w-3xl text-sm sm:text-base text-dawn/85 leading-relaxed">
            {" "}
            {visibility.bio
              ? profile.bio?.trim() ||
                "This storyteller has not added a bio yet."
              : "This storyteller keeps their bio private."}{" "}
          </p>{" "}

          {actionData?.error ? (
            <div
              className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
              role="alert"
              aria-live="polite"
            >
              {actionData.error}
            </div>
          ) : null}

          {actionData?.success ? (
            <div
              className="mt-4 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest"
              role="status"
              aria-live="polite"
            >
              {actionData.success}
            </div>
          ) : null}

          {isOwner ? (
            <div className="mt-4">
              <Link
                to="/profile/settings"
                className="min-h-[44px] inline-flex items-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Manage profile settings
              </Link>
            </div>
          ) : viewer ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 max-w-3xl">
              <Form method="post" className="rounded-xl border border-white/25 bg-white/10 p-3">
                <input type="hidden" name="intent" value="block-user" />
                <input type="hidden" name="username" value={profile.username} />
                <label htmlFor="blockReason" className="block text-xs text-dawn/80">
                  Block reason (optional)
                </label>
                <input
                  id="blockReason"
                  name="blockReason"
                  maxLength={300}
                  className="mt-1 block w-full min-h-[44px] rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-golden"
                  placeholder="Mute this profile from your experience"
                />
                <button
                  type="submit"
                  className="mt-2 min-h-[44px] w-full rounded-lg border border-white/35 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  Block @{profile.username}
                </button>
              </Form>

              <Form method="post" className="rounded-xl border border-white/25 bg-white/10 p-3">
                <input type="hidden" name="intent" value="report-user" />
                <input type="hidden" name="username" value={profile.username} />
                <label htmlFor="reportDescription" className="block text-xs text-dawn/80">
                  Report details (optional)
                </label>
                <textarea
                  id="reportDescription"
                  name="reportDescription"
                  rows={2}
                  maxLength={500}
                  className="mt-1 block w-full rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-sm text-midnight focus:outline-none focus:ring-2 focus:ring-golden"
                  placeholder="Share what happened"
                />
                <button
                  type="submit"
                  className="mt-2 min-h-[44px] w-full rounded-lg border border-[#F59E0B]/60 bg-[#7C2D12]/80 px-3 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  Report @{profile.username}
                </button>
              </Form>
            </div>
          ) : (
            <div className="mt-4">
              <Link
                to={`/login?redirectTo=${encodeURIComponent(`/u/${profile.username}`)}`}
                className="min-h-[44px] inline-flex items-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Log in to block or report
              </Link>
            </div>
          )}
        </div>{" "}
      </section>{" "}
      <section className="py-8 sm:py-10 border-b border-midnight/10 bg-white">
        {" "}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <h2 className="sr-only">Profile highlights</h2>{" "}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {" "}
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              {" "}
              <p className="text-xs text-night/60 uppercase tracking-wide">
                Followers
              </p>{" "}
              <p className="mt-1 text-2xl font-bold text-midnight">
                {stats.followersCount}
              </p>{" "}
            </article>{" "}
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              {" "}
              <p className="text-xs text-night/60 uppercase tracking-wide">
                Following
              </p>{" "}
              <p className="mt-1 text-2xl font-bold text-midnight">
                {stats.followingCount}
              </p>{" "}
            </article>{" "}
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              {" "}
              <p className="text-xs text-night/60 uppercase tracking-wide">
                Published stories
              </p>{" "}
              <p className="mt-1 text-2xl font-bold text-midnight">
                {visibility.stories ? stats.storyCount : "Private"}
              </p>{" "}
            </article>{" "}
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              {" "}
              <p className="text-xs text-night/60 uppercase tracking-wide">
                Public aspirations
              </p>{" "}
              <p className="mt-1 text-2xl font-bold text-midnight">
                {" "}
                {visibility.aspirations
                  ? stats.aspirationCount
                  : "Private"}{" "}
              </p>{" "}
            </article>{" "}
          </div>{" "}
          <dl className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            {" "}
            <div className="rounded-xl border border-midnight/10 p-3">
              {" "}
              <dt className="text-night/60">Location</dt>{" "}
              <dd className="mt-1 font-medium text-midnight">
                {" "}
                {visibility.location
                  ? locationText || "Not shared"
                  : "Private"}{" "}
              </dd>{" "}
            </div>{" "}
            <div className="rounded-xl border border-midnight/10 p-3">
              {" "}
              <dt className="text-night/60">Pronouns</dt>{" "}
              <dd className="mt-1 font-medium text-midnight">
                {" "}
                {visibility.pronouns
                  ? profile.pronouns || "Not shared"
                  : "Private"}{" "}
              </dd>{" "}
            </div>{" "}
            <div className="rounded-xl border border-midnight/10 p-3">
              {" "}
              <dt className="text-night/60">Interests</dt>{" "}
              <dd className="mt-1 font-medium text-midnight">
                {" "}
                {visibility.interests
                  ? profile.personalInterests.length > 0
                    ? profile.personalInterests.length
                    : "None listed"
                  : "Private"}{" "}
              </dd>{" "}
            </div>{" "}
          </dl>{" "}
          {visibility.interests && profile.personalInterests.length > 0 ? (
            <ul
              className="mt-3 flex flex-wrap gap-2"
              role="list"
              aria-label="Personal interests"
            >
              {" "}
              {profile.personalInterests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full bg-[#FDF3D6] text-[#7A5A00] px-3 py-1 text-xs font-semibold"
                >
                  {" "}
                  {interest}{" "}
                </li>
              ))}{" "}
            </ul>
          ) : null}{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-8 sm:py-10">
        {" "}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <div className="flex items-center justify-between gap-3">
            {" "}
            <h2 className="font-heading text-2xl text-midnight">
              Recent stories
            </h2>{" "}
            <Link
              to="/discover"
              className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-medium text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
            >
              {" "}
              Explore all stories{" "}
            </Link>{" "}
          </div>{" "}
          {!visibility.stories ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              {" "}
              This storyteller keeps story highlights private.{" "}
            </p>
          ) : stories.length === 0 ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              {" "}
              No published stories yet.{" "}
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {" "}
              {stories.map((story) => (
                <article
                  key={story.id}
                  className="rounded-2xl border border-midnight/10 bg-white p-4 shadow-sm"
                >
                  {" "}
                  <p className="text-xs uppercase tracking-wide text-night/60">
                    {story.categoryName}
                  </p>{" "}
                  <h3 className="mt-2 font-heading text-lg text-midnight leading-tight">
                    {" "}
                    <Link
                      to={`/stories/${story.id}`}
                      className="hover:text-golden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                    >
                      {" "}
                      {story.title}{" "}
                    </Link>{" "}
                  </h3>{" "}
                  <p className="mt-2 text-sm text-night/75 leading-relaxed line-clamp-3">
                    {" "}
                    {story.excerpt?.trim() ||
                      "Read this reflection to discover more of this journey."}{" "}
                  </p>{" "}
                  <div className="mt-4 flex items-center justify-between text-xs text-night/60">
                    {" "}
                    <span>{formatDate(story.publishedAt)}</span>{" "}
                    <span>
                      {" "}
                      {story.reactionCount} reactions | {story.commentCount}{" "}
                      comments{" "}
                    </span>{" "}
                  </div>{" "}
                </article>
              ))}{" "}
            </div>
          )}{" "}
        </div>{" "}
      </section>{" "}
      <section className="pb-12 sm:pb-16">
        {" "}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <h2 className="font-heading text-2xl text-midnight">
            Recent aspirations
          </h2>{" "}
          {!visibility.aspirations ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              {" "}
              This storyteller keeps aspiration highlights private.{" "}
            </p>
          ) : aspirations.length === 0 ? (
            <p className="mt-4 rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
              {" "}
              No public aspirations shared yet.{" "}
            </p>
          ) : (
            <ul className="mt-4 space-y-3" role="list">
              {" "}
              {aspirations.map((aspiration) => (
                <li
                  key={aspiration.id}
                  className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm"
                >
                  {" "}
                  <p className="text-sm font-semibold text-midnight">
                    {aspiration.title}
                  </p>{" "}
                  <div className="mt-1 flex items-center gap-2 text-xs text-night/60">
                    {" "}
                    <span className="rounded-full bg-[#ECF9F0] text-forest px-2 py-0.5 font-semibold uppercase tracking-wide">
                      {" "}
                      {aspiration.status}{" "}
                    </span>{" "}
                    <span>{formatDate(aspiration.createdAt)}</span>{" "}
                  </div>{" "}
                </li>
              ))}{" "}
            </ul>
          )}{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
