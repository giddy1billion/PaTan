import { useEffect, useState } from 'react';

const metrics = [
  { label: 'Stories Shared', value: 12847, suffix: '+' },
  { label: 'Lives Encouraged', value: 89234, suffix: '+' },
  { label: 'Celebrations Given', value: 245000, suffix: '+' },
  { label: 'Countries Represented', value: 147, suffix: '' },
  { label: 'Community Connections', value: 34521, suffix: '+' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
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
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function CommunityMetrics() {
  return (
    <section
      className="py-20 bg-midnight relative overflow-hidden"
      aria-labelledby="metrics-heading"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5B942' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="metrics-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-dawn"
          >
            Stories Creating Ripples of Hope
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="text-center"
              role="status"
              aria-live="polite"
            >
              <div className="font-heading text-3xl sm:text-4xl font-bold text-golden">
                <AnimatedCounter value={metric.value} suffix={metric.suffix} />
              </div>
              <p className="mt-2 text-sm text-dawn/70">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
