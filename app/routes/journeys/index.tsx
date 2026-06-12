import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Thematic Journeys – PaTan™' },
    { name: 'description', content: 'Explore curated collections of stories organized by life themes and experiences.' },
  ];
};

const journeys = [
  {
    slug: 'gratitude',
    name: 'Gratitude',
    icon: '🙏',
    description: 'Stories celebrating thankfulness and appreciation for life\'s blessings.',
    storiesCount: 1567,
    color: 'from-golden/20 to-soft-gold/20',
  },
  {
    slug: 'hope-and-faith',
    name: 'Hope and Faith',
    icon: '🌅',
    description: 'Journeys of spiritual growth, faith, and finding hope in difficult times.',
    storiesCount: 1247,
    color: 'from-golden/20 to-forest/20',
  },
  {
    slug: 'overcoming-adversity',
    name: 'Overcoming Adversity',
    icon: '💪',
    description: 'Powerful stories of resilience, courage, and triumph over challenges.',
    storiesCount: 892,
    color: 'from-forest/20 to-midnight/20',
  },
  {
    slug: 'health-and-wellness',
    name: 'Health and Wellness',
    icon: '💚',
    description: 'Healing journeys, recovery stories, and paths to physical and mental wellness.',
    storiesCount: 634,
    color: 'from-forest/20 to-soft-gold/20',
  },
  {
    slug: 'relationships',
    name: 'Relationships',
    icon: '❤️',
    description: 'Stories of love, family, friendship, and meaningful human connections.',
    storiesCount: 1023,
    color: 'from-error/10 to-golden/20',
  },
  {
    slug: 'professional-growth',
    name: 'Professional Growth',
    icon: '📈',
    description: 'Career transformations, entrepreneurship journeys, and professional breakthroughs.',
    storiesCount: 445,
    color: 'from-info/20 to-midnight/20',
  },
  {
    slug: 'personal-triumph',
    name: 'Personal Triumph',
    icon: '🏆',
    description: 'Victories big and small — moments of achievement and personal growth.',
    storiesCount: 723,
    color: 'from-golden/20 to-golden/30',
  },
  {
    slug: 'social-impact',
    name: 'Social Impact',
    icon: '🌍',
    description: 'Stories of making a difference in communities and changing lives.',
    storiesCount: 312,
    color: 'from-forest/20 to-info/20',
  },
  {
    slug: 'transformation',
    name: 'Transformation',
    icon: '🦋',
    description: 'Life-changing moments and the journeys of becoming who we\'re meant to be.',
    storiesCount: 856,
    color: 'from-golden/20 to-forest/20',
  },
  {
    slug: 'inspiration',
    name: 'Inspiration',
    icon: '✨',
    description: 'Stories that spark motivation, creativity, and positive action.',
    storiesCount: 978,
    color: 'from-soft-gold/20 to-golden/20',
  },
];

export default function JourneysIndex() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16" aria-labelledby="journeys-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="journeys-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Thematic Journeys
          </h1>
          <p className="mt-4 text-lg text-dawn/70">
            Curated collections of stories that speak to shared human experiences.
          </p>
        </div>
      </section>

      {/* Journeys Grid */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey) => (
              <Link
                key={journey.slug}
                to={`/journeys/${journey.slug}`}
                className="group block"
              >
                <article className={`h-full p-6 rounded-xl bg-gradient-to-br ${journey.color} border border-mist hover:shadow-lg transition-all`}>
                  <span className="text-4xl" aria-hidden="true">{journey.icon}</span>
                  <h2 className="mt-4 font-heading text-xl font-bold text-midnight group-hover:text-golden transition-colors">
                    {journey.name}
                  </h2>
                  <p className="mt-2 text-night/70 text-sm">
                    {journey.description}
                  </p>
                  <p className="mt-4 text-sm font-medium text-night/50">
                    {journey.storiesCount.toLocaleString()} stories
                  </p>
                  <span className="mt-4 inline-flex items-center text-sm text-golden opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore journey
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Create Journey CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Start Your Own Journey
          </h2>
          <p className="mt-4 text-night/70">
            Every transformative experience begins with a single step. 
            Share your story and inspire others on their path.
          </p>
          <Link to="/stories/new" className="mt-6 btn-primary inline-block">
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
