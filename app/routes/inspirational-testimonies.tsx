import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    {
      title:
        "Inspirational Testimonies | Real Stories of Faith and Courage | PaTan™",
    },
    {
      name: "description",
      content:
        "Read powerful testimonies from people who experienced life-changing moments of faith, courage, and divine intervention. Authentic inspirational stories.",
    },
    {
      name: "keywords",
      content:
        "inspirational testimonies, faith testimonies, real life testimonies, christian testimonies, spiritual testimonies, miracle stories, testimony sharing",
    },
    {
      property: "og:title",
      content: "Inspirational Testimonies | Real Stories of Faith and Courage",
    },
    {
      property: "og:description",
      content:
        "Read powerful testimonies from people who experienced life-changing moments.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
};

const featuredStories = [
  {
    id: "1",
    title: "When Prayer Changed Everything",
    excerpt:
      "I didn't believe in miracles until I experienced one firsthand...",
    author: "Grace A.",
    readTime: "6 min",
    reactions: 1089,
  },
  {
    id: "2",
    title: "A Voice in the Silence",
    excerpt:
      "In my darkest moment, I heard something that changed the course of my life...",
    author: "Thomas W.",
    readTime: "5 min",
    reactions: 876,
  },
  {
    id: "3",
    title: "The Stranger Who Knew My Name",
    excerpt: "Sometimes help comes from the most unexpected places...",
    author: "Sarah K.",
    readTime: "7 min",
    reactions: 1234,
  },
];

const testimonyTypes = [
  {
    icon: "🙏",
    title: "Faith Journeys",
    description: "Stories of spiritual awakening and growth",
  },
  {
    icon: "✨",
    title: "Divine Encounters",
    description: "Unexplainable moments of grace",
  },
  {
    icon: "🔄",
    title: "Redemption",
    description: "Second chances and fresh starts",
  },
  {
    icon: "💡",
    title: "Answered Prayers",
    description: "When the impossible became possible",
  },
];

export default function InspirationalTestimonies() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-midnight to-night text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-golden/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">
            ✝️
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Inspirational <span className="text-golden">Testimonies</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Authentic stories of faith, miracles, and divine encounters. These
            testimonies remind us that there's more to life than what we can
            see.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discover?category=hope-faith"
              className="btn-primary text-lg px-8 py-4"
            >
              Read Testimonies
            </Link>
            <Link
              to="/stories/new"
              className="btn-secondary-dark text-lg px-8 py-4"
            >
              Share Your Testimony
            </Link>
          </div>
        </div>
      </section>

      {/* What is a Testimony */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            What is a Testimony?
          </h2>
          <div className="mt-8 prose prose-lg max-w-none text-night/70 text-center">
            <p>
              A testimony is more than a story, it's a declaration of what
              you've witnessed and experienced. It's evidence of change, of
              grace, of something greater than ourselves at work in our lives.
            </p>
            <p>
              On PaTan™, people from all backgrounds share their testimonies.
              Whether rooted in religious faith, spiritual practice, or simply a
              profound life experience, every testimony has the power to touch
              another soul.
            </p>
          </div>
        </div>
      </section>

      {/* Testimony Types */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Types of Testimonies
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonyTypes.map((type) => (
              <div
                key={type.title}
                className="p-6 bg-white rounded-xl border border-mist text-center"
              >
                <span className="text-4xl" aria-hidden="true">
                  {type.icon}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                  {type.title}
                </h3>
                <p className="mt-2 text-sm text-night/70">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Testimonies
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {featuredStories.map((story) => (
              <article
                key={story.id}
                className="group relative card hover:shadow-lg transition-shadow"
              >
                <Link
                  to={`/stories/${story.id}`}
                  className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                  aria-label={`Read story: ${story.title}`}
                />
                <h3 className="font-heading text-xl font-bold text-midnight transition-colors group-hover:text-golden">
                  {story.title}
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
            <Link to="/discover?category=hope-faith" className="btn-secondary">
              View All Testimonies
            </Link>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-golden/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl text-midnight italic">
            "A testimony shared is a seed planted in another soul."
          </blockquote>
        </div>
      </section>

      {/* Why Share */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Why Share Your Testimony?
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-2xl">💪</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Strengthen Your Faith
              </h3>
              <p className="mt-2 text-night/70">
                Reflecting on your journey deepens your own conviction.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Inspire Others
              </h3>
              <p className="mt-2 text-night/70">
                Your story could be exactly what someone needs to hear.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Preserve Your Story
              </h3>
              <p className="mt-2 text-night/70">
                Create a lasting record of what you've witnessed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Your Testimony Has Power
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            What you've experienced, the struggles, the breakthroughs, the
            moments of grace, could change someone's life.
          </p>
          <Link
            to="/stories/new"
            className="mt-8 btn-primary inline-block text-lg px-8 py-4"
          >
            Share Your Testimony
          </Link>
        </div>
      </section>
    </main>
  );
}
