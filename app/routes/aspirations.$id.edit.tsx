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
import { useState } from "react";
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

type ActionData = {
  error?: string;
  values?: {
    title: string;
    description: string;
    targetDate: string;
    privacy: string;
    status: string;
    newMilestone1: string;
    newMilestone2: string;
    newMilestone3: string;
  };
};

function parseAspirationPrivacy(input: string) {
  if (input === "followers") {
    return "FOLLOWERS_ONLY" as const;
  }

  if (input === "private") {
    return "PRIVATE" as const;
  }

  return "PUBLIC" as const;
}

function fromAspirationPrivacy(input: string) {
  if (input === "FOLLOWERS_ONLY") {
    return "followers";
  }

  if (input === "PRIVATE") {
    return "private";
  }

  return "public";
}

function parseAspirationStatus(input: string) {
  if (
    input === "PENDING" ||
    input === "IN_PROGRESS" ||
    input === "ACHIEVED" ||
    input === "GRANTED" ||
    input === "TRANSFORMED"
  ) {
    return input;
  }

  return "PENDING";
}

function RemoveMilestoneIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Edit Aspiration | PaTan" }];
  }

  return [
    { title: `Edit ${data.aspiration.title} | PaTan` },
    {
      name: "description",
      content:
        "Update aspiration details, milestones, and visibility settings with ownership-safe controls.",
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const aspirationId = params.id?.trim();

  if (!aspirationId) {
    throw new Response("Aspiration not found", { status: 404 });
  }

  const aspiration = await db.aspiration.findFirst({
    where: {
      id: aspirationId,
      authorId: sessionUser.id,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      targetDate: true,
      privacy: true,
      status: true,
      milestones: {
        orderBy: {
          orderIndex: "asc",
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          orderIndex: true,
        },
      },
    },
  });

  if (!aspiration) {
    throw new Response("Aspiration not found", { status: 404 });
  }

  return { aspiration };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const aspirationId = params.id?.trim();
  const formData = await request.formData();

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    targetDate: String(formData.get("targetDate") ?? "").trim(),
    privacy: String(formData.get("privacy") ?? "public"),
    status: String(formData.get("status") ?? "PENDING"),
    newMilestone1: String(formData.get("newMilestone1") ?? "").trim(),
    newMilestone2: String(formData.get("newMilestone2") ?? "").trim(),
    newMilestone3: String(formData.get("newMilestone3") ?? "").trim(),
  };

  if (!aspirationId) {
    return { error: "Aspiration reference is missing.", values } satisfies ActionData;
  }

  if (!values.title || !values.description) {
    return {
      error: "Title and description are required.",
      values,
    } satisfies ActionData;
  }

  const aspiration = await db.aspiration.findFirst({
    where: {
      id: aspirationId,
      authorId: sessionUser.id,
      deletedAt: null,
    },
    select: {
      id: true,
      milestones: {
        select: {
          id: true,
          orderIndex: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });

  if (!aspiration) {
    return { error: "Aspiration not found.", values } satisfies ActionData;
  }

  const targetDate = values.targetDate ? new Date(values.targetDate) : null;
  if (values.targetDate && Number.isNaN(targetDate?.getTime())) {
    return { error: "Target date is invalid.", values } satisfies ActionData;
  }

  const milestoneIds = formData.getAll("milestoneId").map((entry) => String(entry));
  const milestoneTitles = formData.getAll("milestoneTitle").map((entry) => String(entry).trim());

  await db.$transaction(async (tx) => {
    await tx.aspiration.update({
      where: { id: aspiration.id },
      data: {
        title: values.title,
        description: values.description,
        targetDate,
        privacy: parseAspirationPrivacy(values.privacy),
        status: parseAspirationStatus(values.status),
        achievedAt: parseAspirationStatus(values.status) === "ACHIEVED" ? new Date() : null,
      },
    });

    for (let index = 0; index < milestoneIds.length; index += 1) {
      const milestoneId = milestoneIds[index];
      const title = milestoneTitles[index] ?? "";
      const remove = String(formData.get(`removeMilestone-${milestoneId}`) ?? "") === "on";
      const isCompleted = String(formData.get(`milestoneCompleted-${milestoneId}`) ?? "") === "on";

      if (!milestoneId) {
        continue;
      }

      if (remove) {
        await tx.aspirationMilestone.deleteMany({
          where: {
            id: milestoneId,
            aspirationId: aspiration.id,
          },
        });
        continue;
      }

      if (!title) {
        continue;
      }

      await tx.aspirationMilestone.update({
        where: { id: milestoneId },
        data: {
          title,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    const existingMilestonesCount = await tx.aspirationMilestone.count({
      where: {
        aspirationId: aspiration.id,
      },
    });

    const newMilestones = [values.newMilestone1, values.newMilestone2, values.newMilestone3].filter(Boolean);

    if (newMilestones.length > 0) {
      await tx.aspirationMilestone.createMany({
        data: newMilestones.map((title, index) => ({
          aspirationId: aspiration.id,
          title,
          orderIndex: existingMilestonesCount + index,
        })),
      });
    }
  });

  return redirect(`/aspirations/${aspiration.id}?updated=1`);
}

export default function AspirationEditRoute() {
  const { aspiration } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [pendingMilestoneRemovalId, setPendingMilestoneRemovalId] = useState<string | null>(null);
  const [confirmedMilestoneRemovals, setConfirmedMilestoneRemovals] = useState<Record<string, boolean>>({});

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold text-midnight">Edit aspiration</h1>
          <Link
            to={`/aspirations/${aspiration.id}`}
            className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
          >
            Back to aspiration
          </Link>
        </div>

        <AutoDismissAlert
          tone="error"
          message={actionData?.error}
          className="mt-4"
        />

        <Form method="post" className="mt-6 space-y-6 rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="aspiration-title" className="block text-sm font-medium text-night">
              Title
            </label>
            <input
              id="aspiration-title"
              name="title"
              required
              maxLength={100}
              defaultValue={actionData?.values?.title ?? aspiration.title}
              className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />
          </div>

          <div>
            <label htmlFor="aspiration-description" className="block text-sm font-medium text-night">
              Description
            </label>
            <textarea
              id="aspiration-description"
              name="description"
              required
              rows={8}
              defaultValue={actionData?.values?.description ?? aspiration.description}
              className="mt-1 block w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="aspiration-target-date" className="block text-sm font-medium text-night">
                Target date
              </label>
              <input
                id="aspiration-target-date"
                name="targetDate"
                type="date"
                defaultValue={
                  actionData?.values?.targetDate ??
                  (aspiration.targetDate ? aspiration.targetDate.toISOString().slice(0, 10) : "")
                }
                className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden"
              />
            </div>

            <div>
              <label htmlFor="aspiration-privacy" className="block text-sm font-medium text-night">
                Privacy
              </label>
              <select
                id="aspiration-privacy"
                name="privacy"
                defaultValue={actionData?.values?.privacy ?? fromAspirationPrivacy(aspiration.privacy)}
                className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
              >
                <option value="public">Public</option>
                <option value="followers">Followers only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label htmlFor="aspiration-status" className="block text-sm font-medium text-night">
                Status
              </label>
              <select
                id="aspiration-status"
                name="status"
                defaultValue={actionData?.values?.status ?? aspiration.status}
                className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="ACHIEVED">Achieved</option>
                <option value="GRANTED">Granted</option>
                <option value="TRANSFORMED">Transformed</option>
              </select>
            </div>
          </div>

          <section aria-labelledby="milestone-edit-heading">
            <h2 id="milestone-edit-heading" className="font-heading text-xl text-midnight">
              Milestones
            </h2>
            {aspiration.milestones.length === 0 ? (
              <p className="mt-2 text-sm text-night/60">No milestones yet.</p>
            ) : (
              <ul className="mt-3 space-y-3" role="list">
                {aspiration.milestones.map((milestone) => (
                  <li key={milestone.id} className="rounded-xl border border-midnight/10 p-4">
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    {confirmedMilestoneRemovals[milestone.id] ? (
                      <input type="hidden" name={`removeMilestone-${milestone.id}`} value="on" />
                    ) : null}
                    <label htmlFor={`milestone-title-${milestone.id}`} className="block text-xs font-medium text-night">
                      Milestone title
                    </label>
                    <input
                      id={`milestone-title-${milestone.id}`}
                      name="milestoneTitle"
                      defaultValue={milestone.title}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-golden"
                    />
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm text-night">
                        <input
                          type="checkbox"
                          name={`milestoneCompleted-${milestone.id}`}
                          defaultChecked={milestone.isCompleted}
                        />
                        Completed
                      </label>

                      {confirmedMilestoneRemovals[milestone.id] ? (
                        <div className="rounded-xl border border-[#F59E0B]/45 bg-[#FEF3C7]/60 px-3 py-2">
                          <p className="text-sm font-semibold text-[#7C2D12]">Milestone will be removed on save.</p>
                          <button
                            type="button"
                            className="mt-2 min-h-[36px] rounded-lg border border-[#F59E0B]/45 bg-white px-3 text-xs font-semibold text-[#7C2D12] hover:bg-[#FFF7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                            onClick={() => {
                              setConfirmedMilestoneRemovals((current) => ({
                                ...current,
                                [milestone.id]: false,
                              }));
                              setPendingMilestoneRemovalId(null);
                            }}
                          >
                            Undo remove
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-midnight/15 bg-white p-2">
                          <button
                            type="button"
                            className="min-h-[44px] w-full inline-flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#7C2D12] transition-colors duration-200 hover:bg-[#FEF3C7]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                            onClick={() =>
                              setPendingMilestoneRemovalId((current) =>
                                current === milestone.id ? null : milestone.id,
                              )
                            }
                            aria-expanded={pendingMilestoneRemovalId === milestone.id}
                            aria-controls={`confirm-remove-milestone-${milestone.id}`}
                          >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#F59E0B]/45 bg-[#FFF7E8]">
                              <RemoveMilestoneIcon />
                            </span>
                            <span>Remove milestone</span>
                          </button>

                          <div
                            id={`confirm-remove-milestone-${milestone.id}`}
                            className={`overflow-hidden transition-all duration-200 motion-reduce:transition-none ${
                              pendingMilestoneRemovalId === milestone.id
                                ? "max-h-40 opacity-100 mt-2"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="rounded-lg border border-[#F59E0B]/40 bg-[#FEF3C7]/55 px-3 py-2">
                              <p className="text-xs text-[#7C2D12]">
                                Remove this milestone from the aspiration after you save changes?
                              </p>
                              <div className="mt-2 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  className="min-h-[36px] rounded-lg border border-[#F59E0B]/45 bg-white px-3 text-xs font-semibold text-[#7C2D12] hover:bg-[#FFF7E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                  onClick={() => setPendingMilestoneRemovalId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="min-h-[36px] rounded-lg bg-[#7C2D12] px-3 text-xs font-semibold text-white hover:bg-[#6A250F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                                  onClick={() => {
                                    setConfirmedMilestoneRemovals((current) => ({
                                      ...current,
                                      [milestone.id]: true,
                                    }));
                                    setPendingMilestoneRemovalId(null);
                                  }}
                                >
                                  Continue
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                name="newMilestone1"
                placeholder="New milestone 1"
                defaultValue={actionData?.values?.newMilestone1 ?? ""}
                className="min-h-[44px] rounded-xl border border-mist px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-golden"
              />
              <input
                name="newMilestone2"
                placeholder="New milestone 2"
                defaultValue={actionData?.values?.newMilestone2 ?? ""}
                className="min-h-[44px] rounded-xl border border-mist px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-golden"
              />
              <input
                name="newMilestone3"
                placeholder="New milestone 3"
                defaultValue={actionData?.values?.newMilestone3 ?? ""}
                className="min-h-[44px] rounded-xl border border-mist px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-golden"
              />
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" className="btn-primary min-h-[44px]" disabled={isSubmitting} aria-busy={isSubmitting}>
              Save changes
            </button>
            <Link
              to={`/aspirations/${aspiration.id}`}
              className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </section>
    </main>
  );
}
