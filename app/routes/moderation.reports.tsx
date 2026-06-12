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
  useNavigation,
} from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";

type ActionData = {
  error?: string;
  success?: string;
};

type StatusFilter = "all" | "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
type TriageStatus = Exclude<StatusFilter, "all">;

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

function formatStatus(value: TriageStatus) {
  return value.toLowerCase().replace("_", " ");
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
        reporterId: true,
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
            slug: true,
            title: true,
            excerpt: true,
            author: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                displayName: true,
              },
            },
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
    await createNotification({
      userId: report.reporterId,
      actorId: user.id,
      type: "COMMUNITY_UPDATE",
      title: "Report status updated",
      body: `Your report is now ${nextStatus.toLowerCase().replace("_", " ")}.`,
      resourceId: reportId,
      resourceType: "report",
    });
  }

  return { success: `Report updated to ${nextStatus}.` } satisfies ActionData;
}

export default function ModerationReportsRoute() {
  const { status, page, totalCount, totalPages, counts, reports } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const reportIds = useMemo(() => reports.map((report) => report.id), [reports]);
  const [activeReportId, setActiveReportId] = useState<string | null>(reportIds[0] ?? null);
  const [shortcutMessage, setShortcutMessage] = useState("");
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const quickFormRefs = useRef<Record<string, Partial<Record<TriageStatus, HTMLFormElement | null>>>>({});

  useEffect(() => {
    if (!activeReportId || !reportIds.includes(activeReportId)) {
      setActiveReportId(reportIds[0] ?? null);
    }
  }, [activeReportId, reportIds]);

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const report of reports) {
      nextDrafts[report.id] = report.resolution ?? "";
    }
    setResolutionDrafts(nextDrafts);
  }, [reports]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable
        )
      ) {
        return;
      }

      if (reportIds.length === 0) {
        return;
      }

      if (event.key.toLowerCase() === "j" || event.key.toLowerCase() === "k") {
        event.preventDefault();

        const currentIndex = activeReportId ? reportIds.indexOf(activeReportId) : -1;
        const delta = event.key.toLowerCase() === "j" ? 1 : -1;
        const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = (fallbackIndex + delta + reportIds.length) % reportIds.length;
        const nextReportId = reportIds[nextIndex];
        setActiveReportId(nextReportId);
        setShortcutMessage(`Selected report ${nextIndex + 1} of ${reportIds.length}.`);
        return;
      }

      if (!activeReportId) {
        return;
      }

      const shortcutMap: Record<string, TriageStatus> = {
        "1": "PENDING",
        "2": "UNDER_REVIEW",
        "3": "RESOLVED",
        "4": "DISMISSED",
      };

      const nextStatus = shortcutMap[event.key];
      if (!nextStatus) {
        return;
      }

      const form = quickFormRefs.current[activeReportId]?.[nextStatus];
      if (!form) {
        return;
      }

      event.preventDefault();
      form.requestSubmit();
      setShortcutMessage(`Applied ${formatStatus(nextStatus)} to selected report.`);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeReportId, reportIds]);

  const isSubmitting = navigation.state === "submitting";

  const setQuickFormRef = (reportId: string, nextStatus: TriageStatus, element: HTMLFormElement | null) => {
    if (!quickFormRefs.current[reportId]) {
      quickFormRefs.current[reportId] = {};
    }

    quickFormRefs.current[reportId][nextStatus] = element;
  };

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
          <p className="sr-only" role="status" aria-live="polite">
            {shortcutMessage}
          </p>

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

            <div className="mt-4 rounded-xl border border-midnight/10 bg-surface p-3 text-xs text-night/75" role="note" aria-label="Keyboard triage shortcuts">
              <p className="font-semibold text-midnight">Keyboard triage shortcuts</p>
              <p className="mt-1">
                Press J and K to move between reports. Press 1 for pending, 2 for under review, 3 for resolved, and 4 for dismissed on the selected report.
              </p>
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
                  <li
                    key={report.id}
                    className={`rounded-xl border p-4 ${activeReportId === report.id ? "border-golden bg-[#FFF7E6]" : "border-midnight/10 bg-white"}`}
                    tabIndex={0}
                    onFocus={() => setActiveReportId(report.id)}
                    aria-label={`Report ${report.id} currently ${formatStatus(report.status as TriageStatus)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-midnight">
                          {formatReason(report.reason)} | {formatStatus(report.status as TriageStatus)}
                        </p>
                        <p className="mt-1 text-xs text-night/60">
                          Filed {formatDate(report.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReportId(report.id);
                          setShortcutMessage("Report selected for keyboard triage.");
                        }}
                        className="min-h-[44px] rounded-lg border border-midnight/15 px-3 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                        aria-pressed={activeReportId === report.id}
                      >
                        {activeReportId === report.id ? "Selected" : "Select"}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr),19rem]">
                      <div className="space-y-3">
                        <article className="rounded-lg border border-midnight/10 bg-white px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Reporter</p>
                          <p className="mt-1 text-sm text-midnight">
                            {report.reporter.displayName} (@{report.reporter.username})
                          </p>
                        </article>

                        <article className="rounded-lg border border-midnight/10 bg-white px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Reported target</p>
                          <p className="mt-1 text-sm text-midnight">
                            {report.reportedUser
                              ? `${report.reportedUser.displayName} (@${report.reportedUser.username})`
                              : "Content-only report"}
                          </p>
                        </article>

                        {report.story ? (
                          <article className="rounded-lg border border-midnight/10 bg-white px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Story context</p>
                            <Link
                              to={`/stories/${report.story.id}`}
                              className="mt-1 inline-flex text-sm font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                            >
                              {report.story.title}
                            </Link>
                            {report.story.excerpt ? (
                              <p className="mt-1 text-sm text-night/75">{report.story.excerpt.slice(0, 220)}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-night/60">
                              Author: {report.story.author.displayName} (@{report.story.author.username})
                            </p>
                          </article>
                        ) : null}

                        {report.comment ? (
                          <article className="rounded-lg border border-midnight/10 bg-white px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Comment context</p>
                            <p className="mt-1 text-sm text-night/80">{report.comment.content.slice(0, 260)}</p>
                            <p className="mt-1 text-xs text-night/60">
                              By {report.comment.author.displayName} (@{report.comment.author.username}) on {formatDate(report.comment.createdAt)}
                            </p>
                          </article>
                        ) : null}

                        {report.description ? (
                          <article className="rounded-lg border border-midnight/10 bg-white px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Reporter description</p>
                            <p className="mt-1 text-sm text-night/80">{report.description}</p>
                          </article>
                        ) : null}

                        {report.resolution ? (
                          <article className="rounded-lg border border-forest/20 bg-[#ECF9F0] px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-forest">Resolution</p>
                            <p className="mt-1 text-sm text-forest">{report.resolution}</p>
                          </article>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <div className="rounded-lg border border-midnight/10 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-night/65">Quick triage</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {([
                              { status: "PENDING", label: "Pending", keyHint: "1" },
                              { status: "UNDER_REVIEW", label: "Under review", keyHint: "2" },
                              { status: "RESOLVED", label: "Resolved", keyHint: "3" },
                              { status: "DISMISSED", label: "Dismissed", keyHint: "4" },
                            ] as Array<{ status: TriageStatus; label: string; keyHint: string }>).map((entry) => (
                              <Form
                                key={entry.status}
                                method="post"
                                ref={(node) => setQuickFormRef(report.id, entry.status, node)}
                              >
                                <input type="hidden" name="intent" value="set-report-status" />
                                <input type="hidden" name="reportId" value={report.id} />
                                <input type="hidden" name="nextStatus" value={entry.status} />
                                <input type="hidden" name="resolution" value={resolutionDrafts[report.id] ?? ""} />
                                <button
                                  type="submit"
                                  className="min-h-[44px] w-full rounded-lg border border-midnight/15 px-2 py-2 text-xs font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                  disabled={isSubmitting}
                                  aria-busy={isSubmitting}
                                  aria-label={`Set report to ${entry.label}. Shortcut ${entry.keyHint}.`}
                                >
                                  {entry.label} ({entry.keyHint})
                                </button>
                              </Form>
                            ))}
                          </div>
                        </div>

                        <Form method="post" className="rounded-lg border border-midnight/10 bg-white p-3 space-y-2">
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
                            rows={3}
                            maxLength={600}
                            value={resolutionDrafts[report.id] ?? ""}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setResolutionDrafts((current) => ({
                                ...current,
                                [report.id]: nextValue,
                              }));
                            }}
                            className="block w-full rounded-xl border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-golden"
                            placeholder="Optional notes for resolved or dismissed cases"
                          />
                          <button type="submit" className="btn-primary min-h-[44px] w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                            Update report
                          </button>
                          <p className="text-[11px] text-night/60">
                            Last updated {formatDate(report.updatedAt)}
                            {report.resolvedAt ? `, resolved ${formatDate(report.resolvedAt)}` : ""}
                          </p>
                        </Form>
                      </div>
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
