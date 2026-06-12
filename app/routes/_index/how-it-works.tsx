import { Link } from "react-router";
const steps = [
  {
    title: "Reflect",
    description:
      "Capture moments that shaped your journey through thoughtful storytelling.",
    color: "golden",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {" "}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />{" "}
      </svg>
    ),
  },
  {
    title: "Inspire",
    description:
      "Share experiences that encourage others and offer hope during life's challenges.",
    color: "forest",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {" "}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />{" "}
      </svg>
    ),
  },
  {
    title: "Connect",
    description:
      "Build meaningful relationships through empathy, celebration, and shared humanity.",
    color: "info",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {" "}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />{" "}
      </svg>
    ),
  },
];
const colorClasses = {
  golden: {
    bg: "bg-golden/15",
    text: "text-golden-accessible",
    ring: "ring-golden/30",
    gradient: "from-golden/20 to-golden/5",
    line: "from-golden via-golden/50 to-golden/20",
  },
  forest: {
    bg: "bg-forest/15",
    text: "text-forest-accessible",
    ring: "ring-forest/30",
    gradient: "from-forest/20 to-forest/5",
    line: "from-forest via-forest/50 to-forest/20",
  },
  info: {
    bg: "bg-info/15",
    text: "text-info-accessible",
    ring: "ring-info/30",
    gradient: "from-info/20 to-info/5",
    line: "from-info via-info/50 to-info/20",
  },
};
export function HowItWorks() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-dawn via-mist/20 to-dawn relative overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {" "}
      {/* Decorative background elements */}{" "}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {" "}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-golden/5 rounded-full blur-[80px]" />{" "}
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-forest/5 rounded-full blur-[80px]" />{" "}
      </div>{" "}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Section Header */}{" "}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          {" "}
          <span className="badge-midnight-accessible mb-4">
            {" "}
            How It Works{" "}
          </span>{" "}
          <h2
            id="how-it-works-heading"
            className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-midnight"
          >
            {" "}
            A Place to Reflect, Inspire, and Connect{" "}
          </h2>{" "}
        </div>{" "}
        {/* Steps */}{" "}
        <div className="relative">
          {" "}
          {/* Desktop connector line - positioned to connect icon centers */}{" "}
          <div
            className="hidden lg:block absolute top-12 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-0.5"
            aria-hidden="true"
          >
            {" "}
            <div className="h-full bg-gradient-to-r from-golden/40 via-forest/40 to-info/40" />{" "}
          </div>{" "}
          <div className="grid gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-12">
            {" "}
            {steps.map((step, index) => {
              const colors =
                colorClasses[step.color as keyof typeof colorClasses];
              return (
                <div
                  key={step.title}
                  className={` relative text-center opacity-0 animate-fade-in-up `}
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  {" "}
                  {/* Icon Container */}{" "}
                  <div className="relative inline-flex">
                    {" "}
                    <div
                      className={` w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.text} ring-4 ${colors.ring} shadow-lg transform transition-transform duration-300 hover:scale-105 hover:rotate-3 `}
                    >
                      {" "}
                      {step.icon}{" "}
                    </div>{" "}
                    {/* Step number badge - positioned at top-right corner of icon */}{" "}
                    <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md flex items-center justify-center text-xs sm:text-sm font-bold text-midnight ring-2 ring-midnight/10">
                      {" "}
                      {index + 1}{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* Content */}{" "}
                  <h3 className="mt-6 sm:mt-8 font-heading text-xl sm:text-2xl font-bold text-midnight">
                    {" "}
                    {step.title}{" "}
                  </h3>{" "}
                  <p className="mt-3 sm:mt-4 text-muted text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
                    {" "}
                    {step.description}{" "}
                  </p>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
        </div>{" "}
        {/* CTA */}{" "}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          {" "}
          <Link
            to="/signup"
            className="btn-primary text-base sm:text-lg px-8 py-4"
          >
            {" "}
            <span className="flex items-center gap-2">
              {" "}
              Begin Your Journey{" "}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />{" "}
              </svg>{" "}
            </span>{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
