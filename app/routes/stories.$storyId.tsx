import type { MetaFunction } from 'react-router';
import { useParams, Link } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Story – PaTan' },
    { name: 'description', content: 'Read inspiring stories from our community.' },
  ];
};

// Placeholder - will be replaced with loader
const story = {
  id: '1',
  title: 'Finding Light After the Storm',
  content: `When everything seemed lost, I discovered strength I never knew I had.

It started on a Tuesday morning. The kind of morning where the sun refuses to break through the clouds, as if nature itself knew what was coming.

I had built my life around certainties—a stable career, a comfortable routine, relationships I thought would last forever. But life has a way of teaching us that nothing is truly permanent.

The call came at 9:47 AM. In the span of a few minutes, everything I knew crumbled. My company was closing. My foundation shook.

The first weeks were the hardest. I remember lying awake at 3 AM, my mind racing through every decision I'd ever made, searching for the moment where I could have done things differently. The what-ifs were relentless.

But somewhere in that darkness, a small voice began to whisper. At first, it was barely audible—drowned out by fear and uncertainty. But it persisted.

"This is not the end. This is a beginning."

I started writing. Not for anyone else, just for myself. Late at night, I would pour my thoughts onto paper—raw, unfiltered, painful. And slowly, something shifted.

The more I wrote, the more I realized that my story wasn't just about loss. It was about resilience. About the human capacity to adapt, to grow, to find meaning even in the midst of chaos.

I reconnected with old friends. I discovered new passions. I learned to be gentle with myself in ways I never had before.

Today, standing on the other side of that storm, I can see how every challenge was shaping me. The job loss that felt like a catastrophe became the catalyst for starting my own business. The loneliness that once overwhelmed me taught me the value of genuine connection.

If you're reading this from the middle of your own storm, I want you to know: the light is coming. It might not arrive when you expect it, or in the form you imagined. But it will come.

Your story is still being written. And the chapters ahead might just be the most beautiful ones yet.`,
  author: {
    name: 'Sarah M.',
    location: 'Toronto, Canada',
    avatar: null,
    storiesCount: 12,
  },
  category: 'Transformation',
  tags: ['resilience', 'career', 'personal-growth', 'hope'],
  readTime: '5 min',
  publishedAt: '2026-05-15',
  reactions: {
    celebrate: 124,
    uplift: 89,
    empathy: 67,
  },
  commentsCount: 23,
};

export default function StoryDetail() {
  const { storyId } = useParams();

  return (
    <main id="main-content" className="page-modern bg-dawn">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category */}
        <div className="text-center">
          <span className="inline-block px-4 py-1.5 bg-golden/10 text-golden text-sm font-medium rounded-full">
            {story.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-midnight text-center leading-tight">
          {story.title}
        </h1>

        {/* Author & Meta */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-night/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white font-bold">
              {story.author.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-midnight">{story.author.name}</p>
              <p>{story.author.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span>{story.readTime} read</span>
            <span>•</span>
            <time dateTime={story.publishedAt}>
              {new Date(story.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>

        {/* Content */}
        <div className="mt-12 prose prose-lg max-w-none">
          {story.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-night/80 leading-relaxed mb-6">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Tags */}
        <div className="mt-12 flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <Link
              key={tag}
              to={`/discover?tag=${tag}`}
              className="px-3 py-1 bg-mist text-night/70 text-sm rounded-full hover:bg-mist/70 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>

        {/* Engagement Bar */}
        <div className="mt-12 py-6 border-y border-mist">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="engagement-btn"
              aria-label="Celebrate this story"
            >
              🎉 Celebrate
              <span className="text-night/50">{story.reactions.celebrate}</span>
            </button>
            <button
              type="button"
              className="engagement-btn"
              aria-label="Uplift this story"
            >
              🙌 Uplift
              <span className="text-night/50">{story.reactions.uplift}</span>
            </button>
            <button
              type="button"
              className="engagement-btn"
              aria-label="Show empathy"
            >
              💜 Empathy
              <span className="text-night/50">{story.reactions.empathy}</span>
            </button>
            <button
              type="button"
              className="engagement-btn"
              aria-label="Save this story"
            >
              🔖 Save
            </button>
            <button
              type="button"
              className="engagement-btn"
              aria-label="Share this story"
            >
              📤 Share
            </button>
          </div>
        </div>

        {/* Author Bio */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-mist">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-golden to-forest flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {story.author.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-midnight">
                {story.author.name}
              </h2>
              <p className="text-sm text-night/60">{story.author.location}</p>
              <p className="mt-2 text-night/70 text-sm">
                {story.author.storiesCount} stories shared
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-golden hover:text-soft-gold"
              >
                Follow
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section Placeholder */}
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-midnight">
            Reflections ({story.commentsCount})
          </h2>
          <div className="mt-6 p-8 bg-mist/30 rounded-xl text-center">
            <p className="text-night/60">
              Sign in to share your reflection on this story.
            </p>
            <Link to="/login" className="mt-4 btn-primary inline-block">
              Sign In
            </Link>
          </div>
        </section>
      </article>

      {/* Related Stories */}
      <section className="bg-mist/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-midnight text-center">
            More Stories Like This
          </h2>
          <div className="mt-8 text-center">
            <Link to="/discover" className="btn-secondary">
              Explore More Stories
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
