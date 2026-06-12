import type { LoaderFunctionArgs } from 'react-router';
import { Outlet, useLoaderData } from 'react-router';
import { Navigation } from '../components/navigation';
import { Footer } from '~/components/footer';
import { getUser } from '~/utils/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

/**
 * Main app layout with navigation and footer.
 * Wraps all public-facing routes.
 */
export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Navigation user={user} />
      <Outlet />
      <Footer />
    </>
  );
}
