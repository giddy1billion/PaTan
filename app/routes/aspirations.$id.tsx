import type { MetaFunction } from "react-router";
import { useParams, Link } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Aspiration | PaTan™" },
    { name: "description", content: "View and support this aspiration." },
  ];
};

const aspiration = {
  id: "1",
  title: "Complete my first marathon",
  description: `For years, I've watched marathon runners cross the finish line and dreamed of being one of them. This year, I'm making it happen.

I'm not naturally athletic. In fact, I spent most of my 20s avoiding exercise. But after a health scare last year, I realized I needed to make a change. Running became my therapy, my meditation, my proof that I could push beyond what I thought possible.

Right now, I'm training for a local marathon happening in October. Every morning at 5 AM, I lace up my shoes and hit the pavement. Some days are hard, really hard. But I keep going.

I'm sharing this aspiration because I want to be accountable, and because I believe that when we share our goals, we give others permission to dream big too.

If you're working toward something that scares you, know that you're not alone. We're all just putting one foot in front of the other.`,
  author: {
    name: "Michael R.",
    avatar: null,
  },
  status: "in-progress",
  progress: 65,
  category: "Health & Wellness",
  createdAt: "2026-03-15",
  targetDate: "2026-10-15",
  supporters: 45,
  milestones: [
    { title: "Started training program", completed: true, date: "2026-03-20" },
    { title: "Completed first 5K", completed: true, date: "2026-04-15" },
    { title: "Completed first 10K", completed: true, date: "2026-05-20" },
    { title: "Complete half marathon", completed: false, date: null },
    { title: "Complete full marathon", completed: false, date: null },
  ],
  updates: [
    {
      date: "2026-06-01",
      content:
        "Just finished my longest run yet, 15 miles! Legs are tired but heart is full. 💪",
    },
    {
      date: "2026-05-20",
      content:
        "Completed my first 10K race! Finished in 58 minutes. Not fast, but I did it!",
    },
  ],
};

export default function AspirationDetail() {
  const { id } = useParams();

  return (
    <main id="main-content" className="page-modern bg-dawn">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/aspirations"
            className="inline-flex items-center text-sm text-night/60 hover:text-midnight mb-4"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All Aspirations
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <span className="badge-in-progress">In Progress</span>
            <span className="text-sm text-night/50">{aspiration.category}</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-midnight">
            {aspiration.title}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white font-bold">
                {aspiration.author.name.charAt(0)}
              </div>
              <span className="font-medium text-midnight">
                {aspiration.author.name}
              </span>
            </div>
            <span className="text-sm text-night/50">
              Started {new Date(aspiration.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-6 border border-mist mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-midnight">Progress</span>
            <span className="text-2xl font-bold text-golden">
              {aspiration.progress}%
            </span>
          </div>
          <div className="h-3 bg-mist rounded-full overflow-hidden">
            <div
              className="h-full bg-golden rounded-full"
              style={{ width: `${aspiration.progress}%` }}
              role="progressbar"
              aria-valuenow={aspiration.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-night/60">
            <span>
              Target: {new Date(aspiration.targetDate).toLocaleDateString()}
            </span>
            <span>👥 {aspiration.supporters} supporters</span>
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-lg max-w-none mb-12">
          {aspiration.description.split("\n\n").map((paragraph, index) => (
            <p key={index} className="text-night/80 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Support Button */}
        <div className="text-center py-8 border-y border-mist mb-12">
          <button type="button" className="btn-primary text-lg px-8">
            🙌 Support This Aspiration
          </button>
          <p className="mt-2 text-sm text-night/50">Show your encouragement</p>
        </div>

        {/* Milestones */}
        <section className="mb-12">
          <h2 className="font-heading text-xl font-bold text-midnight mb-6">
            Milestones
          </h2>
          <div className="space-y-4">
            {aspiration.milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-lg ${
                  milestone.completed ? "bg-forest/5" : "bg-mist/30"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.completed
                      ? "bg-forest text-white"
                      : "bg-mist text-night/30"
                  }`}
                >
                  {milestone.completed ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-night/30" />
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${milestone.completed ? "text-midnight" : "text-night/50"}`}
                  >
                    {milestone.title}
                  </p>
                  {milestone.date && (
                    <p className="text-sm text-night/50">
                      {new Date(milestone.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="font-heading text-xl font-bold text-midnight mb-6">
            Updates
          </h2>
          <div className="space-y-6">
            {aspiration.updates.map((update, index) => (
              <div
                key={index}
                className="p-4 bg-white rounded-lg border border-mist"
              >
                <p className="text-night/80">{update.content}</p>
                <p className="mt-2 text-sm text-night/50">
                  {new Date(update.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* CTA */}
      <section className="py-16 bg-mist/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-midnight">
            Inspired to Share Your Own Goal?
          </h2>
          <p className="mt-4 text-night/70">
            When we share our aspirations, we invite the community to support
            us.
          </p>
          <Link to="/aspirations/new" className="mt-6 btn-primary inline-block">
            Share Your Aspiration
          </Link>
        </div>
      </section>
    </main>
  );
}
