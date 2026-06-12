import { Link } from 'react-router';

const categories = [
  { 
    name: 'Hope and Faith', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    count: 1247, 
    slug: 'hope-and-faith',
    color: 'golden',
  },
  { 
    name: 'Overcoming Adversity', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    count: 892, 
    slug: 'overcoming-adversity',
    color: 'error',
  },
  { 
    name: 'Health & Wellness', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    count: 634, 
    slug: 'health-and-wellness',
    color: 'forest',
  },
  { 
    name: 'Relationships', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    count: 1023, 
    slug: 'relationships',
    color: 'info',
  },
  { 
    name: 'Professional Growth', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    count: 445, 
    slug: 'professional-growth',
    color: 'midnight',
  },
  { 
    name: 'Gratitude', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    count: 1567, 
    slug: 'gratitude',
    color: 'golden',
  },
  { 
    name: 'Personal Triumph', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
    count: 723, 
    slug: 'personal-triumph',
    color: 'forest',
  },
  { 
    name: 'Social Impact', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    count: 312, 
    slug: 'social-impact',
    color: 'info',
  },
];

const colorConfig = {
  golden: {
    bg: 'bg-golden/15',
    text: 'text-golden-accessible',
    hover: 'hover:border-golden/50 hover:bg-golden/5',
    iconBg: 'group-hover:bg-golden/25',
  },
  forest: {
    bg: 'bg-forest/15',
    text: 'text-forest-accessible',
    hover: 'hover:border-forest/50 hover:bg-forest/5',
    iconBg: 'group-hover:bg-forest/25',
  },
  info: {
    bg: 'bg-info/15',
    text: 'text-info-accessible',
    hover: 'hover:border-info/50 hover:bg-info/5',
    iconBg: 'group-hover:bg-info/25',
  },
  error: {
    bg: 'bg-error/15',
    text: 'text-error-accessible',
    hover: 'hover:border-error/50 hover:bg-error/5',
    iconBg: 'group-hover:bg-error/25',
  },
  midnight: {
    bg: 'bg-midnight/10',
    text: 'text-midnight',
    hover: 'hover:border-midnight/50 hover:bg-midnight/5',
    iconBg: 'group-hover:bg-midnight/20',
  },
};

export function ThematicJourneys() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-mist/30 via-dawn to-mist/30"
      aria-labelledby="journeys-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="badge-forest-accessible mb-4">
            Thematic Journeys
          </span>
          <h2
            id="journeys-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight"
          >
            Find Stories That Speak to You
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted max-w-xl mx-auto">
            Explore curated collections of stories organized by life themes
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-6">
          {categories.map((category, index) => {
            const colors = colorConfig[category.color as keyof typeof colorConfig];
            
            return (
              <Link
                key={category.slug}
                to={`/journeys/${category.slug}`}
                className={`
                  group relative
                  p-4 sm:p-6
                  bg-white rounded-2xl
                  border border-mist/50 ${colors.hover}
                  transition-all duration-300 ease-out
                  hover:-translate-y-1
                  shadow-sm hover:shadow-lg
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2
                  min-h-[140px] sm:min-h-[160px]
                  opacity-0 animate-fade-in-up
                `}
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
              >
                {/* Icon */}
                <div 
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14
                    rounded-xl ${colors.bg} ${colors.iconBg}
                    flex items-center justify-center
                    ${colors.text}
                    transition-colors duration-300
                    mb-3 sm:mb-4
                  `}
                >
                  {category.icon}
                </div>
                
                {/* Content */}
                <h3 className="font-medium text-sm sm:text-base text-midnight group-hover:text-golden transition-colors leading-tight">
                  {category.name}
                </h3>
                
                <p className="mt-1 text-xs sm:text-sm text-subtle">
                  {category.count.toLocaleString()} stories
                </p>
                
                {/* Arrow indicator */}
                <span className="absolute bottom-4 right-4 text-golden opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
