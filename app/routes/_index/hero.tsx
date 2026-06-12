import { Link } from "react-router";
const floatingStories = [
  {
    text: "I never thought I would overcome this...",
    delay: 0,
    position: "left-top",
  },
  {
    text: "This experience changed my perspective...",
    delay: 2,
    position: "right-middle",
  },
  {
    text: "Today, I am grateful because...",
    delay: 4,
    position: "left-bottom",
  },
];
const trustIndicators = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        {" "}
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />{" "}
      </svg>
    ),
    text: "Thousands of stories shared",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        {" "}
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
          clipRule="evenodd"
        />{" "}
      </svg>
    ),
    text: "Global community",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        {" "}
        <path
          fillRule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />{" "}
      </svg>
    ),
    text: "Safe & inclusive",
  },
];
export function Hero() {
  return (
    <section
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-midnight text-white"
      aria-labelledby="hero-heading"
    >
      {" "}
      {/* Layered Background */}{" "}
      <div className="absolute inset-0" aria-hidden="true">
        {" "}
        {/* Base gradient */}{" "}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight/95 to-dawn" />{" "}
        {/* Radial glow from center */}{" "}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(245, 185, 66, 0.15) 0%, transparent 60%)",
          }}
        />{" "}
        {/* Animated gradient orbs */}{" "}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-golden/20 rounded-full blur-[100px] animate-pulse-slow" />{" "}
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-forest/20 rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />{" "}
        {/* Subtle noise texture */}{" "}
        <div className="absolute inset-0 noise opacity-[0.02]" />{" "}
      </div>{" "}
      {/* Floating Story Cards */}{" "}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block"
        aria-hidden="true"
      >
        {" "}
        {floatingStories.map((story, index) => {
          const positions = {
            "left-top": "top-[15%] left-[5%]",
            "right-middle": "top-[40%] right-[3%]",
            "left-bottom": "top-[65%] left-[8%]",
          };
          return (
            <div
              key={index}
              className={` absolute ${positions[story.position as keyof typeof positions]} glass-dark rounded-2xl p-5 max-w-[280px] transform hover:scale-105 transition-transform duration-500 animate-float `}
              style={{ animationDelay: `${story.delay}s` }}
            >
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <div className="w-2 h-2 rounded-full bg-golden mt-2 flex-shrink-0" />{" "}
                <p className="text-dawn text-sm leading-relaxed italic">
                  {" "}
                  "{story.text}"{" "}
                </p>{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      {/* Rising particles effect */}{" "}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {" "}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-golden/40 rounded-full animate-particle"
            style={{
              left: `${10 + i * 7}%`,
              animationDuration: `${8 + Math.random() * 6}s`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="relative z-10 w-full">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          {" "}
          <div className="text-center max-w-4xl mx-auto">
            {" "}
            {/* Logo */}{" "}
            <div className="mb-8 sm:mb-10 flex justify-center opacity-0 animate-fade-in-up">
              {" "}
              <div className="relative">
                {" "}
                <img
                  src="/brand/logos/logo-md.png"
                  alt="PaTan™ Tree of Light"
                  className="h-20 sm:h-24 lg:h-32 w-auto"
                  fetchPriority="high"
                />{" "}
                {/* Glow behind logo */}{" "}
                <div className="absolute inset-0 bg-golden/30 blur-3xl -z-10 scale-150" />{" "}
              </div>{" "}
            </div>{" "}
            {/* Headline */}{" "}
            <h1
              id="hero-heading"
              className="opacity-0 animate-fade-in-up stagger-1"
            >
              {" "}
              <span className="block font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-dawn leading-[1.1] tracking-tight">
                {" "}
                Every Story Has the <span className="text-golden">
                  Power
                </span>{" "}
                to{" "}
              </span>{" "}
              <span className="block font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mt-2 sm:mt-3 leading-[1.1] tracking-tight">
                {" "}
                <span className="animate-gradient-text">Light</span>{" "}
                <span className="text-dawn">Someone Else's Path.</span>{" "}
              </span>{" "}
            </h1>{" "}
            {/* Subheadline */}{" "}
            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-dawn max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up stagger-2 px-4">
              {" "}
              Discover authentic stories of hope, gratitude, resilience, and
              transformation. Reflect on your journey, inspire others, and
              connect with a community that celebrates the beauty of being
              human.{" "}
            </p>{" "}
            {/* CTAs */}{" "}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center px-4 opacity-0 animate-fade-in-up stagger-3">
              {" "}
              <Link
                to="/stories/new"
                className="btn-primary text-base sm:text-lg px-8 py-4 animate-glow"
              >
                {" "}
                <span className="flex items-center justify-center gap-2">
                  {" "}
                  Share Your Story{" "}
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />{" "}
                  </svg>{" "}
                </span>{" "}
              </Link>{" "}
              <Link
                to="/discover"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-dawn/30 text-dawn font-medium text-base sm:text-lg hover:bg-dawn/10 hover:border-dawn/50 transition-all duration-300 min-h-[44px]"
              >
                {" "}
                Explore Stories{" "}
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                    d="M9 5l7 7-7 7"
                  />{" "}
                </svg>{" "}
              </Link>{" "}
            </div>{" "}
            {/* Trust Indicators */}{" "}
            <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-8 opacity-0 animate-fade-in-up stagger-4 text-golden">
              {" "}
              {trustIndicators.map((indicator, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-dawn text-sm sm:text-base"
                >
                  {" "}
                  <span className="text-golden">{indicator.icon}</span>{" "}
                  <span>{indicator.text}</span>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Scroll indicator */}{" "}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up stagger-5 hidden sm:block"
        aria-hidden="true"
      >
        {" "}
        <div className="flex flex-col items-center gap-2 text-dawn">
          {" "}
          <span className="text-xs uppercase tracking-widest">Scroll</span>{" "}
          <div className="w-6 h-10 rounded-full border-2 border-dawn flex justify-center pt-2">
            {" "}
            <div className="w-1 h-2 bg-dawn rounded-full animate-bounce" />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
