import { useState } from 'react';

const testimonials = [
  {
    quote: "I found encouragement exactly when I needed it most. Reading stories from others who've walked similar paths gave me strength I didn't know I had.",
    name: 'Sarah M.',
    location: 'Toronto, Canada',
    avatar: null,
  },
  {
    quote: "Sharing my story helped me see how far I had come. The community's response reminded me that vulnerability is a strength, not a weakness.",
    name: 'James K.',
    location: 'London, UK',
    avatar: null,
  },
  {
    quote: "PaTan reminded me that none of us walk alone. Every story I read connects me to someone else's journey, and that connection is powerful.",
    name: 'Amara O.',
    location: 'Lagos, Nigeria',
    avatar: null,
  },
  {
    quote: "The AI assistant helped me find the words when I couldn't. My story is now helping others going through the same experience.",
    name: 'Michael R.',
    location: 'Sydney, Australia',
    avatar: null,
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className="py-20 bg-dawn"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="testimonials-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
          >
            What Our Community Is Saying
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Testimonial Card */}
          <div
            className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center"
            role="group"
            aria-roledescription="testimonial"
            aria-label={`Testimonial ${currentIndex + 1} of ${testimonials.length}`}
          >
            <svg
              className="w-12 h-12 text-golden/30 mx-auto mb-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            
            <blockquote className="text-xl sm:text-2xl text-night/80 leading-relaxed italic">
              "{testimonials[currentIndex].quote}"
            </blockquote>
            
            <div className="mt-8 flex items-center justify-center gap-4">
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white font-bold text-lg">
                {testimonials[currentIndex].name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-medium text-midnight">
                  {testimonials[currentIndex].name}
                </p>
                <p className="text-sm text-night/50">
                  {testimonials[currentIndex].location}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={goToPrevious}
              className="p-2 rounded-full bg-mist hover:bg-golden/20 text-night/50 hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              aria-label="Previous testimonial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 ${
                    index === currentIndex ? 'bg-golden' : 'bg-mist'
                  }`}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToNext}
              className="p-2 rounded-full bg-mist hover:bg-golden/20 text-night/50 hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              aria-label="Next testimonial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
