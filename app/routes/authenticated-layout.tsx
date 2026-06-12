import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, redirect, useLoaderData } from 'react-router';
import { Navigation } from '~/components/navigation';
import { Footer } from '~/components/footer';
import { requireUser } from '~/utils/auth.server';
import { getOnboardingProfile } from '~/utils/users.server';

type OnboardingState = {
  isRequired: boolean;
  step: 1 | 2;
  resumeHref: string;
};

function getSafeRedirectTarget(target: string) {
  if (!target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard';
  }

  return target;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);

  const profile = await getOnboardingProfile(user.id);
  if (!profile) {
    throw redirect('/login?error=session-expired');
  }

  if (!profile.onboardingCompleted) {
    const redirectTo = getSafeRedirectTarget(`${url.pathname}${url.search}`);
    throw redirect(`/onboarding/profile?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const onboarding: OnboardingState = {
    isRequired: false,
    step: 1,
    resumeHref: '',
  };

  return { user, onboarding };
}

export default function AuthenticatedLayout() {
  const { user, onboarding } = useLoaderData<typeof loader>();

  return (
    <>
      <Navigation user={user} onboarding={onboarding} />
      <Outlet />
      <Footer />
    </>
  );
}
