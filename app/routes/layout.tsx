import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, redirect, useLoaderData } from 'react-router';
import { Navigation } from '../components/navigation';
import { Footer } from '~/components/footer';
import { getUser } from '~/utils/auth.server';
import { getOnboardingProfile } from '~/utils/users.server';

type OnboardingState = {
  isRequired: boolean;
  step: 1 | 2;
  resumeHref: string;
};

const GUARDED_APP_PATH_PREFIXES = [
  '/discover',
  '/stories',
  '/journeys',
  '/aspirations',
  '/community',
];

function isGuardedAppPath(pathname: string) {
  return GUARDED_APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSafeRedirectTarget(target: string) {
  if (!target.startsWith('/') || target.startsWith('//')) {
    return '/discover';
  }

  return target;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const user = await getUser(request);

  const onboarding: OnboardingState = {
    isRequired: false,
    step: 1,
    resumeHref: '',
  };

  if (user) {
    const profile = await getOnboardingProfile(user.id);

    if (profile && !profile.onboardingCompleted) {
      const redirectTo = getSafeRedirectTarget(`${url.pathname}${url.search}`);

      onboarding.isRequired = true;
      onboarding.step = profile.personalInterests.length > 0 ? 2 : 1;
      onboarding.resumeHref = `/onboarding/profile?redirectTo=${encodeURIComponent(redirectTo)}`;

      if (isGuardedAppPath(url.pathname)) {
        throw redirect(onboarding.resumeHref);
      }
    }
  }

  return { user, onboarding };
}

/**
 * Main app layout with navigation and footer.
 * Wraps all public-facing routes.
 */
export default function AppLayout() {
  const { user, onboarding } = useLoaderData<typeof loader>();

  return (
    <>
      <Navigation user={user} onboarding={onboarding} />
      <Outlet />
      <Footer />
    </>
  );
}
