import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Terms of Service | PaTan™" },
    {
      name: "description",
      content:
        "Terms and conditions for using the PaTan™ storytelling platform.",
    },
  ];
};

export default function Terms() {
  return (
    <main id="main-content" className="page-modern bg-dawn">
      {/* Hero */}
      <section className="bg-midnight text-dawn py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            Terms of Service
          </h1>
          <p className="mt-4 text-dawn/70">Last updated: June 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <article className="space-y-12">
              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Welcome to PaTan™
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  These Terms of Service govern your use of PaTan™ and its
                  services. By creating an account or using our platform, you
                  agree to these terms. Please read them carefully.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Your Account
                </h2>
                <div className="mt-4 space-y-4 text-night/70">
                  <p>
                    You must be at least 13 years old to create an account. You
                    are responsible for maintaining the security of your account
                    and all activities that occur under it.
                  </p>
                  <p>
                    You agree to provide accurate information and keep it
                    updated. We reserve the right to suspend accounts that
                    violate these terms.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Your Content
                </h2>
                <div className="mt-4 space-y-4 text-night/70">
                  <p>
                    You retain ownership of the stories and content you create
                    on PaTan™. By posting content, you grant us a license to
                    display, distribute, and promote your content on our
                    platform.
                  </p>
                  <p>
                    You are responsible for ensuring your content does not
                    violate any laws or the rights of others. Content that is
                    defamatory, infringing, or harmful may be removed.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Community Standards
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  All users must follow our Community Guidelines. Violations may
                  result in content removal, account suspension, or permanent
                  ban. We take the safety and wellbeing of our community
                  seriously.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Prohibited Activities
                </h2>
                <ul className="mt-4 space-y-2 text-night/70">
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Harassing, threatening, or intimidating other users
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Posting false, misleading, or harmful content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Impersonating others or misrepresenting your identity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Attempting to access others' accounts or private data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Using automated systems to scrape or spam the platform
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error mt-1">✗</span>
                    Violating intellectual property rights
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  AI Features
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  PaTan™ offers AI-powered features to assist with storytelling.
                  While these tools aim to help you express your experiences,
                  you are responsible for reviewing and approving any
                  AI-generated suggestions before publishing.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Disclaimers
                </h2>
                <div className="mt-4 space-y-4 text-night/70">
                  <p>
                    PaTan™ is provided "as is" without warranties of any kind.
                    We do not guarantee uninterrupted service or that the
                    platform will be error-free.
                  </p>
                  <p>
                    Stories shared on PaTan™ represent personal experiences and
                    should not be considered professional advice. For medical,
                    legal, or financial matters, please consult qualified
                    professionals.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Changes to Terms
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  We may update these terms from time to time. Significant
                  changes will be communicated through the platform or via
                  email. Continued use of PaTan™ after changes constitutes
                  acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="font-heading text-2xl font-bold text-midnight">
                  Contact Us
                </h2>
                <p className="mt-4 text-night/70 leading-relaxed">
                  Questions about these terms? Contact us at{" "}
                  <a
                    href="mailto:legal@patan.site"
                    className="text-golden hover:text-soft-gold"
                  >
                    legal@patan.site
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
