import { useState } from 'react';

const faqs = [
  {
    question: 'What is PaTan?',
    answer: 'PaTan is an AI-powered inspirational storytelling platform where people share transformative life experiences, discover hope-filled stories, and connect with a supportive community. Our mission is to illuminate lives through authentic stories of gratitude, resilience, hope, and transformation.',
  },
  {
    question: 'Who can join?',
    answer: 'PaTan welcomes everyone from all backgrounds and beliefs. Whether you\'re looking to share your own journey, find encouragement from others\' stories, or simply be part of a positive community, there\'s a place for you here.',
  },
  {
    question: 'Do I have to share publicly?',
    answer: 'No, you have full control over your privacy. You can browse and engage with stories without sharing anything. When you\'re ready to share, you can choose who sees your stories—make them public, share with followers only, or keep them private for personal reflection.',
  },
  {
    question: 'Can I remain anonymous?',
    answer: 'Yes! PaTan fully supports anonymous publishing. You can share your story without revealing your identity, allowing you to be authentic while maintaining privacy. Many of our most powerful stories come from anonymous contributors.',
  },
  {
    question: 'How does AI assistance work?',
    answer: 'Our AI assistant helps you express your thoughts more clearly while preserving your authentic voice. It offers grammar suggestions, story structure guidance, title ideas, and reflection prompts. You\'re always in control—every suggestion is optional, and your story remains uniquely yours.',
  },
  {
    question: 'Is PaTan faith-specific?',
    answer: 'PaTan is faith-friendly but belief-inclusive. We welcome stories from all spiritual backgrounds and perspectives. Whether your journey involves religious faith, spiritual growth, or personal philosophy, your experience is valued here.',
  },
  {
    question: 'How is my information protected?',
    answer: 'We take privacy seriously. Your data is encrypted, and we never sell personal information. You control what you share and with whom. Our platform is designed with emotional safety in mind, and we have robust moderation to maintain a supportive environment.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="py-20 bg-dawn"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="faq-heading"
            className="font-heading text-3xl sm:text-4xl font-bold text-midnight"
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-mist overflow-hidden"
            >
              <button
                type="button"
                className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-mist/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-golden"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium text-midnight">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-night/50 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 text-night/70">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
