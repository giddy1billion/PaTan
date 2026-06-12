import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, useActionData, useLoaderData, useNavigation, useRouteLoaderData } from 'react-router';
import { requireUser } from '~/utils/auth.server';
import { verifyCsrfToken } from '~/utils/csrf.server';
import { db } from '~/utils/db.server';
import {
  createMentionNotifications,
  createNotification,
  resolveMentionedUsers,
} from '~/utils/notifications.server';

type ActionData = {
  error?: string;
  success?: string;
  values?: {
    content: string;
  };
};

type ReactionType = 'CELEBRATE' | 'UPLIFT' | 'EMPATHY' | 'GRATITUDE' | 'INSPIRE';

const reactionOptions: Array<{ type: ReactionType; label: string }> = [
  { type: 'CELEBRATE', label: 'Celebrate' },
  { type: 'UPLIFT', label: 'Uplift' },
  { type: 'EMPATHY', label: 'Empathy' },
  { type: 'GRATITUDE', label: 'Gratitude' },
  { type: 'INSPIRE', label: 'Inspire' },
];

function parseReactionType(input: string): ReactionType | null {
  if (
    input === 'CELEBRATE' ||
    input === 'UPLIFT' ||
    input === 'EMPATHY' ||
    input === 'GRATITUDE' ||
    input === 'INSPIRE'
  ) {
    return input;
  }

  return null;
}

