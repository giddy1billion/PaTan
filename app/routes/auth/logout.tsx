import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { logout } from "~/utils/auth.server";
import { logAuthSecurityEvent } from "~/utils/auth-security.server";
import { verifyCsrfToken } from "~/utils/csrf.server";
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const csrfToken = String(formData.get("csrfToken") ?? "");
  const hasValidCsrf = await verifyCsrfToken({
    request,
    submittedToken: csrfToken,
  });
  if (!hasValidCsrf) {
    await logAuthSecurityEvent({
      request,
      eventType: "csrf_failure",
      severity: "warn",
      outcome: "blocked",
      route: "/logout",
    });
    return redirect("/login?error=invalid-csrf");
  }
  return logout(request);
}
export default function LogoutRoute() {
  return null;
}
