import type { MetaFunction } from 'react-router';
import { Form, Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Share Your Aspiration – PaTan' },
    { name: 'description', content: 'Share your dreams and goals with the community and receive support.' },
  ];
};

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
    <main id="main-content" className="min-h-screen bg-dawn">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-midnight">
            Share Your Aspiration
          </h1>
          <p className="mt-4 text-lg text-night/70">
            When we share our goals, we invite the community to support our journey.
          </p>
        </div>

        <Form method="post" className="space-y-8">
          {/* Title */}
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
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
              placeholder="e.g., Complete my first marathon"
            />
          </div>

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

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-night">
              Tell us more about this aspiration
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent resize-y"
              placeholder="Why is this important to you? What motivated you to pursue this goal?"
            />
          </div>

          {/* Target Date */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-night">
              Target completion date
            </label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
            />
            <p className="mt-1 text-sm text-night/50">
              Optional — helps track your progress
            </p>
          </div>

          {/* Milestones */}
          <div>
            <label className="block text-sm font-medium text-night mb-2">
              Milestones
            </label>
            <p className="text-sm text-night/50 mb-4">
              Break your aspiration into smaller steps (optional)
            </p>
            <div className="space-y-3">
              {[1, 2, 3].map((num) => (
                <input
                  key={num}
                  name={`milestone${num}`}
                  type="text"
                  className="block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder={`Milestone ${num}`}
                />
              ))}
            </div>
          </div>

          {/* Privacy */}
          <fieldset className="p-6 bg-white rounded-xl border border-mist">
            <legend className="text-sm font-medium text-night px-2">Privacy</legend>
            
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
                  <p className="text-sm text-night/60">Anyone can see and support your aspiration</p>
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
                  <p className="text-sm text-night/60">Only your followers can see this</p>
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
                  <p className="text-sm text-night/60">Only you can see this aspiration</p>
                </div>
              </label>
            </div>

            <div className="mt-6 pt-4 border-t border-mist">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="anonymous"
                  className="h-4 w-4 text-golden border-mist rounded focus:ring-golden"
                />
                <div>
                  <span className="font-medium text-midnight">Post Anonymously</span>
                  <p className="text-sm text-night/60">Your name won't be shown</p>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              className="btn-primary flex-1 py-3"
            >
              Share Aspiration
            </button>
            <Link
              to="/aspirations"
              className="btn-secondary flex-1 py-3 text-center"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
