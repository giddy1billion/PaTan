import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, redirect } from 'react-router';
import { useState } from 'react';
import { requireUser } from '~/utils/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Share Your Story – PaTan™' },
    { name: 'description', content: 'Share your transformative experience and inspire others on their journey.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get('action') ?? 'publish');

  // Database insert belongs here and should always run after auth guard.
  // Example future insert: await prisma.story.create({ data: { ..., authorId: user.id } });
  const destination = intent === 'draft' ? '/discover?saved=draft' : '/discover?published=story';

  return redirect(destination);
}

const categories = [
  'Gratitude',
  'Inspiration',
  'Transformation',
  'Hope and Faith',
  'Health and Wellness',
  'Professional Growth',
  'Relationships',
  'Social Impact',
  'Overcoming Adversity',
  'Personal Triumph',
];

export default function NewStory() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  return (
    <main id="main-content" className="page-modern min-h-screen bg-gradient-to-b from-white via-[#F8FAFC] to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-[#F5B942]/12 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-[#2E6F40]/10 blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[#64748B] font-medium">
              Reflect • Inspire • Connect
            </p>
            <h1 className="mt-3 font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight leading-tight">
              Share Your Story
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#334155] max-w-3xl leading-relaxed">
              Your experience could be the light that guides someone else's way.
              Write with honesty, care, and hope.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDF3D6] text-[#0D2B45] text-xs sm:text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[#F5B942]" aria-hidden="true" />
                Uplifting Community
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF5EC] text-[#0D2B45] text-xs sm:text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[#2E6F40]" aria-hidden="true" />
                Safe Storytelling
              </span>
            </div>
          </div>
        </div>

        <Form method="post" className="form-modern mt-8 sm:mt-10 space-y-6 sm:space-y-8">
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-sm space-y-6" aria-labelledby="story-basics-heading">
            <h2 id="story-basics-heading" className="font-heading text-xl sm:text-2xl text-midnight font-bold">
              Story Basics
            </h2>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-night">
              Category <span className="text-error">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1 block w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent transition-shadow"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-night">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={100}
              className="mt-1 block w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#334155] focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent transition-shadow"
              placeholder="A title that captures the essence of your story"
              aria-describedby="title-hint"
            />
            <p id="title-hint" className="mt-1 text-sm text-[#64748B]">
              A compelling title helps others discover your story
            </p>
          </div>
          </section>

          {/* Content */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-sm" aria-labelledby="story-content-heading">
            <div className="flex items-center justify-between">
              <label id="story-content-heading" htmlFor="content" className="block text-sm font-medium text-night">
                Your Story <span className="text-error">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="text-sm text-[#2E6F40] hover:text-[#0D2B45] flex items-center gap-1 rounded-lg px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942]"
                aria-expanded={showAIPanel}
                aria-controls="ai-assistant-panel"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                AI Assistance
              </button>
            </div>
            <textarea
              id="content"
              name="content"
              required
              rows={12}
              className="mt-2 block w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#334155] focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent resize-y transition-shadow"
              placeholder="Share your experience... What happened? How did it affect you? What did you learn?"
            />

            {/* AI Panel */}
            {showAIPanel && (
              <div id="ai-assistant-panel" className="mt-4 p-4 sm:p-5 bg-[#EDF6FB] rounded-xl border border-[#B8E3F3]">
                <h3 className="text-sm font-medium text-[#0D2B45] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  AI Writing Assistant
                </h3>
                <p className="mt-2 text-sm text-[#334155]">
                  Need help expressing your story? Our AI can assist with:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors"
                  >
                    Improve grammar
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors"
                  >
                    Suggest structure
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors"
                  >
                    Generate title ideas
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full hover:bg-[#F8FAFC] transition-colors"
                  >
                    Add reflection prompts
                  </button>
                </div>
                <p className="mt-3 text-xs text-[#64748B]">
                  AI suggestions are optional. Your authentic voice is what matters most.
                </p>
              </div>
            )}
          </section>

          {/* Tags */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-7 shadow-sm" aria-labelledby="story-meta-heading">
            <h2 id="story-meta-heading" className="font-heading text-xl sm:text-2xl text-midnight font-bold mb-4">
              Discoverability & Safety
            </h2>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-night">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="mt-1 block w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#334155] focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent transition-shadow"
              placeholder="resilience, hope, healing (comma separated)"
              aria-describedby="tags-hint"
            />
            <p id="tags-hint" className="mt-1 text-sm text-[#64748B]">
              Add up to 5 tags to help others find your story
            </p>
          </div>

          {/* Content Warning */}
          <div className="mt-5">
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
              <input
                type="checkbox"
                name="contentWarning"
                className="mt-1 h-4 w-4 text-golden border-mist rounded focus:ring-golden"
              />
              <div>
                <span className="font-medium text-midnight">Add Content Warning</span>
                <p className="text-sm text-night/60">
                  Mark if your story contains sensitive topics (trauma, illness, loss)
                </p>
              </div>
            </label>
          </div>
          </section>

          {/* Privacy Options */}
          <fieldset className="p-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
            <legend className="text-sm font-medium text-night px-2">Privacy Settings</legend>
            
            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  defaultChecked
                  className="mt-1 h-4 w-4 text-golden border-mist focus:ring-golden"
                />
                <div>
                  <span className="font-medium text-midnight">Public</span>
                  <p className="text-sm text-night/60">Anyone can discover and read your story</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="followers"
                  className="mt-1 h-4 w-4 text-golden border-mist focus:ring-golden"
                />
                <div>
                  <span className="font-medium text-midnight">Followers Only</span>
                  <p className="text-sm text-night/60">Only people who follow you can read</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  className="mt-1 h-4 w-4 text-golden border-mist focus:ring-golden"
                />
                <div>
                  <span className="font-medium text-midnight">Private</span>
                  <p className="text-sm text-night/60">Only you can see this story</p>
                </div>
              </label>
            </div>

            <div className="mt-6 pt-4 border-t border-mist">
              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-[#E2E8F0] p-4 hover:bg-[#F8FAFC] transition-colors">
                <input
                  type="checkbox"
                  name="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-golden border-mist rounded focus:ring-golden"
                />
                <div>
                  <span className="font-medium text-midnight">Publish Anonymously</span>
                  <p className="text-sm text-night/60">Your name won't be shown on this story</p>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="submit"
              name="action"
              value="publish"
              className="btn-primary flex-1 py-3 text-base sm:text-lg"
            >
              Publish Story
            </button>
            <button
              type="submit"
              name="action"
              value="draft"
              className="btn-secondary flex-1 py-3 text-base sm:text-lg"
            >
              Save as Draft
            </button>
          </div>
        </Form>

        {/* Guidelines Reminder */}
        <div className="mt-10 p-6 sm:p-7 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
          <h2 className="font-heading text-xl font-bold text-midnight">Before you publish</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-night/70">
            <li className="flex items-start gap-2">
              <span className="text-golden" aria-hidden="true">✓</span>
              Share authentically — your genuine voice resonates most
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden" aria-hidden="true">✓</span>
              Respect others' privacy if mentioning them
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden" aria-hidden="true">✓</span>
              Use content warnings for sensitive topics
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden" aria-hidden="true">✓</span>
              Review our <Link to="/guidelines" className="text-[#2E6F40] hover:text-[#0D2B45] underline underline-offset-2">Community Guidelines</Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
