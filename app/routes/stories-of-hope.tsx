import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Stories of Hope – Find Hope Through Real Life Experiences | PaTan™' },
    {
      name: 'description',
      content: 'Discover powerful stories of hope from people who found light in dark times. Read real testimonies of faith, perseverance, and the human spirit triumphing over adversity.',
    },
    {
      name: 'keywords',
      content: 'stories of hope, hope stories, finding hope, hopeful testimonies, inspirational hope stories, hope in difficult times, stories of faith and hope',
    },
    { property: 'og:title', content: 'Stories of Hope – Find Hope Through Real Life Experiences' },
    { property: 'og:description', content: 'Discover powerful stories of hope from people who found light in dark times.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};

const featuredStories = [
  {
    id: '1',
    title: 'Finding Light When All Seemed Dark',
    excerpt: 'After losing everything I thought mattered, I discovered what truly gives life meaning...',
    author: 'Maria L.',
    readTime: '6 min',
    reactions: 342,
  },
  {
    id: '2',
    title: 'The Day Hope Found Me',
    excerpt: 'I had given up on tomorrow until a stranger\'s kindness changed everything...',
    author: 'David K.',
    readTime: '5 min',
    reactions: 287,
  },
  {
    id: '3',
    title: 'From Despair to Purpose',
    excerpt: 'What I thought was the end turned out to be the beginning of my true journey...',
    author: 'Sarah M.',
    readTime: '7 min',
    reactions: 456,
  },
];

const hopefulQuotes = [
  '"Hope is being able to see that there is light despite all of the darkness."',
  '"Once you choose hope, anything is possible."',
  '"Hope is the thing with feathers that perches in the soul."',
];

export default function StoriesOfHope() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-midnight via-midnight to-night text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-golden/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-forest/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">🌅</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Stories of <span className="text-golden">Hope</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Real stories from real people who found hope in their darkest moments. 
            Let their journeys remind you that light always breaks through.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover?category=hope-faith" className="btn-primary text-lg px-8 py-4">
              Explore Hope Stories
            </Link>
            <Link to="/stories/new" className="btn-secondary-dark text-lg px-8 py-4">
              Share Your Story
            </Link>
          </div>
        </div>
      </section>

      {/* What You'll Find */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            What You'll Find Here
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-3xl">💫</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Renewed Faith
              </h3>
              <p className="mt-2 text-night/70">
                Stories of people who rediscovered faith and purpose through life's challenges.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                New Beginnings
              </h3>
              <p className="mt-2 text-night/70">
                Testimonies of fresh starts, second chances, and the courage to begin again.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-golden/10 flex items-center justify-center">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-midnight">
                Unexpected Help
              </h3>
              <p className="mt-2 text-night/70">
                Moments when help arrived just when it was needed most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Stories of Hope
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
            <Link to="/discover?category=hope-faith" className="btn-secondary">
              View All Hope Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 bg-golden/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl text-midnight italic">
            {hopefulQuotes[0]}
          </blockquote>
        </div>
      </section>

      {/* Why Hope Matters */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Why Stories of Hope Matter
          </h2>
          <div className="mt-8 prose prose-lg max-w-none text-night/70">
            <p>
              Hope isn't just a feeling—it's a lifeline. When we're struggling, hearing that 
              someone else made it through a similar situation can make all the difference. 
              These stories aren't about pretending everything is perfect. They're about real 
              people facing real challenges and finding reasons to keep going.
            </p>
            <p>
              Research shows that hope is strongly linked to mental health, resilience, and 
              even physical wellbeing. When we read stories of hope, we're not just being 
              entertained—we're building our own capacity for hope.
            </p>
            <p>
              Every story shared here is a gift to someone who needs it. Your story could be 
              the one that helps a stranger find their footing again.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Your Story of Hope Could Change Someone's Life
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            If you've found hope in a difficult time, sharing your experience might be 
            exactly what someone else needs to hear today.
          </p>
          <Link to="/stories/new" className="mt-8 btn-primary inline-block text-lg px-8 py-4">
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
