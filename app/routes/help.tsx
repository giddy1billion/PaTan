import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Help Center | PaTan™" },
    {
      name: "description",
      content:
        "Get help with your PaTan™ account, storytelling, and community features.",
    },
  ];
};

const categories = [
  {
    title: "Getting Started",
    icon: "🚀",
    articles: [
      "Creating your account",
      "Setting up your profile",
      "Writing your first story",
      "Understanding privacy settings",
    ],
  },
  {
    title: "Storytelling",
    icon: "✍️",
    articles: [
      "How to write a compelling story",
      "Using AI assistance",
      "Adding media to your story",
      "Publishing and sharing",
    ],
  },
  {
    title: "Aspirations",
    icon: "🎯",
    articles: [
      "Creating an aspiration",
      "Tracking your progress",
      "Celebrating achievements",
      "Finding community support",
    ],
  },
  {
    title: "Account & Privacy",
    icon: "🔐",
    articles: [
      "Managing your account",
      "Privacy and data settings",
      "Anonymous publishing",
      "Deleting your account",
    ],
  },
  {
    title: "Community",
    icon: "👥",
    articles: [
      "Engaging with stories",
      "Following storytellers",
      "Community guidelines",
      "Reporting content",
    ],
  },
  {
    title: "Technical Support",
    icon: "🔧",
    articles: [
      "App troubleshooting",
      "Browser compatibility",
      "Mobile app issues",
      "Contact support",
    ],
  },
];

export default function Help() {
  return (
    <main id="main-content" className="page-modern">
      {/* Hero */}
      <section
        className="bg-midnight text-dawn py-16"
        aria-labelledby="help-heading"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            id="help-heading"
            className="font-heading text-3xl sm:text-4xl font-bold"
          >
            How Can We Help?
          </h1>
          <div className="mt-8 max-w-xl mx-auto">
            <label htmlFor="search" className="sr-only">
              Search help articles
            </label>
            <div className="relative">
              <input
                id="search"
                type="search"
                placeholder="Search for help..."
                className="w-full px-5 py-4 pl-12 rounded-full bg-night/50 border border-dawn/20 text-dawn placeholder-dawn/50 focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dawn/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-dawn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <article
                key={category.title}
                className="card hover:shadow-lg transition-shadow"
              >
                <span className="text-3xl" aria-hidden="true">
                  {category.icon}
                </span>
                <h2 className="mt-4 font-heading text-lg font-bold text-midnight">
                  {category.title}
                </h2>
                <ul className="mt-4 space-y-2" role="list">
                  {category.articles.map((article) => (
                    <li key={article}>
                      <a
                        href="#"
                        className="text-sm text-night/70 hover:text-golden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
                      >
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Still Need Help?
          </h2>
          <p className="mt-4 text-night/70">
            Our support team is here to help you on your journey.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@PaTan™.site"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Support
            </a>
            <Link
              to="/guidelines"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Community Guidelines
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
