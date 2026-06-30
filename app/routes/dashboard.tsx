import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useState } from "react";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";
import {
  getDashboardSummary,
  getSuggestedFollows,
  type EngagementRange,
} from "~/utils/users.server";
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
const RANGE_OPTIONS: Array<{ value: EngagementRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];
const ACTIVITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "stories", label: "Stories" },
  { value: "aspirations", label: "Aspirations" },
  { value: "notifications", label: "Notifications" },
] as const;
type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]["value"];

type ActionData = {
  error?: string;
  success?: string;
};

const DASHBOARD_TAB_QUERY_KEYS = new Set(["activity", "range"]);

function parseRange(input: string | null): EngagementRange {
  if (input === "7d" || input === "30d" || input === "90d") {
    return input;
  }
  return "30d";
}
function parseFilter(input: string | null): ActivityFilter {
  if (
    input === "stories" ||
    input === "aspirations" ||
    input === "notifications"
  ) {
    return input;
  }
  return "all";
}
function formatDate(input: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

function ReadAllIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <path d="m17 16 2 2 3-4" />
    </svg>
  );
}
export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard | PaTan" },
    {
      name: "description",
      content:
        "Your personal PaTan dashboard with profile progress, stories, aspirations, and community activity.",
    },
  ];
};
export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range"));
  const activityFilter = parseFilter(url.searchParams.get("activity"));
  const showWelcome = url.searchParams.get("welcome") === "onboarding-complete";
  const [summary, suggestions] = await Promise.all([
    getDashboardSummary(sessionUser.id, range),
    getSuggestedFollows(sessionUser.id),
  ]);
  if (!summary) {
    throw new Response("Dashboard unavailable", { status: 404 });
  }
  return { summary, suggestions, showWelcome, activityFilter, range };
}

