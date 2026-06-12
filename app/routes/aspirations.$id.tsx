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
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { createNotification, createNotifications } from "~/utils/notifications.server";

type ActionData = {
  error?: string;
  success?: string;
  values?: {
    supportMessage?: string;
    updateMessage?: string;
  };
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatStatus(value: string) {
  if (value === "IN_PROGRESS") {
    return "In Progress";
  }

  return value.charAt(0) + value.slice(1).toLowerCase();
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Aspiration | PaTan" },
      { name: "description", content: "View and support this aspiration." },
    ];
  }

  return [
    { title: `${data.aspiration.title} | PaTan` },
    {
      name: "description",
      content: data.aspiration.description.slice(0, 160),
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const aspirationId = params.id?.trim();

  if (!aspirationId) {
    throw new Response("Aspiration not found", { status: 404 });
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
      description: true,
      status: true,
      privacy: true,
      isAnonymous: true,
      supportCount: true,
      targetDate: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          username: true,
          displayName: true,
          profilePhotoUrl: true,
        },
      },
      milestones: {
        orderBy: {
          orderIndex: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          isCompleted: true,
          completedAt: true,
          updatedAt: true,
        },
      },
      supporters: {
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          message: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              displayName: true,
              profilePhotoUrl: true,
            },
          },
        },
      },
      updates: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
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
  });

  if (!aspiration) {
    throw new Response("Aspiration not found", { status: 404 });
  }

  const support = await db.aspirationSupport.findUnique({
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

  const completedMilestones = aspiration.milestones.filter((milestone) => milestone.isCompleted).length;
  const totalMilestones = aspiration.milestones.length;
  const progress = getProgress(aspiration.status, completedMilestones, totalMilestones);
  const isOwner = aspiration.authorId === sessionUser.id;

  return {
    sessionUserId: sessionUser.id,
    isOwner,
    isSupported: Boolean(support),
    showUpdatedNotice: url.searchParams.get("updated") === "1",
    progress,
    completedMilestones,
    totalMilestones,
    aspiration,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const aspirationId = params.id?.trim();
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "").trim();

  const supportMessage = String(formData.get("supportMessage") ?? "").trim().slice(0, 300);
  const updateMessage = String(formData.get("updateMessage") ?? "").trim().slice(0, 600);
  const milestoneId = String(formData.get("milestoneId") ?? "").trim();

  if (!aspirationId) {
    return { error: "Aspiration reference is missing." } satisfies ActionData;
  }

  const aspiration = await db.aspiration.findUnique({
    where: { id: aspirationId },
    select: {
      id: true,
      title: true,
      authorId: true,
      status: true,
      deletedAt: true,
      privacy: true,
    },
  });

  if (!aspiration || aspiration.deletedAt) {
    return { error: "Aspiration is unavailable." } satisfies ActionData;
  }

  if (intent === "support-aspiration") {
    if (aspiration.privacy === "PRIVATE" && aspiration.authorId !== sessionUser.id) {
      return { error: "This aspiration is private." } satisfies ActionData;
    }

    if (aspiration.privacy === "FOLLOWERS_ONLY" && aspiration.authorId !== sessionUser.id) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: sessionUser.id,
            followingId: aspiration.authorId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!follow) {
        return {
          error: "Only followers can support this aspiration.",
        } satisfies ActionData;
      }
    }

    if (aspiration.authorId === sessionUser.id) {
      return { error: "You cannot support your own aspiration." } satisfies ActionData;
    }

    const existing = await db.aspirationSupport.findUnique({
      where: {
        aspirationId_userId: {
          aspirationId,
          userId: sessionUser.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return { success: "You already support this aspiration." } satisfies ActionData;
    }

    await db.$transaction([
      db.aspirationSupport.create({
        data: {
          aspirationId,
          userId: sessionUser.id,
          message: supportMessage || null,
        },
      }),
      db.aspiration.update({
        where: { id: aspirationId },
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
      body: supportMessage || "Someone supported your aspiration.",
      resourceId: aspirationId,
      resourceType: "aspiration",
    });

    return { success: "Support added successfully.", values: { supportMessage: "" } } satisfies ActionData;
  }

  if (intent === "toggle-milestone") {
    if (aspiration.authorId !== sessionUser.id) {
      return { error: "Only the aspiration owner can update milestones." } satisfies ActionData;
    }

    if (!milestoneId) {
      return { error: "Milestone reference is missing." } satisfies ActionData;
    }

    const milestone = await db.aspirationMilestone.findFirst({
      where: {
        id: milestoneId,
        aspirationId,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!milestone) {
      return { error: "Milestone not found." } satisfies ActionData;
    }

    const nextCompleted = !milestone.isCompleted;

    await db.aspirationMilestone.update({
      where: { id: milestone.id },
      data: {
        isCompleted: nextCompleted,
        completedAt: nextCompleted ? new Date() : null,
      },
    });

    const milestoneSummary = await db.aspirationMilestone.findMany({
      where: { aspirationId },
      select: {
        isCompleted: true,
      },
    });

    const completedCount = milestoneSummary.filter((entry) => entry.isCompleted).length;
    const allComplete = milestoneSummary.length > 0 && completedCount === milestoneSummary.length;

    await db.aspiration.update({
      where: { id: aspirationId },
      data: {
        status: allComplete
          ? "ACHIEVED"
          : completedCount > 0
            ? "IN_PROGRESS"
            : "PENDING",
        achievedAt: allComplete ? new Date() : null,
      },
    });

    const supporters = await db.aspirationSupport.findMany({
      where: {
        aspirationId,
        userId: {
          not: sessionUser.id,
        },
      },
      select: {
        userId: true,
      },
    });

    if (supporters.length > 0) {
      await createNotifications({
        userIds: supporters.map((supporter) => supporter.userId),
        actorId: sessionUser.id,
        type: "STORY_MILESTONE",
        title: "Aspiration milestone updated",
        body: `${milestone.title} was ${nextCompleted ? "completed" : "reopened"}.`,
        resourceId: aspirationId,
        resourceType: "aspiration",
      });
    }

    return {
      success: nextCompleted ? "Milestone marked complete." : "Milestone marked in progress.",
    } satisfies ActionData;
  }

  if (intent === "post-update") {
    if (aspiration.authorId !== sessionUser.id) {
      return { error: "Only the aspiration owner can post updates." } satisfies ActionData;
    }

    if (!updateMessage) {
      return {
        error: "Write an update message before posting.",
        values: { updateMessage },
      } satisfies ActionData;
    }

    await db.aspirationUpdate.create({
      data: {
        aspirationId,
        authorId: sessionUser.id,
        content: updateMessage,
      },
    });

    const supporters = await db.aspirationSupport.findMany({
      where: {
        aspirationId,
        userId: {
          not: sessionUser.id,
        },
      },
      select: {
        userId: true,
      },
    });

    if (supporters.length > 0) {
      await createNotifications({
        userIds: supporters.map((supporter) => supporter.userId),
        actorId: sessionUser.id,
        type: "COMMUNITY_UPDATE",
        title: "Aspiration update",
        body: updateMessage.slice(0, 180),
        resourceId: aspirationId,
        resourceType: "aspiration",
      });
    }

    return {
      success: "Update posted to your aspiration journey.",
      values: { updateMessage: "" },
    } satisfies ActionData;
  }

  return { error: "Unsupported aspiration action." } satisfies ActionData;
}

export default function AspirationDetail() {
  const {
    aspiration,
    isOwner,
    isSupported,
    showUpdatedNotice,
    progress,
    completedMilestones,
    totalMilestones,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const authorLabel = aspiration.isAnonymous && !isOwner ? "Anonymous" : aspiration.author.displayName;
  const showProfileLink = !aspiration.isAnonymous || isOwner;

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <Link
          to="/aspirations"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-night/70 hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
        >
          Back to aspirations
        </Link>

        {actionData?.error ? (
          <p className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]" role="alert" aria-live="polite">
            {actionData.error}
          </p>
        ) : null}

        {actionData?.success ? (
          <p className="mt-4 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest" role="status" aria-live="polite">
            {actionData.success}
          </p>
        ) : null}

        {showUpdatedNotice ? (
          <p className="mt-4 rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest" role="status" aria-live="polite">
            Aspiration updated successfully.
          </p>
        ) : null}

        <header className="mt-4 rounded-2xl border border-midnight/10 bg-white p-6 sm:p-8 shadow-sm">
          <p className="inline-flex rounded-full bg-golden/10 px-3 py-1 text-xs font-semibold text-golden">
            {formatStatus(aspiration.status)}
          </p>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-bold text-midnight leading-tight">
            {aspiration.title}
          </h1>
          <p className="mt-3 text-night/75 leading-relaxed whitespace-pre-line">{aspiration.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-night/60">
            <span>By {authorLabel}</span>
            <span aria-hidden="true">|</span>
            <span>Started {formatDate(aspiration.createdAt)}</span>
            <span aria-hidden="true">|</span>
            <span>Target {formatDate(aspiration.targetDate)}</span>
            {isOwner ? (
              <>
                <span aria-hidden="true">|</span>
                <Link
                  to={`/aspirations/${aspiration.id}/edit`}
                  className="font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                >
                  Edit aspiration
                </Link>
              </>
            ) : null}
            {showProfileLink ? (
              <>
                <span aria-hidden="true">|</span>
                <Link
                  to={`/u/${aspiration.author.username}`}
                  className="font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                >
                  View profile
                </Link>
              </>
            ) : null}
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl text-midnight">Progress</h2>
            <p className="text-sm font-semibold text-midnight">
              {progress}% ({completedMilestones}/{totalMilestones} milestones)
            </p>
          </div>
          <div className="mt-2 h-3 rounded-full bg-mist overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Aspiration progress">
            <div className="h-full rounded-full bg-golden" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm text-night/60">{aspiration.supportCount} supporter{aspiration.supportCount === 1 ? "" : "s"}</p>

          {!isOwner ? (
            <Form method="post" className="mt-5 space-y-3">
              <input type="hidden" name="intent" value="support-aspiration" />
              <label htmlFor="supportMessage" className="block text-sm font-medium text-night">
                Add a support message (optional)
              </label>
              <textarea
                id="supportMessage"
                name="supportMessage"
                rows={2}
                maxLength={300}
                defaultValue={actionData?.values?.supportMessage ?? ""}
                className="block w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden"
                placeholder="You are not alone. Keep going."
              />
              <button
                type="submit"
                className="btn-primary min-h-[44px]"
                disabled={isSubmitting || isSupported}
                aria-busy={isSubmitting}
              >
                {isSupported ? "Already supported" : "Support this aspiration"}
              </button>
            </Form>
          ) : (
            <Form method="post" className="mt-5 space-y-3" aria-labelledby="update-heading">
              <input type="hidden" name="intent" value="post-update" />
              <h3 id="update-heading" className="text-sm font-semibold text-midnight">
                Post an update for supporters
              </h3>
              <textarea
                id="updateMessage"
                name="updateMessage"
                rows={3}
                maxLength={600}
                defaultValue={actionData?.values?.updateMessage ?? ""}
                className="block w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden"
                placeholder="Share your latest progress."
              />
              <button type="submit" className="btn-primary min-h-[44px]" disabled={isSubmitting} aria-busy={isSubmitting}>
                Post update
              </button>
            </Form>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm" aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="font-heading text-xl text-midnight">Milestones</h2>
          {aspiration.milestones.length === 0 ? (
            <p className="mt-3 text-sm text-night/60">No milestones set yet.</p>
          ) : (
            <ul className="mt-4 space-y-3" role="list">
              {aspiration.milestones.map((milestone) => (
                <li key={milestone.id} className="rounded-xl border border-midnight/10 px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-midnight">{milestone.title}</p>
                      <p className="mt-1 text-xs text-night/60">
                        {milestone.isCompleted
                          ? `Completed ${formatDate(milestone.completedAt)}`
                          : "In progress"}
                      </p>
                    </div>

                    {isOwner ? (
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle-milestone" />
                        <input type="hidden" name="milestoneId" value={milestone.id} />
                        <button
                          type="submit"
                          className="min-h-[44px] rounded-xl border border-midnight/15 px-3 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                          disabled={isSubmitting}
                          aria-busy={isSubmitting}
                        >
                          {milestone.isCompleted ? "Mark in progress" : "Mark complete"}
                        </button>
                      </Form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm" aria-labelledby="updates-heading">
            <h2 id="updates-heading" className="font-heading text-xl text-midnight">Updates</h2>
            {aspiration.updates.length === 0 ? (
              <p className="mt-3 text-sm text-night/60">No updates posted yet.</p>
            ) : (
              <ul className="mt-4 space-y-3" role="list">
                {aspiration.updates.map((update) => (
                  <li key={update.id} className="rounded-xl border border-midnight/10 px-4 py-3">
                    <p className="text-sm text-night/80">{update.content}</p>
                    <p className="mt-2 text-xs text-night/60">
                      {formatDate(update.createdAt)} by {update.author.displayName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm" aria-labelledby="supporters-heading">
            <h2 id="supporters-heading" className="font-heading text-xl text-midnight">Recent supporters</h2>
            {aspiration.supporters.length === 0 ? (
              <p className="mt-3 text-sm text-night/60">No supporters yet.</p>
            ) : (
              <ul className="mt-4 space-y-3" role="list">
                {aspiration.supporters.map((supporter) => (
                  <li key={supporter.id} className="rounded-xl border border-midnight/10 px-4 py-3">
                    <p className="text-sm font-semibold text-midnight">{supporter.user.displayName}</p>
                    {supporter.message ? (
                      <p className="mt-1 text-sm text-night/75">{supporter.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-night/60">{formatDate(supporter.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </article>
    </main>
  );
}
