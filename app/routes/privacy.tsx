import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Privacy Policy – PaTan' },
    { name: 'description', content: 'Learn how PaTan protects your privacy and handles your personal information.' },
  ];
};

export default function Privacy() {
  return (
    <main id="main-content" className="page-modern bg-dawn">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Privacy Policy
          </h1>
          <p className="mt-4 text-dawn/70">
            Last updated: June 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <article className="space-y-12">
              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Our Commitment to Privacy
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  At PaTan, we believe that sharing your story should never compromise your 
                  privacy. This policy explains how we collect, use, and protect your personal 
                  information when you use our platform.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Information We Collect
                </h2>
                <div className="mt-4 space-y-4 text-night/70">
                  <div>
                    <h3 className="font-semibold text-midnight">Account Information</h3>
                    <p>Name, email address, and profile details you provide when creating an account.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight">Content</h3>
                    <p>Stories, aspirations, comments, and other content you share on the platform.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-midnight">Usage Data</h3>
                    <p>Information about how you interact with our platform to improve your experience.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  How We Use Your Information
                </h2>
                <ul className="mt-4 space-y-2 text-night/70">
                  <li className="flex items-start gap-2">
                    <span className="text-golden mt-1">•</span>
                    Providing and improving our services
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-golden mt-1">•</span>
                    Personalizing your content discovery experience
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-golden mt-1">•</span>
                    Communicating with you about your account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-golden mt-1">•</span>
                    Ensuring platform safety and security
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-golden mt-1">•</span>
                    Complying with legal obligations
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Data Protection
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  We implement industry-standard security measures to protect your data, 
                  including encryption in transit and at rest, secure authentication, 
                  and regular security audits.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Your Rights
                </h2>
                <ul className="mt-4 space-y-2 text-night/70">
                  <li className="flex items-start gap-2">
                    <span className="text-forest mt-1">✓</span>
                    Access your personal data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest mt-1">✓</span>
                    Correct inaccurate information
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest mt-1">✓</span>
                    Delete your account and data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest mt-1">✓</span>
                    Export your stories and content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-forest mt-1">✓</span>
                    Opt out of non-essential communications
                  </li>
                </ul>
                <p className="mt-4 text-night/70 leading-relaxed">
                  For step-by-step account deletion instructions, visit our{' '}
                  <a href="/data-deletion" className="text-golden hover:text-soft-gold">
                    User Data Deletion page
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Anonymous Publishing
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  PaTan supports anonymous story publishing. When you publish anonymously, 
                  your identity is not displayed to other users. However, we retain this 
                  information internally for moderation and legal compliance purposes.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Third-Party Services
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  We use trusted third-party services for authentication, analytics, and 
                  infrastructure. These partners are bound by strict data processing agreements 
                  and are not permitted to use your data for their own purposes.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Contact Us
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  For privacy-related questions or to exercise your rights, contact us at{' '}
                  <a href="mailto:privacy@patan.app" className="text-golden hover:text-soft-gold">
                    privacy@patan.app
                  </a>
                </p>
              </section>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
