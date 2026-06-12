import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import {
  getOnboardingProfile,
  updateOnboardingProfileStep,
} from "~/utils/users.server";
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
type ActionData = {
  error?: string;
  values?: { displayName: string; username: string; bio: string };
};
function getSafeRedirectTarget(redirectTo: string | null | undefined) {
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return "/dashboard";
  }
  return redirectTo;
}
export const meta: MetaFunction = () => {
  return [
    { title: "Onboarding: Profile Basics | PaTan" },
    {
      name: "description",
      content:
        "Set up your profile basics so your PaTan community can recognize and support your journey.",
    },
  ];
};
export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const url = new URL(request.url);
  const redirectTo = getSafeRedirectTarget(url.searchParams.get("redirectTo"));
  const profile = await getOnboardingProfile(sessionUser.id);
  if (!profile) {
    throw redirect("/login?error=session-expired");
  }
  if (profile.onboardingCompleted) {
    throw redirect(redirectTo);
  }
  return { redirectTo, profile };
}
export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();
  const redirectTo = getSafeRedirectTarget(
    String(formData.get("redirectTo") ?? "/dashboard"),
  );
  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();
  const values = { displayName, username, bio };
  if (displayName.length < 2) {
    return {
      error: "Please add a display name with at least 2 characters.",
      values,
    } satisfies ActionData;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Username must be 3-20 characters using lowercase letters, numbers, or underscores.",
      values,
    } satisfies ActionData;
  }
  if (bio.length > 240) {
    return {
      error: "Bio must be 240 characters or fewer.",
      values,
    } satisfies ActionData;
  }
  try {
    await updateOnboardingProfileStep({
      userId: sessionUser.id,
      displayName,
      username,
      bio,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "username-taken") {
      return {
        error: "That username is already taken. Try another one.",
        values,
      } satisfies ActionData;
    }
    return {
      error: "We could not save your profile right now. Please try again.",
      values,
    } satisfies ActionData;
  }
  throw redirect(
    `/onboarding/interests?redirectTo=${encodeURIComponent(redirectTo)}`,
  );
}
export default function OnboardingProfileRoute() {
  const { profile, redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const displayName = actionData?.values?.displayName ?? profile.displayName;
  const username = actionData?.values?.username ?? profile.username;
  const bio = actionData?.values?.bio ?? profile.bio ?? "";
  return (
    <div className="min-h-screen page-modern flex flex-col">
      {" "}
      <header className="p-4 sm:p-6">
        {" "}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
          aria-label="Back to home"
        >
          {" "}
          <img
            src="/brand/logos/logo-sm.png"
            alt=""
            aria-hidden="true"
            className="h-8 w-auto"
          />{" "}
          <span className="font-heading text-lg font-bold text-midnight">
            PaTan
          </span>{" "}
        </Link>{" "}
      </header>{" "}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        {" "}
        <section className="w-full max-w-2xl rounded-3xl border border-midnight/10 bg-white/95 p-6 sm:p-8 shadow-[0_15px_45px_rgba(13,43,69,0.08)]">
          {" "}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            Step 1 of 2
          </p>{" "}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl leading-tight text-midnight">
            {" "}
            Build your profile basics{" "}
          </h1>{" "}
          <p className="mt-3 text-sm sm:text-base text-night/70 leading-relaxed">
            {" "}
            Share how people should know you. You can refine this anytime.{" "}
          </p>{" "}
          {actionData?.error ? (
            <div
              className="mt-5 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
              role="alert"
              aria-live="polite"
            >
              {" "}
              {actionData.error}{" "}
            </div>
          ) : null}{" "}
          <Form method="post" className="mt-6 space-y-5">
            {" "}
            <input type="hidden" name="redirectTo" value={redirectTo} />{" "}
            <div>
              {" "}
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-night"
              >
                {" "}
                Display name{" "}
              </label>{" "}
              <input
                id="displayName"
                name="displayName"
                defaultValue={displayName}
                required
                minLength={2}
                className="mt-1 block w-full rounded-lg border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                autoComplete="name"
              />{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="username"
                className="block text-sm font-medium text-night"
              >
                {" "}
                Username{" "}
              </label>{" "}
              <input
                id="username"
                name="username"
                defaultValue={username}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]{3,20}"
                className="mt-1 block w-full rounded-lg border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                aria-describedby="username-hint"
                autoCapitalize="none"
                autoCorrect="off"
              />{" "}
              <p id="username-hint" className="mt-1 text-xs text-night/60">
                {" "}
                Use lowercase letters, numbers, or underscores.{" "}
              </p>{" "}
            </div>{" "}
            <div>
              {" "}
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-night"
              >
                {" "}
                Short bio (optional){" "}
              </label>{" "}
              <textarea
                id="bio"
                name="bio"
                defaultValue={bio}
                maxLength={240}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                placeholder="What brings you to PaTan?"
              />{" "}
            </div>{" "}
            <div className="pt-2 flex justify-end">
              {" "}
              <button
                type="submit"
                className="btn-primary min-h-[44px] px-5 py-2.5 text-sm sm:text-base"
              >
                {" "}
                Continue to interests{" "}
              </button>{" "}
            </div>{" "}
          </Form>{" "}
        </section>{" "}
      </main>{" "}
    </div>
  );
}
