import { Outlet } from 'react-router';

/**
 * Onboarding route group layout.
 * Keeps onboarding routes isolated from public and authenticated app layouts.
 */
export default function OnboardingLayoutRoute() {
  return <Outlet />;
}
