import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import {
  Form,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useNavigation,
  useRouteError,
  useSearchParams,
} from "react-router";
import { useEffect } from "react";
import { requireUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

const CATEGORY_ALIASES: Record<string, string> = {
  "hope-faith": "hope-and-faith",
  "health-wellness": "health-and-wellness",
  "personal-growth": "personal-triumph",
};

export const meta: MetaFunction = () => {
  return [
    { title: "Discover Stories | PaTan™" },
    {
      name: "description",
      content:
        "Discover inspiring stories of hope, transformation, and resilience from our global community.",
    },
  ];
};

function normalizeCategory(input: string | null) {
  const normalized = input?.trim().toLowerCase() || "";
  return CATEGORY_ALIASES[normalized] ?? normalized;
}

function normalizeSearchQuery(input: string | null) {
  return input?.trim().slice(0, 80) || "";
}

function normalizeTag(input: string | null) {
  const normalized = (input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);

  return normalized;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function getAvatarLabel(displayName: string, isAnonymous: boolean) {
  if (isAnonymous) {
    return "A";
  }

  return displayName.trim().slice(0, 1).toUpperCase() || "P";
}

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const selectedCategory = normalizeCategory(url.searchParams.get("category"));
  const selectedTag = normalizeTag(url.searchParams.get("tag"));
  const searchQuery = normalizeSearchQuery(url.searchParams.get("q"));
  const showOnboardingWelcome =
    url.searchParams.get("welcome") === "onboarding-complete";
  const showStoryPublishedNotice = url.searchParams.get("published") === "story";

  const discoverVisibility = {
    OR: [{ privacy: "PUBLIC" as const }, { authorId: sessionUser.id }],
  };

  const andFilters = [];

  if (selectedCategory) {
    andFilters.push({ category: { slug: selectedCategory } });
  }

  if (selectedTag) {
    andFilters.push({ tags: { some: { tag: { slug: selectedTag } } } });
  }

  if (searchQuery) {
    andFilters.push({
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" as const } },
        { excerpt: { contains: searchQuery, mode: "insensitive" as const } },
        { content: { contains: searchQuery, mode: "insensitive" as const } },
      ],
    });
  }

  const [stories, categories] = await Promise.all([
    db.story.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        ...discoverVisibility,
        ...(andFilters.length > 0 ? { AND: andFilters } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 18,
      select: {
        id: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        readingTimeMinutes: true,
        reactionCount: true,
        commentCount: true,
        isAnonymous: true,
        author: {
          select: {
            displayName: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    db.category.findMany({
      where: {
        isActive: true,
        stories: {
          some: {
            deletedAt: null,
            status: "PUBLISHED",
            ...discoverVisibility,
          },
        },
      },
      select: {
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 12,
    }),
  ]);

  return {
    stories,
    categories,
    selectedCategory,
    selectedTag,
    searchQuery,
    showOnboardingWelcome,
    showStoryPublishedNotice,
  };
}

export default function Discover() {
  const {
    stories,
    categories,
    selectedCategory,
    selectedTag,
    searchQuery,
    showOnboardingWelcome,
    showStoryPublishedNotice,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isRefreshing =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/discover";
  const hasActiveFilters = Boolean(selectedCategory || selectedTag || searchQuery);

  const categoryFilters = [
    { name: "All", value: "" },
    ...categories.map((category) => ({
      name: category.name,
      value: category.slug,
    })),
  ];

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let shouldReplace = false;

    const rawCategory = searchParams.get("category");
    const canonicalCategory = normalizeCategory(rawCategory);
    if (rawCategory && canonicalCategory && rawCategory !== canonicalCategory) {
      nextParams.set("category", canonicalCategory);
      shouldReplace = true;
    }

    const rawTag = searchParams.get("tag");
    const canonicalTag = normalizeTag(rawTag);
    if (rawTag && canonicalTag && rawTag !== canonicalTag) {
      nextParams.set("tag", canonicalTag);
      shouldReplace = true;
    }

    if (showOnboardingWelcome) {
      nextParams.delete("welcome");
      shouldReplace = true;
    }

    if (showStoryPublishedNotice) {
      nextParams.delete("published");
      shouldReplace = true;
    }

    if (!shouldReplace) {
      return;
    }

    setSearchParams(nextParams, { replace: true, preventScrollReset: true });
  }, [showOnboardingWelcome, showStoryPublishedNotice, searchParams, setSearchParams]);

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {/* Hero Section */}
      <section
        className="bg-midnight text-dawn py-16"
        aria-labelledby="discover-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            id="discover-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-center"
          >
            Discover Inspiring Stories
          </h1>
          <p className="mt-4 text-lg text-dawn/70 text-center max-w-2xl mx-auto">
            Every story here has the power to touch your heart, shift your
            perspective, or remind you that you're not alone.
          </p>

          {showOnboardingWelcome ? (
            <div
              className="mt-6 mx-auto max-w-xl rounded-xl border border-[#F5B942]/40 bg-white/95 text-midnight px-4 py-3 shadow-sm"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium">
                Welcome to PaTan. Your profile setup is complete and your feed
                is now personalized.
              </p>
            </div>
          ) : null}

          {showStoryPublishedNotice ? (
            <div
              className="mt-4 mx-auto max-w-xl rounded-xl border border-[#2E6F40]/35 bg-white/95 px-4 py-3 text-[#1F4D2C] shadow-sm"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium">
                Your story is now live. Thank you for sharing your voice with the community.
              </p>
            </div>
          ) : null}

          {/* Search */}
          <Form method="get" className="mt-8 max-w-xl mx-auto" role="search">
            {selectedCategory ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
            {selectedTag ? (
              <input type="hidden" name="tag" value={selectedTag} />
            ) : null}
            <label htmlFor="search" className="sr-only">
              Search stories
            </label>
            <div className="relative">
              <input
                id="search"
                name="q"
                type="search"
                defaultValue={searchQuery}
                placeholder="Search stories..."
                className="w-full px-5 py-4 pl-12 rounded-full bg-night/50 border border-dawn/20 text-dawn placeholder-dawn/50 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dawn/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                className="absolute right-1 top-1 min-h-[44px] rounded-full bg-golden px-4 text-midnight font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Search
              </button>
            </div>
          </Form>
          {selectedTag ? (
            <p className="mt-3 text-center text-sm text-dawn/80" role="status" aria-live="polite">
              Active tag filter: #{selectedTag}
            </p>
          ) : null}
          {hasActiveFilters ? (
            <div className="mt-4 text-center">
              <Link
                to="/discover"
                className="inline-flex min-h-[44px] items-center rounded-full border border-dawn/30 px-4 py-2 text-sm text-dawn hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                Clear filters
              </Link>
            </div>
          ) : null}
          {isRefreshing ? (
            <p className="mt-3 text-xs text-dawn/80 text-center" role="status" aria-live="polite">
              Refreshing discover feed...
            </p>
          ) : null}
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-mist bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Story categories">
            <ul
              className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 sm:mx-0 sm:px-0"
              role="list"
            >
              {categoryFilters.map((category) => (
                <li key={category.value}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCategory === category.value && !searchParams.get("welcome")) {
                        return;
                      }

                      const nextParams = new URLSearchParams(searchParams);

                      if (category.value) {
                        nextParams.set("category", category.value);
                      } else {
                        nextParams.delete("category");
                      }

                      nextParams.delete("welcome");
                      setSearchParams(nextParams, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${
                      selectedCategory === category.value
                        ? "bg-midnight text-dawn"
                        : "bg-mist/50 text-night/70 hover:bg-mist"
                    }`}
                    aria-pressed={selectedCategory === category.value}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-12" aria-busy={isRefreshing}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {stories.length === 0 ? (
            <article className="rounded-2xl border border-midnight/10 bg-white p-6 text-center shadow-sm">
              <h2 className="font-heading text-2xl text-midnight">No stories match this filter</h2>
              <p className="mt-2 text-night/70">
                Try a different category or search term to discover more community stories.
              </p>
              <div className="mt-5">
                <Link to="/discover" className="btn-secondary inline-flex min-h-[44px] items-center">
                  Show all stories
                </Link>
              </div>
            </article>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => {
                const authorName = story.isAnonymous
                  ? "Anonymous storyteller"
                  : story.author.displayName;

                return (
                  <article
                    key={story.id}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <span className="inline-block px-3 py-1 bg-golden/10 text-golden text-sm font-medium rounded-full">
                      {story.category.name}
                    </span>

                    <h2 className="mt-4 font-heading text-xl font-bold text-midnight">
                      <Link
                        to={`/stories/${story.id}`}
                        className="hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                      >
                        {story.title}
                      </Link>
                    </h2>

                    <p className="mt-2 text-night/70 line-clamp-2">
                      {story.excerpt?.trim() ||
                        "Read this community story and join the reflection."}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white text-sm font-bold">
                          {getAvatarLabel(story.author.displayName, story.isAnonymous)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-midnight truncate">
                            {authorName}
                          </p>
                          <p className="text-xs text-night/50">
                            {story.readingTimeMinutes} min read • {formatDate(story.publishedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs text-night/60">
                        <p>{story.reactionCount} reactions</p>
                        <p>{story.commentCount} reflections</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-mist/50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-midnight">
            Your Story Matters Too
          </h2>
          <p className="mt-4 text-lg text-night/70">
            Someone out there needs to hear exactly what you've been through.
            Your experience could be the light that guides their way.
          </p>
          <Link to="/stories/new" className="mt-6 btn-primary inline-block">
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ErrorBoundary() {
  const routeError = useRouteError();

  let message = "We could not load discover stories right now.";

  if (isRouteErrorResponse(routeError)) {
    message =
      routeError.status === 404
        ? "Discover stories are unavailable right now."
        : routeError.statusText || message;
  }

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-5 py-4 text-[#7C2D12]">
          <h1 className="font-heading text-2xl">Discover unavailable</h1>
          <p className="mt-2 text-sm">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/discover"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
            >
              Retry discover
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
