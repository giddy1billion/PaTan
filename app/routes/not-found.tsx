import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, useRouteLoaderData } from "react-router";
import { NotFoundView } from "~/components/error-pages";
import type { loader as layoutLoader } from "./layout";

export const meta: MetaFunction = () => {
  return [
    { title: "Page not found (404) | PaTan™" },
    { name: "robots", content: "noindex, nofollow" },
    {
      name: "description",
      content:
        "The page you are looking for could not be found on PaTan™. Return home or discover stories of gratitude, resilience, and transformation.",
    },
  ];
};

/**
 * Catch-all route for unmatched URLs. Returns a real HTTP 404 status so the
 * response is correct for crawlers, monitoring, and clients, while rendering a
 * branded, accessible page within the public layout chrome.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  return data({ pathname: url.pathname }, { status: 404 });
}

export default function CatchAllRoute() {
  const layoutData = useRouteLoaderData<typeof layoutLoader>("routes/layout");

  return <NotFoundView isAuthenticated={Boolean(layoutData?.user)} />;
}
