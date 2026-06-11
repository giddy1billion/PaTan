import { Link } from 'react-router';

const floatingStories = [
  "I never thought I would overcome this...",
  "This experience changed my perspective...",
  "Today, I am grateful because...",
];

export function Hero() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/95 to-dawn"
        aria-hidden="true"
      />
      
      {/* Floating Story Cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {floatingStories.map((story, index) => (
          <div
            key={index}
            className={`
              absolute bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-xs
              border border-white/20 text-dawn/80 text-sm italic
              animate-float
            `}
            style={{
              top: `${20 + index * 25}%`,
              left: index % 2 === 0 ? '5%' : 'auto',
              right: index % 2 === 1 ? '5%' : 'auto',
              animationDelay: `${index * 2}s`,
            }}
          >
            "{story}"
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Logo Animation Placeholder */}
        <div className="mb-8 flex justify-center">
          <img
            src="/brand/logos/logo-md.png"
            alt="PaTan Tree of Light"
            className="h-32 w-auto animate-pulse-slow"
          />
        </div>

        <h1
          id="hero-heading"
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-dawn leading-tight"
        >
          Every Story Has the Power to
          <br />
          <span className="text-golden">Light Someone Else's Path.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-dawn/80 max-w-3xl mx-auto leading-relaxed">
          Discover authentic stories of hope, gratitude, resilience, and transformation. 
          Reflect on your journey, inspire others through your experiences, and connect 
          with a community that celebrates the beauty of being human.
        </p>

        {/* CTAs */}
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
            Explore Stories
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-dawn/60 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-golden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Thousands of stories shared</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-golden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            <span>Growing global community</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-golden" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Safe and inclusive environment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
