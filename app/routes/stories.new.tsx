import type { MetaFunction } from 'react-router';
import { Form, Link } from 'react-router';
import { useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Share Your Story – PaTan' },
    { name: 'description', content: 'Share your transformative experience and inspire others on their journey.' },
  ];
};

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
    <main id="main-content" className="min-h-screen bg-dawn">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-midnight">
            Share Your Story
          </h1>
          <p className="mt-4 text-lg text-night/70">
            Your experience could be the light that guides someone else's way.
          </p>
        </div>

        <Form method="post" className="space-y-8">
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-night">
              Category <span className="text-error">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
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
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
              placeholder="A title that captures the essence of your story"
              aria-describedby="title-hint"
            />
            <p id="title-hint" className="mt-1 text-sm text-night/50">
              A compelling title helps others discover your story
            </p>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="block text-sm font-medium text-night">
                Your Story <span className="text-error">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="text-sm text-golden hover:text-soft-gold flex items-center gap-1"
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
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent resize-y"
              placeholder="Share your experience... What happened? How did it affect you? What did you learn?"
            />

            {/* AI Panel */}
            {showAIPanel && (
              <div className="mt-4 p-4 bg-golden/5 rounded-lg border border-golden/20">
                <h3 className="text-sm font-medium text-golden flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  AI Writing Assistant
                </h3>
                <p className="mt-2 text-sm text-night/60">
                  Need help expressing your story? Our AI can assist with:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-mist rounded-full hover:bg-mist/50"
                  >
                    Improve grammar
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-mist rounded-full hover:bg-mist/50"
                  >
                    Suggest structure
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-mist rounded-full hover:bg-mist/50"
                  >
                    Generate title ideas
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-white border border-mist rounded-full hover:bg-mist/50"
                  >
                    Add reflection prompts
                  </button>
                </div>
                <p className="mt-3 text-xs text-night/50">
                  AI suggestions are optional. Your authentic voice is what matters most.
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-night">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
              placeholder="resilience, hope, healing (comma separated)"
              aria-describedby="tags-hint"
            />
            <p id="tags-hint" className="mt-1 text-sm text-night/50">
              Add up to 5 tags to help others find your story
            </p>
          </div>

          {/* Privacy Options */}
          <fieldset className="p-6 bg-white rounded-xl border border-mist">
            <legend className="text-sm font-medium text-night px-2">Privacy Settings</legend>
            
            <div className="mt-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
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
              
              <label className="flex items-start gap-3 cursor-pointer">
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
              
              <label className="flex items-start gap-3 cursor-pointer">
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
              <label className="flex items-center gap-3 cursor-pointer">
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

          {/* Content Warning */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              name="action"
              value="publish"
              className="btn-primary flex-1 py-3"
            >
              Publish Story
            </button>
            <button
              type="submit"
              name="action"
              value="draft"
              className="btn-secondary flex-1 py-3"
            >
              Save as Draft
            </button>
          </div>
        </Form>

        {/* Guidelines Reminder */}
        <div className="mt-12 p-6 bg-mist/50 rounded-xl">
          <h2 className="font-medium text-midnight">Before you publish</h2>
          <ul className="mt-4 space-y-2 text-sm text-night/70">
            <li className="flex items-start gap-2">
              <span className="text-golden">✓</span>
              Share authentically — your genuine voice resonates most
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden">✓</span>
              Respect others' privacy if mentioning them
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden">✓</span>
              Use content warnings for sensitive topics
            </li>
            <li className="flex items-start gap-2">
              <span className="text-golden">✓</span>
              Review our <Link to="/guidelines" className="text-golden hover:text-soft-gold">Community Guidelines</Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
