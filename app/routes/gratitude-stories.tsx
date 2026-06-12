import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Gratitude Stories – Discover the Power of Thankfulness | PaTan' },
    {
      name: 'description',
      content: 'Read heartfelt gratitude stories that celebrate life\'s blessings. Discover how practicing thankfulness transforms perspectives and brings joy to everyday moments.',
    },
    {
      name: 'keywords',
      content: 'gratitude stories, thankfulness testimonies, grateful living, appreciation stories, blessings stories, gratitude journal stories, thankful moments',
    },
    { property: 'og:title', content: 'Gratitude Stories – Discover the Power of Thankfulness' },
    { property: 'og:description', content: 'Read heartfelt gratitude stories that celebrate life\'s blessings.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};

const featuredStories = [
  {
    id: '1',
    title: 'The Gift of Ordinary Days',
    excerpt: 'It took losing what I had to realize how much I\'d been given all along...',
    author: 'Jennifer W.',
    readTime: '4 min',
    reactions: 523,
  },
  {
    id: '2',
    title: 'Finding Abundance in Simplicity',
    excerpt: 'When I started counting blessings instead of problems, everything changed...',
    author: 'Robert M.',
    readTime: '5 min',
    reactions: 412,
  },
  {
    id: '3',
    title: 'Thank You for the Struggle',
    excerpt: 'The hardest year of my life taught me the deepest gratitude...',
    author: 'Amina K.',
    readTime: '6 min',
    reactions: 389,
  },
];

const gratitudePractices = [
  { icon: '📝', title: 'Daily Journaling', description: 'Write three things you\'re grateful for each day' },
  { icon: '💌', title: 'Thank You Notes', description: 'Express appreciation to someone who made a difference' },
  { icon: '🧘', title: 'Mindful Moments', description: 'Pause to notice and appreciate present blessings' },
  { icon: '🗣️', title: 'Share Stories', description: 'Tell others about moments you\'re grateful for' },
];

export default function GratitudeStories() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-golden/20 to-dawn py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">🙏</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight leading-tight">
            Gratitude <span className="text-golden">Stories</span>
          </h1>
          <p className="mt-6 text-xl text-night/70 max-w-2xl mx-auto">
            Discover the transformative power of thankfulness through stories from people 
            who found joy in appreciating life's gifts—big and small.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover?category=gratitude" className="btn-primary text-lg px-8 py-4">
              Explore Gratitude Stories
            </Link>
            <Link to="/stories/new" className="btn-secondary text-lg px-8 py-4">
              Share Your Gratitude
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits of Gratitude */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            The Science of Gratitude
          </h2>
          <p className="mt-4 text-center text-night/70 max-w-2xl mx-auto">
            Research shows that practicing gratitude has measurable benefits for mental 
            and physical health.
          </p>
          <div className="mt-12 grid sm:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-dawn rounded-xl">
              <span className="text-4xl font-bold text-golden">25%</span>
              <p className="mt-2 text-sm text-night/70">increase in happiness</p>
            </div>
            <div className="text-center p-6 bg-dawn rounded-xl">
              <span className="text-4xl font-bold text-golden">Better</span>
              <p className="mt-2 text-sm text-night/70">sleep quality</p>
            </div>
            <div className="text-center p-6 bg-dawn rounded-xl">
              <span className="text-4xl font-bold text-golden">Lower</span>
              <p className="mt-2 text-sm text-night/70">stress levels</p>
            </div>
            <div className="text-center p-6 bg-dawn rounded-xl">
              <span className="text-4xl font-bold text-golden">Stronger</span>
              <p className="mt-2 text-sm text-night/70">relationships</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Gratitude Stories
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
            <Link to="/discover?category=gratitude" className="btn-secondary">
              View All Gratitude Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Gratitude Practices */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Ways to Practice Gratitude
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {gratitudePractices.map((practice) => (
              <div key={practice.title} className="p-6 bg-white rounded-xl border border-mist">
                <span className="text-3xl" aria-hidden="true">{practice.icon}</span>
                <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                  {practice.title}
                </h3>
                <p className="mt-2 text-sm text-night/70">{practice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-golden/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl text-midnight italic">
            "Gratitude turns what we have into enough, and more."
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            What Are You Grateful For?
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            Sharing your gratitude amplifies it—for you and for everyone who reads it.
          </p>
          <Link to="/stories/new" className="mt-8 btn-primary inline-block text-lg px-8 py-4">
            Share Your Gratitude Story
          </Link>
        </div>
      </section>
    </main>
  );
}
