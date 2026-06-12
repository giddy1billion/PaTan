import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

type ActionData = {
  error?: string;
  success?: string;
};

type StatusFilter = "all" | "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";

const PAGE_SIZE = 20;

const elevatedRoles = new Set(["ADMIN", "SUPER_ADMIN", "MODERATOR"]);

function parseStatus(input: string | null): StatusFilter {
  if (
    input === "PENDING" ||
    input === "UNDER_REVIEW" ||
    input === "RESOLVED" ||
    input === "DISMISSED"
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

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatReason(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

async function requireModerationRole(request: Request) {
  const user = await requireUser(request);
  const roleLookup = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!roleLookup || !elevatedRoles.has(roleLookup.role)) {
    throw redirect("/dashboard");
  }

  return { user, role: roleLookup.role };
}

export const meta: MetaFunction = () => {
  return [
    { title: "Moderation Reports | PaTan" },
    {
      name: "description",
      content:
        "Review user reports, update report statuses, and track moderation activity in PaTan.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireModerationRole(request);
  const url = new URL(request.url);
  const status = parseStatus(url.searchParams.get("status"));
  const page = parsePage(url.searchParams.get("page"));

  const where = status === "all" ? {} : { status };

  const [countsByStatus, totalCount, reports] = await Promise.all([
    db.report.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
    db.report.count({ where }),
    db.report.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        status: true,
        description: true,
        resolution: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        reporter: {
          select: {
            username: true,
            displayName: true,
          },
        },
        reportedUser: {
          select: {
            username: true,
            displayName: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    }),
  ]);

  const counts = countsByStatus.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});

  return {
    status,
    page,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    counts,
    reports,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await requireModerationRole(request);
  const formData = await request.formData();

  const intent = String(formData.get("intent") ?? "").trim();
  const reportId = String(formData.get("reportId") ?? "").trim();
  const nextStatus = parseStatus(String(formData.get("nextStatus") ?? "all"));
  const resolution = String(formData.get("resolution") ?? "").trim().slice(0, 600);

  if (intent !== "set-report-status") {
    return { error: "Unsupported moderation action." } satisfies ActionData;
  }

  if (!reportId) {
    return { error: "Report id is missing." } satisfies ActionData;
  }

  if (nextStatus === "all") {
    return { error: "Select a valid report status." } satisfies ActionData;
  }

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      reporterId: true,
    },
  });

  if (!report) {
    return { error: "Report not found." } satisfies ActionData;
  }

  const isResolvedState = nextStatus === "RESOLVED" || nextStatus === "DISMISSED";

  await db.$transaction([
    db.report.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
        resolvedBy: isResolvedState ? user.id : null,
        resolvedAt: isResolvedState ? new Date() : null,
        resolution: isResolvedState ? resolution || null : null,
      },
    }),
    db.moderationAction.create({
      data: {
        moderatorId: user.id,
        action: `report:${nextStatus.toLowerCase()}`,
        targetType: "report",
        targetId: reportId,
        reason: resolution || `Report moved to ${nextStatus}`,
        metadata: {
          previousStatus: report.status,
          nextStatus,
        },
      },
    }),
  ]);

  if (report.reporterId !== user.id) {
    await db.notification.create({
      data: {
        userId: report.reporterId,
        actorId: user.id,
        type: "COMMUNITY_UPDATE",
        title: "Report status updated",
        body: `Your report is now ${nextStatus.toLowerCase().replace("_", " ")}.`,
        resourceId: reportId,
        resourceType: "report",
      },
    });
  }

  return { success: `Report updated to ${nextStatus}.` } satisfies ActionData;
}