function formatDate(value: Date | null) {
  if (!value) {
    return 'Recently';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: 'Story | PaTan' },
      { name: 'description', content: 'Read and reflect on an inspiring community story.' },
    ];
  }

  return [
    { title: `${data.story.title} | PaTan` },
    {
      name: 'description',
      content: data.story.excerpt || `Read ${data.story.author.displayName}'s story on PaTan.`,
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const storyParam = params.storyId?.trim();

  if (!storyParam) {
    throw new Response('Story not found', { status: 404 });
  }

  const story = await db.story.findFirst({
    where: {
      deletedAt: null,
      status: 'PUBLISHED',
      OR: [{ id: storyParam }, { slug: storyParam }],
      AND: {
        OR: [{ privacy: 'PUBLIC' }, { authorId: sessionUser.id }],
      },
    },
    select: {
      id: true,
      title: true,
      authorId: true,
      content: true,
      excerpt: true,
      readingTimeMinutes: true,
      publishedAt: true,
      reactionCount: true,
      commentCount: true,
      category: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
      author: {
        select: {
          username: true,
          displayName: true,
          city: true,
          country: true,
          profilePhotoUrl: true,
        },
      },
    },
  });

  if (!story) {
    throw new Response('Story not found', { status: 404 });
  }

  const [reflections, storyDraftsCount, activeAspirationsCount, savedStoriesCount, authoredStoriesCount, privateReflectionCount, recentAspirations, recentPrivateReflections, userReaction] = await Promise.all([
    db.comment.findMany({
      where: {
        storyId: story.id,
        deletedAt: null,
        parentId: null,
      },
      take: 8,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    db.story.count({
      where: {
        authorId: sessionUser.id,
        deletedAt: null,
        status: 'DRAFT',
      },
    }),
    db.aspiration.count({
      where: {
        authorId: sessionUser.id,
        deletedAt: null,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    }),
    db.savedStory.count({
      where: {
        userId: sessionUser.id,
      },
    }),
    db.story.count({
      where: {
        authorId: sessionUser.id,
        deletedAt: null,
      },
    }),
    db.reflectionEntry.count({
      where: {
        userId: sessionUser.id,
      },
    }),
    db.aspiration.findMany({
      where: {
        authorId: sessionUser.id,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    }),
    db.reflectionEntry.findMany({
      where: {
        userId: sessionUser.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    }),
    db.reaction.findFirst({
      where: {
        storyId: story.id,
        userId: sessionUser.id,
      },
      select: {
        type: true,
      },
    }),
  ]);

  return {
    story,
    reflections,
    userReactionType: userReaction?.type ?? null,
    workspace: {
      storyDraftsCount,
      activeAspirationsCount,
      savedStoriesCount,
      authoredStoriesCount,
      privateReflectionCount,
      recentAspirations,
      recentPrivateReflections,
    },
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const storyParam = params.storyId?.trim();

  if (!storyParam) {
    return {
      error: 'Invalid story reference.',
      values: {
        content: String((await request.formData()).get('content') ?? ''),
      },
    } satisfies ActionData;
  }

  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? 'share-reflection');
  const csrfToken = String(formData.get('csrfToken') ?? '');
  const content = String(formData.get('content') ?? '').trim();
  const reactionTypeInput = String(formData.get('reactionType') ?? '').trim().toUpperCase();

  const hasValidCsrf = await verifyCsrfToken({
    request,
    submittedToken: csrfToken,
  });

  if (!hasValidCsrf) {
    return {
      error: 'Your session could not be verified. Please refresh and try again.',
      values: { content },
    } satisfies ActionData;
  }

  if (!content) {
    return {
      error: 'Please write your reflection before submitting.',
      values: { content },
    } satisfies ActionData;
  }

  if (content.length > 1200) {
    return {
      error: 'Reflection must be 1200 characters or fewer.',
      values: { content },
    } satisfies ActionData;
  }

  const story = await db.story.findFirst({
    where: {
      deletedAt: null,
      status: 'PUBLISHED',
      OR: [{ id: storyParam }, { slug: storyParam }],
      AND: {
        OR: [{ privacy: 'PUBLIC' }, { authorId: sessionUser.id }],
      },
    },
    select: {
      id: true,
      title: true,
      authorId: true,
    },
  });

  if (!story) {
    return {
      error: 'This story is no longer available for reflections.',
      values: { content },
    } satisfies ActionData;
  }

  if (intent === 'react-story') {
    const reactionType = parseReactionType(reactionTypeInput);

    if (!reactionType) {
      return {
        error: 'Select a valid reaction before submitting.',
        values: { content: '' },
      } satisfies ActionData;
    }

    const existingReactions = await db.reaction.findMany({
      where: {
        storyId: story.id,
        userId: sessionUser.id,
      },
      select: {
        id: true,
        type: true,
      },
    });

    const hasSameReaction = existingReactions.some((entry) => entry.type === reactionType);

    if (hasSameReaction) {
      await db.$transaction([
        db.reaction.deleteMany({
          where: {
            storyId: story.id,
            userId: sessionUser.id,
            type: reactionType,
          },
        }),
        db.story.updateMany({
          where: {
            id: story.id,
            reactionCount: {
              gt: 0,
            },
          },
          data: {
            reactionCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return {
        success: 'Your reaction was removed.',
        values: { content: '' },
      } satisfies ActionData;
    }

    const txOps = [] as Array<ReturnType<typeof db.reaction.create> | ReturnType<typeof db.reaction.deleteMany> | ReturnType<typeof db.story.update>>;

    if (existingReactions.length > 0) {
      txOps.push(
        db.reaction.deleteMany({
          where: {
            storyId: story.id,
            userId: sessionUser.id,
          },
        }),
      );
    } else {
      txOps.push(
        db.story.update({
          where: { id: story.id },
          data: {
            reactionCount: {
              increment: 1,
            },
          },
        }),
      );
    }

    txOps.push(
      db.reaction.create({
        data: {
          storyId: story.id,
          userId: sessionUser.id,
          type: reactionType,
        },
      }),
    );

    await db.$transaction(txOps);

    if (story.authorId !== sessionUser.id) {
      await createNotification({
        userId: story.authorId,
        actorId: sessionUser.id,
        type: 'STORY_REACTION',
        title: 'Your story received a reaction',
        body: `Someone reacted to ${story.title}.`,
        resourceId: story.id,
        resourceType: 'story',
        data: {
          reactionType,
          storyId: story.id,
        },
      });
    }

    return {
      success: 'Reaction saved.',
      values: { content: '' },
    } satisfies ActionData;
  }

  if (!content) {
    return {
      error: 'Please write your reflection before submitting.',
      values: { content },
    } satisfies ActionData;
  }

  if (content.length > 1200) {
    return {
      error: 'Reflection must be 1200 characters or fewer.',
      values: { content },
    } satisfies ActionData;
  }

  if (intent === 'save-private-reflection') {
    await db.reflectionEntry.create({
      data: {
        userId: sessionUser.id,
        title: `Reflection on ${story.title}`,
        content,
        gratitudes: [],
        isPrivate: true,
      },
    });

    return {
      success: 'Private reflection saved to your journal.',
      values: {
        content: '',
      },
    } satisfies ActionData;
  }

  const mentionedUsers = await resolveMentionedUsers(content, [sessionUser.id, story.authorId]);

  await db.$transaction([
    db.comment.create({
      data: {
        storyId: story.id,
        authorId: sessionUser.id,
        content,
      },
    }),
    db.story.update({
      where: { id: story.id },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    }),
  ]);

  if (story.authorId !== sessionUser.id) {
    await createNotification({
      userId: story.authorId,
      actorId: sessionUser.id,
      type: 'STORY_COMMENT',
      title: 'New story reflection',
      body: content.slice(0, 180),
      resourceId: story.id,
      resourceType: 'story',
      data: {
        storyId: story.id,
      },
    });
  }

  if (mentionedUsers.length > 0) {
    await createMentionNotifications({
      mentionedUserIds: mentionedUsers.map((user) => user.id),
      actorId: sessionUser.id,
      title: 'You were mentioned in a story reflection',
      body: content.slice(0, 180),
      resourceId: story.id,
      resourceType: 'story',
      data: {
        storyId: story.id,
      },
      excludeUserIds: [story.authorId],
    });
  }

  return {
    success: 'Reflection shared successfully.',
    values: {
      content: '',
    },
  } satisfies ActionData;
}

export default function StoryDetailRoute() {
  const rootData = useRouteLoaderData<{ csrfToken?: string; csrfFieldName?: string }>('root');
  const { story, reflections, userReactionType, workspace } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();

  const csrfToken = rootData?.csrfToken ?? '';
  const csrfFieldName = rootData?.csrfFieldName ?? 'csrfToken';
  const isSubmitting = navigation.state === 'submitting';

  const locationText = [story.author.city, story.author.country].filter(Boolean).join(', ');
  const reflectionDraft = actionData?.values?.content ?? '';

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),22rem]">
          <section aria-labelledby="story-title" className="rounded-3xl border border-midnight/10 bg-white p-6 sm:p-8 shadow-sm">
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 bg-golden/10 text-golden text-sm font-medium rounded-full">
                {story.category.name}
              </span>
            </div>

            <h1 id="story-title" className="mt-6 font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight text-center leading-tight">
              {story.title}
            </h1>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-night/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white font-bold overflow-hidden">
                  {story.author.profilePhotoUrl ? (
                    <img src={story.author.profilePhotoUrl} alt={`Profile avatar for ${story.author.displayName}`} className="w-full h-full object-cover" />
                  ) : (
                    story.author.displayName.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-medium text-midnight">{story.author.displayName}</p>
                  <p>{locationText || 'PaTan community'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span>{story.readingTimeMinutes} min read</span>
                <span aria-hidden="true">|</span>
                <time dateTime={story.publishedAt?.toISOString()}>{formatDate(story.publishedAt)}</time>
              </div>
            </div>

            <div className="mt-10 prose prose-lg max-w-none">
              {story.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-night/85 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {story.tags.map((tagLink) => (
                <Link
                  key={tagLink.tag.name}
                  to={`/discover?tag=${encodeURIComponent(tagLink.tag.name)}`}
                  className="px-3 py-1 bg-mist text-night/70 text-sm rounded-full hover:bg-mist/70 transition-colors"
                >
                  #{tagLink.tag.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-midnight/10 bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-night/70">
                <span>{story.reactionCount} reactions</span>
                <span>{story.commentCount} reflections</span>
                <Link
                  to={`/u/${story.author.username}`}
                  className="font-semibold text-forest hover:text-midnight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                >
                  View author profile
                </Link>
              </div>

              <Form method="post" className="mt-3 flex flex-wrap gap-2" aria-label="Story reactions">
                <input type="hidden" name="intent" value="react-story" />
                <input type="hidden" name={csrfFieldName} value={csrfToken} />
                {reactionOptions.map((option) => {
                  const isActive = userReactionType === option.type;
                  return (
                    <button
                      key={option.type}
                      type="submit"
                      name="reactionType"
                      value={option.type}
                      className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${isActive ? 'bg-golden text-midnight' : 'border border-midnight/15 bg-white text-midnight hover:bg-surface'}`}
                      aria-pressed={isActive}
                      disabled={isSubmitting}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </Form>
            </div>

            <section className="mt-10" aria-labelledby="reflections-heading">
              <h2 id="reflections-heading" className="font-heading text-2xl font-bold text-midnight">
                Reflections
              </h2>

              <div className="mt-4 rounded-2xl border border-midnight/10 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-midnight">Share or save your reflection</h3>

                {actionData?.error ? (
                  <p className="mt-3 rounded-lg border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-3 py-2 text-sm text-[#7C2D12]" role="alert">
                    {actionData.error}
                  </p>
                ) : null}

                {actionData?.success ? (
                  <p className="mt-3 rounded-lg border border-forest/30 bg-[#ECF9F0] px-3 py-2 text-sm text-forest" role="status" aria-live="polite">
                    {actionData.success}
                  </p>
                ) : null}

                <Form method="post" className="mt-3 space-y-3">
                  <input type="hidden" name="storyId" value={story.id} />
                  <input type="hidden" name={csrfFieldName} value={csrfToken} />
                  <label htmlFor="content" className="sr-only">Your reflection</label>
                  <textarea
                    id="content"
                    name="content"
                    rows={4}
                    maxLength={1200}
                    defaultValue={reflectionDraft}
                    className="w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    placeholder="What touched you in this story?"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      name="intent"
                      value="save-private-reflection"
                      className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-medium text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save private reflection'}
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="share-reflection"
                      className="btn-primary min-h-[44px] px-5 py-2.5 text-sm"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? 'Sharing...' : 'Share reflection'}
                    </button>
                  </div>
                </Form>
              </div>

              <ul className="mt-5 space-y-3" role="list">
                {reflections.length === 0 ? (
                  <li className="rounded-xl border border-midnight/10 bg-white p-4 text-sm text-night/70">
                    No reflections yet. Be the first to encourage this storyteller.
                  </li>
                ) : (
                  reflections.map((reflection) => (
                    <li key={reflection.id} className="rounded-xl border border-midnight/10 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-midnight">{reflection.author.displayName}</p>
                        <span className="text-xs text-night/60">{formatShortDate(reflection.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-night/80 leading-relaxed">{reflection.content}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </section>

          <aside className="space-y-4" aria-label="Story workspace">
            <section className="rounded-3xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-golden font-semibold">My Workspace</p>
              <h2 className="mt-2 font-heading text-2xl text-midnight">Dashboard Panel</h2>
              <p className="mt-2 text-sm text-night/70">
                Manage your active features while you read and reflect.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <article className="rounded-xl border border-midnight/10 bg-surface p-3">
                  <p className="text-xs text-night/60 uppercase tracking-wide">My stories</p>
                  <p className="mt-1 text-xl font-bold text-midnight">{workspace.authoredStoriesCount}</p>
                </article>
                <article className="rounded-xl border border-midnight/10 bg-surface p-3">
                  <p className="text-xs text-night/60 uppercase tracking-wide">Drafts</p>
                  <p className="mt-1 text-xl font-bold text-midnight">{workspace.storyDraftsCount}</p>
                </article>
                <article className="rounded-xl border border-midnight/10 bg-surface p-3">
                  <p className="text-xs text-night/60 uppercase tracking-wide">Aspirations</p>
                  <p className="mt-1 text-xl font-bold text-midnight">{workspace.activeAspirationsCount}</p>
                </article>
                <article className="rounded-xl border border-midnight/10 bg-surface p-3">
                  <p className="text-xs text-night/60 uppercase tracking-wide">Journal</p>
                  <p className="mt-1 text-xl font-bold text-midnight">{workspace.privateReflectionCount}</p>
                </article>
              </div>

              <nav className="mt-5 grid gap-2" aria-label="Workspace quick actions">
                <Link to="/dashboard" className="btn-primary min-h-[44px] inline-flex items-center justify-center text-sm">Open dashboard</Link>
                <Link to="/profile" className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">Manage profile</Link>
                <Link to="/profile/edit" className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">Public profile settings</Link>
                <Link to="/aspirations/new" className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">Create aspiration</Link>
              </nav>
            </section>

            <section className="rounded-3xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm" aria-labelledby="recent-aspirations-heading">
              <h2 id="recent-aspirations-heading" className="font-heading text-xl text-midnight">Recent aspirations</h2>
              {workspace.recentAspirations.length === 0 ? (
                <p className="mt-3 text-sm text-night/70">No aspirations yet. Start one to track your next milestone.</p>
              ) : (
                <ul className="mt-3 space-y-3" role="list">
                  {workspace.recentAspirations.map((aspiration) => (
                    <li key={aspiration.id} className="rounded-xl border border-midnight/10 p-3">
                      <p className="text-sm font-medium text-midnight">{aspiration.title}</p>
                      <p className="mt-1 text-xs text-night/60">
                        {formatStatus(aspiration.status)} | {formatShortDate(aspiration.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm" aria-labelledby="recent-journal-heading">
              <h2 id="recent-journal-heading" className="font-heading text-xl text-midnight">Private journal</h2>
              {workspace.recentPrivateReflections.length === 0 ? (
                <p className="mt-3 text-sm text-night/70">No private reflections yet. Save one after reading this story.</p>
              ) : (
                <ul className="mt-3 space-y-3" role="list">
                  {workspace.recentPrivateReflections.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-midnight/10 p-3">
                      <p className="text-sm font-medium text-midnight">{entry.title?.trim() || 'Reflection entry'}</p>
                      <p className="mt-1 text-xs text-night/70 line-clamp-2">{entry.content}</p>
                      <p className="mt-1 text-xs text-night/60">{formatShortDate(entry.updatedAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
