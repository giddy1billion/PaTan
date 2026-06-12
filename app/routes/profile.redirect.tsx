import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const next = search ? `/profile?${search}` : "/profile";
  throw redirect(next, { status: 301 });
}
export default function ProfileRedirectRoute() {
  return null;
}
