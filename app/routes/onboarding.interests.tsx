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
  useNavigation,
} from "react-router";
import { requireVerifiedUser } from "~/utils/auth.server";
import {
  completeOnboardingWithInterests,
  getOnboardingProfile,
} from "~/utils/users.server";
import { AutoDismissAlert } from "~/components/auto-dismiss-alert";
import { SubmitButton } from "~/components/ui";
type ActionData = { error?: string };
const INTEREST_OPTIONS = [
  "Gratitude",
  "Inspiration",
  "Transformation",
  "Hope and Faith",
  "Health and Wellness",
  "Professional Growth",
  "Relationships",
  "Social Impact",
  "Overcoming Adversity",
  "Personal Triumph",
];
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
function withOnboardingWelcome(redirectTo: string) {
  const url = new URL(redirectTo, "https://patan.site");
  url.searchParams.set("welcome", "onboarding-complete");
  return `${url.pathname}${url.search}${url.hash}`;
}
export const meta: MetaFunction = () => {
  return [
    { title: "Onboarding: Interests | PaTan" },
    {
      name: "description",
      content:
        "Choose your interests so PaTan can personalize your first dashboard and discovery experience.",
    },
  ];
};
export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireVerifiedUser(request);
  const url = new URL(request.url);
  const redirectTo = getSafeRedirectTarget(url.searchParams.get("redirectTo"));
  const profile = await getOnboardingProfile(sessionUser.id);
  if (!profile) {
    throw redirect("/login?error=session-expired");
  }
  if (profile.onboardingCompleted) {
    throw redirect(redirectTo);
  }
  return { redirectTo, selectedInterests: profile.personalInterests };
}
export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireVerifiedUser(request);
  const formData = await request.formData();
  const redirectTo = getSafeRedirectTarget(
    String(formData.get("redirectTo") ?? "/dashboard"),
  );
  const selectedInterests = formData
    .getAll("interests")
    .map((value) => String(value))
    .filter(Boolean);
  if (selectedInterests.length < 1) {
    return {
      error: "Choose at least one focus area to personalize your experience.",
    } satisfies ActionData;
  }
  await completeOnboardingWithInterests(sessionUser.id, selectedInterests);
  throw redirect(withOnboardingWelcome(redirectTo));
}
export default function OnboardingInterestsRoute() {
  const { redirectTo, selectedInterests } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isCompleting = navigation.state === "submitting";
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
        <section className="w-full max-w-3xl rounded-3xl border border-midnight/10 bg-white/95 p-6 sm:p-8 shadow-[0_15px_45px_rgba(13,43,69,0.08)]">
          {" "}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
            Step 2 of 2
          </p>{" "}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl leading-tight text-midnight">
            {" "}
            Choose your focus areas{" "}
          </h1>{" "}
          <p className="mt-3 text-sm sm:text-base text-night/70 leading-relaxed">
            {" "}
            Pick the topics you want to see first in your dashboard and
            discovery feed.{" "}
          </p>{" "}
          <AutoDismissAlert
            tone="error"
            message={actionData?.error}
            className="mt-5"
          />{" "}
          <Form method="post" className="mt-6 space-y-6">
            {" "}
            <input type="hidden" name="redirectTo" value={redirectTo} />{" "}
            <fieldset>
              {" "}
              <legend className="sr-only">Select interests</legend>{" "}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {" "}
                {INTEREST_OPTIONS.map((interest) => {
                  const id = `interest-${interest.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                  const isChecked = selectedInterests.includes(interest);
                  return (
                    <label
                      key={interest}
                      htmlFor={id}
                      className="group flex items-center gap-3 rounded-xl border border-midnight/10 bg-surface/60 px-4 py-3 min-h-[52px] hover:border-golden/50 hover:bg-[#FFF9EC] transition-colors duration-200 motion-reduce:transition-none"
                    >
                      {" "}
                      <input
                        id={id}
                        name="interests"
                        type="checkbox"
                        value={interest}
                        defaultChecked={isChecked}
                        className="h-5 w-5 rounded border-mist text-forest focus:ring-golden"
                      />{" "}
                      <span className="text-sm font-medium text-night group-hover:text-midnight">
                        {interest}
                      </span>{" "}
                    </label>
                  );
                })}{" "}
              </div>{" "}
            </fieldset>{" "}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              {" "}
              <Link
                to={`/onboarding/profile?redirectTo=${encodeURIComponent(redirectTo)}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-midnight/15 px-4 py-2 text-sm font-medium text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                {" "}
                Back{" "}
              </Link>{" "}
              <SubmitButton
                className="btn-primary min-h-[44px] px-5 py-2.5 text-sm sm:text-base"
                busy={isCompleting}
                pendingLabel="Completing…"
              >
                {" "}
                Complete onboarding{" "}
              </SubmitButton>{" "}
            </div>{" "}
          </Form>{" "}
        </section>{" "}
      </main>{" "}
    </div>
  );
}
