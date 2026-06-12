import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, redirect } from 'react-router';
import { requireUser } from '~/utils/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Share Your Aspiration – PaTan™' },
    { name: 'description', content: 'Share your dreams and goals with the community and receive support.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);

  // Database insert belongs here and should always run after auth guard.
  // Example future insert: await prisma.aspiration.create({ data: { ... } });
  return redirect('/aspirations?created=1');
}

const categories = [
  'Health & Wellness',
  'Personal Growth',
  'Relationships',
  'Professional',
  'Social Impact',
  'Creative',
  'Spiritual',
  'Financial',
  'Education',
  'Other',
];

export default function NewAspiration() {
  return (
    <main id="main-content" className="page-modern min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="page-hero-modern relative p-6 sm:p-8 lg:p-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[#64748B] font-medium">
            Growth • Purpose • Community
          </p>
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight leading-tight">
            Share Your Aspiration
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#334155] max-w-3xl leading-relaxed">
            When we share our goals, we invite encouragement, accountability, and
            meaningful support along the journey.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDF3D6] text-[#0D2B45] text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-[#F5B942]" aria-hidden="true" />
              Hopeful Progress
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5EC] text-[#0D2B45] text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2E6F40]" aria-hidden="true" />
              Community Support
            </span>
          </div>
        </div>

        <Form method="post" className="form-modern mt-8 sm:mt-10 space-y-8">
          <section className="surface-modern p-5 sm:p-7 space-y-5" aria-labelledby="aspiration-basics-heading">
            <h2 id="aspiration-basics-heading" className="font-heading text-xl sm:text-2xl text-midnight font-bold">
              Aspiration Basics
            </h2>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-night">
                What are you working toward? <span className="text-error">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={100}
                className="mt-1 block w-full px-4 py-3"
                placeholder="e.g., Complete my first marathon"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-night">
                Category <span className="text-error">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 block w-full px-4 py-3 bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-night">
                Tell us more about this aspiration
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                className="mt-1 block w-full px-4 py-3 resize-y"
                placeholder="Why is this important to you? What motivated you to pursue this goal?"
              />
            </div>
          </section>

          <section className="surface-modern p-5 sm:p-7 space-y-5" aria-labelledby="aspiration-plan-heading">
            <h2 id="aspiration-plan-heading" className="font-heading text-xl sm:text-2xl text-midnight font-bold">
              Timeline & Milestones
            </h2>

            <div>
              <label htmlFor="targetDate" className="block text-sm font-medium text-night">
                Target completion date
              </label>
              <input
                id="targetDate"
                name="targetDate"
                type="date"
                className="mt-1 block w-full px-4 py-3"
              />
              <p className="mt-1 text-sm text-[#64748B]">
                Optional. A date helps you track meaningful progress.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-night mb-2">
                Milestones
              </label>
              <p className="text-sm text-[#64748B] mb-4">
                Break your aspiration into smaller steps.
              </p>
              <div className="space-y-3">
                {[1, 2, 3].map((num) => (
                  <input
                    key={num}
                    name={`milestone${num}`}
                    type="text"
                    className="block w-full px-4 py-3"
                    placeholder={`Milestone ${num}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <fieldset className="surface-modern p-6" aria-labelledby="aspiration-privacy-heading">
            <legend id="aspiration-privacy-heading" className="text-sm font-medium text-night px-2">Privacy</legend>

            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  defaultChecked
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <span className="font-medium text-midnight">Public</span>
                  <p className="text-sm text-night/60">Anyone can see and support your aspiration</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="followers"
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <span className="font-medium text-midnight">Followers Only</span>
                  <p className="text-sm text-night/60">Only your followers can see this</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <span className="font-medium text-midnight">Private</span>
                  <p className="text-sm text-night/60">Only you can see this aspiration</p>
                </div>
              </label>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="checkbox"
                  name="anonymous"
                  className="h-4 w-4"
                />
                <div>
                  <span className="font-medium text-midnight">Post Anonymously</span>
                  <p className="text-sm text-night/60">Your name will not be shown</p>
                </div>
              </label>
            </div>
          </fieldset>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1 py-3 text-base sm:text-lg"
            >
              Share Aspiration
            </button>
            <Link
              to="/aspirations"
              className="btn-secondary flex-1 py-3 text-center text-base sm:text-lg"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
