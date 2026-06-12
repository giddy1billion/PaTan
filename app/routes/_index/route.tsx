import type { MetaFunction } from 'react-router';

import { Hero } from './hero';
import { FeaturedStories } from './featured-stories';
import { HowItWorks } from './how-it-works';
import { AIAssistant } from './ai-assistant';
import { ThematicJourneys } from './thematic-journeys';
import { Aspirations } from './aspirations';
import { CommunityMetrics } from './community-metrics';
import { Testimonials } from './testimonials';
import { MobileExperience } from './mobile-experience';
import { FAQ } from './faq';
import { FinalCTA } from './final-cta';

export const meta: MetaFunction = () => {
  return [
    { title: 'PaTan – Share Stories. Inspire Lives. Connect Through Hope.' },
    {
      name: 'description',
      content:
        'PaTan is an AI-powered platform for sharing transformative life experiences. Discover stories of gratitude, resilience, and hope. Your story could light someone else\'s path.',
    },
    {
      name: 'keywords',
      content:
        'inspirational stories, testimony sharing, life transformation, personal growth, community support, gratitude, hope, faith stories, overcoming adversity',
    },
    { property: 'og:title', content: 'PaTan – Share Stories. Inspire Lives. Connect Through Hope.' },
    {
      property: 'og:description',
      content:
        'An AI-powered platform for sharing transformative life experiences and discovering hope-filled stories from a global community.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '/brand/social/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'PaTan – Share Stories. Inspire Lives.' },
    {
      name: 'twitter:description',
      content: 'Discover hope-filled stories and share your own transformative experiences.',
    },
    { name: 'twitter:image', content: '/brand/social/twitter-card.png' },
  ];
};

export default function Index() {
  return (
    <main id="main-content" className="page-modern">
      <Hero />
      <FeaturedStories />
      <HowItWorks />
      <AIAssistant />
      <ThematicJourneys />
      <Aspirations />
      <CommunityMetrics />
      <Testimonials />
      <MobileExperience />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