function getChangedSearchParamKeys(currentUrl: URL, nextUrl: URL) {
  const changedKeys = new Set<string>();
  const keys = new Set<string>([
    ...Array.from(currentUrl.searchParams.keys()),
    ...Array.from(nextUrl.searchParams.keys()),
  ]);

  for (const key of keys) {
    const currentValue = currentUrl.searchParams.getAll(key).join("\u0000");
    const nextValue = nextUrl.searchParams.getAll(key).join("\u0000");
    if (currentValue !== nextValue) {
      changedKeys.add(key);
    }
  }

  return changedKeys;
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod.toLowerCase() !== "get") {
    return defaultShouldRevalidate;
  }

  if (currentUrl.pathname !== nextUrl.pathname) {
    return defaultShouldRevalidate;
  }

  const changedKeys = getChangedSearchParamKeys(currentUrl, nextUrl);

  if (changedKeys.size === 0) {
    return defaultShouldRevalidate;
  }

  const changedOnlyDashboardTabs = Array.from(changedKeys).every((key) =>
    DASHBOARD_TAB_QUERY_KEYS.has(key),
  );

  if (!changedOnlyDashboardTabs) {
    return defaultShouldRevalidate;
  }

  if (changedKeys.has("range")) {
    return true;
  }

  if (changedKeys.has("activity")) {
    return false;
  }

  return defaultShouldRevalidate;
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "follow-user") {
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();

    if (!targetUserId) {
      return { error: "Target user is missing." } satisfies ActionData;
    }

    if (targetUserId === sessionUser.id) {
      return { error: "You cannot follow yourself." } satisfies ActionData;
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, deletedAt: true },
    });

    if (!targetUser || targetUser.deletedAt) {
      return { error: "This profile is no longer available." } satisfies ActionData;
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUser.id,
          followingId: targetUserId,
        },
      },
      select: { id: true },
    });

    if (existingFollow) {
      return { success: "You already follow this person." } satisfies ActionData;
    }

    await db.follow.create({
      data: {
        followerId: sessionUser.id,
        followingId: targetUserId,
      },
    });

    await createNotification({
      userId: targetUserId,
      actorId: sessionUser.id,
      type: "NEW_FOLLOWER",
      title: "You have a new follower",
      body: "Someone followed your journey.",
      resourceId: sessionUser.id,
      resourceType: "user",
    });

    return { success: "You are now following this person." } satisfies ActionData;
  }

  if (intent === "unfollow-user") {
    const targetUserId = String(formData.get("targetUserId") ?? "").trim();

    if (!targetUserId) {
      return { error: "Target user is missing." } satisfies ActionData;
    }

    const result = await db.follow.deleteMany({
      where: {
        followerId: sessionUser.id,
        followingId: targetUserId,
      },
    });

    if (result.count === 0) {
      return { success: "You were not following this person." } satisfies ActionData;
    }

    return { success: "Unfollowed successfully." } satisfies ActionData;
  }

  if (intent === "join-circle") {
    const circleId = String(formData.get("circleId") ?? "").trim();

    if (!circleId) {
      return { error: "Circle reference is missing." } satisfies ActionData;
    }

    const circle = await db.circle.findUnique({
      where: { id: circleId },
      select: { id: true, isPrivate: true, deletedAt: true, name: true },
    });

    if (!circle || circle.deletedAt) {
      return { error: "This circle is not available." } satisfies ActionData;
    }

    if (circle.isPrivate) {
      return { error: "This circle requires an invitation." } satisfies ActionData;
    }

    const membership = await db.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: sessionUser.id,
        },
      },
      select: { id: true },
    });

    if (membership) {
      return { success: "You are already a member of this circle." } satisfies ActionData;
    }

    await db.$transaction([
      db.circleMember.create({
        data: {
          circleId,
          userId: sessionUser.id,
          role: "member",
        },
      }),
      db.circle.update({
        where: { id: circleId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return { success: `You joined ${circle.name}.` } satisfies ActionData;
  }

  if (intent === "leave-circle") {
    const circleId = String(formData.get("circleId") ?? "").trim();

    if (!circleId) {
      return { error: "Circle reference is missing." } satisfies ActionData;
    }

    const [result, circle] = await Promise.all([
      db.circleMember.deleteMany({
        where: {
          circleId,
          userId: sessionUser.id,
        },
      }),
      db.circle.findUnique({
        where: { id: circleId },
        select: { id: true, name: true, deletedAt: true },
      }),
    ]);

    if (result.count === 0) {
      return { success: "You are not currently a member of this circle." } satisfies ActionData;
    }

    if (circle && !circle.deletedAt) {
      await db.circle.updateMany({
        where: {
          id: circle.id,
          memberCount: {
            gt: 0,
          },
        },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });
    }

    return { success: "You left the circle." } satisfies ActionData;
  }

  if (intent === "mark-notification-read") {
    const notificationId = String(formData.get("notificationId") ?? "").trim();
    if (!notificationId) {
      return { error: "Notification id is missing." } satisfies ActionData;
    }

    const result = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: sessionUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      return { error: "Notification not found or already read." } satisfies ActionData;
    }

    return { success: "Notification marked as read." } satisfies ActionData;
  }

  if (intent === "mark-all-notifications-read") {
    const result = await db.notification.updateMany({
      where: {
        userId: sessionUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      return { success: "No unread notifications." } satisfies ActionData;
    }

    const label = result.count === 1 ? "notification" : "notifications";
    return { success: `Marked ${result.count} ${label} as read.` } satisfies ActionData;
  }

  return { error: "Unsupported dashboard action." } satisfies ActionData;
}

export default function DashboardRoute() {
  const { summary, suggestions, showWelcome, range } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDashboardReadAll, setPendingDashboardReadAll] = useState(false);
  const navigationState = useNavigation();
  const submittingIntent =
    navigationState.state === "submitting"
      ? String(navigationState.formData?.get("intent") ?? "")
      : "";
  const isRefreshing =
    navigationState.state === "loading" &&
    navigationState.location?.pathname === "/dashboard";
  const isSubmittingNotificationAction =
    submittingIntent.includes("notification");
  const isSubmittingRelationshipAction =
    submittingIntent === "follow-user" ||
    submittingIntent === "unfollow-user" ||
    submittingIntent === "join-circle" ||
    submittingIntent === "leave-circle";
  const activeActivityFilter = parseFilter(searchParams.get("activity"));
  const filteredStories =
    activeActivityFilter === "all" || activeActivityFilter === "stories";
  const filteredAspirations =
    activeActivityFilter === "all" || activeActivityFilter === "aspirations";
  const filteredNotifications =
    activeActivityFilter === "all" || activeActivityFilter === "notifications";
  const reflectionPrompt =
    summary.unfinishedDrafts.length > 0
      ? "You have drafts waiting. Add one thoughtful paragraph to move them forward today."
      : "Take one minute to reflect: what moment today made you feel grateful or hopeful?";
  const completionWidth = `${summary.profileCompletion.percent}%`;
  return (
    <main id="main-content" className="min-h-screen bg-dawn dark:bg-[#0F1419]">
      {" "}
      <section className="aurora-accent bg-midnight dark:bg-night text-dawn py-10 sm:py-14">
        {" "}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <p className="text-xs uppercase tracking-[0.2em] text-golden font-semibold">
            Dashboard
          </p>{" "}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            {" "}
            Welcome, {summary.user.displayName}{" "}
          </h1>{" "}
          <p className="mt-3 text-dawn/75 max-w-2xl">
            {" "}
            Your calm space for progress, reflection, and community growth.{" "}
          </p>{" "}
          <AutoDismissAlert
            tone="success"
            message={showWelcome ? "Onboarding complete. Your dashboard is now personalized." : undefined}
            className="mt-5"
          />{" "}
          {isRefreshing ? (
            <div
              className="mt-3 text-xs text-dawn/80"
              role="status"
              aria-live="polite"
            >
              {" "}
              Refreshing dashboard insights...{" "}
            </div>
          ) : null}{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-8 sm:py-10">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bento-grid">
          <AutoDismissAlert
            tone="error"
            message={actionData?.error}
            className="bento-full"
          />
          <AutoDismissAlert
            tone="success"
            message={actionData?.success}
            className="bento-full"
          />
          {" "}
          <article className="bento-card bento-md">
            {" "}
            <h2 className="font-heading text-xl text-midnight dark:text-dawn">
              Profile completion
            </h2>{" "}
            <p className="mt-2 text-sm text-night/70 dark:text-dawn/70">
              {" "}
              {summary.profileCompletion.completedFields} of{" "}
              {summary.profileCompletion.totalFields} profile signals
              completed.{" "}
            </p>{" "}
            <div
              className="mt-4 h-3 rounded-full bg-mist dark:bg-white/10 overflow-hidden"
              aria-hidden="true"
            >
              {" "}
              <div
                className="h-full bg-golden transition-all duration-500"
                style={{ width: completionWidth }}
              />{" "}
            </div>{" "}
            <p className="mt-2 text-xs text-night/60 dark:text-dawn/60">
              {summary.profileCompletion.percent}% complete
            </p>{" "}
            <Link
              to="/profile/settings"
              className="mt-5 m3-btn-filled min-h-[44px] w-full text-sm"
            >
              {" "}
              Edit profile{" "}
            </Link>{" "}
          </article>{" "}
          <section
            className="bento-card-featured bento-xl"
            aria-labelledby="engagement-summary-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {" "}
              <h2
                id="engagement-summary-heading"
                className="font-heading text-xl text-midnight dark:text-dawn"
              >
                Engagement summary
              </h2>{" "}
              <div className="flex flex-wrap items-center gap-2">
                {" "}
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (searchParams.get("range") === option.value) {
                        return;
                      }

                      const next = new URLSearchParams(searchParams);
                      next.set("range", option.value);
                      setSearchParams(next, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                    className={`m3-chip ${range === option.value ? "is-selected" : ""}`}
                    aria-pressed={range === option.value}
                  >
                    {" "}
                    {option.label}{" "}
                  </button>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">
                  Draft stories
                </p>{" "}
                <p className="bento-stat-value">
                  {summary.storyStats.draft}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">
                  Published stories
                </p>{" "}
                <p className="bento-stat-value">
                  {summary.storyStats.published}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">
                  Reactions ({range})
                </p>{" "}
                <p className="bento-stat-value">
                  {summary.storyStats.reactions}
                </p>{" "}
              </article>{" "}
            </div>{" "}
          </section>{" "}
          <section
            className="bento-card bento-xl"
            aria-labelledby="aspiration-summary-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <h2
              id="aspiration-summary-heading"
              className="font-heading text-xl text-midnight dark:text-dawn"
            >
              Aspirations summary
            </h2>{" "}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">Pending</p>{" "}
                <p className="bento-stat-value text-lg">
                  {summary.aspirations.pending}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">In progress</p>{" "}
                <p className="bento-stat-value text-lg">
                  {summary.aspirations.inProgress}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">Achieved</p>{" "}
                <p className="bento-stat-value text-lg">
                  {summary.aspirations.achieved}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">Granted</p>{" "}
                <p className="bento-stat-value text-lg">
                  {summary.aspirations.granted}
                </p>{" "}
              </article>{" "}
              <article className="bento-stat">
                {" "}
                <p className="bento-stat-label">Transformed</p>{" "}
                <p className="bento-stat-value text-lg">
                  {summary.aspirations.transformed}
                </p>{" "}
              </article>{" "}
            </div>{" "}
          </section>{" "}
          <aside className="bento-card bento-md">
            {" "}
            <h2 className="font-heading text-xl text-midnight dark:text-dawn">
              Quick actions
            </h2>{" "}
            <div className="mt-4 grid gap-2">
              {" "}
              <Link
                to="/stories/new"
                className="m3-btn-filled min-h-[44px] text-sm"
              >
                {" "}
                Share story{" "}
              </Link>{" "}
              <Link
                to="/aspirations/new"
                className="m3-btn-tonal min-h-[44px] text-sm"
              >
                {" "}
                Add aspiration{" "}
              </Link>{" "}
              <Link
                to="/profile/settings"
                className="m3-btn-outlined min-h-[44px] text-sm"
              >
                {" "}
                Edit profile{" "}
              </Link>{" "}
              <Link
                to="/profile/settings#preferences"
                className="m3-btn-outlined min-h-[44px] text-sm"
              >
                {" "}
                Preferences{" "}
              </Link>{" "}
              <Link
                to="/notifications"
                className="m3-btn-outlined min-h-[44px] text-sm"
              >
                Notifications inbox
              </Link>{" "}
            </div>{" "}
          </aside>{" "}
          <section
            className="bento-card bento-full"
            aria-labelledby="activity-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {" "}
              <h2
                id="activity-heading"
                className="font-heading text-xl text-midnight dark:text-dawn"
              >
                Recent activity
              </h2>{" "}
              <div className="flex flex-wrap gap-2">
                {" "}
                {ACTIVITY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      if (searchParams.get("activity") === filter.value) {
                        return;
                      }

                      const next = new URLSearchParams(searchParams);
                      next.set("activity", filter.value);
                      setSearchParams(next, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                    className={`m3-chip ${activeActivityFilter === filter.value ? "is-selected" : ""}`}
                    aria-pressed={activeActivityFilter === filter.value}
                  >
                    {" "}
                    {filter.label}{" "}
                  </button>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {" "}
              {filteredStories ? (
                <section
                  className="rounded-xl border border-midnight/10 dark:border-white/10 p-4"
                  aria-labelledby="recent-story-list-heading"
                >
                  {" "}
                  <h3
                    id="recent-story-list-heading"
                    className="text-sm font-semibold text-midnight dark:text-dawn"
                  >
                    Stories
                  </h3>{" "}
                  {summary.recentStories.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60 dark:text-dawn/60" role="status">
                      No stories yet. Share your first story to see it here.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.recentStories.map((story) => (
                        <li
                          key={story.id}
                          className="rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                        >
                          {" "}
                          <p className="text-sm font-medium text-midnight dark:text-dawn">
                            {story.title}
                          </p>{" "}
                          <p className="mt-1 text-xs text-night/60 dark:text-dawn/60">
                            {story.status} | updated{" "}
                            {formatDate(story.updatedAt)}
                          </p>{" "}
                        </li>
                      ))}{" "}
                    </ul>
                  )}{" "}
                </section>
              ) : null}{" "}
              {filteredAspirations ? (
                <section
                  className="rounded-xl border border-midnight/10 dark:border-white/10 p-4"
                  aria-labelledby="recent-aspiration-list-heading"
                >
                  {" "}
                  <h3
                    id="recent-aspiration-list-heading"
                    className="text-sm font-semibold text-midnight dark:text-dawn"
                  >
                    Aspirations
                  </h3>{" "}
                  {summary.recentAspirations.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60 dark:text-dawn/60" role="status">
                      No aspirations yet. Add your first aspiration to track progress.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.recentAspirations.map((aspiration) => (
                        <li
                          key={aspiration.id}
                          className="rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                        >
                          {" "}
                          <p className="text-sm font-medium text-midnight dark:text-dawn">
                            {aspiration.title}
                          </p>{" "}
                          <p className="mt-1 text-xs text-night/60 dark:text-dawn/60">
                            {aspiration.status} | updated{" "}
                            {formatDate(aspiration.updatedAt)}
                          </p>{" "}
                        </li>
                      ))}{" "}
                    </ul>
                  )}{" "}
                </section>
              ) : null}{" "}
              {filteredNotifications ? (
                <section
                  className="rounded-xl border border-midnight/10 dark:border-white/10 p-4"
                  aria-labelledby="notification-preview-heading"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      id="notification-preview-heading"
                      className="text-sm font-semibold text-midnight dark:text-dawn"
                    >
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/notifications"
                        className="min-h-[44px] inline-flex items-center rounded-lg border border-midnight/15 dark:border-white/15 px-3 py-2 text-xs font-semibold text-midnight dark:text-dawn hover:bg-surface dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      >
                        Open inbox
                      </Link>

                      {summary.notifications.some((notification) => !notification.isRead) ? (
                        <div className="rounded-lg border border-midnight/15 dark:border-white/15 bg-white dark:bg-night p-1.5">
                          <button
                            type="button"
                            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-midnight dark:text-dawn hover:bg-surface dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                            onClick={() => setPendingDashboardReadAll((current) => !current)}
                            aria-expanded={pendingDashboardReadAll}
                            aria-controls="dashboard-confirm-mark-all-read"
                          >
                            <ReadAllIcon />
                            Mark all read
                          </button>

                          <div
                            id="dashboard-confirm-mark-all-read"
                            className={`overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
                              pendingDashboardReadAll ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="rounded-md border border-golden/35 bg-golden/10 dark:bg-golden/5 px-2 py-2">
                              <p className="text-[11px] text-midnight dark:text-dawn/90">
                                Mark all unread dashboard notifications as read?
                              </p>
                              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  className="min-h-[32px] rounded-md border border-golden/45 bg-white dark:bg-night px-2 text-[11px] font-semibold text-midnight dark:text-dawn hover:bg-surface dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                  onClick={() => setPendingDashboardReadAll(false)}
                                >
                                  Cancel
                                </button>
                                <Form method="post">
                                  <input type="hidden" name="intent" value="mark-all-notifications-read" />
                                  <button
                                    type="submit"
                                    className="min-h-[32px] rounded-md bg-midnight dark:bg-golden px-2 text-[11px] font-semibold text-white dark:text-midnight hover:bg-midnight-hover dark:hover:bg-golden/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                    disabled={isSubmittingNotificationAction}
                                    aria-busy={isSubmittingNotificationAction}
                                    onClick={() => setPendingDashboardReadAll(false)}
                                  >
                                    Continue
                                  </button>
                                </Form>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {summary.notifications.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60 dark:text-dawn/60" role="status">
                      No notifications yet. Activity will appear here as it happens.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className="rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-midnight dark:text-dawn">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs text-night/60 dark:text-dawn/60">
                                {formatDate(notification.createdAt)}
                              </p>
                              <p className="mt-1 text-[11px] text-night/60 dark:text-dawn/60">
                                {notification.isRead ? "Read" : "Unread"}
                              </p>
                            </div>

                            {!notification.isRead ? (
                              <Form method="post">
                                <input type="hidden" name="intent" value="mark-notification-read" />
                                <input type="hidden" name="notificationId" value={notification.id} />
                                <button
                                  type="submit"
                                  className="min-h-[44px] rounded-lg border border-midnight/15 dark:border-white/15 px-3 py-2 text-xs font-semibold text-midnight dark:text-dawn hover:bg-surface dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                  disabled={isSubmittingNotificationAction}
                                  aria-label={`Mark notification ${notification.title} as read`}
                                  aria-busy={isSubmittingNotificationAction}
                                >
                                  Mark read
                                </button>
                              </Form>
                            ) : null}
                          </div>
                        </li>
                      ))}{" "}
                    </ul>
                  )}{" "}
                </section>
              ) : null}{" "}
            </div>{" "}
          </section>{" "}
          <section
            className="bento-card-featured bento-xl"
            aria-labelledby="growth-hooks-heading"
          >
            {" "}
            <h2
              id="growth-hooks-heading"
              className="font-heading text-xl text-midnight dark:text-dawn"
            >
              Community and growth hooks
            </h2>{" "}
            <p className="mt-2 text-sm text-night/70 dark:text-dawn/70">
              Gentle, non-addictive nudges to keep your journey meaningful.
            </p>{" "}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {" "}
              <article className="rounded-xl border border-midnight/10 dark:border-white/10 p-4">
                {" "}
                <h3 className="text-sm font-semibold text-midnight dark:text-dawn">
                  Suggested people
                </h3>{" "}
                {suggestions.people.length === 0 ? (
                  <p className="mt-2 text-xs text-night/60 dark:text-dawn/60" role="status">
                    Add interests to unlock suggestions.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2" role="list">
                    {" "}
                    {suggestions.people.map((person) => (
                      <li
                        key={person.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                      >
                        {" "}
                        <div>
                          {" "}
                          <p className="text-sm font-medium text-midnight dark:text-dawn">
                            {person.displayName}
                          </p>{" "}
                          <p className="text-xs text-night/60 dark:text-dawn/60">
                            @{person.username}
                          </p>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/u/${person.username}`}
                            className="min-h-[44px] inline-flex items-center rounded-lg border border-midnight/15 px-2 py-1 text-xs font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                          >
                            View
                          </Link>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="intent"
                              value={person.isFollowing ? "unfollow-user" : "follow-user"}
                            />
                            <input type="hidden" name="targetUserId" value={person.id} />
                            <button
                              type="submit"
                              className="min-h-[44px] rounded-lg border border-midnight/15 px-2 py-1 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                              disabled={isSubmittingRelationshipAction}
                              aria-busy={isSubmittingRelationshipAction}
                              aria-label={`${person.isFollowing ? "Unfollow" : "Follow"} ${person.displayName}`}
                            >
                              {person.isFollowing ? "Following" : "Follow"}
                            </button>
                          </Form>
                        </div>
                      </li>
                    ))}{" "}
                  </ul>
                )}{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 dark:border-white/10 p-4">
                {" "}
                <h3 className="text-sm font-semibold text-midnight dark:text-dawn">
                  Suggested circles
                </h3>{" "}
                {suggestions.circles.length === 0 ? (
                  <p className="mt-2 text-xs text-night/60 dark:text-dawn/60" role="status">
                    No circle suggestions yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2" role="list">
                    {" "}
                    {suggestions.circles.map((circle) => (
                      <li
                        key={circle.id}
                        className="rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-midnight dark:text-dawn">
                              {circle.name}
                            </p>
                            <p className="mt-1 text-xs text-night/60 dark:text-dawn/60">
                              {circle.memberCount} members
                            </p>
                          </div>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="intent"
                              value={circle.isMember ? "leave-circle" : "join-circle"}
                            />
                            <input type="hidden" name="circleId" value={circle.id} />
                            <button
                              type="submit"
                              className="min-h-[44px] rounded-lg border border-midnight/15 px-3 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                              disabled={isSubmittingRelationshipAction}
                              aria-busy={isSubmittingRelationshipAction}
                              aria-label={`${circle.isMember ? "Leave" : "Join"} circle ${circle.name}`}
                            >
                              {circle.isMember ? "Member" : "Join"}
                            </button>
                          </Form>
                        </div>
                      </li>
                    ))}{" "}
                  </ul>
                )}{" "}
              </article>{" "}
            </div>{" "}
            <article className="mt-4 rounded-xl border border-midnight/10 dark:border-white/10 bg-surface dark:bg-white/5 p-4">
              {" "}
              <h3 className="text-sm font-semibold text-midnight dark:text-dawn">
                Reflection prompt
              </h3>{" "}
              <p className="mt-2 text-sm text-night/75 dark:text-dawn/75">{reflectionPrompt}</p>{" "}
              {summary.unfinishedDrafts.length > 0 ? (
                <p className="mt-2 text-xs text-night/60 dark:text-dawn/60">
                  {" "}
                  Gentle nudge: {summary.unfinishedDrafts.length} unfinished
                  draft(s) waiting.{" "}
                </p>
              ) : (
                <p className="mt-2 text-xs text-night/60 dark:text-dawn/60">
                  No unfinished drafts right now.
                </p>
              )}{" "}
            </article>{" "}
          </section>{" "}
          <section
            className="bento-card bento-md bento-tall"
            aria-labelledby="badge-summary-heading"
          >
            {" "}
            <h2
              id="badge-summary-heading"
              className="font-heading text-xl text-midnight dark:text-dawn"
            >
              Badges and milestones
            </h2>{" "}
            {summary.badges.length === 0 ? (
              <p className="mt-3 text-sm text-night/70 dark:text-dawn/70" role="status">
                Badges will appear as you engage positively with the community.
              </p>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {" "}
                {summary.badges.map((badgeEntry) => (
                  <li
                    key={`${badgeEntry.badge.slug}-${badgeEntry.earnedAt.toString()}`}
                    className="rounded-lg border border-midnight/10 dark:border-white/10 px-3 py-2"
                  >
                    {" "}
                    <p className="text-sm font-semibold text-midnight dark:text-dawn">
                      {badgeEntry.badge.name}
                    </p>{" "}
                    <p className="mt-1 text-xs text-night/60 dark:text-dawn/60">
                      {badgeEntry.badge.points} pts | earned{" "}
                      {formatDate(badgeEntry.earnedAt)}
                    </p>{" "}
                  </li>
                ))}{" "}
              </ul>
            )}{" "}
          </section>{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
export function ErrorBoundary() {
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {" "}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <AutoDismissAlert
          tone="error"
          message="We could not load your dashboard right now."
          timeoutMs={10000}
        />
        <div className="mt-4 rounded-2xl border border-midnight/10 bg-white px-5 py-4 text-midnight">
          <h1 className="font-heading text-2xl">Dashboard error state</h1>
          <Link
            to="/discover"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-midnight/20 px-3 py-2 text-sm font-semibold hover:bg-surface"
          >
            Back to discover
          </Link>
        </div>
      </section>{" "}
    </main>
  );
}
