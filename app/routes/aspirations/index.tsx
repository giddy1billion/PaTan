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
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
import { SubmitButton } from "~/components/ui";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";

type ActionData = {
  error?: string;
  success?: string;
};

type StatusFilter = "all" | "pending" | "in-progress" | "achieved" | "granted" | "transformed";

const PAGE_SIZE = 9;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "achieved", label: "Achieved" },
  { value: "granted", label: "Granted" },
  { value: "transformed", label: "Transformed" },
];

const statusClassName: Record<Exclude<StatusFilter, "all">, string> = {
  pending: "bg-mist text-night/70",
  "in-progress": "bg-golden/10 text-golden",
  achieved: "bg-[#DCFCE7] text-[#14532D]",
  granted: "bg-[#ECF9F0] text-forest",
  transformed: "bg-[#FFF7E6] text-[#92400E]",
};

function parseStatus(input: string | null): StatusFilter {
  if (
    input === "pending" ||
    input === "in-progress" ||
    input === "achieved" ||
    input === "granted" ||
    input === "transformed"
  ) {
    return input;
  }

  return "all";
}

function parsePage(input: string | null) {
  const parsed = Number(input ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function getProgress(status: string, completedMilestones: number, totalMilestones: number) {
  if (status === "ACHIEVED" || status === "GRANTED" || status === "TRANSFORMED") {
    return 100;
  }

  if (totalMilestones === 0) {
    return status === "IN_PROGRESS" ? 50 : 0;
  }

  return Math.max(0, Math.min(100, Math.round((completedMilestones / totalMilestones) * 100)));
}

function toStatusLabel(status: string) {
  if (status === "IN_PROGRESS") {
    return "In Progress";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export const meta: MetaFunction = () => {
  return [
    { title: "Aspirations | PaTan" },
    {
      name: "description",
      content:
        "Discover goals from the PaTan community, support meaningful progress, and track transformation journeys.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const status = parseStatus(url.searchParams.get("status"));
  const q = String(url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const page = parsePage(url.searchParams.get("page"));
  const showCreatedNotice = url.searchParams.get("created") === "1";
  const showArchivedNotice = url.searchParams.get("archived") === "aspiration";
  const showDeletedNotice = url.searchParams.get("deleted") === "aspiration";

  const visibilityWhere = {
    OR: [
      { authorId: sessionUser.id },
      { privacy: "PUBLIC" as const },
      {
        privacy: "FOLLOWERS_ONLY" as const,
        author: {
          followers: {
            some: {
              followerId: sessionUser.id,
            },
          },
        },
      },
    ],
  };

  const filters: Array<Record<string, unknown>> = [
    { deletedAt: null },
    visibilityWhere,
  ];

  if (status !== "all") {
    const statusMap = {
      pending: "PENDING",
      "in-progress": "IN_PROGRESS",
      achieved: "ACHIEVED",
      granted: "GRANTED",
      transformed: "TRANSFORMED",
    } as const;

    filters.push({ status: statusMap[status] });
  }

  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  const where = {
    AND: filters,
  };

  const [totalCount, aspirations] = await Promise.all([
    db.aspiration.count({ where }),
    db.aspiration.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        privacy: true,
        isAnonymous: true,
        supportCount: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        authorId: true,
        author: {
          select: {
            username: true,
            displayName: true,
            profilePhotoUrl: true,
          },
        },
        milestones: {
          select: {
            isCompleted: true,
          },
        },
      },
    }),
  ]);

  const supportState = aspirations.length
    ? await db.aspirationSupport.findMany({
        where: {
          userId: sessionUser.id,
          aspirationId: {
            in: aspirations.map((aspiration) => aspiration.id),
          },
        },
        select: {
          aspirationId: true,
        },
      })
    : [];

  const supportedIds = new Set(supportState.map((support) => support.aspirationId));
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    sessionUserId: sessionUser.id,
    status,
    q,
    page,
    totalPages,
    totalCount,
    showCreatedNotice,
    showArchivedNotice,
    showDeletedNotice,
    aspirations: aspirations.map((aspiration) => {
      const completedMilestones = aspiration.milestones.filter((item) => item.isCompleted).length;
      const totalMilestones = aspiration.milestones.length;
      return {
        id: aspiration.id,
        title: aspiration.title,
        status: aspiration.status,
        statusLabel: toStatusLabel(aspiration.status),
        statusKey: aspiration.status.toLowerCase().replace("_", "-") as Exclude<StatusFilter, "all">,
        privacy: aspiration.privacy,
        isAnonymous: aspiration.isAnonymous,
        supportCount: aspiration.supportCount,
        createdAt: aspiration.createdAt,
        updatedAt: aspiration.updatedAt,
        description: aspiration.description,
        authorId: aspiration.authorId,
        isOwner: aspiration.authorId === sessionUser.id,
        author: aspiration.author,
        isSupported: supportedIds.has(aspiration.id),
        progress: getProgress(aspiration.status, completedMilestones, totalMilestones),
        totalMilestones,
        completedMilestones,
      };
    }),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim();
  const aspirationId = String(formData.get("aspirationId") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim().slice(0, 300);

  if (intent !== "support-aspiration") {
    return { error: "Unsupported aspiration action." } satisfies ActionData;
  }

  if (!aspirationId) {
    return { error: "Aspiration reference is missing." } satisfies ActionData;
  }

  const aspiration = await db.aspiration.findFirst({
    where: {
      id: aspirationId,
      deletedAt: null,
      OR: [
        { authorId: sessionUser.id },
        { privacy: "PUBLIC" },
        {
          privacy: "FOLLOWERS_ONLY",
          author: {
            followers: {
              some: {
                followerId: sessionUser.id,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      authorId: true,
    },
  });

  if (!aspiration) {
    return { error: "This aspiration is not available." } satisfies ActionData;
  }

  if (aspiration.authorId === sessionUser.id) {
    return { error: "You cannot support your own aspiration." } satisfies ActionData;
  }

  const existing = await db.aspirationSupport.findUnique({
    where: {
      aspirationId_userId: {
        aspirationId: aspiration.id,
        userId: sessionUser.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return { success: "You already support this aspiration." } satisfies ActionData;
  }

  await db.$transaction([
    db.aspirationSupport.create({
      data: {
        aspirationId: aspiration.id,
        userId: sessionUser.id,
        message: message || null,
      },
    }),
    db.aspiration.update({
      where: { id: aspiration.id },
      data: {
        supportCount: {
          increment: 1,
        },
      },
    }),
  ]);

  await createNotification({
    userId: aspiration.authorId,
    actorId: sessionUser.id,
    type: "ASPIRATION_SUPPORT",
    title: "New aspiration support",
    body: message || "Someone supported your aspiration.",
    resourceId: aspiration.id,
    resourceType: "aspiration",
  });

  return { success: "Support added. Thank you for encouraging this journey." } satisfies ActionData;
}

export default function AspirationsIndex() {
  const {
    sessionUserId,
    aspirations,
    status,
    q,
    page,
    totalPages,
    totalCount,
    showCreatedNotice,
    showArchivedNotice,
    showDeletedNotice,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const supportingAspirationId =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "support-aspiration"
      ? String(navigation.formData?.get("aspirationId") ?? "")
      : "";
  const isFiltering =
    navigation.state === "loading" && navigation.formMethod === "GET";

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-12 sm:py-16" aria-labelledby="aspirations-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="aspirations-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Aspirations
          </h1>
          <p className="mt-4 text-base sm:text-lg text-dawn/75 max-w-3xl mx-auto">
            Discover community goals, offer meaningful support, and celebrate progress with care.
          </p>
          <Link to="/aspirations/new" className="mt-6 btn-primary inline-flex min-h-[44px] items-center">
            Share an aspiration
          </Link>
        </div>
      </section>

      <section className="border-b border-mist bg-white sticky top-16 z-40" aria-label="Aspirations controls">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <label htmlFor="aspiration-search" className="sr-only">
              Search aspirations
            </label>
            <input
              id="aspiration-search"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search aspirations"
              className="w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />
            <label htmlFor="aspiration-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="aspiration-status"
              name="status"
              defaultValue={status}
              className="min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <SubmitButton className="btn-secondary min-h-[44px]" busy={isFiltering} pendingLabel="Applying…">
              Apply filters
            </SubmitButton>
          </Form>

          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Quick status filters">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (searchParams.get("status") === option.value) {
                    return;
                  }

                  const next = new URLSearchParams(searchParams);
                  next.set("status", option.value);
                  next.set("page", "1");
                  setSearchParams(next, {
                    replace: true,
                    preventScrollReset: true,
                  });
                }}
                className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${
                  status === option.value
                    ? "bg-midnight text-white"
                    : "bg-mist/40 text-night/75 hover:bg-mist"
                }`}
                aria-pressed={status === option.value}
              >
                {option.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AutoDismissAlert
            tone="success"
            message={showCreatedNotice ? "Your aspiration has been shared." : undefined}
            className="mb-4"
          />

          <AutoDismissAlert
            tone="success"
            message={showArchivedNotice ? "Aspiration archived. It is now private to your account." : undefined}
            className="mb-4"
          />

          <AutoDismissAlert
            tone="success"
            message={showDeletedNotice ? "Aspiration deleted from your list." : undefined}
            className="mb-4"
          />

          <AutoDismissAlert
            tone="error"
            message={actionData?.error}
            className="mb-4"
          />

          <AutoDismissAlert
            tone="success"
            message={actionData?.success}
            className="mb-4"
          />

          <p className="mb-4 text-sm text-night/70" role="status">
            {totalCount} aspiration{totalCount === 1 ? "" : "s"} found.
          </p>

          {aspirations.length === 0 ? (
            <article className="rounded-2xl border border-midnight/10 bg-white p-8 text-center shadow-sm">
              <h2 className="font-heading text-2xl text-midnight">No aspirations yet</h2>
              <p className="mt-3 text-night/70">
                Try a different search or be the first to share a new aspiration.
              </p>
              <Link to="/aspirations/new" className="mt-5 btn-primary inline-flex min-h-[44px] items-center">
                Share your aspiration
              </Link>
            </article>
          ) : (
            <div className="space-y-5">
              {aspirations.map((aspiration) => (
                <article key={aspiration.id} className="rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName[aspiration.statusKey]}`}>
                          {aspiration.statusLabel}
                        </span>
                        <span className="text-xs text-night/60">Updated {formatDate(aspiration.updatedAt)}</span>
                      </div>

                      <h2 className="mt-3 font-heading text-xl sm:text-2xl font-bold text-midnight leading-tight">
                        <Link
                          to={`/aspirations/${aspiration.id}`}
                          className="hover:text-golden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                        >
                          {aspiration.title}
                        </Link>
                      </h2>

                      <p className="mt-2 text-sm text-night/70 line-clamp-3">{aspiration.description}</p>

                      <p className="mt-2 text-sm text-night/60">
                        by {aspiration.isAnonymous ? "Anonymous" : aspiration.author.displayName}
                        {aspiration.isAnonymous ? "" : ` (@${aspiration.author.username})`}
                      </p>
                    </div>

                    <Form method="post" className="sm:w-[14rem]">
                      <input type="hidden" name="intent" value="support-aspiration" />
                      <input type="hidden" name="aspirationId" value={aspiration.id} />
                      <SubmitButton
                        className="min-h-[44px] w-full rounded-xl border border-golden/40 bg-white px-4 py-2 text-sm font-semibold text-midnight hover:bg-[#FFF7E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={aspiration.isSupported || aspiration.isOwner || aspiration.authorId === sessionUserId}
                        busy={supportingAspirationId === aspiration.id}
                        pendingLabel="Supporting…"
                        aria-label={aspiration.isSupported ? "You already support this aspiration" : `Support aspiration ${aspiration.title}`}
                      >
                        {aspiration.isSupported ? "Supported" : "Support aspiration"}
                      </SubmitButton>
                    </Form>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-night/60">Progress</span>
                      <span className="font-semibold text-midnight">
                        {aspiration.progress}% ({aspiration.completedMilestones}/{aspiration.totalMilestones} milestones)
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-mist overflow-hidden" role="progressbar" aria-valuenow={aspiration.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress for ${aspiration.title}`}>
                      <div className="h-full rounded-full bg-golden" style={{ width: `${aspiration.progress}%` }} />
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-night/60">{aspiration.supportCount} supporter{aspiration.supportCount === 1 ? "" : "s"}</p>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Aspirations pagination">
              <Link
                to={`/aspirations?${new URLSearchParams({
                  q,
                  status,
                  page: String(Math.max(1, page - 1)),
                }).toString()}`}
                preventScrollReset
                aria-disabled={page <= 1}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${page <= 1 ? "pointer-events-none bg-mist/40 text-night/40" : "bg-white border border-midnight/15 text-midnight hover:bg-surface"}`}
              >
                Previous
              </Link>

              <span className="px-2 text-sm text-night/70" aria-live="polite">
                Page {page} of {totalPages}
              </span>

              <Link
                to={`/aspirations?${new URLSearchParams({
                  q,
                  status,
                  page: String(Math.min(totalPages, page + 1)),
                }).toString()}`}
                preventScrollReset
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
