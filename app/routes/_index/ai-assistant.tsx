import { Link } from 'react-router';

const features = [
  { icon: '✏️', label: 'Grammar enhancement' },
  { icon: '📐', label: 'Story structure guidance' },
  { icon: '💡', label: 'Title suggestions' },
  { icon: '🪞', label: 'Reflection prompts' },
  { icon: '🌍', label: 'Multilingual support' },
];

export function AIAssistant() {
  return (
    <section
      className="py-20 bg-dawn"
      aria-labelledby="ai-assistant-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2
              id="ai-assistant-heading"
              className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
            >
              Tell Your Story with Confidence
            </h2>
            
            <p className="mt-4 text-lg text-night/70">
              Whether your thoughts are unfinished, emotional, or difficult to express, 
              PaTan's AI assistant helps transform your experiences into meaningful 
              narratives while preserving your authentic voice.
            </p>

            <ul className="mt-8 space-y-4" role="list">
              {features.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-3"
                >
                  <span
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-golden/10 flex items-center justify-center text-lg"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </span>
                  <span className="text-night/80">{feature.label}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/stories/new"
              className="mt-8 btn-primary inline-flex items-center"
            >
              Experience AI Guidance
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Editor Mockup */}
          <div className="relative" aria-hidden="true">
            <div className="bg-white rounded-xl shadow-xl border border-mist overflow-hidden">
              {/* Editor Header */}
              <div className="bg-mist/50 px-4 py-3 flex items-center gap-2 border-b border-mist">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/50" />
                  <div className="w-3 h-3 rounded-full bg-golden/50" />
                  <div className="w-3 h-3 rounded-full bg-forest/50" />
                </div>
                <span className="text-sm text-night/50 ml-2">Story Editor</span>
              </div>
              
              {/* Editor Content */}
              <div className="p-6">
                <div className="text-sm text-night/40 mb-2">Title</div>
                <div className="font-heading text-xl text-midnight mb-6">
                  Finding Light in the Darkness
                </div>
                
                <div className="text-sm text-night/40 mb-2">Your Story</div>
                <div className="text-night/70 leading-relaxed">
                  <p>
                    When I first received the news, I didn't know how to process it. 
                    The world felt like it was crumbling around me...
                  </p>
                  <p className="mt-3 text-night/40 italic">
                    Continue writing...
                  </p>
                </div>

                {/* AI Suggestion */}
                <div className="mt-6 p-4 bg-golden/5 rounded-lg border border-golden/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-golden/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-golden" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-golden">AI Suggestion</div>
                      <p className="text-sm text-night/60 mt-1">
                        Consider describing the specific moment you felt hope returning. 
                        What small sign gave you strength?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-golden/10 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-72 h-72 bg-forest/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
