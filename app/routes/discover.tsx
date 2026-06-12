import type { MetaFunction } from 'react-router';
import { Link, useSearchParams } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Discover Stories – PaTan' },
    { name: 'description', content: 'Discover inspiring stories of hope, transformation, and resilience from our global community.' },
  ];
};

const categories = [
  { name: 'All', value: '' },
  { name: 'Gratitude', value: 'gratitude' },
  { name: 'Hope & Faith', value: 'hope-faith' },
  { name: 'Transformation', value: 'transformation' },
  { name: 'Overcoming Adversity', value: 'overcoming-adversity' },
  { name: 'Relationships', value: 'relationships' },
  { name: 'Health & Wellness', value: 'health-wellness' },
  { name: 'Personal Growth', value: 'personal-growth' },
];

// Placeholder stories - will be replaced with loader data
const stories = [
  {
    id: '1',
    title: 'Finding Light After the Storm',
    excerpt: 'When everything seemed lost, I discovered strength I never knew I had...',
    author: 'Sarah M.',
    category: 'Transformation',
    readTime: '5 min',
    reactions: { celebrate: 124, uplift: 89 },
    image: null,
  },
  {
    id: '2',
    title: 'A Journey of Forgiveness',
    excerpt: 'Learning to forgive wasn\'t easy, but it set me free...',
    author: 'James K.',
    category: 'Relationships',
    readTime: '7 min',
    reactions: { celebrate: 256, uplift: 143 },
    image: null,
  },
  {
    id: '3',
    title: 'From Doubt to Faith',
    excerpt: 'My path wasn\'t linear, but every step led me closer to peace...',
    author: 'Amara O.',
    category: 'Hope & Faith',
    readTime: '6 min',
    reactions: { celebrate: 312, uplift: 201 },
    image: null,
  },
  {
    id: '4',
    title: 'The Gift of Gratitude',
    excerpt: 'A simple practice changed my entire perspective on life...',
    author: 'Michael R.',
    category: 'Gratitude',
    readTime: '4 min',
    reactions: { celebrate: 189, uplift: 112 },
    image: null,
  },
  {
    id: '5',
    title: 'Rising After Failure',
    excerpt: 'What felt like my biggest setback became my greatest teacher...',
    author: 'Elena P.',
    category: 'Personal Growth',
    readTime: '8 min',
    reactions: { celebrate: 445, uplift: 267 },
    image: null,
  },
  {
    id: '6',
    title: 'Healing One Day at a Time',
    excerpt: 'Recovery taught me patience, self-compassion, and the power of community...',
    author: 'David L.',
    category: 'Health & Wellness',
    readTime: '6 min',
    reactions: { celebrate: 367, uplift: 234 },
    image: null,
  },
];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {/* Hero Section */}
      <section className="bg-midnight text-dawn py-16" aria-labelledby="discover-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 id="discover-heading" className="font-heading text-3xl sm:text-4xl font-bold text-center">
            Discover Inspiring Stories
          </h1>
          <p className="mt-4 text-lg text-dawn/70 text-center max-w-2xl mx-auto">
            Every story here has the power to touch your heart, shift your perspective, 
            or remind you that you're not alone.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <label htmlFor="search" className="sr-only">Search stories</label>
            <div className="relative">
              <input
                id="search"
                type="search"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-mist bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Story categories">
            <ul className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 sm:mx-0 sm:px-0" role="list">
              {categories.map((category) => (
                <li key={category.value}>
                  <button
                    type="button"
                    onClick={() => {
                      if (category.value) {
                        setSearchParams({ category: category.value });
                      } else {
                        setSearchParams({});
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden ${
                      selectedCategory === category.value
                        ? 'bg-midnight text-dawn'
                        : 'bg-mist/50 text-night/70 hover:bg-mist'
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
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <article
                key={story.id}
                className="card hover:shadow-lg transition-shadow"
              >
                {/* Category Badge */}
                <span className="inline-block px-3 py-1 bg-golden/10 text-golden text-sm font-medium rounded-full">
                  {story.category}
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

          {/* Load More */}
          <div className="mt-12 text-center">
            <button
              type="button"
              className="btn-secondary"
            >
              Load More Stories
            </button>
          </div>
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
          <Link
            to="/stories/new"
            className="mt-6 btn-primary inline-block"
          >
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
