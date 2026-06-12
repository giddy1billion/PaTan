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
    gradient: 'from-golden/20 via-golden/5 to-transparent',
  },
  {
    id: '2',
    category: 'Gratitude',
    title: 'The Letter I Never Sent',
    excerpt: 'For twenty years, I carried resentment toward my father. Writing this letter changed everything, even though he never read it...',
    readingTime: 4,
    reactions: 189,
    slug: 'the-letter-i-never-sent',
    gradient: 'from-forest/20 via-forest/5 to-transparent',
  },
  {
    id: '3',
    category: 'Hope and Faith',
    title: 'When the Diagnosis Came',
    excerpt: 'The doctor\'s words echoed in that sterile room. But what happened next taught me that hope isn\'t the absence of fear...',
    readingTime: 6,
    reactions: 312,
    slug: 'when-the-diagnosis-came',
    gradient: 'from-info/20 via-info/5 to-transparent',
  },
];

const categoryConfig: Record<string, { bg: string; text: string; border: string }> = {
  'Transformation': { 
    bg: 'bg-golden/15', 
    text: 'text-golden-accessible', 
    border: 'group-hover:border-golden/40'
  },
  'Gratitude': { 
    bg: 'bg-forest/15', 
    text: 'text-forest-accessible',
    border: 'group-hover:border-forest/40'
  },
  'Hope and Faith': { 
    bg: 'bg-info/15', 
    text: 'text-info-accessible',
    border: 'group-hover:border-info/40'
  },
  'Overcoming Adversity': { 
    bg: 'bg-error/15', 
    text: 'text-error-accessible',
    border: 'group-hover:border-error/40'
  },
};

export function FeaturedStories() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-dawn relative overflow-hidden"
      aria-labelledby="featured-stories-heading"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-golden/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-forest/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" aria-hidden="true" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="badge-golden-accessible mb-4">
            Featured Stories
          </span>
          <h2
            id="featured-stories-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight"
          >
            Stories That Illuminate Lives
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Explore real experiences from people navigating growth, gratitude, healing, 
            faith, relationships, and personal triumph.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredStories.map((story, index) => {
            const config = categoryConfig[story.category] || { 
              bg: 'bg-mist', 
              text: 'text-muted',
              border: 'group-hover:border-mist'
            };
            
            return (
              <article
                key={story.id}
                className={`
                  group relative
                  bg-white rounded-2xl
                  border border-mist/50 ${config.border}
                  p-5 sm:p-6
                  transition-all duration-500 ease-out
                  hover:-translate-y-2
                  shadow-layered hover:shadow-layered-lg
                  opacity-0 animate-fade-in-up
                `}
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
              >
                {/* Category gradient glow */}
                <div 
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${story.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  aria-hidden="true"
                />
                
                <div className="relative">
                  {/* Category Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" aria-hidden="true" />
                    {story.category}
                  </span>
                  
                  {/* Title */}
                  <h3 className="mt-4 font-heading text-lg sm:text-xl font-bold text-midnight group-hover:text-golden-accessible transition-colors duration-300 line-clamp-2">
                    {story.title}
                  </h3>
                  
                  {/* Excerpt */}
                  <p className="mt-3 text-muted text-sm sm:text-base leading-relaxed line-clamp-3">
                    {story.excerpt}
                  </p>
                  
                  {/* Footer */}
                  <footer className="mt-5 pt-4 border-t border-mist/50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-subtle">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {story.readingTime} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        {story.reactions}
                      </span>
                    </div>
                    
                    <Link
                      to={`/stories/${story.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-golden-accessible hover:text-golden hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded min-h-[44px] min-w-[44px] justify-center"
                      aria-label={`Read story: ${story.title}`}
                    >
                      Read
                      <svg 
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-16 text-center">
          <Link
            to="/discover"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-midnight text-midnight font-medium hover:bg-midnight hover:text-dawn transition-all duration-300 min-h-[48px]"
          >
            Discover More Stories
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
