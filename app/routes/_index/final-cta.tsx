import { Link } from "react-router";
export function FinalCTA() {
  return (
    <section
      className="relative py-20 sm:py-24 lg:py-32 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {" "}
      {/* Layered Background */}{" "}
      <div className="absolute inset-0" aria-hidden="true">
        {" "}
        {/* Base gradient */}{" "}
        <div className="absolute inset-0 bg-gradient-to-b from-midnight via-night to-midnight" />{" "}
        {/* Radial glow */}{" "}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(245, 185, 66, 0.15) 0%, transparent 70%)",
          }}
        />{" "}
        {/* Animated gradient orbs */}{" "}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-golden/10 rounded-full blur-[150px] animate-pulse-slow" />{" "}
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-forest/10 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />{" "}
      </div>{" "}
      {/* Tree of Light Animation - Particles */}{" "}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {" "}
        {/* Rising golden particles */}{" "}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-golden/50 rounded-full animate-particle"
            style={{
              left: `${5 + i * 4.5}%`,
              animationDuration: `${10 + Math.random() * 8}s`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}{" "}
        {/* Central tree glow effect */}{" "}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {" "}
          <div className="relative">
            {" "}
            <img
              src="/brand/logos/logo-md.png"
              alt=""
              className="h-40 sm:h-52 w-auto opacity-20"
            />{" "}
            <div className="absolute inset-0 bg-golden/20 blur-[60px] scale-150" />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {" "}
        <h2
          id="final-cta-heading"
          className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
        >
          {" "}
          <span className="text-dawn">
            Someone May Need the Story
          </span> <br />{" "}
          <span className="animate-gradient-text">Only You Can Tell.</span>{" "}
        </h2>{" "}
        <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-dawn max-w-2xl mx-auto leading-relaxed">
          {" "}
          Your experiences matter. Reflect on your journey. Inspire through
          authenticity. Connect through shared humanity.{" "}
        </p>{" "}
        {/* CTAs */}{" "}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          {" "}
          <Link
            to="/stories/new"
            className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 animate-glow"
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
            className="group inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 rounded-xl border-2 border-dawn/30 text-dawn font-medium text-base sm:text-lg hover:bg-dawn/10 hover:border-dawn/50 transition-all duration-300 min-h-[48px]"
          >
            {" "}
            Explore the Community{" "}
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
        {/* Tagline */}{" "}
        <div className="mt-16 sm:mt-20">
          {" "}
          <div className="inline-flex items-center gap-3 sm:gap-4">
            {" "}
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-golden" />{" "}
            <p className="text-sm sm:text-base text-golden tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium">
              {" "}
              Reflect • Inspire • Connect{" "}
            </p>{" "}
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-golden" />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
