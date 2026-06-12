import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, Form, redirect, useSearchParams } from 'react-router';
import { createUserSession, getUser } from '~/utils/auth.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Log In – PaTan' },
    { name: 'description', content: 'Log in to PaTan to share your story and connect with our community.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (user) {
    return redirect('/discover');
  }

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const redirectTo = String(formData.get('redirectTo') ?? '/discover');

  if (!email || !password) {
    return redirect('/login?error=missing-credentials');
  }

  // Placeholder auth until DB-backed auth is implemented.
  return createUserSession({
    request,
    user: {
      id: email,
      email,
    },
    redirectTo,
    remember,
  });
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/discover';

  return (
    <div className="min-h-screen page-modern flex flex-col">
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
      <main id="main-content" className="page-modern flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="page-hero-modern p-6 sm:p-8">
            <h1 className="font-heading text-2xl font-bold text-midnight text-center">
              Welcome Back
            </h1>
            <p className="mt-2 text-center text-[#64748B]">
              Log in to continue your journey
            </p>

            <Form method="post" className="form-modern mt-8 space-y-6">
              <input type="hidden" name="redirectTo" value={redirectTo} />
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

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-night">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#2E6F40] hover:text-[#0D2B45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-golden border-mist rounded focus:ring-golden"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-night/70">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 text-base"
              >
                Log In
              </button>
            </Form>

            {/* Social Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mist" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#64748B]">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-mist rounded-lg text-sm font-medium text-night hover:bg-mist/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-mist rounded-lg text-sm font-medium text-night hover:bg-mist/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-night/60">
              Don't have an account?{' '}
              <Link
                to={`/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-[#2E6F40] hover:text-[#0D2B45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
