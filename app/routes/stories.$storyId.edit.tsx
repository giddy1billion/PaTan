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
import { SubmitButton } from "~/components/ui";
import { requireUser } from "~/utils/auth.server";
import {
  buildLocalStorySuggestion,
  generateAiStorySuggestion,
  normalizeAiSuggestionType,
} from "~/utils/ai.server";
import { db } from "~/utils/db.server";
import { createNotification } from "~/utils/notifications.server";
import { enforceAuthRateLimit } from "~/utils/rate-limit.server";

type ActionData = {
  error?: string;
  success?: string;
  aiSuggestion?: string;
  values?: {
    title: string;
    content: string;
    category: string;
    tags: string;
    privacy: string;
    anonymous: string;
    contentWarning: string;
    status: string;
  };
};

function normalizeTag(input: string) {
  return input.trim().toLowerCase();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parseTags(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => normalizeTag(value))
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

function estimateReadingTime(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 200));
}

function toStoryPrivacy(input: string, isAnonymous: boolean) {
  if (isAnonymous) {
    return "ANONYMOUS" as const;
  }

  if (input === "followers") {
    return "FOLLOWERS_ONLY" as const;
  }

  if (input === "private") {
    return "PRIVATE" as const;
  }

  return "PUBLIC" as const;
}

