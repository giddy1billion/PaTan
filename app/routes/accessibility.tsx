import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Accessibility Statement | PaTan™" },
    {
      name: "description",
      content: "PaTan™'s commitment to digital accessibility for all users.",
    },
  ];
};

export default function Accessibility() {
  return (
    <main id="main-content" className="page-modern bg-dawn">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Accessibility Statement
          </h1>
          <p className="mt-4 text-dawn/70">
            Every story deserves to be shared and heard by everyone.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="space-y-12">
            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Our Commitment
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                PaTan™ is committed to ensuring digital accessibility for people
                with disabilities. We are continually improving the user
                experience for everyone and applying the relevant accessibility
                standards.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Conformance Status
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                We strive to conform to the Web Content Accessibility Guidelines
                (WCAG) 2.2 Level AA standards. These guidelines explain how to
                make web content more accessible for people with disabilities.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Accessibility Features
              </h2>
              <ul className="mt-4 space-y-3 text-night/70">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">
                      Keyboard Navigation
                    </strong>
                    <p>
                      All functionality is accessible via keyboard without
                      requiring a mouse.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">
                      Screen Reader Support
                    </strong>
                    <p>
                      Semantic HTML and ARIA labels ensure compatibility with
                      assistive technologies.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">Color Contrast</strong>
                    <p>
                      Text maintains a minimum 4.5:1 contrast ratio against
                      backgrounds.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">Focus Indicators</strong>
                    <p>
                      Visible focus states help keyboard users navigate the
                      interface.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">Skip Links</strong>
                    <p>
                      Skip navigation links allow users to jump directly to main
                      content.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">Reduced Motion</strong>
                    <p>
                      Animations respect user preferences for reduced motion.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest/10 text-forest flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <strong className="text-midnight">
                      Form Accessibility
                    </strong>
                    <p>
                      All form inputs have associated labels and error messages
                      are announced.
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Assistive Technologies
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                PaTan™ is designed to be compatible with the following assistive
                technologies:
              </p>
              <ul className="mt-4 space-y-2 text-night/70">
                <li>• Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
                <li>• Voice control software</li>
                <li>• Screen magnification tools</li>
                <li>• Alternative input devices</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Known Limitations
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                While we strive for full accessibility, some content may have
                limitations:
              </p>
              <ul className="mt-4 space-y-2 text-night/70">
                <li>
                  • User-uploaded images may not always have descriptive alt
                  text
                </li>
                <li>
                  • Some third-party embedded content may not be fully
                  accessible
                </li>
                <li>
                  • PDF documents generated by users may vary in accessibility
                </li>
              </ul>
              <p className="mt-4 text-night/70">
                We are actively working to address these limitations and
                encourage users to add descriptive text to their media.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Feedback
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                We welcome your feedback on the accessibility of PaTan™. If you
                encounter any barriers or have suggestions for improvement,
                please contact us:
              </p>
              <div className="mt-4 p-6 bg-mist/50 rounded-xl">
                <p className="text-night/70">
                  <strong className="text-midnight">Email:</strong>{" "}
                  <a
                    href="mailto:accessibility@patan.site"
                    className="text-golden hover:text-soft-gold"
                  >
                    accessibility@patan.site
                  </a>
                </p>
                <p className="mt-2 text-night/70">
                  We aim to respond to accessibility feedback within 3 business
                  days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold text-midnight">
                Continuous Improvement
              </h2>
              <p className="mt-4 text-night/70 leading-relaxed">
                Accessibility is an ongoing effort. We regularly audit our
                platform, train our team on accessibility best practices, and
                incorporate feedback from users with disabilities to improve our
                services.
              </p>
            </section>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Questions?
          </h2>
          <p className="mt-4 text-night/70">
            Our team is here to help ensure you can fully experience PaTan™.
          </p>
          <div className="mt-6">
            <Link to="/help" className="btn-primary">
              Visit Help Center
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
