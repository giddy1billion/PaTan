import { Link } from 'react-router';

const features = [
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ), 
    label: 'Grammar enhancement',
    description: 'Polish your writing naturally',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ), 
    label: 'Story structure guidance',
    description: 'Organize your narrative',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ), 
    label: 'Title suggestions',
    description: 'Find the perfect headline',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), 
    label: 'Reflection prompts',
    description: 'Uncover deeper insights',
  },
  { 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), 
    label: 'Multilingual support',
    description: 'Share in your language',
  },
];

export function AIAssistant() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-dawn relative overflow-hidden"
      aria-labelledby="ai-assistant-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-golden/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-forest/5 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <span className="badge-golden-accessible mb-4">
              AI-Powered Assistance
            </span>
            
            <h2
              id="ai-assistant-heading"
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight leading-tight"
            >
              Tell Your Story with Confidence
            </h2>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted leading-relaxed">
              Whether your thoughts are unfinished, emotional, or difficult to express, 
              PaTan AI assistant helps transform your experiences into meaningful 
              narratives while preserving your authentic voice.
            </p>

            {/* Features grid */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={feature.label}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-mist/50 hover:border-golden/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-golden/15 text-golden-accessible flex items-center justify-center group-hover:bg-golden/25 transition-colors">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-midnight text-sm sm:text-base">
                      {feature.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-subtle mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/stories/new"
              className="mt-8 sm:mt-10 btn-primary inline-flex items-center"
            >
              <span className="flex items-center gap-2">
                Experience AI Guidance
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Editor Mockup */}
          <div className="relative order-1 lg:order-2" aria-hidden="true">
            <div className="relative bg-white rounded-2xl shadow-layered-lg border border-mist/50 overflow-hidden">
              {/* Editor Header */}
              <div className="bg-gradient-to-r from-mist/50 to-mist/30 px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-mist/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-golden/60" />
                  <div className="w-3 h-3 rounded-full bg-forest/60" />
                </div>
                <span className="text-sm text-subtle font-medium ml-2">Story Editor</span>
              </div>
              
              {/* Editor Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-subtle uppercase tracking-wider font-medium">Title</label>
                    <div className="mt-1 font-heading text-lg sm:text-xl text-midnight font-semibold">
                      Finding Light in the Darkness
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-subtle uppercase tracking-wider font-medium">Your Story</label>
                    <div className="mt-2 text-muted leading-relaxed text-sm sm:text-base">
                      <p>
                        When I first received the news, I didn't know how to process it. 
                        The world felt like it was crumbling around me...
                      </p>
                      <p className="mt-3 text-subtle italic">
                        Continue writing...
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Suggestion Card */}
                <div className="mt-6 p-4 sm:p-5 bg-gradient-to-br from-golden/10 via-golden/5 to-transparent rounded-xl border border-golden/20">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-golden/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-golden-accessible" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-golden-accessible">AI Suggestion</div>
                      <p className="text-sm text-muted mt-1 leading-relaxed">
                        Consider describing the specific moment you felt hope returning. 
                        What small sign gave you strength?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative glow elements */}
            <div className="absolute -z-10 -top-6 -right-6 w-48 h-48 sm:w-72 sm:h-72 bg-golden/15 rounded-full blur-[60px]" />
            <div className="absolute -z-10 -bottom-6 -left-6 w-40 h-40 sm:w-56 sm:h-56 bg-forest/15 rounded-full blur-[50px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
