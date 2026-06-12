import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";
import {
  getDashboardSummary,
  getSuggestedFollows,
  type EngagementRange,
} from "~/utils/users.server";
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
  const { summary, suggestions, showWelcome, activityFilter, range } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const filteredStories =
    activityFilter === "all" || activityFilter === "stories";
  const filteredAspirations =
    activityFilter === "all" || activityFilter === "aspirations";
  const filteredNotifications =
    activityFilter === "all" || activityFilter === "notifications";
  const reflectionPrompt =
    summary.unfinishedDrafts.length > 0
      ? "You have drafts waiting. Add one thoughtful paragraph to move them forward today."
      : "Take one minute to reflect: what moment today made you feel grateful or hopeful?";
  const completionWidth = `${summary.profileCompletion.percent}%`;
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {" "}
      <section className="bg-midnight text-dawn py-10 sm:py-14">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <p className="text-xs uppercase tracking-[0.2em] text-golden font-semibold">
            Phase 3
          </p>{" "}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            {" "}
            Welcome, {summary.user.displayName}{" "}
          </h1>{" "}
          <p className="mt-3 text-dawn/75 max-w-2xl">
            {" "}
            This is your calm home for progress, reflection, and community
            growth.{" "}
          </p>{" "}
          {showWelcome ? (
            <div
              className="mt-5 rounded-xl border border-golden/40 bg-white/95 text-midnight px-4 py-3"
              role="status"
              aria-live="polite"
            >
              {" "}
              Onboarding complete. Your dashboard is now personalized.{" "}
            </div>
          ) : null}{" "}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-5 lg:grid-cols-3">
          {actionData?.error ? (
            <div
              className="lg:col-span-3 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
              role="alert"
              aria-live="polite"
            >
              {actionData.error}
            </div>
          ) : null}
          {actionData?.success ? (
            <div
              className="lg:col-span-3 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest"
              role="status"
              aria-live="polite"
            >
              {actionData.success}
            </div>
          ) : null}
          {" "}
          <article className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-1">
            {" "}
            <h2 className="font-heading text-xl text-midnight">
              Profile completion
            </h2>{" "}
            <p className="mt-2 text-sm text-night/70">
              {" "}
              {summary.profileCompletion.completedFields} of{" "}
              {summary.profileCompletion.totalFields} profile signals
              completed.{" "}
            </p>{" "}
            <div
              className="mt-4 h-3 rounded-full bg-mist overflow-hidden"
              aria-hidden="true"
            >
              {" "}
              <div
                className="h-full bg-golden"
                style={{ width: completionWidth }}
              />{" "}
            </div>{" "}
            <p className="mt-2 text-xs text-night/60">
              {summary.profileCompletion.percent}% complete
            </p>{" "}
            <Link
              to="/profile/settings"
              className="mt-5 btn-primary min-h-[44px] inline-flex w-full items-center justify-center text-sm"
            >
              {" "}
              Edit profile{" "}
            </Link>{" "}
          </article>{" "}
          <section
            className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-2"
            aria-labelledby="engagement-summary-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {" "}
              <h2
                id="engagement-summary-heading"
                className="font-heading text-xl text-midnight"
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
                      const next = new URLSearchParams(searchParams);
                      next.set("range", option.value);
                      setSearchParams(next);
                    }}
                    className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${range === option.value ? "bg-midnight text-white" : "bg-surface text-midnight hover:bg-mist"}`}
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
              <article className="rounded-xl border border-midnight/10 p-4">
                {" "}
                <p className="text-xs uppercase tracking-wide text-night/60">
                  Draft stories
                </p>{" "}
                <p className="mt-1 text-2xl font-bold text-midnight">
                  {summary.storyStats.draft}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-4">
                {" "}
                <p className="text-xs uppercase tracking-wide text-night/60">
                  Published stories
                </p>{" "}
                <p className="mt-1 text-2xl font-bold text-midnight">
                  {summary.storyStats.published}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-4">
                {" "}
                <p className="text-xs uppercase tracking-wide text-night/60">
                  Reactions ({range})
                </p>{" "}
                <p className="mt-1 text-2xl font-bold text-midnight">
                  {summary.storyStats.reactions}
                </p>{" "}
              </article>{" "}
            </div>{" "}
          </section>{" "}
          <section
            className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-2"
            aria-labelledby="aspiration-summary-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <h2
              id="aspiration-summary-heading"
              className="font-heading text-xl text-midnight"
            >
              Aspirations summary
            </h2>{" "}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {" "}
              <article className="rounded-xl border border-midnight/10 p-3">
                {" "}
                <p className="text-xs text-night/60">Pending</p>{" "}
                <p className="text-lg font-bold text-midnight">
                  {summary.aspirations.pending}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-3">
                {" "}
                <p className="text-xs text-night/60">In progress</p>{" "}
                <p className="text-lg font-bold text-midnight">
                  {summary.aspirations.inProgress}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-3">
                {" "}
                <p className="text-xs text-night/60">Achieved</p>{" "}
                <p className="text-lg font-bold text-midnight">
                  {summary.aspirations.achieved}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-3">
                {" "}
                <p className="text-xs text-night/60">Granted</p>{" "}
                <p className="text-lg font-bold text-midnight">
                  {summary.aspirations.granted}
                </p>{" "}
              </article>{" "}
              <article className="rounded-xl border border-midnight/10 p-3">
                {" "}
                <p className="text-xs text-night/60">Transformed</p>{" "}
                <p className="text-lg font-bold text-midnight">
                  {summary.aspirations.transformed}
                </p>{" "}
              </article>{" "}
            </div>{" "}
          </section>{" "}
          <aside className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-1">
            {" "}
            <h2 className="font-heading text-xl text-midnight">
              Quick actions
            </h2>{" "}
            <div className="mt-4 grid gap-2">
              {" "}
              <Link
                to="/stories/new"
                className="btn-primary min-h-[44px] inline-flex items-center justify-center text-sm"
              >
                {" "}
                Share story{" "}
              </Link>{" "}
              <Link
                to="/aspirations/new"
                className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                {" "}
                Add aspiration{" "}
              </Link>{" "}
              <Link
                to="/profile/settings"
                className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                {" "}
                Edit profile{" "}
              </Link>{" "}
              <Link
                to="/notifications"
                className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Notifications inbox
              </Link>{" "}
            </div>{" "}
          </aside>{" "}
          <section
            className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-3"
            aria-labelledby="activity-heading"
            aria-busy={isRefreshing}
          >
            {" "}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {" "}
              <h2
                id="activity-heading"
                className="font-heading text-xl text-midnight"
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
                      const next = new URLSearchParams(searchParams);
                      next.set("activity", filter.value);
                      setSearchParams(next);
                    }}
                    className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${activityFilter === filter.value ? "bg-midnight text-white" : "bg-surface text-midnight hover:bg-mist"}`}
                    aria-pressed={activityFilter === filter.value}
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
                  className="rounded-xl border border-midnight/10 p-4"
                  aria-labelledby="recent-story-list-heading"
                >
                  {" "}
                  <h3
                    id="recent-story-list-heading"
                    className="text-sm font-semibold text-midnight"
                  >
                    Stories
                  </h3>{" "}
                  {summary.recentStories.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60" role="status">
                      Empty state: no stories yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.recentStories.map((story) => (
                        <li
                          key={story.id}
                          className="rounded-lg border border-midnight/10 px-3 py-2"
                        >
                          {" "}
                          <p className="text-sm font-medium text-midnight">
                            {story.title}
                          </p>{" "}
                          <p className="mt-1 text-xs text-night/60">
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
                  className="rounded-xl border border-midnight/10 p-4"
                  aria-labelledby="recent-aspiration-list-heading"
                >
                  {" "}
                  <h3
                    id="recent-aspiration-list-heading"
                    className="text-sm font-semibold text-midnight"
                  >
                    Aspirations
                  </h3>{" "}
                  {summary.recentAspirations.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60" role="status">
                      Empty state: no aspirations yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.recentAspirations.map((aspiration) => (
                        <li
                          key={aspiration.id}
                          className="rounded-lg border border-midnight/10 px-3 py-2"
                        >
                          {" "}
                          <p className="text-sm font-medium text-midnight">
                            {aspiration.title}
                          </p>{" "}
                          <p className="mt-1 text-xs text-night/60">
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
                  className="rounded-xl border border-midnight/10 p-4"
                  aria-labelledby="notification-preview-heading"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3
                      id="notification-preview-heading"
                      className="text-sm font-semibold text-midnight"
                    >
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/notifications"
                        className="min-h-[44px] inline-flex items-center rounded-lg border border-midnight/15 px-3 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      >
                        Open inbox
                      </Link>

                      {summary.notifications.some((notification) => !notification.isRead) ? (
                        <Form method="post">
                          <input type="hidden" name="intent" value="mark-all-notifications-read" />
                          <button
                            type="submit"
                            className="min-h-[44px] rounded-lg border border-midnight/15 px-3 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                            disabled={isSubmittingNotificationAction}
                            aria-busy={isSubmittingNotificationAction}
                          >
                            Mark all read
                          </button>
                        </Form>
                      ) : null}
                    </div>
                  </div>

                  {summary.notifications.length === 0 ? (
                    <p className="mt-2 text-xs text-night/60" role="status">
                      Empty state: no notifications yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2" role="list">
                      {" "}
                      {summary.notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className="rounded-lg border border-midnight/10 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-midnight">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-xs text-night/60">
                                {formatDate(notification.createdAt)}
                              </p>
                              <p className="mt-1 text-[11px] text-night/60">
                                {notification.isRead ? "Read" : "Unread"}
                              </p>
                            </div>

                            {!notification.isRead ? (
                              <Form method="post">
                                <input type="hidden" name="intent" value="mark-notification-read" />
                                <input type="hidden" name="notificationId" value={notification.id} />
                                <button
                                  type="submit"
                                  className="min-h-[44px] rounded-lg border border-midnight/15 px-3 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
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
            className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-2"
            aria-labelledby="growth-hooks-heading"
          >
            {" "}
            <h2
              id="growth-hooks-heading"
              className="font-heading text-xl text-midnight"
            >
              Community and growth hooks
            </h2>{" "}
            <p className="mt-2 text-sm text-night/70">
              Gentle, non-addictive nudges to keep your journey meaningful.
            </p>{" "}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {" "}
              <article className="rounded-xl border border-midnight/10 p-4">
                {" "}
                <h3 className="text-sm font-semibold text-midnight">
                  Suggested people
                </h3>{" "}
                {suggestions.people.length === 0 ? (
                  <p className="mt-2 text-xs text-night/60" role="status">
                    Empty state: add interests to unlock suggestions.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2" role="list">
                    {" "}
                    {suggestions.people.map((person) => (
                      <li
                        key={person.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-midnight/10 px-3 py-2"
                      >
                        {" "}
                        <div>
                          {" "}
                          <p className="text-sm font-medium text-midnight">
                            {person.displayName}
                          </p>{" "}
                          <p className="text-xs text-night/60">
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
              <article className="rounded-xl border border-midnight/10 p-4">
                {" "}
                <h3 className="text-sm font-semibold text-midnight">
                  Suggested circles
                </h3>{" "}
                {suggestions.circles.length === 0 ? (
                  <p className="mt-2 text-xs text-night/60" role="status">
                    Empty state: no circle suggestions yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2" role="list">
                    {" "}
                    {suggestions.circles.map((circle) => (
                      <li
                        key={circle.id}
                        className="rounded-lg border border-midnight/10 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-midnight">
                              {circle.name}
                            </p>
                            <p className="mt-1 text-xs text-night/60">
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
            <article className="mt-4 rounded-xl border border-midnight/10 bg-surface p-4">
              {" "}
              <h3 className="text-sm font-semibold text-midnight">
                Reflection prompt
              </h3>{" "}
              <p className="mt-2 text-sm text-night/75">{reflectionPrompt}</p>{" "}
              {summary.unfinishedDrafts.length > 0 ? (
                <p className="mt-2 text-xs text-night/60">
                  {" "}
                  Gentle nudge: {summary.unfinishedDrafts.length} unfinished
                  draft(s) waiting.{" "}
                </p>
              ) : (
                <p className="mt-2 text-xs text-night/60">
                  No unfinished drafts right now.
                </p>
              )}{" "}
            </article>{" "}
          </section>{" "}
          <section
            className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-1"
            aria-labelledby="badge-summary-heading"
          >
            {" "}
            <h2
              id="badge-summary-heading"
              className="font-heading text-xl text-midnight"
            >
              Badges and milestones
            </h2>{" "}
            {summary.badges.length === 0 ? (
              <p className="mt-3 text-sm text-night/70" role="status">
                Empty state: badges will appear as you engage positively.
              </p>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {" "}
                {summary.badges.map((badgeEntry) => (
                  <li
                    key={`${badgeEntry.badge.slug}-${badgeEntry.earnedAt.toString()}`}
                    className="rounded-lg border border-midnight/10 px-3 py-2"
                  >
                    {" "}
                    <p className="text-sm font-semibold text-midnight">
                      {badgeEntry.badge.name}
                    </p>{" "}
                    <p className="mt-1 text-xs text-night/60">
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
        {" "}
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-5 py-4 text-[#7C2D12]">
          {" "}
          <h1 className="font-heading text-2xl">Dashboard error state</h1>{" "}
          <p className="mt-2 text-sm">
            We could not load your dashboard right now.
          </p>{" "}
          <Link
            to="/discover"
            className="mt-4 inline-flex rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
          >
            {" "}
            Back to discover{" "}
          </Link>{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
