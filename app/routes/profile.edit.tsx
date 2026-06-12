import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { requireUser } from "~/utils/auth.server";
import {
  getPublicProfileVisibilitySettings,
  getProfileForEdit,
  getNotificationSettings,
  getProfileSafetySettings,
  upsertPublicProfileVisibilitySettings,
  upsertNotificationSettings,
  updateProfile,
  upsertProfileSafetySettings,
} from "~/utils/users.server";
type VisibilityValue = "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
type ActionData = {
  error?: string;
  success?: string;
  values?: {
    bio: string;
    country: string;
    city: string;
    pronouns: string;
    profilePhotoUrl: string;
    coverPhotoUrl: string;
    interests: string;
    anonymousPublishingDefault: string;
    defaultStoryVisibility: string;
    defaultAspirationVisibility: string;
    showBio: string;
    showLocation: string;
    showPronouns: string;
    showInterests: string;
    showStories: string;
    showAspirations: string;
    emailNotifications: string;
    pushNotifications: string;
    smsNotifications: string;
    digestFrequency: string;
  };
};
const VISIBILITY_OPTIONS: Array<{
  value: VisibilityValue;
  label: string;
  description: string;
}> = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Visible to everyone by default.",
  },
  {
    value: "FOLLOWERS_ONLY",
    label: "Followers only",
    description: "Visible to your followers by default.",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Visible only to you by default.",
  },
];
function parseVisibility(input: string): VisibilityValue {
  if (input === "FOLLOWERS_ONLY") {
    return "FOLLOWERS_ONLY";
  }
  if (input === "PRIVATE") {
    return "PRIVATE";
  }
  return "PUBLIC";
}

