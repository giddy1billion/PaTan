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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-dawn via-mist/20 to-dawn"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-midnight/10 text-midnight text-sm font-medium mb-4">
            Got Questions?
          </span>
          <h2
            id="faq-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight"
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`
                bg-white rounded-2xl border overflow-hidden
                transition-all duration-300
                ${openIndex === index 
                  ? 'border-golden/30 shadow-layered' 
                  : 'border-mist/50 hover:border-mist'
                }
              `}
            >
              <button
                type="button"
                id={`faq-question-${index}`}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-golden min-h-[56px]"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className={`font-medium text-sm sm:text-base ${openIndex === index ? 'text-golden-accessible' : 'text-midnight'} transition-colors`}>
                  {faq.question}
                </span>
                <span 
                  className={`
                    flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 
                    rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${openIndex === index 
                      ? 'bg-golden/10 text-golden-accessible rotate-180' 
                      : 'bg-mist/50 text-subtle'
                    }
                  `}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`
                  grid transition-all duration-300 ease-out
                  ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
                `}
              >
                <div className="overflow-hidden">
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-muted text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional help */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-muted text-sm sm:text-base">
            Still have questions?{' '}
            <a 
              href="/contact" 
              className="text-golden-accessible hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
