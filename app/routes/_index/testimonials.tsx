import { useState, useEffect, useCallback } from 'react';

const testimonials = [
  {
    quote: "I found encouragement exactly when I needed it most. Reading stories from others who've walked similar paths gave me strength I didn't know I had.",
    name: 'Sarah M.',
    location: 'Toronto, Canada',
    initials: 'SM',
  },
  {
    quote: "Sharing my story helped me see how far I had come. The community's response reminded me that vulnerability is a strength, not a weakness.",
    name: 'James K.',
    location: 'London, UK',
    initials: 'JK',
  },
  {
    quote: "PaTan reminded me that none of us walk alone. Every story I read connects me to someone else's journey, and that connection is powerful.",
    name: 'Amara O.',
    location: 'Lagos, Nigeria',
    initials: 'AO',
  },
  {
    quote: "The AI assistant helped me find the words when I couldn't. My story is now helping others going through the same experience.",
    name: 'Michael R.',
    location: 'Sydney, Australia',
    initials: 'MR',
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  // Auto-advance
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, goToNext]);

  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-dawn relative overflow-hidden"
      aria-labelledby="testimonials-heading"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-golden/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-forest/5 rounded-full blur-[80px]" />
      </div>
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="badge-info-accessible mb-4">
            Community Voices
          </span>
          <h2
            id="testimonials-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight"
          >
            What Our Community Is Saying
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Main testimonial card */}
          <div
            className="relative bg-white rounded-3xl shadow-layered-lg p-6 sm:p-10 lg:p-12"
            role="group"
            aria-roledescription="testimonial"
            aria-label={`Testimonial ${currentIndex + 1} of ${testimonials.length}`}
          >
            {/* Large quote mark */}
            <svg
              className="absolute top-6 left-6 sm:top-8 sm:left-8 w-12 h-12 sm:w-16 sm:h-16 text-golden/20"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            
            {/* Quote text */}
            <blockquote className="relative pt-8 sm:pt-12 text-center">
              <p className="text-lg sm:text-xl lg:text-2xl text-muted leading-relaxed font-medium italic max-w-3xl mx-auto">
                "{testimonials[currentIndex].quote}"
              </p>
              
              {/* Author */}
              <footer className="mt-8 sm:mt-10 flex items-center justify-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-golden via-golden to-forest flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-golden">
                  {testimonials[currentIndex].initials}
                </div>
                <div className="text-left">
                  <cite className="not-italic font-semibold text-midnight text-base sm:text-lg">
                    {testimonials[currentIndex].name}
                  </cite>
                  <p className="text-sm sm:text-base text-subtle">
                    {testimonials[currentIndex].location}
                  </p>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8">
            {/* Previous button */}
            <button
              type="button"
              onClick={goToPrevious}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md flex items-center justify-center text-subtle hover:text-golden hover:shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2 sm:gap-3" role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    transition-all duration-300 
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2
                    ${index === currentIndex 
                      ? 'w-8 sm:w-10 h-2.5 sm:h-3 rounded-full bg-golden' 
                      : 'w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-mist hover:bg-golden/30'
                    }
                  `}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={goToNext}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md flex items-center justify-center text-subtle hover:text-golden hover:shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
