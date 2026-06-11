import { Link } from 'react-router';

const categories = [
  { name: 'Hope and Faith', icon: '🌅', count: 1247, slug: 'hope-and-faith' },
  { name: 'Overcoming Adversity', icon: '💪', count: 892, slug: 'overcoming-adversity' },
  { name: 'Health and Wellness', icon: '💚', count: 634, slug: 'health-and-wellness' },
  { name: 'Relationships', icon: '❤️', count: 1023, slug: 'relationships' },
  { name: 'Professional Growth', icon: '📈', count: 445, slug: 'professional-growth' },
  { name: 'Gratitude', icon: '🙏', count: 1567, slug: 'gratitude' },
  { name: 'Personal Triumph', icon: '🏆', count: 723, slug: 'personal-triumph' },
  { name: 'Social Impact', icon: '🌍', count: 312, slug: 'social-impact' },
];

export function ThematicJourneys() {
  return (
    <section
      className="py-20 bg-mist/30"
      aria-labelledby="journeys-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="journeys-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
          >
            Find Stories That Speak to You
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/journeys/${category.slug}`}
              className="group p-6 bg-white rounded-xl border border-mist hover:border-golden hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
            >
              <span
                className="text-3xl block mb-3"
                aria-hidden="true"
              >
                {category.icon}
              </span>
              
              <h3 className="font-medium text-midnight group-hover:text-golden transition-colors">
                {category.name}
              </h3>
              
              <p className="mt-1 text-sm text-night/50">
                {category.count.toLocaleString()} stories
              </p>
              
              <span className="mt-3 inline-flex items-center text-sm text-golden opacity-0 group-hover:opacity-100 transition-opacity">
                Explore
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
