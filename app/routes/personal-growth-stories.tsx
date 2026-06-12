import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    {
      title: "Personal Growth Stories | Journeys of Self-Improvement | PaTan™",
    },
    {
      name: "description",
      content:
        "Read inspiring personal growth stories from people on journeys of self-improvement. Discover how others achieved their goals and became their best selves.",
    },
    {
      name: "keywords",
      content:
        "personal growth stories, self-improvement stories, personal development testimonies, growth mindset stories, becoming better, self-help stories, life improvement",
    },
    {
      property: "og:title",
      content: "Personal Growth Stories | Journeys of Self-Improvement",
    },
    {
      property: "og:description",
      content:
        "Read inspiring personal growth stories from people on journeys of self-improvement.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

const featuredStories = [
  {
    id: "1",
    title: "How Reading Changed My Life",
    excerpt:
      "One book a week for two years transformed how I think, work, and relate to others...",
    author: "Kevin L.",
    readTime: "5 min",
    reactions: 678,
  },
  {
    id: "2",
    title: "From Procrastinator to Early Riser",
    excerpt:
      "The 5 AM club sounded crazy until I tried it. Here's what happened...",
    author: "Amanda R.",
    readTime: "6 min",
    reactions: 923,
  },
  {
    id: "3",
    title: "Learning to Set Boundaries",
    excerpt:
      "Saying no was the hardest thing I ever learned, and the most important...",
    author: "Jordan M.",
    readTime: "7 min",
    reactions: 812,
  },
];

const growthAreas = [
  {
    icon: "🧠",
    title: "Mindset",
    description: "Shifting perspectives and beliefs",
    count: 456,
  },
  {
    icon: "⏰",
    title: "Productivity",
    description: "Time management and focus",
    count: 389,
  },
  {
    icon: "💪",
    title: "Discipline",
    description: "Building habits that stick",
    count: 523,
  },
  {
    icon: "🗣️",
    title: "Communication",
    description: "Better relationships through words",
    count: 345,
  },
  {
    icon: "💰",
    title: "Financial",
    description: "Money management and wealth building",
    count: 278,
  },
  {
    icon: "🎯",
    title: "Goal Setting",
    description: "Dreams into actionable plans",
    count: 412,
  },
];

export default function PersonalGrowthStories() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-forest/90 to-midnight text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/patterns/growth.svg')] bg-repeat opacity-10" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">
            🌱
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Personal Growth <span className="text-golden">Stories</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Real stories from people committed to becoming their best selves.
            Find inspiration for your own journey of growth.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discover?category=personal-growth"
              className="btn-primary text-lg px-8 py-4"
            >
              Explore Growth Stories
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

      {/* Growth Areas */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Stories by Growth Area
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {growthAreas.map((area) => (
              <Link
                key={area.title}
                to={`/discover?category=personal-growth&tag=${area.title.toLowerCase()}`}
                className="p-6 bg-white rounded-xl border border-mist hover:border-forest hover:shadow-md transition-all"
              >
                <span className="text-3xl" aria-hidden="true">
                  {area.icon}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold text-midnight">
                  {area.title}
                </h3>
                <p className="mt-1 text-sm text-night/70">{area.description}</p>
                <p className="mt-3 text-xs text-night/50">
                  {area.count} stories
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Growth Stories
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
              to="/discover?category=personal-growth"
              className="btn-secondary"
            >
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Growth Framework */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            The Growth Journey
          </h2>
          <div className="mt-12 relative">
            <div
              className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-forest to-golden"
              aria-hidden="true"
            />
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Awareness",
                  description: "Recognizing the need for change",
                },
                {
                  step: "2",
                  title: "Decision",
                  description: "Committing to growth",
                },
                {
                  step: "3",
                  title: "Action",
                  description: "Taking consistent steps forward",
                },
                {
                  step: "4",
                  title: "Reflection",
                  description: "Learning from experiences",
                },
                {
                  step: "5",
                  title: "Sharing",
                  description: "Helping others on their journey",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start pl-4">
                  <div className="relative z-10 w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-midnight">
                      {item.title}
                    </h3>
                    <p className="text-night/70">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-forest text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl italic">
            "The only person you are destined to become is the person you decide
            to be."
          </blockquote>
          <cite className="mt-4 block text-dawn/70">Ralph Waldo Emerson</cite>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Document Your Growth Journey
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            Writing about your growth helps you process it, and might inspire
            someone else to start their own journey.
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
