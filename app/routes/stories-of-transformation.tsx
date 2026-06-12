import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Stories of Transformation – Life-Changing Testimonies | PaTan' },
    {
      name: 'description',
      content: 'Read inspiring stories of personal transformation and life change. Discover testimonies of people who transformed their lives through faith, growth, and determination.',
    },
    {
      name: 'keywords',
      content: 'transformation stories, life change testimonies, personal transformation, life-changing stories, before and after stories, redemption stories, changed lives',
    },
    { property: 'og:title', content: 'Stories of Transformation – Life-Changing Testimonies' },
    { property: 'og:description', content: 'Read inspiring stories of personal transformation and life change.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};

const featuredStories = [
  {
    id: '1',
    title: 'From Addiction to Advocacy',
    excerpt: 'Twenty years of substance abuse ended the day I decided to become the person I needed when I was struggling...',
    author: 'Michael T.',
    readTime: '9 min',
    reactions: 1567,
  },
  {
    id: '2',
    title: 'The Day I Chose a Different Path',
    excerpt: 'Standing at a crossroads, I made a decision that would change everything...',
    author: 'Priya S.',
    readTime: '6 min',
    reactions: 823,
  },
  {
    id: '3',
    title: 'Becoming Who I Was Meant to Be',
    excerpt: 'For years I lived someone else\'s dream. This is how I found my own...',
    author: 'Anonymous',
    readTime: '7 min',
    reactions: 945,
  },
];

const transformationTypes = [
  { icon: '🦋', title: 'Identity', description: 'Discovering your true self' },
  { icon: '💚', title: 'Health', description: 'Physical and mental wellness journeys' },
  { icon: '🎯', title: 'Purpose', description: 'Finding meaning and direction' },
  { icon: '💝', title: 'Relationships', description: 'Healing and connection' },
  { icon: '🌱', title: 'Habits', description: 'Building a better life daily' },
  { icon: '✨', title: 'Mindset', description: 'Shifting perspectives' },
];

export default function StoriesOfTransformation() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-midnight via-forest/80 to-midnight text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 bg-golden/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">🦋</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Stories of <span className="text-golden">Transformation</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Witness the incredible power of change. These are stories of people who 
            transformed their lives, their perspectives, and their futures.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover?category=transformation" className="btn-primary text-lg px-8 py-4">
              Read Transformations
            </Link>
            <Link to="/stories/new" className="btn-secondary-dark text-lg px-8 py-4">
              Share Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Before & After Visual */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div className="p-8 bg-mist/50 rounded-xl text-center">
              <span className="text-4xl">😔</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">Where They Started</h3>
              <ul className="mt-4 text-sm text-night/70 space-y-2 text-left">
                <li>• Feeling stuck and hopeless</li>
                <li>• Struggling with old patterns</li>
                <li>• Searching for meaning</li>
                <li>• Ready for change</li>
              </ul>
            </div>
            <div className="p-8 bg-golden/10 rounded-xl text-center border-2 border-golden/30">
              <span className="text-4xl">✨</span>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">Where They Are Now</h3>
              <ul className="mt-4 text-sm text-night/70 space-y-2 text-left">
                <li>• Living with purpose</li>
                <li>• Free from limitations</li>
                <li>• Helping others transform</li>
                <li>• Grateful for the journey</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Transformation */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Types of Transformation
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformationTypes.map((type) => (
              <div key={type.title} className="p-6 bg-white rounded-xl border border-mist hover:shadow-md transition-shadow">
                <span className="text-4xl" aria-hidden="true">{type.icon}</span>
                <h3 className="mt-4 font-heading text-lg font-bold text-midnight">{type.title}</h3>
                <p className="mt-2 text-night/70">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Transformation Stories
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {featuredStories.map((story) => (
              <article key={story.id} className="card hover:shadow-lg transition-shadow">
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
                  <span className="text-night/60">{story.author} · {story.readTime}</span>
                  <span className="text-golden">🎉 {story.reactions}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/discover?category=transformation" className="btn-secondary">
              View All Transformations
            </Link>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-forest text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl italic">
            "The only way to make sense out of change is to plunge into it, move with it, and join the dance."
          </blockquote>
          <cite className="mt-4 block text-dawn/70">— Alan Watts</cite>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Every Transformation Story Begins Somewhere
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            If you've experienced change—big or small—your story could inspire someone 
            to begin their own transformation.
          </p>
          <Link to="/stories/new" className="mt-8 btn-primary inline-block text-lg px-8 py-4">
            Share Your Transformation
          </Link>
        </div>
      </section>
    </main>
  );
}
