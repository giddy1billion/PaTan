import type { MetaFunction } from 'react-router';
import { Link, Form } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Reset Password – PaTan' },
    { name: 'description', content: 'Reset your PaTan password to regain access to your account.' },
  ];
};

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-dawn flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded-lg"
          aria-label="Back to home"
        >
          <img
            src="/brand/logos/logo-sm.png"
            alt=""
            className="h-8 w-auto"
            aria-hidden="true"
          />
          <span className="font-heading text-lg font-bold text-midnight">PaTan</span>
        </Link>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="font-heading text-2xl font-bold text-midnight text-center">
              Reset Your Password
            </h1>
            <p className="mt-2 text-center text-night/60">
              Enter your email and we'll send you a reset link
            </p>

            <Form method="post" className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-night">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 text-base"
              >
                Send Reset Link
              </button>
            </Form>

            <p className="mt-8 text-center text-sm text-night/60">
              Remember your password?{' '}
              <Link
                to="/login"
                className="font-medium text-golden hover:text-soft-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
