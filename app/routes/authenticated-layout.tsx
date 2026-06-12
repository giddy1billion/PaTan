import type { LoaderFunctionArgs } from "react-router";
import { Outlet, redirect, useLoaderData } from "react-router";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { requireVerifiedUser } from "~/utils/auth.server";
import { db } from "~/utils/db.server";
import { getOnboardingProfile } from "~/utils/users.server";
type OnboardingState = { isRequired: boolean; step: 1 | 2; resumeHref: string };
function getSafeRedirectTarget(target: string) {
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }
  return target;
}
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireVerifiedUser(request);
  const url = new URL(request.url);

  const [profile, unreadNotifications] = await Promise.all([
    getOnboardingProfile(user.id),
    db.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    }),
  ]);

  if (!profile) {
    throw redirect("/login?error=session-expired");
  }
  if (!profile.onboardingCompleted) {
    const redirectTo = getSafeRedirectTarget(`${url.pathname}${url.search}`);
    throw redirect(
      `/onboarding/profile?redirectTo=${encodeURIComponent(redirectTo)}`,
    );
  }
  const onboarding: OnboardingState = {
    isRequired: false,
    step: 1,
    resumeHref: "",
  };

  return { user, onboarding, unreadNotifications };
}

export default function AuthenticatedLayout() {
  const { user, onboarding, unreadNotifications } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Navigation
        user={user}
        onboarding={onboarding}
        notificationUnreadCount={unreadNotifications}
        variant="dashboard"
      />
      <div className="relative flex-1">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-[10%] h-72 w-72 rounded-full bg-golden/10 blur-[110px]" />
          <div className="absolute bottom-0 right-[8%] h-80 w-80 rounded-full bg-sky-reflection/70 blur-[120px]" />
        </div>
        <Outlet />
      </div>
      <Footer variant="dashboard" />
    </div>
  );
}