function parseDigestFrequency(input: string) {
  if (input === "realtime" || input === "weekly") {
    return input;
  }

  return "daily";
}
function parseInterests(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}
export const meta: MetaFunction = () => {
  return [
    { title: "Edit Profile | PaTan" },
    {
      name: "description",
      content:
        "Update your profile details, interests, and safety defaults on PaTan.",
    },
  ];
};
export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const [profile, safety, visibility, notificationSettings] = await Promise.all([
    getProfileForEdit(sessionUser.id),
    getProfileSafetySettings(sessionUser.id),
    getPublicProfileVisibilitySettings(sessionUser.id),
    getNotificationSettings(sessionUser.id),
  ]);
  if (!profile) {
    throw new Response("Profile not found", { status: 404 });
  }
  return { profile, safety, visibility, notificationSettings };
}
export async function action({ request }: ActionFunctionArgs) {
  const sessionUser = await requireUser(request);
  const formData = await request.formData();
  const values = {
    bio: String(formData.get("bio") ?? ""),
    country: String(formData.get("country") ?? ""),
    city: String(formData.get("city") ?? ""),
    pronouns: String(formData.get("pronouns") ?? ""),
    profilePhotoUrl: String(formData.get("profilePhotoUrl") ?? ""),
    coverPhotoUrl: String(formData.get("coverPhotoUrl") ?? ""),
    interests: String(formData.get("interests") ?? ""),
    anonymousPublishingDefault: String(
      formData.get("anonymousPublishingDefault") ?? "",
    ),
    defaultStoryVisibility: String(
      formData.get("defaultStoryVisibility") ?? "PUBLIC",
    ),
    defaultAspirationVisibility: String(
      formData.get("defaultAspirationVisibility") ?? "PUBLIC",
    ),
    showBio: String(formData.get("showBio") ?? ""),
    showLocation: String(formData.get("showLocation") ?? ""),
    showPronouns: String(formData.get("showPronouns") ?? ""),
    showInterests: String(formData.get("showInterests") ?? ""),
    showStories: String(formData.get("showStories") ?? ""),
    showAspirations: String(formData.get("showAspirations") ?? ""),
    emailNotifications: String(formData.get("emailNotifications") ?? ""),
    pushNotifications: String(formData.get("pushNotifications") ?? ""),
    smsNotifications: String(formData.get("smsNotifications") ?? ""),
    digestFrequency: String(formData.get("digestFrequency") ?? "daily"),
  };
  const bio = values.bio.trim();
  if (bio.length > 240) {
    return {
      error: "Bio must be 240 characters or fewer.",
      values,
    } satisfies ActionData;
  }
  const interests = parseInterests(values.interests);
  try {
    await updateProfile({
      userId: sessionUser.id,
      bio,
      country: values.country,
      city: values.city,
      pronouns: values.pronouns,
      profilePhotoUrl: values.profilePhotoUrl,
      coverPhotoUrl: values.coverPhotoUrl,
      interests,
    });
    await upsertProfileSafetySettings({
      userId: sessionUser.id,
      anonymousPublishingDefault: values.anonymousPublishingDefault === "on",
      defaultStoryVisibility: parseVisibility(values.defaultStoryVisibility),
      defaultAspirationVisibility: parseVisibility(
        values.defaultAspirationVisibility,
      ),
    });
    await upsertPublicProfileVisibilitySettings({
      userId: sessionUser.id,
      visibility: {
        bio: values.showBio === "on",
        location: values.showLocation === "on",
        pronouns: values.showPronouns === "on",
        interests: values.showInterests === "on",
        stories: values.showStories === "on",
        aspirations: values.showAspirations === "on",
      },
    });
    await upsertNotificationSettings({
      userId: sessionUser.id,
      emailNotifications: values.emailNotifications === "on",
      pushNotifications: values.pushNotifications === "on",
      smsNotifications: values.smsNotifications === "on",
      digestFrequency: parseDigestFrequency(values.digestFrequency),
    });
  } catch {
    return {
      error: "We could not save your profile right now. Please try again.",
      values,
    } satisfies ActionData;
  }
  return { success: "Profile updated successfully." } satisfies ActionData;
}
export default function ProfileEditRoute() {
  const { profile, safety, visibility, notificationSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const bio = actionData?.values?.bio ?? profile.bio ?? "";
  const country = actionData?.values?.country ?? profile.country ?? "";
  const city = actionData?.values?.city ?? profile.city ?? "";
  const pronouns = actionData?.values?.pronouns ?? profile.pronouns ?? "";
  const profilePhotoUrl =
    actionData?.values?.profilePhotoUrl ?? profile.profilePhotoUrl ?? "";
  const coverPhotoUrl =
    actionData?.values?.coverPhotoUrl ?? profile.coverPhotoUrl ?? "";
  const interests =
    actionData?.values?.interests ?? profile.personalInterests.join(", ");
  const anonymousDefault =
    (actionData?.values?.anonymousPublishingDefault ??
      (safety.anonymousPublishingDefault ? "on" : "off")) === "on";
  const defaultStoryVisibility = parseVisibility(
    actionData?.values?.defaultStoryVisibility ?? safety.defaultStoryVisibility,
  );
  const defaultAspirationVisibility = parseVisibility(
    actionData?.values?.defaultAspirationVisibility ??
      safety.defaultAspirationVisibility,
  );
  const publicVisibility = {
    bio:
      (actionData?.values?.showBio ?? (visibility.bio ? "on" : "off")) === "on",
    location:
      (actionData?.values?.showLocation ??
        (visibility.location ? "on" : "off")) === "on",
    pronouns:
      (actionData?.values?.showPronouns ??
        (visibility.pronouns ? "on" : "off")) === "on",
    interests:
      (actionData?.values?.showInterests ??
        (visibility.interests ? "on" : "off")) === "on",
    stories:
      (actionData?.values?.showStories ??
        (visibility.stories ? "on" : "off")) === "on",
    aspirations:
      (actionData?.values?.showAspirations ??
        (visibility.aspirations ? "on" : "off")) === "on",
  };
  const channelSettings = {
    email:
      (actionData?.values?.emailNotifications ??
        (notificationSettings.emailNotifications ? "on" : "off")) === "on",
    push:
      (actionData?.values?.pushNotifications ??
        (notificationSettings.pushNotifications ? "on" : "off")) === "on",
    sms:
      (actionData?.values?.smsNotifications ??
        (notificationSettings.smsNotifications ? "on" : "off")) === "on",
    digestFrequency: parseDigestFrequency(
      actionData?.values?.digestFrequency ?? notificationSettings.digestFrequency,
    ),
  };
  const joinedLocation = [city.trim(), country.trim()]
    .filter(Boolean)
    .join(", ");
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {" "}
      <section className="bg-midnight text-dawn py-10 sm:py-14">
        {" "}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <p className="text-xs uppercase tracking-[0.18em] text-golden font-semibold">
            Phase 2
          </p>{" "}
          <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-bold">
            My profile settings
          </h1>{" "}
          <p className="mt-3 text-dawn/75 max-w-2xl">
            {" "}
            Edit your profile details and safety defaults. Your public page is
            available at{" "}
            <Link
              to={`/u/${profile.username}`}
              className="font-semibold text-golden hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden rounded"
            >
              {" "}
              /u/{profile.username}{" "}
            </Link>{" "}
            .{" "}
          </p>{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-8 sm:py-10">
        {" "}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-5 lg:grid-cols-3">
          {" "}
          <aside className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm h-fit">
            {" "}
            <h2 className="font-heading text-xl text-midnight">
              Profile preview
            </h2>{" "}
            <div className="mt-4 aspect-[3/1] rounded-xl border border-midnight/10 bg-surface overflow-hidden">
              {" "}
              {coverPhotoUrl.trim() ? (
                <img
                  src={coverPhotoUrl.trim()}
                  alt="Cover photo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-night/60">
                  {" "}
                  Empty cover photo state{" "}
                </div>
              )}{" "}
            </div>{" "}
            <div className="mt-4 flex items-center gap-3">
              {" "}
              <div className="h-14 w-14 rounded-full overflow-hidden border border-midnight/15 bg-mist flex items-center justify-center text-sm font-semibold text-midnight">
                {" "}
                {profilePhotoUrl.trim() ? (
                  <img
                    src={profilePhotoUrl.trim()}
                    alt="Profile photo preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.displayName.slice(0, 2).toUpperCase()
                )}{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-sm font-semibold text-midnight">
                  {profile.displayName}
                </p>{" "}
                <p className="text-xs text-night/60">
                  @{profile.username}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-4 space-y-2 text-sm text-night/75">
              {" "}
              <p>{bio.trim() || "Empty bio state: add a short intro."}</p>{" "}
              <p>
                {joinedLocation ||
                  "Empty location state: city and country not set."}
              </p>{" "}
              <p>{pronouns.trim() || "Empty pronouns state: not set yet."}</p>{" "}
              <p>
                {interests.trim() ||
                  "Empty interests state: add interests for better suggestions."}
              </p>{" "}
            </div>{" "}
            <div className="mt-6 space-y-2">
              {" "}
              <Link
                to={`/u/${profile.username}`}
                className="btn-primary min-h-[44px] inline-flex w-full items-center justify-center text-sm"
              >
                {" "}
                View public profile{" "}
              </Link>{" "}
              <Link
                to="/dashboard"
                className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
              >
                {" "}
                Back to dashboard{" "}
              </Link>{" "}
            </div>{" "}
          </aside>{" "}
          <div className="space-y-5 lg:col-span-2">
            {" "}
            {actionData?.error ? (
              <div
                className="rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
                role="alert"
                aria-live="polite"
              >
                {" "}
                {actionData.error}{" "}
              </div>
            ) : null}{" "}
            {actionData?.success ? (
              <div
                className="rounded-xl border border-forest/30 bg-[#ECF9F0] px-4 py-3 text-sm text-forest"
                role="status"
                aria-live="polite"
              >
                {" "}
                {actionData.success}{" "}
              </div>
            ) : null}{" "}
            <Form method="post" className="space-y-5">
              {" "}
              <section
                className="rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm"
                aria-labelledby="profile-details-heading"
                aria-busy={isSubmitting}
              >
                {" "}
                <h2
                  id="profile-details-heading"
                  className="font-heading text-xl text-midnight"
                >
                  Profile details
                </h2>{" "}
                <p className="mt-1 text-sm text-night/70">
                  Editable fields from your schema are supported below.
                </p>{" "}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {" "}
                  <div className="sm:col-span-2">
                    {" "}
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-night"
                    >
                      Bio
                    </label>{" "}
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      maxLength={240}
                      defaultValue={bio}
                      className="mt-1 block w-full rounded-xl border border-mist px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Write a short bio"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-night"
                    >
                      Country
                    </label>{" "}
                    <input
                      id="country"
                      name="country"
                      defaultValue={country}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-night"
                    >
                      City
                    </label>{" "}
                    <input
                      id="city"
                      name="city"
                      defaultValue={city}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label
                      htmlFor="pronouns"
                      className="block text-sm font-medium text-night"
                    >
                      Pronouns
                    </label>{" "}
                    <input
                      id="pronouns"
                      name="pronouns"
                      defaultValue={pronouns}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    />{" "}
                  </div>{" "}
                  <div className="sm:col-span-2">
                    {" "}
                    <label
                      htmlFor="interests"
                      className="block text-sm font-medium text-night"
                    >
                      Interests (comma-separated)
                    </label>{" "}
                    <input
                      id="interests"
                      name="interests"
                      defaultValue={interests}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="Gratitude, Transformation, Community"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label
                      htmlFor="profilePhotoUrl"
                      className="block text-sm font-medium text-night"
                    >
                      Profile photo URL
                    </label>{" "}
                    <input
                      id="profilePhotoUrl"
                      name="profilePhotoUrl"
                      type="url"
                      inputMode="url"
                      defaultValue={profilePhotoUrl}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="https://..."
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label
                      htmlFor="coverPhotoUrl"
                      className="block text-sm font-medium text-night"
                    >
                      Cover photo URL
                    </label>{" "}
                    <input
                      id="coverPhotoUrl"
                      name="coverPhotoUrl"
                      type="url"
                      inputMode="url"
                      defaultValue={coverPhotoUrl}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                      placeholder="https://..."
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </section>{" "}
              <section
                className="rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm"
                aria-labelledby="safety-heading"
                aria-busy={isSubmitting}
              >
                {" "}
                <h2
                  id="safety-heading"
                  className="font-heading text-xl text-midnight"
                >
                  Profile safety controls
                </h2>{" "}
                <fieldset className="mt-4">
                  {" "}
                  <legend className="text-sm font-medium text-night">
                    Anonymous publishing preference
                  </legend>{" "}
                  <label className="mt-2 inline-flex min-h-[44px] items-center gap-3 rounded-xl border border-midnight/10 px-4 py-3">
                    {" "}
                    <input
                      type="checkbox"
                      name="anonymousPublishingDefault"
                      defaultChecked={anonymousDefault}
                      className="h-4 w-4 rounded border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm text-night">
                      Apply anonymous publishing as default
                    </span>{" "}
                  </label>{" "}
                </fieldset>{" "}
                <fieldset className="mt-5">
                  {" "}
                  <legend className="text-sm font-medium text-night">
                    Default story visibility
                  </legend>{" "}
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {" "}
                    {VISIBILITY_OPTIONS.map((option) => (
                      <label
                        key={`story-${option.value}`}
                        className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]"
                      >
                        {" "}
                        <input
                          type="radio"
                          name="defaultStoryVisibility"
                          value={option.value}
                          defaultChecked={
                            defaultStoryVisibility === option.value
                          }
                          className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                        />{" "}
                        <span className="text-sm font-medium text-midnight">
                          {option.label}
                        </span>{" "}
                        <p className="mt-1 text-xs text-night/60">
                          {option.description}
                        </p>{" "}
                      </label>
                    ))}{" "}
                  </div>{" "}
                </fieldset>{" "}
                <fieldset className="mt-5">
                  {" "}
                  <legend className="text-sm font-medium text-night">
                    Default aspiration visibility
                  </legend>{" "}
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {" "}
                    {VISIBILITY_OPTIONS.map((option) => (
                      <label
                        key={`aspiration-${option.value}`}
                        className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]"
                      >
                        {" "}
                        <input
                          type="radio"
                          name="defaultAspirationVisibility"
                          value={option.value}
                          defaultChecked={
                            defaultAspirationVisibility === option.value
                          }
                          className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                        />{" "}
                        <span className="text-sm font-medium text-midnight">
                          {option.label}
                        </span>{" "}
                        <p className="mt-1 text-xs text-night/60">
                          {option.description}
                        </p>{" "}
                      </label>
                    ))}{" "}
                  </div>{" "}
                </fieldset>{" "}
                <p className="mt-5 rounded-xl border border-midnight/10 bg-surface px-3 py-2 text-xs text-night/60">
                  {" "}
                  Block/report entry points are on public profiles, including
                  your own public page links.{" "}
                </p>{" "}
              </section>{" "}
              <section
                className="rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm"
                aria-labelledby="public-visibility-heading"
                aria-busy={isSubmitting}
              >
                {" "}
                <h2
                  id="public-visibility-heading"
                  className="font-heading text-xl text-midnight"
                >
                  Public profile visibility
                </h2>{" "}
                <p className="mt-1 text-sm text-night/70">
                  {" "}
                  Choose exactly what appears on your public profile page.{" "}
                </p>{" "}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showBio"
                      defaultChecked={publicVisibility.bio}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show bio
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Share your introduction on your public page.
                    </p>{" "}
                  </label>{" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showLocation"
                      defaultChecked={publicVisibility.location}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show location
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Display your city and country.
                    </p>{" "}
                  </label>{" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showPronouns"
                      defaultChecked={publicVisibility.pronouns}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show pronouns
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Help people address you correctly.
                    </p>{" "}
                  </label>{" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showInterests"
                      defaultChecked={publicVisibility.interests}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show interests
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Reveal your focus areas and themes.
                    </p>{" "}
                  </label>{" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showStories"
                      defaultChecked={publicVisibility.stories}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show story highlights
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Display your public stories and story count.
                    </p>{" "}
                  </label>{" "}
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    {" "}
                    <input
                      type="checkbox"
                      name="showAspirations"
                      defaultChecked={publicVisibility.aspirations}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />{" "}
                    <span className="text-sm font-medium text-midnight">
                      Show aspiration highlights
                    </span>{" "}
                    <p className="mt-1 text-xs text-night/60">
                      Display your public aspirations and progress.
                    </p>{" "}
                  </label>{" "}
                </div>{" "}
              </section>{" "}
              <section
                className="rounded-2xl border border-midnight/10 bg-white p-5 sm:p-6 shadow-sm"
                aria-labelledby="notification-preferences-heading"
                aria-busy={isSubmitting}
              >
                <h2
                  id="notification-preferences-heading"
                  className="font-heading text-xl text-midnight"
                >
                  Notification delivery preferences
                </h2>
                <p className="mt-1 text-sm text-night/70">
                  Choose how PaTan delivers updates for reactions, comments, support, messages, and mentions.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      defaultChecked={channelSettings.email}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />
                    <span className="text-sm font-medium text-midnight">Email notifications</span>
                    <p className="mt-1 text-xs text-night/60">Send eligible updates to your email inbox.</p>
                  </label>

                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px]">
                    <input
                      type="checkbox"
                      name="pushNotifications"
                      defaultChecked={channelSettings.push}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />
                    <span className="text-sm font-medium text-midnight">Push notifications</span>
                    <p className="mt-1 text-xs text-night/60">Send immediate push alerts for eligible activity.</p>
                  </label>

                  <label className="rounded-xl border border-midnight/10 px-4 py-3 min-h-[44px] sm:col-span-2">
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      defaultChecked={channelSettings.sms}
                      className="mr-2 h-4 w-4 border-mist text-golden focus:ring-golden"
                    />
                    <span className="text-sm font-medium text-midnight">SMS notifications</span>
                    <p className="mt-1 text-xs text-night/60">Reserved for channels that explicitly support SMS delivery.</p>
                  </label>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="digestFrequency"
                      className="block text-sm font-medium text-night"
                    >
                      Email digest frequency
                    </label>
                    <select
                      id="digestFrequency"
                      name="digestFrequency"
                      defaultValue={channelSettings.digestFrequency}
                      className="mt-1 block w-full min-h-[44px] rounded-xl border border-mist px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-golden focus:border-transparent"
                    >
                      <option value="realtime">Realtime emails</option>
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly digest</option>
                    </select>
                  </div>
                </div>
              </section>{" "}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                {" "}
                <Link
                  to={`/u/${profile.username}`}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-midnight/15 bg-white px-4 py-2 text-sm font-medium text-midnight hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden"
                >
                  {" "}
                  Go to public profile{" "}
                </Link>{" "}
                <button
                  type="submit"
                  className="btn-primary min-h-[44px] px-5 py-2.5 text-sm"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {" "}
                  {isSubmitting
                    ? "Saving profile..."
                    : "Save profile changes"}{" "}
                </button>{" "}
              </div>{" "}
            </Form>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
export function ErrorBoundary() {
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      {" "}
      <section className="max-w-3xl mx-auto px-4 py-14">
        {" "}
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-5 py-4 text-[#7C2D12]">
          {" "}
          <h1 className="font-heading text-2xl">Profile error state</h1>{" "}
          <p className="mt-2 text-sm">
            We could not load your profile settings right now.
          </p>{" "}
          <Link
            to="/dashboard"
            className="mt-4 inline-flex rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
          >
            {" "}
            Back to dashboard{" "}
          </Link>{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
