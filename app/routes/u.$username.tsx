import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
import { getUser, requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";
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

function MoreVerticalIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 15.5 7-7" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4v16" />
      <path d="M6 5h8.2l-1.2 3.6L16 12H6" />
    </svg>
  );
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
  const isFollowing =
    viewer && viewer.id !== profile.id
      ? Boolean(
          await db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: profile.id,
              },
            },
            select: { id: true },
          }),
        )
      : false;
  return {
    profile,
    viewer,
    isOwner: viewer?.id === profile.id,
    isFollowing,
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
    if (intent === "follow-user" || intent === "unfollow-user") {
      const target = await db.user.findFirst({
        where: {
          username: { equals: username, mode: "insensitive" },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!target) {
        return { error: "This profile no longer exists." } satisfies ActionData;
      }

      if (target.id === sessionUser.id) {
        return {
          error: "You cannot follow your own profile.",
        } satisfies ActionData;
      }

      if (intent === "follow-user") {
        const existing = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: sessionUser.id,
              followingId: target.id,
            },
          },
          select: { id: true },
        });

        if (!existing) {
          await db.follow.create({
            data: {
              followerId: sessionUser.id,
              followingId: target.id,
            },
          });

          await createNotification({
            userId: target.id,
            actorId: sessionUser.id,
            type: "NEW_FOLLOWER",
            title: "You have a new follower",
            body: "Someone followed your journey.",
            resourceId: sessionUser.id,
            resourceType: "user",
          });
        }

        return {
          success: `You are now following @${username}.`,
        } satisfies ActionData;
      }

      await db.follow.deleteMany({
        where: {
          followerId: sessionUser.id,
          followingId: target.id,
        },
      });

      return { success: `You unfollowed @${username}.` } satisfies ActionData;
    }

    if (intent === "block-user") {
      await blockUserByUsername({
        blockerId: sessionUser.id,
        blockedUsername: username,
      });

      return { success: `You blocked @${username}.` } satisfies ActionData;
    }

    if (intent === "report-user") {
      await reportUserByUsername({
        reporterId: sessionUser.id,
        reportedUsername: username,
      });

      return {
        success: `Thank you. Our moderation team will review @${username}.`,
      } satisfies ActionData;
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
  const {
    profile,
    viewer,
    isOwner,
    isFollowing,
    stats,
    visibility,
    stories,
    aspirations,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submittingIntent =
    navigation.state === "submitting"
      ? String(navigation.formData?.get("intent") ?? "")
      : "";
  const [isSafetyMenuOpen, setIsSafetyMenuOpen] = useState(false);
  const [pendingSafetyIntent, setPendingSafetyIntent] = useState<"block-user" | "report-user" | null>(null);
  const safetyMenuRef = useRef<HTMLDivElement>(null);
  const safetyMenuButtonRef = useRef<HTMLButtonElement>(null);
  const locationText = [profile.city, profile.country]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    if (!isSafetyMenuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (safetyMenuRef.current && !safetyMenuRef.current.contains(target)) {
        setIsSafetyMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSafetyMenuOpen(false);
        safetyMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSafetyMenuOpen]);

  useEffect(() => {
    if (!isSafetyMenuOpen) {
      setPendingSafetyIntent(null);
    }
  }, [isSafetyMenuOpen]);

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

          <AutoDismissAlert
            tone="error"
            message={actionData?.error}
            className="mt-4"
          />

          <AutoDismissAlert
            tone="success"
            message={actionData?.success}
            className="mt-4"
          />

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
            <div className="mt-5 flex items-center gap-3">
              <Form method="post">
                <input
                  type="hidden"
                  name="intent"
                  value={isFollowing ? "unfollow-user" : "follow-user"}
                />
                <input type="hidden" name="username" value={profile.username} />
                <button
                  type="submit"
                  className={
                    isFollowing
                      ? "min-h-[44px] inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                      : "min-h-[44px] inline-flex items-center justify-center rounded-xl bg-golden px-5 py-2 text-sm font-semibold text-midnight transition-colors duration-200 hover:bg-golden-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                  }
                  disabled={
                    submittingIntent === "follow-user" ||
                    submittingIntent === "unfollow-user"
                  }
                  aria-busy={
                    submittingIntent === "follow-user" ||
                    submittingIntent === "unfollow-user"
                  }
                  aria-label={`${isFollowing ? "Unfollow" : "Follow"} ${profile.displayName}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </Form>

              <div className="relative ml-auto" ref={safetyMenuRef}>
                <button
                  ref={safetyMenuButtonRef}
                  type="button"
                  className="group min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                  aria-haspopup="dialog"
                  aria-controls="profile-safety-menu"
                  aria-expanded={isSafetyMenuOpen}
                  aria-label={`Open safety actions for ${profile.displayName}`}
                  onClick={() => setIsSafetyMenuOpen((current) => !current)}
                >
                  <MoreVerticalIcon
                    className={`transition-transform duration-200 ${isSafetyMenuOpen ? "rotate-90" : "rotate-0"}`}
                  />
                </button>

                <div
                  id="profile-safety-menu"
                  role="dialog"
                  aria-modal="false"
                  aria-label="Profile safety actions"
                  className={`absolute right-0 top-full z-20 mt-2 w-[min(21rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-midnight/15 bg-white/95 p-2.5 shadow-[0_20px_40px_rgba(13,43,69,0.22)] backdrop-blur-sm transition-all duration-200 motion-reduce:transition-none sm:w-80 ${
                    isSafetyMenuOpen
                      ? "opacity-100 translate-y-0 scale-100"
                      : "pointer-events-none opacity-0 -translate-y-2 scale-95"
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="rounded-xl border border-midnight/10 bg-white p-2">
                      <button
                        type="button"
                        className="min-h-[44px] w-full inline-flex items-center gap-3 rounded-lg px-2 py-2 text-left text-midnight transition-colors duration-200 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                        onClick={() =>
                          setPendingSafetyIntent((current) =>
                            current === "block-user" ? null : "block-user",
                          )
                        }
                        aria-expanded={pendingSafetyIntent === "block-user"}
                        aria-controls="confirm-block-user"
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-midnight/15 bg-white text-midnight">
                          <BlockIcon />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">Block user</span>
                          <span className="text-xs text-night/65 leading-tight mt-0.5">
                            Hide this profile and stop interactions.
                          </span>
                        </span>
                      </button>

                      <div
                        id="confirm-block-user"
                        className={`overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
                          pendingSafetyIntent === "block-user"
                            ? "max-h-44 opacity-100 mt-2"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="rounded-lg border border-midnight/10 bg-surface px-3 py-2">
                          <p className="text-xs text-night/75">
                            Block @{profile.username}? You can unblock later from your safety settings.
                          </p>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="min-h-[36px] rounded-lg border border-midnight/20 bg-white px-3 text-xs font-semibold text-midnight hover:bg-mist/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                              onClick={() => setPendingSafetyIntent(null)}
                            >
                              Cancel
                            </button>
                            <Form method="post">
                              <input type="hidden" name="intent" value="block-user" />
                              <input type="hidden" name="username" value={profile.username} />
                              <button
                                type="submit"
                                className="min-h-[36px] rounded-lg bg-midnight px-3 text-xs font-semibold text-white hover:bg-[#123A5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                disabled={submittingIntent === "block-user"}
                                aria-busy={submittingIntent === "block-user"}
                                onClick={() => setIsSafetyMenuOpen(false)}
                              >
                                {submittingIntent === "block-user" ? "Blocking..." : "Continue"}
                              </button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#F59E0B]/30 bg-white p-2">
                      <button
                        type="button"
                        className="min-h-[44px] w-full inline-flex items-center gap-3 rounded-lg px-2 py-2 text-left text-[#7C2D12] transition-colors duration-200 hover:bg-[#FEF3C7]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                        onClick={() =>
                          setPendingSafetyIntent((current) =>
                            current === "report-user" ? null : "report-user",
                          )
                        }
                        aria-expanded={pendingSafetyIntent === "report-user"}
                        aria-controls="confirm-report-user"
                      >
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F59E0B]/45 bg-[#FFF7E8] text-[#7C2D12]">
                          <ReportIcon />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-semibold leading-tight">Report user</span>
                          <span className="text-xs text-[#7C2D12]/80 leading-tight mt-0.5">
                            Send this profile to moderators for review.
                          </span>
                        </span>
                      </button>

                      <div
                        id="confirm-report-user"
                        className={`overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
                          pendingSafetyIntent === "report-user"
                            ? "max-h-44 opacity-100 mt-2"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="rounded-lg border border-[#F59E0B]/35 bg-[#FEF3C7]/55 px-3 py-2">
                          <p className="text-xs text-[#7C2D12]">
                            Report @{profile.username}? Our moderation team reviews every report.
                          </p>
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="min-h-[36px] rounded-lg border border-[#F59E0B]/45 bg-white px-3 text-xs font-semibold text-[#7C2D12] hover:bg-[#FFF7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                              onClick={() => setPendingSafetyIntent(null)}
                            >
                              Cancel
                            </button>
                            <Form method="post">
                              <input type="hidden" name="intent" value="report-user" />
                              <input type="hidden" name="username" value={profile.username} />
                              <button
                                type="submit"
                                className="min-h-[36px] rounded-lg bg-[#7C2D12] px-3 text-xs font-semibold text-white hover:bg-[#6A250F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                disabled={submittingIntent === "report-user"}
                                aria-busy={submittingIntent === "report-user"}
                                onClick={() => setIsSafetyMenuOpen(false)}
                              >
                                {submittingIntent === "report-user" ? "Reporting..." : "Continue"}
                              </button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Link
                to={`/login?redirectTo=${encodeURIComponent(`/u/${profile.username}`)}`}
                className="min-h-[44px] inline-flex items-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Log in to follow, block, or report
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
                  className="group relative rounded-2xl border border-midnight/10 bg-white p-4 shadow-sm"
                >
                  <Link
                    to={`/stories/${story.id}`}
                    className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    aria-label={`Read story: ${story.title}`}
                  />
                  {" "}
                  <p className="text-xs uppercase tracking-wide text-night/60">
                    {story.categoryName}
                  </p>{" "}
                  <h3 className="mt-2 font-heading text-lg text-midnight leading-tight transition-colors group-hover:text-golden">
                    {" "}
                    {story.title}{" "}
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
