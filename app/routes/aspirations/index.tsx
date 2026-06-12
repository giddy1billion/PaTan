import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Aspirations – PaTan™' },
    { name: 'description', content: 'Share your dreams, goals, and aspirations. Receive community support on your journey.' },
  ];
};

const aspirations = [
  {
    id: '1',
    title: 'Complete my first marathon',
    author: 'Michael R.',
    status: 'in-progress',
    progress: 65,
    supporters: 45,
    category: 'Health & Wellness',
  },
  {
    id: '2',
    title: 'Write and publish my memoir',
    author: 'Sarah M.',
    status: 'in-progress',
    progress: 40,
    supporters: 89,
    category: 'Personal Growth',
  },
  {
    id: '3',
    title: 'Start a community garden in my neighborhood',
    author: 'Elena P.',
    status: 'achieved',
    progress: 100,
    supporters: 156,
    category: 'Social Impact',
  },
  {
    id: '4',
    title: 'Learn to play the piano',
    author: 'James K.',
    status: 'pending',
    progress: 0,
    supporters: 23,
    category: 'Personal Growth',
  },
  {
    id: '5',
    title: 'Reconnect with estranged family members',
    author: 'Anonymous',
    status: 'in-progress',
    progress: 30,
    supporters: 78,
    category: 'Relationships',
  },
];

const statusConfig = {
  pending: { label: 'Pending', class: 'badge-pending' },
  'in-progress': { label: 'In Progress', class: 'badge-in-progress' },
  achieved: { label: 'Achieved', class: 'badge-achieved' },
};

export default function AspirationsIndex() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16" aria-labelledby="aspirations-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="aspirations-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Aspirations
          </h1>
          <p className="mt-4 text-lg text-dawn/70">
            Share your dreams. Receive support. Celebrate progress together.
          </p>
          <Link to="/aspirations/new" className="mt-6 btn-primary inline-block">
            Share an Aspiration
          </Link>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-mist bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Aspiration filters">
            <ul className="flex gap-4 overflow-x-auto py-4" role="list">
              <li>
                <button type="button" className="px-4 py-2 rounded-full text-sm font-medium bg-midnight text-dawn">
                  All
                </button>
              </li>
              <li>
                <button type="button" className="px-4 py-2 rounded-full text-sm font-medium bg-mist/50 text-night/70 hover:bg-mist">
                  In Progress
                </button>
              </li>
              <li>
                <button type="button" className="px-4 py-2 rounded-full text-sm font-medium bg-mist/50 text-night/70 hover:bg-mist">
                  Achieved
                </button>
              </li>
              <li>
                <button type="button" className="px-4 py-2 rounded-full text-sm font-medium bg-mist/50 text-night/70 hover:bg-mist">
                  Pending
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      {/* Aspirations List */}
      <section className="py-12 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {aspirations.map((aspiration) => (
              <article
                key={aspiration.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={statusConfig[aspiration.status as keyof typeof statusConfig].class}>
                        {statusConfig[aspiration.status as keyof typeof statusConfig].label}
                      </span>
                      <span className="text-xs text-night/50">{aspiration.category}</span>
                    </div>
                    <h2 className="mt-3 font-heading text-lg font-bold text-midnight">
                      <Link
                        to={`/aspirations/${aspiration.id}`}
                        className="hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                      >
                        {aspiration.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-night/60">
                      by {aspiration.author}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium text-golden border border-golden rounded-full hover:bg-golden hover:text-midnight transition-colors"
                  >
                    🙌 Support
                  </button>
                </div>

                {/* Progress Bar */}
                {aspiration.status !== 'pending' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-night/60">Progress</span>
                      <span className="font-medium text-midnight">{aspiration.progress}%</span>
                    </div>
                    <div className="h-2 bg-mist rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          aspiration.status === 'achieved' ? 'bg-forest' : 'bg-golden'
                        }`}
                        style={{ width: `${aspiration.progress}%` }}
                        role="progressbar"
                        aria-valuenow={aspiration.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-4 text-sm text-night/50">
                  <span className="flex items-center gap-1">
                    👥 {aspiration.supporters} supporters
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button type="button" className="btn-secondary">
              Load More
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            What Are You Working Toward?
          </h2>
          <p className="mt-4 text-night/70">
            Share your aspiration and let the community support you on your journey.
          </p>
          <Link to="/aspirations/new" className="mt-6 btn-primary inline-block">
            Share Your Aspiration
          </Link>
        </div>
      </section>
    </main>
  );
}