export default function ModerationReportsRoute() {
  const { status, page, totalCount, totalPages, counts, reports } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-10 sm:py-14" aria-labelledby="moderation-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 id="moderation-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Moderation queue
          </h1>
          <p className="mt-3 text-dawn/75 max-w-3xl">
            Review incoming reports, move them through triage, and close cases with resolution details.
          </p>
          <div className="mt-4 text-sm text-dawn/85">{totalCount} reports in current filter</div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <section className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm" aria-label="Report filters">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as StatusFilter[]).map((option) => (
                <Link
                  key={option}
                  to={`/moderation/reports?status=${option}&page=1`}
                  className={`min-h-[44px] inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${
                    status === option
                      ? "bg-midnight text-white"
                      : "bg-mist/40 text-night/75 hover:bg-mist"
                  }`}
                  aria-current={status === option ? "page" : undefined}
                >
                  {option === "all" ? "All" : option.replace("_", " ")} ({option === "all" ? totalCount : counts[option] ?? 0})
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm" aria-labelledby="reports-heading">
            <h2 id="reports-heading" className="font-heading text-xl text-midnight">
              Reports
            </h2>

            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-night/70" role="status">
                No reports in this filter.
              </p>
            ) : (
              <ul className="mt-4 space-y-4" role="list">
                {reports.map((report) => (
                  <li key={report.id} className="rounded-xl border border-midnight/10 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-midnight">
                          {formatReason(report.reason)} | {report.status.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-night/60">
                          Filed {formatDate(report.createdAt)} by {report.reporter.displayName} (@{report.reporter.username})
                        </p>
                        <p className="mt-1 text-xs text-night/60">
                          Target: {report.reportedUser ? `${report.reportedUser.displayName} (@${report.reportedUser.username})` : "Content only"}
                        </p>
                        {report.story ? (
                          <p className="mt-1 text-xs text-night/60">Story: {report.story.title}</p>
                        ) : null}
                        {report.comment ? (
                          <p className="mt-1 text-xs text-night/60">Comment excerpt: {report.comment.content.slice(0, 120)}</p>
                        ) : null}
                        {report.description ? (
                          <p className="mt-2 text-sm text-night/75">{report.description}</p>
                        ) : null}
                        {report.resolution ? (
                          <p className="mt-2 text-sm text-forest">Resolution: {report.resolution}</p>
                        ) : null}
                      </div>

                      <Form method="post" className="w-full lg:w-[18rem] space-y-2">
                        <input type="hidden" name="intent" value="set-report-status" />
                        <input type="hidden" name="reportId" value={report.id} />
                        <label htmlFor={`next-status-${report.id}`} className="block text-xs font-medium text-night">
                          Next status
                        </label>
                        <select
                          id={`next-status-${report.id}`}
                          name="nextStatus"
                          defaultValue={report.status}
                          className="min-h-[44px] w-full rounded-xl border border-mist px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-golden"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="UNDER_REVIEW">Under review</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="DISMISSED">Dismissed</option>
                        </select>
                        <label htmlFor={`resolution-${report.id}`} className="block text-xs font-medium text-night">
                          Resolution notes
                        </label>
                        <textarea
                          id={`resolution-${report.id}`}
                          name="resolution"
                          rows={2}
                          maxLength={600}
                          defaultValue={report.resolution ?? ""}
                          className="block w-full rounded-xl border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-golden"
                          placeholder="Optional notes for resolved or dismissed cases"
                        />
                        <button type="submit" className="btn-primary min-h-[44px] w-full">
                          Update report
                        </button>
                        <p className="text-[11px] text-night/60">
                          Last updated {formatDate(report.updatedAt)}
                          {report.resolvedAt ? `, resolved ${formatDate(report.resolvedAt)}` : ""}
                        </p>
                      </Form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {totalPages > 1 ? (
            <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Moderation pagination">
              <Link
                to={`/moderation/reports?status=${status}&page=${Math.max(1, page - 1)}`}
                aria-disabled={page <= 1}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ${page <= 1 ? "pointer-events-none bg-mist/40 text-night/40" : "bg-white border border-midnight/15 text-midnight hover:bg-surface"}`}
              >
                Previous
              </Link>
              <span className="px-2 text-sm text-night/70" aria-live="polite">
                Page {page} of {totalPages}
              </span>
              <Link
                to={`/moderation/reports?status=${status}&page=${Math.min(totalPages, page + 1)}`}
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
