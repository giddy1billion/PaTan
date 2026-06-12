import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Overcoming Adversity – Stories of Resilience and Triumph | PaTan™' },
    {
      name: 'description',
      content: 'Read powerful stories of people who overcame adversity, challenges, and hardships. Find inspiration in real testimonies of resilience, courage, and triumph.',
    },
    {
      name: 'keywords',
      content: 'overcoming adversity stories, resilience stories, triumph over challenges, overcoming obstacles, hardship testimonies, success against odds, perseverance stories',
    },
    { property: 'og:title', content: 'Overcoming Adversity – Stories of Resilience and Triumph' },
    { property: 'og:description', content: 'Read powerful stories of people who overcame adversity and challenges.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
};

const featuredStories = [
  {
    id: '1',
    title: 'From Homeless to Helping Others',
    excerpt: 'Five years ago I was sleeping under a bridge. Today I run a shelter for those in need...',
    author: 'Marcus J.',
    readTime: '8 min',
    reactions: 892,
  },
  {
    id: '2',
    title: 'Walking Again After They Said I Wouldn\'t',
    excerpt: 'The doctors gave me a 5% chance. I decided to be that 5%...',
    author: 'Elena R.',
    readTime: '7 min',
    reactions: 1243,
  },
  {
    id: '3',
    title: 'Rebuilding After Losing Everything',
    excerpt: 'The fire took our home, our possessions, everything. But it couldn\'t take our spirit...',
    author: 'The Johnson Family',
    readTime: '6 min',
    reactions: 756,
  },
];

const challenges = [
  { icon: '💪', label: 'Health Battles', count: 892 },
  { icon: '💼', label: 'Career Setbacks', count: 567 },
  { icon: '💔', label: 'Loss & Grief', count: 723 },
  { icon: '🏠', label: 'Financial Hardship', count: 445 },
  { icon: '🧠', label: 'Mental Health', count: 634 },
  { icon: '🌪️', label: 'Natural Disasters', count: 234 },
];

export default function OvercomingAdversity() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-midnight to-night text-dawn py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-forest/30 to-transparent" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-6xl mb-6 block" aria-hidden="true">💪</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Overcoming <span className="text-golden">Adversity</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80 max-w-2xl mx-auto">
            Stories of remarkable people who faced impossible odds and found a way through. 
            Their journeys prove that the human spirit is unbreakable.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover?category=overcoming-adversity" className="btn-primary text-lg px-8 py-4">
              Read Their Stories
            </Link>
            <Link to="/stories/new" className="btn-secondary-dark text-lg px-8 py-4">
              Share Your Victory
            </Link>
          </div>
        </div>
      </section>

      {/* Challenge Categories */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Stories by Challenge
          </h2>
          <p className="mt-4 text-center text-night/70">
            Find stories from people who faced similar challenges
          </p>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {challenges.map((challenge) => (
              <Link
                key={challenge.label}
                to={`/discover?category=overcoming-adversity&tag=${challenge.label.toLowerCase().replace(' ', '-')}`}
                className="p-4 bg-white rounded-xl border border-mist hover:border-golden hover:shadow-md transition-all text-center"
              >
                <span className="text-3xl" aria-hidden="true">{challenge.icon}</span>
                <h3 className="mt-2 font-medium text-midnight text-sm">{challenge.label}</h3>
                <p className="text-xs text-night/50">{challenge.count} stories</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Featured Stories of Triumph
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
            <Link to="/discover?category=overcoming-adversity" className="btn-secondary">
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* What Makes Us Resilient */}
      <section className="py-16 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            What These Stories Teach Us
          </h2>
          <div className="mt-12 space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
                <span className="text-xl text-forest">1</span>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-midnight">Adversity is universal</h3>
                <p className="mt-2 text-night/70">Everyone faces challenges. Reading these stories reminds us we're not alone in our struggles.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
                <span className="text-xl text-forest">2</span>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-midnight">Resilience can be learned</h3>
                <p className="mt-2 text-night/70">These storytellers weren't born with special powers—they developed strength through their experiences.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
                <span className="text-xl text-forest">3</span>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-midnight">Support makes the difference</h3>
                <p className="mt-2 text-night/70">Almost every story mentions someone who helped along the way. We overcome together.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-forest text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-heading text-2xl sm:text-3xl italic">
            "The oak fought the wind and was broken, the willow bent when it must and survived."
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            You've Overcome Something—Share Your Victory
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            Your story of resilience could give someone else the courage to keep fighting.
          </p>
          <Link to="/stories/new" className="mt-8 btn-primary inline-block text-lg px-8 py-4">
            Share Your Story
          </Link>
        </div>
      </section>
    </main>
  );
}
