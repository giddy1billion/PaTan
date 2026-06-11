import { Link } from 'react-router';

export function FinalCTA() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-midnight to-night"
        aria-hidden="true"
      />
      
      {/* Tree of Light Animation - Expanding leaves effect */}
      <div 
        className="absolute inset-0 opacity-20"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Central tree */}
          <div className="relative">
            <img
              src="/brand/logos/logo-md.png"
              alt=""
              className="h-48 w-auto opacity-50"
            />
            {/* Glowing leaves effect */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-golden rounded-full animate-float"
                style={{
                  top: `${Math.random() * 200 - 100}px`,
                  left: `${Math.random() * 400 - 200}px`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="final-cta-heading"
          className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-dawn leading-tight"
        >
          Someone May Need the Story
          <br />
          <span className="text-golden">Only You Can Tell.</span>
        </h2>
        
        <p className="mt-6 text-lg sm:text-xl text-dawn/80 max-w-2xl mx-auto">
          Your experiences matter. Reflect on your journey. Inspire through authenticity. 
          Connect through shared humanity.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/stories/new"
            className="btn-primary text-lg px-8 py-4"
          >
            Share Your Story
          </Link>
          <Link
            to="/discover"
            className="btn-secondary text-lg px-8 py-4 border-dawn text-dawn hover:bg-dawn hover:text-midnight"
          >
            Explore the Community
          </Link>
        </div>

        {/* Tagline */}
        <p className="mt-16 text-sm text-dawn/50 tracking-[0.3em] uppercase">
          Reflect • Inspire • Connect
        </p>
      </div>
    </section>
  );
}
