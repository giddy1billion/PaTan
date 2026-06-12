import { Link } from 'react-router';

const highlights = [
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), 
    label: 'Track aspirations',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ), 
    label: 'Update progress',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ), 
    label: 'Celebrate achievements',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ), 
    label: 'Receive support',
  },
];

const timelineItems = [
  { status: 'achieved', label: 'Started my healing journey', date: 'Jan 2024' },
  { status: 'achieved', label: 'Shared my first story', date: 'Mar 2024' },
  { status: 'in-progress', label: 'Building a supportive community', date: 'Current' },
  { status: 'pending', label: 'Inspire 100 people', date: 'Goal' },
];

export function Aspirations() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-dawn relative overflow-hidden"
      aria-labelledby="aspirations-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-forest/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-golden/5 rounded-full blur-[80px]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Timeline Illustration */}
          <div className="order-2 lg:order-1" aria-hidden="true">
            <div className="relative max-w-md mx-auto lg:max-w-none">
              {/* Timeline line */}
              <div className="absolute left-6 sm:left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-forest via-golden to-mist rounded-full" />
              
              {/* Timeline Items */}
              <div className="space-y-6 sm:space-y-8">
                {timelineItems.map((item, index) => (
                  <div 
                    key={index} 
                    className={`
                      flex items-start gap-4 sm:gap-5 
                      opacity-0 animate-slide-in-left
                    `}
                    style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Status indicator */}
                    <div
                      className={`
                        relative z-10 flex-shrink-0
                        w-12 h-12 sm:w-16 sm:h-16
                        rounded-2xl flex items-center justify-center
                        shadow-lg
                        ${item.status === 'achieved'
                          ? 'bg-gradient-to-br from-forest to-forest/80 text-white'
                          : item.status === 'in-progress'
                          ? 'bg-gradient-to-br from-golden to-golden/80 text-white'
                          : 'bg-white border-2 border-mist text-night/40'
                        }
                      `}
                    >
                      {item.status === 'achieved' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : item.status === 'in-progress' ? (
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-mist rounded-full" />
                      )}
                    </div>
                    
                    {/* Content card */}
                    <div 
                      className={`
                        flex-1 p-4 sm:p-5 rounded-xl
                        ${item.status === 'in-progress' 
                          ? 'bg-white shadow-layered border border-golden/30' 
                          : 'bg-white/80 border border-mist/50'
                        }
                      `}
                    >
                      <p className="font-medium text-midnight text-sm sm:text-base">
                        {item.label}
                      </p>
                      <p className={`text-xs sm:text-sm mt-1 ${item.status === 'in-progress' ? 'text-golden' : 'text-night/50'}`}>
                        {item.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 rounded-full bg-forest/10 text-forest text-sm font-medium mb-4">
              Aspirations & Goals
            </span>
            
            <h2
              id="aspirations-heading"
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight leading-tight"
            >
              Celebrate the Journey,
              <br className="hidden sm:block" />
              <span className="text-forest">Not Just the Destination</span>
            </h2>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-night/70 leading-relaxed">
              Share your hopes, goals, and aspirations. Receive encouragement from 
              the community and celebrate milestones along the way.
            </p>

            {/* Features grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {highlights.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl border border-mist/50 hover:border-forest/30 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-night/80">{item.label}</span>
                </div>
              ))}
            </div>

            <Link
              to="/aspirations/new"
              className="mt-8 sm:mt-10 btn-primary inline-flex items-center"
            >
              <span className="flex items-center gap-2">
                Share an Aspiration
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
