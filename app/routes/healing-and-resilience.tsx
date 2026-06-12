import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Healing and Resilience Stories | Recovery Journeys | PaTan™" },
    {
      name: "description",
      content:
        "Read powerful stories of healing and resilience from people who recovered from trauma, illness, loss, and hardship. Find hope in their journeys.",
    },
    {
      name: "keywords",
      content:
        "healing stories, resilience stories, recovery testimonies, trauma recovery, healing from loss, mental health recovery, emotional healing stories",
    },
    {
      property: "og:title",
      content: "Healing and Resilience Stories | Recovery Journeys",
    },
    {
      property: "og:description",
      content:
        "Read powerful stories of healing and resilience from people who recovered from trauma and hardship.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

const featuredStories = [
  {
    id: "1",
    title: "Finding Peace After Loss",
    excerpt: "Grief didn't disappear, but I learned to carry it differently...",
    author: "Catherine M.",
    readTime: "8 min",
    reactions: 1456,
  },
  {
    id: "2",
    title: "My Road to Mental Wellness",
    excerpt:
      "Depression told me I was broken. Recovery taught me I was healing...",
    author: "Anonymous",
    readTime: "7 min",
    reactions: 2134,
  },
  {
    id: "3",
    title: "Healing from Betrayal",
    excerpt:
      "Trust was shattered, but I found a way to trust again, starting with myself...",
    author: "Rachel K.",
    readTime: "6 min",
    reactions: 987,
  },
];

const healingPaths = [
  {
    icon: "💚",
    title: "Physical Healing",
    description: "Recovery from illness and injury",
  },
  {
    icon: "🧠",
    title: "Mental Health",
    description: "Depression, anxiety, and beyond",
  },
  {
    icon: "💔",
    title: "Grief & Loss",
    description: "Finding peace after goodbye",
  },
  {
    icon: "🕊️",
    title: "Trauma Recovery",
    description: "From survival to thriving",
  },
  {
    icon: "💑",
    title: "Relationship Healing",
    description: "Mending broken bonds",
  },
  {
    icon: "🌊",
    title: "Emotional Wellness",
    description: "Processing and growing",
  },
];

export default function HealingAndResilience() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-forest/80 via-midnight to-night text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-golden/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-forest/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">
            💚
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Healing and <span className="text-golden">Resilience</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Stories from people who walked through pain and found their way back
            to wholeness. Proof that healing is possible.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discover?category=health-wellness"
              className="btn-primary text-lg px-8 py-4"
            >
              Read Healing Stories
            </Link>
            <Link
              to="/stories/new"
              className="btn-secondary-dark text-lg px-8 py-4"
            >
              Share Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Content Warning */}
      <section className="py-4 bg-golden/10 border-y border-golden/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-night/70">
            <strong className="text-midnight">A gentle note:</strong> Some
            stories in this section discuss difficult topics including trauma,
            mental health struggles, and loss. Take care of yourself while
            reading.
          </p>
        </div>
      </section>

      {/* Healing Paths */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Healing Paths
          </h2>
          <p className="mt-4 text-center text-night/70">
            Everyone's journey is different. Find stories that resonate with
            yours.
          </p>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {healingPaths.map((path) => (
              <Link
                key={path.title}
                to={`/discover?category=health-wellness&tag=${path.title.toLowerCase().replace(" ", "-")}`}
                className="p-6 bg-white rounded-xl border border-mist hover:border-forest hover:shadow-md transition-all text-center"
              >
                <span className="text-4xl" aria-hidden="true">
                  {path.icon}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                  {path.title}
                </h3>
                <p className="mt-2 text-sm text-night/70">{path.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Healing Stories
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {featuredStories.map((story) => (
              <article
                key={story.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="font-heading text-xl font-bold text-midnight">
                  <Link
                    to={`/stories/${story.id}`}
                    className="hover:text-golden transition-colors"
                  >
                    {story.title}
                  </Link>
                </h3>
                <p className="mt-3 text-night/70">{story.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-night/60">
                    {story.author} · {story.readTime}
                  </span>
                  <span className="text-golden">🎉 {story.reactions}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/discover?category=health-wellness"
              className="btn-secondary"
            >
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* What Healing Looks Like */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            What These Stories Teach Us
          </h2>
          <div className="mt-12 space-y-6">
            <div className="p-6 bg-forest/5 rounded-xl border-l-4 border-forest">
              <h3 className="font-heading text-lg font-bold text-midnight">
                Healing isn't linear
              </h3>
              <p className="mt-2 text-night/70">
                There will be setbacks. Progress isn't always visible. That's
                normal.
              </p>
            </div>
            <div className="p-6 bg-forest/5 rounded-xl border-l-4 border-forest">
              <h3 className="font-heading text-lg font-bold text-midnight">
                You don't have to do it alone
              </h3>
              <p className="mt-2 text-night/70">
                Every story mentions support, friends, family, professionals,
                communities.
              </p>
            </div>
            <div className="p-6 bg-forest/5 rounded-xl border-l-4 border-forest">
              <h3 className="font-heading text-lg font-bold text-midnight">
                Time is part of the medicine
              </h3>
              <p className="mt-2 text-night/70">
                Healing takes time. These stories span months and years, not
                days.
              </p>
            </div>
            <div className="p-6 bg-forest/5 rounded-xl border-l-4 border-forest">
              <h3 className="font-heading text-lg font-bold text-midnight">
                Scars can become stories
              </h3>
              <p className="mt-2 text-night/70">
                What once hurt can become what helps others. Pain can become
                purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-12 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-xl font-bold text-midnight">
            Need Support Now?
          </h2>
          <p className="mt-4 text-night/70">
            If you're struggling, please reach out to a mental health
            professional or crisis helpline. Reading stories can provide
            comfort, but it's not a substitute for professional support.
          </p>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-forest text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl italic">
            "The wound is the place where the light enters you."
          </blockquote>
          <cite className="mt-4 block text-dawn/70">Rumi</cite>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Your Healing Story Matters
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            If you've walked through darkness and found light, sharing your
            story could be someone else's lifeline.
          </p>
          <Link
            to="/stories/new"
            className="mt-8 btn-primary inline-block text-lg px-8 py-4"
          >
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
