import { Link } from 'react-router';

const highlights = [
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ), 
    label: 'Offline reading', 
    description: 'Access stories anytime',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ), 
    label: 'Push notifications', 
    description: 'Stay connected',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ), 
    label: 'Personalized feeds', 
    description: 'Stories curated for you',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ), 
    label: 'Seamless sync', 
    description: 'Your journey, everywhere',
  },
];

export function MobileExperience() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-mist/30 via-dawn to-mist/30 relative overflow-hidden"
      aria-labelledby="mobile-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-golden/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-info/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <span className="badge-info-accessible mb-4">
              Mobile Experience
            </span>
            
            <h2
              id="mobile-heading"
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight leading-tight"
            >
              Inspiration Wherever
              <br className="hidden sm:block" />
              <span className="text-info-accessible">Life Takes You</span>
            </h2>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted leading-relaxed">
              Read, reflect, and connect from any device through PaTan's mobile 
              experience and Progressive Web App.
            </p>

            {/* Features grid */}
            <div className="mt-8 sm:mt-10 grid sm:grid-cols-2 gap-3 sm:gap-4">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 sm:gap-4 p-4 bg-white rounded-xl border border-mist/50 hover:border-info/30 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-info/15 text-info-accessible flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-midnight text-sm sm:text-base">{item.label}</h3>
                    <p className="text-xs sm:text-sm text-subtle mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/signup"
              className="mt-8 sm:mt-10 btn-primary inline-flex items-center"
            >
              <span className="flex items-center gap-2">
                Get Started Today
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end" aria-hidden="true">
            <div className="relative w-[280px] sm:w-[320px]">
              {/* Phone Frame */}
              <div className="relative bg-night rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-night rounded-full z-10" />
                
                {/* Screen */}
                <div className="bg-dawn rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-midnight px-6 pt-8 pb-3 flex items-center justify-between text-white text-xs">
                    <span className="font-medium">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2 border border-white rounded-sm relative">
                        <div className="absolute inset-0.5 bg-forest rounded-[1px]" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* App Content */}
                  <div className="p-4 h-[480px] sm:h-[540px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-heading font-bold text-midnight text-lg">PaTan</span>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white text-xs font-bold">
                        JD
                      </div>
                    </div>
                    
                    {/* Story Card Preview */}
                    <div className="bg-white rounded-2xl p-4 shadow-layered mb-4">
                      <span className="inline-block text-xs bg-golden/15 text-golden-accessible px-2.5 py-1 rounded-full font-medium">
                        Gratitude
                      </span>
                      <h4 className="mt-3 font-heading font-semibold text-midnight">
                        Finding Joy in Small Moments
                      </h4>
                      <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                        Today I realized that the smallest things bring the greatest joy...
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-subtle">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          234
                        </span>
                        <span>5 min read</span>
                      </div>
                    </div>
                    
                    {/* Skeleton cards */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-3.5 shadow-sm">
                        <div className="h-2 w-16 bg-mist rounded-full" />
                        <div className="h-3 w-full bg-mist/60 rounded-full mt-3" />
                        <div className="h-3 w-2/3 bg-mist/40 rounded-full mt-2" />
                      </div>
                      <div className="bg-white rounded-xl p-3.5 shadow-sm">
                        <div className="h-2 w-20 bg-mist rounded-full" />
                        <div className="h-3 w-5/6 bg-mist/60 rounded-full mt-3" />
                        <div className="h-3 w-1/2 bg-mist/40 rounded-full mt-2" />
                      </div>
                    </div>
                    
                    {/* Bottom nav mockup */}
                    <div className="absolute bottom-6 left-4 right-4 bg-white rounded-2xl py-3 px-4 shadow-lg flex justify-around">
                      <div className="w-6 h-6 rounded-lg bg-golden/20" />
                      <div className="w-6 h-6 rounded-lg bg-mist" />
                      <div className="w-8 h-8 -mt-1 rounded-xl bg-golden flex items-center justify-center">
                        <svg className="w-4 h-4 text-midnight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-mist" />
                      <div className="w-6 h-6 rounded-lg bg-mist" />
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-dawn/50 rounded-full" />
              </div>

              {/* Decorative glow elements */}
              <div className="absolute -z-10 top-10 -right-10 w-40 h-40 sm:w-56 sm:h-56 bg-golden/20 rounded-full blur-[60px]" />
              <div className="absolute -z-10 bottom-10 -left-10 w-32 h-32 sm:w-48 sm:h-48 bg-info/20 rounded-full blur-[50px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
