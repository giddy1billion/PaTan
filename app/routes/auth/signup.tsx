import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { Link, Form, redirect, useSearchParams } from "react-router";
import { createUserSession, getUser } from "~/utils/auth.server";
import { getAuthErrorMessage } from "~/utils/auth-errors";
import {
  createLocalUser,
  getPostAuthRedirectForUser,
} from "~/utils/users.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Sign Up | PaTan™" },
    {
      name: "description",
      content:
        "Join PaTan™ to share your story, discover hope-filled experiences, and connect with a supportive community.",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (user) {
    const postAuthRedirect = await getPostAuthRedirectForUser(
      user.id,
      "/discover",
    );
    return redirect(postAuthRedirect);
  }

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/discover");

  if (!firstName || !lastName || !email || password.length < 8) {
    return redirect("/signup?error=invalid-signup");
  }

  const acceptedTerms = formData.get("terms") === "on";
  if (!acceptedTerms) {
    return redirect("/signup?error=invalid-signup");
  }

  let user;
  try {
    user = await createLocalUser({ firstName, lastName, email, password });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "email-taken") {
      return redirect("/signup?error=email-taken");
    }
    return redirect("/signup?error=signup-failed");
  }

  const postAuthRedirect = await getPostAuthRedirectForUser(
    user.id,
    redirectTo,
  );

  return createUserSession({
    request,
    user,
    redirectTo: postAuthRedirect,
    remember: true,
  });
}

export default function Signup() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/discover";
  const authError = getAuthErrorMessage(searchParams.get("error"));
  const oauthGoogleUrl = `/oauth/google?mode=signup&redirectTo=${encodeURIComponent(redirectTo)}`;
  const oauthFacebookUrl = `/oauth/facebook?mode=signup&redirectTo=${encodeURIComponent(redirectTo)}`;

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
          <span className="font-heading text-lg font-bold text-midnight">
            PaTan™
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        className="page-modern flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="w-full max-w-lg">
          <div className="page-hero-modern p-6 sm:p-8">
            <h1 className="font-heading text-2xl font-bold text-midnight text-center">
              Begin Your Journey
            </h1>
            <p className="mt-2 text-center text-[#64748B]">
              Your story could light someone else's path
            </p>

            {authError ? (
              <div
                className="mt-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
                role="alert"
                aria-live="polite"
              >
                {authError}
              </div>
            ) : null}

            <Form method="post" className="form-modern mt-8 space-y-6">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-night"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-night"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-night"
                >
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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-night"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="mt-1 block w-full px-4 py-3 border border-mist rounded-lg focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                  placeholder="At least 8 characters"
                  aria-describedby="password-hint"
                />
                <p id="password-hint" className="mt-1 text-sm text-night/50">
                  Use 8+ characters with a mix of letters, numbers & symbols
                </p>
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 mt-0.5 text-golden border-mist rounded focus:ring-golden"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-[#334155]"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-[#2E6F40] hover:text-[#0D2B45]"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-[#2E6F40] hover:text-[#0D2B45]"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 text-base"
              >
                Create Account
              </button>
            </Form>

            {/* Social Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mist" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#64748B]">
                    Or sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to={oauthGoogleUrl}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-mist rounded-lg text-sm font-medium text-night hover:bg-mist/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Link>
                <Link
                  to={oauthFacebookUrl}
                  className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 border border-mist rounded-lg text-sm font-medium text-night hover:bg-mist/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                >
                  <svg
                    className="w-5 h-5 text-[#1877F2]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M22 12.07C22 6.507 17.523 2 12 2S2 6.507 2 12.07c0 5.017 3.657 9.177 8.438 9.93v-7.03H7.898v-2.9h2.54V9.845c0-2.518 1.492-3.91 3.777-3.91 1.094 0 2.238.196 2.238.196v2.472H15.19c-1.243 0-1.63.776-1.63 1.572v1.895h2.773l-.443 2.9H13.56V22c4.78-.753 8.44-4.913 8.44-9.93z" />
                  </svg>
                  Facebook
                </Link>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-night/60">
              Already have an account?{" "}
              <Link
                to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="font-medium text-[#2E6F40] hover:text-[#0D2B45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B942] rounded"
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
