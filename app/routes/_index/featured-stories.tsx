import { Link } from 'react-router';

// Mock data - in production this would come from a loader
const featuredStories = [
  {
    id: '1',
    category: 'Transformation',
    title: 'From Rock Bottom to Purpose',
    excerpt: 'Three years ago, I lost everything I thought defined me. Today, I understand that was the beginning of finding who I truly am...',
    readingTime: 5,
    reactions: 234,
    slug: 'from-rock-bottom-to-purpose',
  },
  {
    id: '2',
    category: 'Gratitude',
    title: 'The Letter I Never Sent',
    excerpt: 'For twenty years, I carried resentment toward my father. Writing this letter changed everything, even though he never read it...',
    readingTime: 4,
    reactions: 189,
    slug: 'the-letter-i-never-sent',
  },
  {
    id: '3',
    category: 'Hope and Faith',
    title: 'When the Diagnosis Came',
    excerpt: 'The doctor\'s words echoed in that sterile room. But what happened next taught me that hope isn\'t the absence of fear...',
    readingTime: 6,
    reactions: 312,
    slug: 'when-the-diagnosis-came',
  },
];

const categoryColors: Record<string, string> = {
  'Transformation': 'bg-golden/10 text-golden',
  'Gratitude': 'bg-forest/10 text-forest',
  'Hope and Faith': 'bg-info/10 text-info',
  'Overcoming Adversity': 'bg-error/10 text-error',
};

export function FeaturedStories() {
  return (
    <section
      className="py-20 bg-dawn"
      aria-labelledby="featured-stories-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="featured-stories-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
          >
            Stories That Illuminate Lives
          </h2>
          <p className="mt-4 text-lg text-night/70 max-w-2xl mx-auto">
            Explore real experiences from people navigating growth, gratitude, healing, 
            faith, relationships, and personal triumph.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredStories.map((story) => (
            <article
              key={story.id}
              className="card hover:shadow-lg transition-shadow group"
            >
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  categoryColors[story.category] || 'bg-mist text-night/70'
                }`}
              >
                {story.category}
              </span>
              
              <h3 className="mt-4 font-heading text-xl font-bold text-midnight group-hover:text-golden transition-colors">
                {story.title}
              </h3>
              
              <p className="mt-3 text-night/70 line-clamp-3">
                {story.excerpt}
              </p>
              
              <footer className="mt-4 pt-4 border-t border-mist flex items-center justify-between text-sm text-night/50">
                <span>{story.readingTime} min read</span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                  {story.reactions}
                </span>
              </footer>
              
              <Link
                to={`/stories/${story.slug}`}
                className="mt-4 inline-flex items-center text-golden font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
              >
                Read Story
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/discover"
            className="btn-secondary inline-flex items-center"
          >
            Discover More Stories
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
