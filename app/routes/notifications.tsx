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

type ActionData = {
  error?: string;
  success?: string;
};

type ViewFilter = "all" | "unread";
type TypeFilter =
  | "all"
  | "NEW_FOLLOWER"
  | "STORY_REACTION"
  | "STORY_COMMENT"
  | "ASPIRATION_SUPPORT"
  | "STORY_MILESTONE"
  | "AI_SUGGESTION"
  | "COMMUNITY_UPDATE"
  | "MESSAGE"
  | "MENTION";

const PAGE_SIZE = 12;

const typeLabels: Record<TypeFilter, string> = {
  all: "All types",
  NEW_FOLLOWER: "New followers",
  STORY_REACTION: "Story reactions",
  STORY_COMMENT: "Story comments",
  ASPIRATION_SUPPORT: "Aspiration support",
  STORY_MILESTONE: "Milestones",
  AI_SUGGESTION: "AI suggestions",
  COMMUNITY_UPDATE: "Community updates",
  MESSAGE: "Messages",
  MENTION: "Mentions",
};

function parsePage(input: string | null) {
  const parsed = Number(input ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function parseView(input: string | null): ViewFilter {
  if (input === "unread") {
    return "unread";
  }

  return "all";
}

function parseType(input: string | null): TypeFilter {
  if (
    input === "NEW_FOLLOWER" ||
    input === "STORY_REACTION" ||
    input === "STORY_COMMENT" ||
    input === "ASPIRATION_SUPPORT" ||
    input === "STORY_MILESTONE" ||
    input === "AI_SUGGESTION" ||
    input === "COMMUNITY_UPDATE" ||
    input === "MESSAGE" ||
    input === "MENTION"
  ) {
    return input;
  }

  return "all";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export const meta: MetaFunction = () => {
  return [
    { title: "Notifications | PaTan" },
    {
      name: "description",
      content:
        "Review notifications, apply filters, and mark updates as read across your PaTan activity.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);

  const page = parsePage(url.searchParams.get("page"));
  const view = parseView(url.searchParams.get("view"));
  const type = parseType(url.searchParams.get("type"));

  const where = {
    userId: sessionUser.id,
    ...(view === "unread" ? { isRead: false } : {}),
    ...(type === "all" ? {} : { type }),
  };

  const [totalCount, unreadCount, groupedCounts, notifications] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({
      where: {
        userId: sessionUser.id,
        isRead: false,
      },
    }),
    db.notification.groupBy({
      by: ["type"],
      where: {
        userId: sessionUser.id,
      },
      _count: {
        type: true,
      },
    }),
    db.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        isRead: true,
        createdAt: true,
        resourceId: true,
        resourceType: true,
        actor: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    }),
  ]);

  const typeCounts = groupedCounts.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = item._count.type;
    return acc;
  }, {});

  return {
    page,
    view,
    type,
    totalCount,
    unreadCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    typeCounts,
    notifications,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();

  const intent = String(formData.get("intent") ?? "").trim();
  const notificationId = String(formData.get("notificationId") ?? "").trim();
  const currentView = parseView(String(formData.get("view") ?? "all"));
  const currentType = parseType(String(formData.get("type") ?? "all"));

  if (intent === "mark-read") {
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

  if (intent === "mark-all-read" || intent === "mark-filter-read") {
    const result = await db.notification.updateMany({
      where: {
        userId: sessionUser.id,
        isRead: false,
        ...(intent === "mark-filter-read" && currentType !== "all" ? { type: currentType } : {}),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (result.count === 0) {
      return { success: "No unread notifications to update." } satisfies ActionData;
    }

    return {
      success:
        intent === "mark-all-read"
          ? `Marked ${result.count} notifications as read.`
          : `Marked ${result.count} filtered notifications as read.`,
    } satisfies ActionData;
  }

  return { error: "Unsupported notification action." } satisfies ActionData;
}

export default function NotificationsRoute() {
  const {
    page,
    view,
    type,
    totalCount,
    unreadCount,
    totalPages,
    typeCounts,
    notifications,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSubmitting = navigation.state === "submitting";

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-10 sm:py-14" aria-labelledby="notifications-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 id="notifications-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Notifications
          </h1>
          <p className="mt-3 text-dawn/75 max-w-2xl">
            Track followers, comments, support activity, and milestone updates in one place.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-dawn/85">
            <span>{totalCount} in this view</span>
            <span aria-hidden="true">|</span>
            <span>{unreadCount} unread total</span>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {actionData?.error ? (
            <p className="mb-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]" role="alert" aria-live="polite">
              {actionData.error}
            </p>
          ) : null}

          {actionData?.success ? (
            <p className="mb-4 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest" role="status" aria-live="polite">
              {actionData.success}
            </p>
          ) : null}

          <section className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm" aria-label="Notification filters">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="notif-view" className="block text-sm font-medium text-night">
                  Visibility
                </label>
                <select
                  id="notif-view"
                  value={view}
                  onChange={(event) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("view", event.target.value);
                    next.set("page", "1");
                    setSearchParams(next);
                  }}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
                >
                  <option value="all">All notifications</option>
                  <option value="unread">Unread only</option>
                </select>
              </div>

              <div>
                <label htmlFor="notif-type" className="block text-sm font-medium text-night">
                  Type
                </label>
                <select
                  id="notif-type"
                  value={type}
                  onChange={(event) => {
                    const next = new URLSearchParams(searchParams);
                    next.set("type", event.target.value);
                    next.set("page", "1");
                    setSearchParams(next);
                  }}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
                >
                  {(Object.keys(typeLabels) as TypeFilter[]).map((key) => (
                    <option key={key} value={key}>
                      {typeLabels[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Form method="post">
                  <input type="hidden" name="intent" value="mark-filter-read" />
                  <input type="hidden" name="view" value={view} />
                  <input type="hidden" name="type" value={type} />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-xl border border-midnight/15 px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    Mark filtered read
                  </button>
                </Form>

                <Form method="post">
                  <input type="hidden" name="intent" value="mark-all-read" />
                  <button
                    type="submit"
                    className="btn-primary min-h-[44px]"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    Mark all read
                  </button>
                </Form>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Notification type counts">
              {(Object.keys(typeLabels) as TypeFilter[])
                .filter((key) => key !== "all")
                .map((key) => (
                  <span key={key} className="inline-flex rounded-full bg-mist/40 px-3 py-1 text-xs font-medium text-night/75">
                    {typeLabels[key]}: {typeCounts[key] ?? 0}
                  </span>
                ))}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm" aria-labelledby="notification-list-heading">
            <h2 id="notification-list-heading" className="font-heading text-xl text-midnight">
              Recent notifications
            </h2>

            {notifications.length === 0 ? (
              <p className="mt-4 text-sm text-night/70" role="status">
                No notifications match your current filters.
              </p>
            ) : (
              <ul className="mt-4 space-y-3" role="list">
                {notifications.map((notification) => (
                  <li key={notification.id} className="rounded-xl border border-midnight/10 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-midnight">{notification.title}</p>
                        {notification.body ? (
                          <p className="mt-1 text-sm text-night/75">{notification.body}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-night/60">
                          {typeLabels[notification.type as TypeFilter] ?? notification.type} | {formatDate(notification.createdAt)}
                        </p>
                        {notification.actor ? (
                          <p className="mt-1 text-xs text-night/60">
                            From {notification.actor.displayName} (@{notification.actor.username})
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {notification.resourceType === "aspiration" && notification.resourceId ? (
                          <Link
                            to={`/aspirations/${notification.resourceId}`}
                            className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-3 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                          >
                            Open
                          </Link>
                        ) : notification.resourceType === "story" && notification.resourceId ? (
                          <Link
                            to={`/stories/${notification.resourceId}`}
                            className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-3 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                          >
                            Open
                          </Link>
                        ) : null}

                        {!notification.isRead ? (
                          <Form method="post">
                            <input type="hidden" name="intent" value="mark-read" />
                            <input type="hidden" name="notificationId" value={notification.id} />
                            <button
                              type="submit"
                              className="min-h-[44px] rounded-xl border border-golden/40 px-3 py-2 text-sm font-semibold text-midnight hover:bg-[#FFF7E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                              disabled={isSubmitting}
                              aria-busy={isSubmitting}
                            >
                              Mark read
                            </button>
                          </Form>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#ECF9F0] px-3 py-1 text-xs font-semibold text-forest">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {totalPages > 1 ? (
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Notification pagination">
              <Link
                to={`/notifications?${new URLSearchParams({
                  view,
                  type,
                  page: String(Math.max(1, page - 1)),
                }).toString()}`}
                aria-disabled={page <= 1}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${page <= 1 ? "pointer-events-none bg-mist/40 text-night/40" : "bg-white border border-midnight/15 text-midnight hover:bg-surface"}`}
              >
                Previous
              </Link>

              <span className="px-2 text-sm text-night/70" aria-live="polite">
                Page {page} of {totalPages}
              </span>

              <Link
                to={`/notifications?${new URLSearchParams({
                  view,
                  type,
                  page: String(Math.min(totalPages, page + 1)),
                }).toString()}`}
                aria-disabled={page >= totalPages}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${page >= totalPages ? "pointer-events-none bg-mist/40 text-night/40" : "bg-white border border-midnight/15 text-midnight hover:bg-surface"}`}
              >
                Next
              </Link>
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}
