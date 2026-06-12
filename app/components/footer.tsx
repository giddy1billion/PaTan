import { Link } from 'react-router';
import type { ReactElement } from 'react';

const footerLinks = {
  product: [
    { label: 'Discover Stories', href: '/discover' },
    { label: 'Journeys', href: '/journeys' },
    { label: 'Aspirations', href: '/aspirations' },
    { label: 'Community Guidelines', href: '/guidelines' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  resources: [
    { label: 'Help Center', href: '/help' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
  social: [
    { label: 'Instagram', href: 'https://instagram.com/PaTan™', icon: 'instagram' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/PaTan™', icon: 'linkedin' },
    { label: 'Facebook', href: 'https://facebook.com/PaTan™', icon: 'facebook' },
    { label: 'YouTube', href: 'https://youtube.com/@PaTan™', icon: 'youtube' },
  ],
};

function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, ReactElement> = {
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
      </svg>
    ),
    youtube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
      </svg>
    ),
  };
  return icons[name] || null;
}

export function Footer() {
  return (
    <footer className="bg-[#0D2B45] text-white relative overflow-hidden" role="contentinfo">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F5B942]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#2E6F40]/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
        {/* Main footer grid - responsive layout */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D2B45] rounded-lg group"
              aria-label="PaTan™ home"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <img
                  src="/brand/logos/logo-sm.png"
                  alt=""
                  className="h-full w-auto brightness-0 invert transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
              </div>
              <span className="font-heading text-xl sm:text-2xl font-bold">PaTan™</span>
            </Link>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-white/80 leading-relaxed max-w-xs">
              Illuminating lives through authentic stories of gratitude, resilience, hope, and transformation.
            </p>
            
            {/* Social Icons */}
            <div className="mt-6 sm:mt-8">
              <h2 className="sr-only">Follow us on social media</h2>
              <ul className="flex gap-3" role="list">
                {footerLinks.social.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/5 text-white/70 hover:bg-[#F5B942]/20 hover:text-[#F5B942] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942]"
                      aria-label={`Follow PaTan™ on ${link.label}`}
                    >
                      <SocialIcon name={link.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5B942]">
              Product
            </h2>
            <ul className="mt-4 sm:mt-6 space-y-3 sm:space-y-4" role="list">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5B942]">
              Company
            </h2>
            <ul className="mt-4 sm:mt-6 space-y-3 sm:space-y-4" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5B942]">
              Resources
            </h2>
            <ul className="mt-4 sm:mt-6 space-y-3 sm:space-y-4" role="list">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Newsletter - wider column */}
          <div className="col-span-2 lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F5B942]">
              Stay Inspired
            </h2>
            <p className="mt-4 sm:mt-6 text-sm text-white/70 max-w-sm">
              Get weekly stories of hope and transformation delivered to your inbox.
            </p>
            <form className="mt-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-3">
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#F5B942] focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="btn-secondary min-h-[44px] px-6 text-sm w-full sm:w-auto"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60 order-2 sm:order-1">
              © {new Date().getFullYear()} PaTan™. All rights reserved.
            </p>
            <p className="text-sm text-white/60 font-medium tracking-[0.2em] order-1 sm:order-2">
              REFLECT • INSPIRE • CONNECT
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
