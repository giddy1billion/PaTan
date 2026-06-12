import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData } from "react-router";
import { Navigation } from "../components/navigation";
import { Footer } from "~/components/footer";
import { getUser } from "~/utils/auth.server";
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
  const url = new URL(request.url);
  const user = await getUser(request);
  const onboarding: OnboardingState = {
    isRequired: false,
    step: 1,
    resumeHref: "",
  };

  let unreadNotifications = 0;

  if (user) {
    const [profile, unreadCount] = await Promise.all([
      getOnboardingProfile(user.id),
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    unreadNotifications = unreadCount;

    if (profile && !profile.onboardingCompleted) {
      const redirectTo = getSafeRedirectTarget(`${url.pathname}${url.search}`);
      onboarding.isRequired = true;
      onboarding.step = profile.personalInterests.length > 0 ? 2 : 1;
      onboarding.resumeHref = `/onboarding/profile?redirectTo=${encodeURIComponent(redirectTo)}`;
    }
  }

  return { user, onboarding, unreadNotifications };
}

/**
 * Main app layout with navigation and footer.
 * Wraps all public-facing routes.
 */
export default function AppLayout() {
  const { user, onboarding, unreadNotifications } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <Navigation
        user={user}
        onboarding={onboarding}
        notificationUnreadCount={unreadNotifications}
      />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
