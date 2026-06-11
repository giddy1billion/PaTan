import { Link } from 'react-router';

const highlights = [
  { icon: '🎯', label: 'Track aspirations' },
  { icon: '📊', label: 'Update progress' },
  { icon: '🎉', label: 'Celebrate achievements' },
  { icon: '💝', label: 'Receive support' },
];

export function Aspirations() {
  return (
    <section
      className="py-20 bg-dawn"
      aria-labelledby="aspirations-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Timeline Illustration */}
          <div className="order-2 lg:order-1" aria-hidden="true">
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-golden via-forest to-golden/20" />
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {[
                  { status: 'achieved', label: 'Started my healing journey', date: 'Jan 2024' },
                  { status: 'achieved', label: 'Shared my first story', date: 'Mar 2024' },
                  { status: 'in-progress', label: 'Building a supportive community', date: 'Current' },
                  { status: 'pending', label: 'Inspire 100 people', date: 'Goal' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pl-4">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        item.status === 'achieved'
                          ? 'bg-forest text-white'
                          : item.status === 'in-progress'
                          ? 'bg-golden text-white'
                          : 'bg-mist text-night/50'
                      }`}
                    >
                      {item.status === 'achieved' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : item.status === 'in-progress' ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-night/30 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-mist">
                      <p className="font-medium text-midnight">{item.label}</p>
                      <p className="text-sm text-night/50 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h2
              id="aspirations-heading"
              className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
            >
              Celebrate the Journey,
              <br />
              Not Just the Destination
            </h2>
            
            <p className="mt-4 text-lg text-night/70">
              Share your hopes, goals, and aspirations. Receive encouragement from 
              the community and celebrate milestones along the way.
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-4" role="list">
              {highlights.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 p-3 bg-mist/50 rounded-lg"
                >
                  <span
                    className="text-xl"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm text-night/80">{item.label}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/aspirations/new"
              className="mt-8 btn-primary inline-flex items-center"
            >
              Share an Aspiration
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
