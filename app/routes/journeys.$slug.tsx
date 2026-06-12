import type { MetaFunction } from 'react-router';
import { useParams, Link } from 'react-router';

export const meta: MetaFunction = ({ params }) => {
  const slug = params.slug || '';
  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return [
    { title: `${name} Journey – PaTan` },
    { name: 'description', content: `Explore stories of ${name.toLowerCase()} from our inspiring community.` },
  ];
};

// Placeholder stories - will be replaced with loader
const journeyData = {
  'hope-and-faith': {
    name: 'Hope and Faith',
    icon: '🌅',
    description: 'Journeys of spiritual growth, faith, and finding hope in difficult times.',
    storiesCount: 1247,
  },
  'gratitude': {
    name: 'Gratitude',
    icon: '🙏',
    description: 'Stories celebrating thankfulness and appreciation for life\'s blessings.',
    storiesCount: 1567,
  },
};

const stories = [
  {
    id: '1',
    title: 'Finding Light After the Storm',
    excerpt: 'When everything seemed lost, I discovered strength I never knew I had...',
    author: 'Sarah M.',
    readTime: '5 min',
    reactions: { celebrate: 124, uplift: 89 },
  },
  {
    id: '2',
    title: 'A Journey of Forgiveness',
    excerpt: 'Learning to forgive wasn\'t easy, but it set me free...',
    author: 'James K.',
    readTime: '7 min',
    reactions: { celebrate: 256, uplift: 143 },
  },
  {
    id: '3',
    title: 'From Doubt to Faith',
    excerpt: 'My path wasn\'t linear, but every step led me closer to peace...',
    author: 'Amara O.',
    readTime: '6 min',
    reactions: { celebrate: 312, uplift: 201 },
  },
];

export default function JourneyDetail() {
  const { slug } = useParams();
  const journey = journeyData[slug as keyof typeof journeyData] || {
    name: slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Journey',
    icon: '📖',
    description: 'Explore stories from this journey.',
    storiesCount: 0,
  };

  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            to="/journeys"
            className="inline-flex items-center text-sm text-dawn/70 hover:text-dawn mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Journeys
          </Link>
          <span className="text-5xl block mb-4" aria-hidden="true">{journey.icon}</span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            {journey.name}
          </h1>
          <p className="mt-4 text-lg text-dawn/70">
            {journey.description}
          </p>
          <p className="mt-4 text-sm text-dawn/50">
            {journey.storiesCount.toLocaleString()} stories
          </p>
        </div>
      </section>

      {/* Stories */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {stories.map((story) => (
              <article
                key={story.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <h2 className="font-heading text-xl font-bold text-midnight">
                  <Link
                    to={`/stories/${story.id}`}
                    className="hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                  >
                    {story.title}
                  </Link>
                </h2>
                <p className="mt-2 text-night/70">
                  {story.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white text-sm font-bold">
                      {story.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-midnight">{story.author}</p>
                      <p className="text-xs text-night/50">{story.readTime} read</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-night/50">
                    <span className="flex items-center gap-1">
                      🎉 {story.reactions.celebrate}
                    </span>
                    <span className="flex items-center gap-1">
                      🙌 {story.reactions.uplift}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button type="button" className="btn-secondary">
              Load More Stories
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Add Your Story to This Journey
          </h2>
          <p className="mt-4 text-night/70">
            Your experience could inspire someone going through a similar journey.
          </p>
          <Link to="/stories/new" className="mt-6 btn-primary inline-block">
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
