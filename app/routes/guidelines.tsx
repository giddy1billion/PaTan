import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Community Guidelines – PaTan™' },
    { name: 'description', content: 'PaTan™ community guidelines for respectful, supportive storytelling and engagement.' },
  ];
};

const guidelines = [
  {
    title: 'Share Authentically',
    description: 'Tell your own story in your own words. Authenticity creates genuine connection.',
    dos: ['Share personal experiences', 'Use your authentic voice', 'Be honest about your journey'],
    donts: ['Fabricate stories', 'Plagiarize others\' experiences', 'Misrepresent yourself'],
  },
  {
    title: 'Respect Everyone',
    description: 'Our community includes people from all backgrounds, beliefs, and perspectives.',
    dos: ['Celebrate diversity', 'Listen with empathy', 'Disagree respectfully'],
    donts: ['Discriminate or harass', 'Attack others\' beliefs', 'Use hate speech'],
  },
  {
    title: 'Protect Privacy',
    description: 'Honor the privacy of yourself and others mentioned in your stories.',
    dos: ['Get consent before sharing others\' stories', 'Use discretion with identifying details', 'Respect anonymity choices'],
    donts: ['Share others\' personal information', 'Reveal confidential details', 'Identify people without consent'],
  },
  {
    title: 'Encourage, Don\'t Compare',
    description: 'PaTan™ is about lifting each other up, not competing.',
    dos: ['Celebrate others\' milestones', 'Offer genuine encouragement', 'Focus on growth over perfection'],
    donts: ['Make comparisons', 'Diminish others\' experiences', 'Promote competitive dynamics'],
  },
  {
    title: 'Maintain Emotional Safety',
    description: 'Be mindful that others may be in vulnerable moments when reading stories.',
    dos: ['Use content warnings when appropriate', 'Write with compassion', 'Consider your audience'],
    donts: ['Post gratuitously graphic content', 'Trivialize trauma', 'Exploit vulnerability for engagement'],
  },
  {
    title: 'Support Mental Health',
    description: 'While we share our struggles, we also prioritize wellbeing.',
    dos: ['Share resources when appropriate', 'Encourage professional help when needed', 'Check in on community members'],
    donts: ['Provide medical advice', 'Discourage professional help', 'Exploit mental health struggles'],
  },
];

export default function Guidelines() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16" aria-labelledby="guidelines-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 id="guidelines-heading" className="font-heading text-3xl sm:text-4xl font-bold">
            Community Guidelines
          </h1>
          <p className="mt-4 text-lg text-dawn/70">
            Together, we create a sanctuary for authentic storytelling and meaningful connection.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-mist">
            <h2 className="font-heading text-xl font-bold text-midnight">
              Our Commitment to You
            </h2>
            <p className="mt-4 text-night/70 leading-relaxed">
              PaTan™ is built on the belief that every story matters and every voice deserves 
              to be heard. These guidelines exist not to restrict, but to protect — ensuring 
              that everyone in our community feels safe to share their most authentic selves.
            </p>
            <p className="mt-4 text-night/70 leading-relaxed">
              By participating in PaTan™, you agree to uphold these principles and help us 
              maintain a space where hope, healing, and human connection can flourish.
            </p>
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="py-12 bg-mist/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {guidelines.map((guideline, index) => (
              <article
                key={guideline.title}
                className="bg-white rounded-xl p-8 shadow-sm border border-mist"
              >
                <h2 className="font-heading text-xl font-bold text-midnight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-golden/20 text-golden flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {guideline.title}
                </h2>
                <p className="mt-4 text-night/70">
                  {guideline.description}
                </p>
                
                <div className="mt-6 grid sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-forest uppercase tracking-wider">
                      Do
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {guideline.dos.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-night/70">
                          <span className="text-forest mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-error uppercase tracking-wider">
                      Don't
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {guideline.donts.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-night/70">
                          <span className="text-error mt-0.5">✗</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-12 bg-dawn">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-mist">
            <h2 className="font-heading text-xl font-bold text-midnight">
              Reporting Violations
            </h2>
            <p className="mt-4 text-night/70">
              If you encounter content or behavior that violates these guidelines, please 
              report it using the report button on any story or profile. Our moderation 
              team reviews all reports within 24 hours.
            </p>
            <p className="mt-4 text-night/70">
              For urgent concerns or questions about these guidelines, contact us at{' '}
              <a href="mailto:safety@PaTan™.site" className="text-golden hover:text-soft-gold">
                safety@PaTan™.site
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Ready to Join Our Community?
          </h2>
          <p className="mt-4 text-night/70">
            By following these guidelines, you help us maintain a space where everyone 
            can share their story with confidence.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary">
              Get Started
            </Link>
            <Link to="/discover" className="btn-secondary">
              Explore Stories
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
