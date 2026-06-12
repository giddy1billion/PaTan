import { useEffect, useState, useRef } from 'react';

const metrics = [
  { 
    label: 'Stories Shared', 
    value: 12847, 
    suffix: '+',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  { 
    label: 'Lives Encouraged', 
    value: 89234, 
    suffix: '+',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  { 
    label: 'Celebrations', 
    value: 245000, 
    suffix: '+',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  { 
    label: 'Countries', 
    value: 147, 
    suffix: '',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function AnimatedCounter({ value, suffix, isVisible }: { value: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function CommunityMetrics() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-28 bg-midnight text-white relative overflow-hidden"
      aria-labelledby="metrics-heading"
    >
      {/* Animated background */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-golden/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-forest/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(245, 185, 66, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 185, 66, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-golden/20 text-golden text-sm font-medium mb-4">
            Our Impact
          </span>
          <h2
            id="metrics-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-dawn"
          >
            Stories Creating Ripples of Hope
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`
                relative text-center p-6 sm:p-8
                rounded-2xl
                bg-white/5 backdrop-blur-sm
                border border-white/10
                opacity-0 animate-fade-in-up
              `}
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
              role="status"
              aria-live="polite"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-golden/20 text-golden mb-4">
                {metric.icon}
              </div>
              
              {/* Counter */}
              <div className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-golden">
                <AnimatedCounter 
                  value={metric.value} 
                  suffix={metric.suffix}
                  isVisible={isVisible}
                />
              </div>
              
              {/* Label */}
              <p className="mt-2 text-sm sm:text-base text-dawn">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p className="mt-12 sm:mt-16 text-center text-dawn text-sm sm:text-base max-w-2xl mx-auto">
          Every number represents a real person whose story created hope for another. 
          Your story could be the next ripple.
        </p>
      </div>
    </section>
  );
}