function fromStoryPrivacy(input: string) {
  if (input === "FOLLOWERS_ONLY") {
    return "followers";
  }

  if (input === "PRIVATE") {
    return "private";
  }

  return "public";
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Edit Story | PaTan" }];
  }

  return [
    { title: `Edit ${data.story.title} | PaTan` },
    {
      name: "description",
      content: "Update your story while keeping version history and safe visibility controls.",
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const storyParam = params.storyId?.trim();

  if (!storyParam) {
    throw new Response("Story not found", { status: 404 });
  }

  const [story, categories] = await Promise.all([
    db.story.findFirst({
      where: {
        OR: [{ id: storyParam }, { slug: storyParam }],
        authorId: sessionUser.id,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        categoryId: true,
        excerpt: true,
        privacy: true,
        isAnonymous: true,
        contentWarning: true,
        status: true,
        version: true,
        publishedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!story) {
    throw new Response("Story not found", { status: 404 });
  }

  return { story, categories };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const storyParam = params.storyId?.trim();
  const formData = await request.formData();
  const rawAction = String(formData.get("action") ?? "").trim().toLowerCase();
  const selectedSuggestionType = formData.get("suggestionType");
  const intent = rawAction || (selectedSuggestionType ? "ai-suggest" : "save");
  const suggestionType = normalizeAiSuggestionType(selectedSuggestionType);

  const values = {
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    tags: String(formData.get("tags") ?? ""),
    privacy: String(formData.get("privacy") ?? "public"),
    anonymous: String(formData.get("anonymous") ?? ""),
    contentWarning: String(formData.get("contentWarning") ?? ""),
    status: String(formData.get("status") ?? "PUBLISHED"),
  };

  if (!storyParam) {
    return { error: "Story reference is missing.", values } satisfies ActionData;
  }

  if (intent === "ai-suggest") {
    if (!values.content) {
      return {
        error: "Add a few sentences so AI can tailor a useful suggestion.",
        values,
      } satisfies ActionData;
    }

    const rateLimitResult = await enforceAuthRateLimit({
      request,
      scope: "ai-suggest",
      identifier: sessionUser.email,
    });

    if (!rateLimitResult.allowed) {
      return {
        error: `Too many AI requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
        values,
      } satisfies ActionData;
    }

    const aiResult = await generateAiStorySuggestion({
      suggestionType,
      title: values.title,
      content: values.content,
    });

    const suggestion = aiResult.ok
      ? aiResult.suggestion
      : buildLocalStorySuggestion(suggestionType, values.title, values.content);

    await createNotification({
      userId: sessionUser.id,
      type: "AI_SUGGESTION",
      title: aiResult.ok ? "AI writing suggestion ready" : "AI writing suggestion ready (fallback mode)",
      body: suggestion.slice(0, 180),
      resourceType: "story_draft",
      data: {
        suggestionType,
        fallbackUsed: !aiResult.ok,
        requestId: aiResult.ok ? aiResult.metadata.requestId : aiResult.requestId,
        endpoint: aiResult.ok ? aiResult.metadata.endpoint : null,
        endpointKind: aiResult.ok ? aiResult.metadata.endpointKind : null,
        model: aiResult.ok ? aiResult.metadata.model : null,
        upstreamError: aiResult.ok ? null : aiResult.message,
      },
    });

    return {
      success: "AI suggestion generated.",
      aiSuggestion: suggestion,
      values,
    } satisfies ActionData;
  }

  if (!values.title || !values.content || !values.category) {
    return {
      error: "Title, category, and story content are required.",
      values,
    } satisfies ActionData;
  }

  const [story, category] = await Promise.all([
    db.story.findFirst({
      where: {
        OR: [{ id: storyParam }, { slug: storyParam }],
        authorId: sessionUser.id,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        excerpt: true,
        version: true,
        categoryId: true,
        privacy: true,
        isAnonymous: true,
        contentWarning: true,
        status: true,
        publishedAt: true,
      },
    }),
    db.category.findFirst({
      where: {
        OR: [{ id: values.category }, { name: values.category }, { slug: slugify(values.category) }],
      },
      select: { id: true },
    }),
  ]);

  if (!story) {
    return { error: "Story not found.", values } satisfies ActionData;
  }

  if (!category) {
    return { error: "Selected category is no longer available.", values } satisfies ActionData;
  }

  const normalizedTags = parseTags(values.tags);
  const isAnonymous = values.anonymous === "on";
  const hasContentWarning = values.contentWarning === "on";
  const status = values.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const words = values.content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasVersionChange =
    story.title !== values.title ||
    story.content !== values.content ||
    (story.excerpt ?? "") !== values.content.slice(0, 220);

  await db.$transaction(async (tx) => {
    const tagIds: string[] = [];

    for (const tagName of normalizedTags) {
      const tagSlug = slugify(tagName);
      if (!tagSlug) {
        continue;
      }

      const tag = await tx.tag.upsert({
        where: { slug: tagSlug },
        update: {
          usageCount: {
            increment: 1,
          },
        },
        create: {
          name: tagName,
          slug: tagSlug,
          usageCount: 1,
        },
        select: { id: true },
      });

      tagIds.push(tag.id);
    }

    if (hasVersionChange) {
      await tx.storyVersion.create({
        data: {
          storyId: story.id,
          version: story.version + 1,
          title: story.title,
          content: story.content,
          excerpt: story.excerpt,
          changedBy: sessionUser.id,
          changeLog: "Story content edited",
        },
      });
    }

    await tx.story.update({
      where: { id: story.id },
      data: {
        title: values.title,
        content: values.content,
        excerpt: values.content.slice(0, 220),
        categoryId: category.id,
        status,
        privacy: toStoryPrivacy(values.privacy, isAnonymous),
        isAnonymous,
        wordCount,
        readingTimeMinutes: estimateReadingTime(wordCount),
        contentWarning: hasContentWarning ? "self-marked" : null,
        publishedAt: status === "PUBLISHED" ? story.publishedAt ?? new Date() : null,
        version: hasVersionChange ? story.version + 1 : story.version,
      },
    });

    await tx.storyTag.deleteMany({
      where: { storyId: story.id },
    });

    if (tagIds.length > 0) {
      await tx.storyTag.createMany({
        data: tagIds.map((tagId) => ({
          storyId: story.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }
  });

  return redirect(`/stories/${story.slug}?updated=1`);
}

export default function StoryEditRoute() {
  const { story, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [showAIPanel, setShowAIPanel] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const submittingAiSuggestion =
    navigation.state === "submitting" && Boolean(navigation.formData?.get("suggestionType"));

  const selectedCategory = actionData?.values?.category ?? story.categoryId;
  const privacy = actionData?.values?.privacy ?? fromStoryPrivacy(story.privacy);
  const isAnonymous =
    (actionData?.values?.anonymous ?? (story.isAnonymous ? "on" : "off")) === "on";

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-bold text-midnight">Edit story</h1>
          <Link
            to={`/stories/${story.slug}`}
            className="min-h-[44px] inline-flex items-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-semibold text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
          >
            Back to story
          </Link>
        </div>

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

        <Form method="post" className="mt-6 space-y-6 rounded-2xl border border-midnight/10 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="story-title" className="block text-sm font-medium text-night">
              Title
            </label>
            <input
              id="story-title"
              name="title"
              required
              maxLength={100}
              defaultValue={actionData?.values?.title ?? story.title}
              className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="story-content" className="block text-sm font-medium text-night">
                Content
              </label>
              <button
                type="button"
                onClick={() => setShowAIPanel((current) => !current)}
                className="text-sm text-[#2E6F40] hover:text-[#0D2B45] flex items-center gap-1 rounded-lg px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942]"
                aria-expanded={showAIPanel}
                aria-controls="ai-assistant-panel-edit"
              >
                AI Assistance
              </button>
            </div>
            <textarea
              id="story-content"
              name="content"
              required
              rows={12}
              defaultValue={actionData?.values?.content ?? story.content}
              className="mt-1 block w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />

            {(showAIPanel || actionData?.aiSuggestion) && (
              <div
                id="ai-assistant-panel-edit"
                className="mt-4 rounded-xl border border-[#B8E3F3] bg-[#EDF6FB] px-4 py-4 sm:px-5"
              >
                <h3 className="text-sm font-semibold text-[#0D2B45]">AI Writing Assistant</h3>
                <p className="mt-2 text-sm text-[#334155]">
                  Get optional guidance while preserving your authentic voice.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    name="suggestionType"
                    value="grammar"
                    formNoValidate
                    className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                  >
                    Improve grammar
                  </button>
                  <button
                    type="submit"
                    name="suggestionType"
                    value="structure"
                    formNoValidate
                    className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                  >
                    Suggest structure
                  </button>
                  <button
                    type="submit"
                    name="suggestionType"
                    value="title"
                    formNoValidate
                    className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                  >
                    Generate title ideas
                  </button>
                  <button
                    type="submit"
                    name="suggestionType"
                    value="reflection"
                    formNoValidate
                    className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                  >
                    Add reflection prompts
                  </button>
                </div>

                {submittingAiSuggestion ? (
                  <p className="mt-3 text-xs text-[#475569]" role="status" aria-live="polite">
                    Generating AI suggestion...
                  </p>
                ) : null}

                {actionData?.aiSuggestion ? (
                  <div className="mt-4 rounded-xl border border-[#B8E3F3] bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Suggested guidance
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#334155]">{actionData.aiSuggestion}</p>
                  </div>
                ) : null}

                <p className="mt-3 text-xs text-[#64748B]">
                  AI suggestions are optional. Your authentic voice leads the story.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="story-category" className="block text-sm font-medium text-night">
                Category
              </label>
              <select
                id="story-category"
                name="category"
                defaultValue={selectedCategory}
                className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="story-status" className="block text-sm font-medium text-night">
                Status
              </label>
              <select
                id="story-status"
                name="status"
                defaultValue={actionData?.values?.status ?? story.status}
                className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-golden"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="story-tags" className="block text-sm font-medium text-night">
              Tags (comma-separated)
            </label>
            <input
              id="story-tags"
              name="tags"
              defaultValue={
                actionData?.values?.tags ?? story.tags.map((item) => item.tag.name).join(", ")
              }
              className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-night">Visibility</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="rounded-xl border border-mist px-3 py-3 text-sm text-night">
                <input type="radio" name="privacy" value="public" defaultChecked={privacy === "public"} className="mr-2" />
                Public
              </label>
              <label className="rounded-xl border border-mist px-3 py-3 text-sm text-night">
                <input type="radio" name="privacy" value="followers" defaultChecked={privacy === "followers"} className="mr-2" />
                Followers only
              </label>
              <label className="rounded-xl border border-mist px-3 py-3 text-sm text-night">
                <input type="radio" name="privacy" value="private" defaultChecked={privacy === "private"} className="mr-2" />
                Private
              </label>
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm text-night">
              <input type="checkbox" name="anonymous" defaultChecked={isAnonymous} />
              Publish anonymously
            </label>
            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm text-night">
              <input
                type="checkbox"
                name="contentWarning"
                defaultChecked={
                  (actionData?.values?.contentWarning ?? (story.contentWarning ? "on" : "off")) === "on"
                }
              />
              Add content warning
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <SubmitButton
              name="action"
              value="save"
              className="btn-primary min-h-[44px]"
              busy={isSubmitting && !submittingAiSuggestion}
              pendingLabel="Saving..."
            >
              Save changes
            </SubmitButton>
            <Link
              to={`/stories/${story.slug}`}
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
