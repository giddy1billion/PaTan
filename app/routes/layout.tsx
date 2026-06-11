import { Outlet } from 'react-router';
import { Navigation } from '~/components/navigation';
import { Footer } from '~/components/footer';

/**
 * Main app layout with navigation and footer.
 * Wraps all public-facing routes.
 */
export default function AppLayout() {
  return (
    <>
      <Navigation />
      <Outlet />
      <Footer />
    </>
  );
}
