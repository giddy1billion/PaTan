import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Community – PaTan' },
    { name: 'description', content: 'Connect with our global community of storytellers and supporters.' },
  ];
};

const circles = [
  { name: 'Gratitude Circle', members: 1234, description: 'Daily gratitude sharing and reflection' },
  { name: 'Overcomers', members: 892, description: 'Stories of resilience and triumph' },
  { name: 'Faith Journey', members: 1567, description: 'Exploring spirituality together' },
  { name: 'Wellness Warriors', members: 723, description: 'Health and healing stories' },
  { name: 'Career Changers', members: 456, description: 'Professional growth journeys' },
  { name: 'Relationship Reflections', members: 634, description: 'Love, family, and connection' },
];

export default function Community() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16" aria-labelledby="community-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="community-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Find Your Circle
          </h1>
          <p className="mt-4 text-lg text-dawn/70">
            Connect with people who understand your journey and celebrate your growth.
          </p>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="py-8 bg-golden/10 border-b border-golden/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-golden font-medium">
            🚀 Community features are coming soon! Join the waitlist to be notified.
          </p>
        </div>
      </section>

      {/* Circles Preview */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-midnight text-center">
            Community Circles
          </h2>
          <p className="mt-2 text-center text-night/60">
            Join themed groups for deeper connection
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle) => (
              <article
                key={circle.name}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-golden/20 to-forest/20 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                  {circle.name}
                </h3>
                <p className="mt-2 text-night/70 text-sm">
                  {circle.description}
                </p>
                <p className="mt-4 text-sm text-night/50">
                  {circle.members.toLocaleString()} members
                </p>
                <button
                  type="button"
                  className="mt-4 w-full btn-secondary text-sm"
                  disabled
                >
                  Coming Soon
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-midnight text-center">
            What's Coming
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
              <span className="text-3xl">💬</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Private Messaging
              </h3>
              <p className="mt-2 text-night/70 text-sm">
                Connect one-on-one with storytellers whose journeys resonate with yours.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
              <span className="text-3xl">🔔</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Story Discussions
              </h3>
              <p className="mt-2 text-night/70 text-sm">
                Engage in meaningful conversations around stories that move you.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
              <span className="text-3xl">🤝</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Accountability Partners
              </h3>
              <p className="mt-2 text-night/70 text-sm">
                Find support partners to help you achieve your aspirations.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
              <span className="text-3xl">🎯</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Group Reflections
              </h3>
              <p className="mt-2 text-night/70 text-sm">
                Participate in guided reflection sessions with your circle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="py-16 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold">
            Be First to Connect
          </h2>
          <p className="mt-4 text-dawn/70">
            Join the waitlist to get early access to community features.
          </p>
          <div className="mt-8">
            <Link to="/signup" className="btn-primary">
              Join the Waitlist
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
