import { Link } from 'react-router';

const highlights = [
  { icon: '📱', label: 'Offline reading', description: 'Access stories without internet' },
  { icon: '🔔', label: 'Push notifications', description: 'Stay connected to your community' },
  { icon: '✨', label: 'Personalized feeds', description: 'Stories curated for you' },
  { icon: '🔄', label: 'Seamless sync', description: 'Your journey across all devices' },
];

export function MobileExperience() {
  return (
    <section
      className="py-20 bg-mist/30"
      aria-labelledby="mobile-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2
              id="mobile-heading"
              className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
            >
              Inspiration Wherever Life Takes You
            </h2>
            
            <p className="mt-4 text-lg text-night/70">
              Read, reflect, and connect from any device through PaTan's mobile 
              experience and Progressive Web App.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg border border-mist"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-medium text-midnight">{item.label}</h3>
                    <p className="text-sm text-night/60">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/signup"
              className="mt-8 btn-primary inline-flex items-center"
            >
              Get Started Today
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Phone Mockup */}
          <div className="relative flex justify-center" aria-hidden="true">
            <div className="relative w-72">
              {/* Phone Frame */}
              <div className="relative bg-night rounded-[3rem] p-3 shadow-2xl">
                {/* Screen */}
                <div className="bg-dawn rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-midnight px-6 py-2 flex items-center justify-between text-dawn text-xs">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-4a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1V3z" />
                      </svg>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="w-6 h-3 bg-forest rounded-sm" />
                    </div>
                  </div>
                  
                  {/* App Content */}
                  <div className="p-4 h-[500px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-heading font-bold text-midnight">PaTan</span>
                      <div className="w-8 h-8 rounded-full bg-golden/20" />
                    </div>
                    
                    {/* Story Card Preview */}
                    <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                      <span className="text-xs bg-golden/10 text-golden px-2 py-1 rounded-full">
                        Gratitude
                      </span>
                      <h4 className="mt-2 font-medium text-midnight text-sm">
                        Finding Joy in Small Moments
                      </h4>
                      <p className="mt-1 text-xs text-night/60 line-clamp-2">
                        Today I realized that the smallest things bring the greatest joy...
                      </p>
                    </div>
                    
                    {/* More cards */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="h-2 w-20 bg-mist rounded" />
                        <div className="h-3 w-full bg-mist/50 rounded mt-2" />
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="h-2 w-16 bg-mist rounded" />
                        <div className="h-3 w-3/4 bg-mist/50 rounded mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-dawn/50 rounded-full" />
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-10 -right-10 w-40 h-40 bg-golden/20 rounded-full blur-3xl" />
              <div className="absolute -z-10 bottom-10 -left-10 w-40 h-40 bg-forest/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
