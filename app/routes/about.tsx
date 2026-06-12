import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "About PaTan™ | Our Mission to Illuminate Lives Through Stories" },
    {
      name: "description",
      content:
        "Learn about PaTan™'s mission to create a trusted digital sanctuary where people share authentic life experiences that inspire humanity.",
    },
  ];
};

const values = [
  {
    icon: "💡",
    title: "Illumination",
    description: "Every story has the power to light someone else's path.",
  },
  {
    icon: "🤝",
    title: "Authentic Connection",
    description: "Real stories from real people create genuine human bonds.",
  },
  {
    icon: "🌱",
    title: "Growth Mindset",
    description: "We celebrate progress, not perfection.",
  },
  {
    icon: "🛡️",
    title: "Emotional Safety",
    description: "A sanctuary where vulnerability is protected and honored.",
  },
  {
    icon: "🌍",
    title: "Inclusive Community",
    description: "Faith-friendly but belief-inclusive for all backgrounds.",
  },
  {
    icon: "✨",
    title: "Positive Impact",
    description: "Encouragement over virality, meaning over metrics.",
  },
];

const team = [
  { name: "Coming Soon", role: "Founder & CEO", image: null },
  { name: "Coming Soon", role: "Head of Community", image: null },
  { name: "Coming Soon", role: "Lead Engineer", image: null },
];

export default function About() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section
        className="bg-midnight text-dawn py-20"
        aria-labelledby="about-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            id="about-heading"
            className="font-heading text-4xl sm:text-5xl font-bold"
          >
            Illuminating Lives Through
            <span className="text-golden"> Authentic Stories</span>
          </h1>
          <p className="mt-6 text-xl text-dawn/80">
            PaTan™ exists to create a trusted digital sanctuary where people
            from every background can share authentic life experiences that
            inspire humanity.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-dawn">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-midnight">
              Our Mission
            </h2>
            <p className="mt-6 text-xl text-night/70 leading-relaxed">
              To illuminate the human experience through authentic stories of
              hope, resilience, gratitude, faith, transformation, and personal
              growth.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-mist">
              <h3 className="font-heading text-xl font-bold text-midnight">
                What We Believe
              </h3>
              <ul className="mt-4 space-y-3 text-night/70">
                <li className="flex items-start gap-2">
                  <span className="text-golden mt-1">✓</span>
                  Every person has a story worth sharing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-golden mt-1">✓</span>
                  Vulnerability is a form of strength
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-golden mt-1">✓</span>
                  Connection heals isolation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-golden mt-1">✓</span>
                  Hope is contagious
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-mist">
              <h3 className="font-heading text-xl font-bold text-midnight">
                What We Do Differently
              </h3>
              <ul className="mt-4 space-y-3 text-night/70">
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-1">→</span>
                  Encouragement over engagement metrics
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-1">→</span>
                  Reflection over comparison
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-1">→</span>
                  AI that assists, never replaces your voice
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-1">→</span>
                  Community safety as a foundation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            Our Core Values
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-mist"
              >
                <span className="text-4xl" aria-hidden="true">
                  {value.icon}
                </span>
                <h3 className="mt-4 font-heading text-xl font-bold text-midnight">
                  {value.title}
                </h3>
                <p className="mt-2 text-night/70">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team placeholder */}
      <section className="py-20 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-midnight text-center">
            The Team Behind PaTan™
          </h2>
          <p className="mt-4 text-center text-night/60">
            Building a platform for human connection
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-golden/20 to-forest/20 flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="mt-4 font-medium text-midnight">
                  {member.name}
                </h3>
                <p className="text-sm text-night/60">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-midnight text-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold">
            Ready to Share Your Story?
          </h2>
          <p className="mt-4 text-lg text-dawn/70">
            Join thousands of people finding hope, encouragement, and connection
            through authentic storytelling.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary">
              Get Started Free
            </Link>
            <Link to="/discover" className="btn-secondary-dark">
              Explore Stories
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
