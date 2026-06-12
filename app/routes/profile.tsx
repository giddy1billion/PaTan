import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, redirect, useLoaderData, useNavigation, useRouteLoaderData, useSearchParams } from 'react-router';
import { requireUser } from '~/utils/auth.server';
import { getAuthErrorMessage } from '~/utils/auth-errors';
import { logAuthSecurityEvent } from '~/utils/auth-security.server';
import { verifyCsrfToken } from '~/utils/csrf.server';
import { db } from '~/utils/db.server';
import { issueEmailVerification } from '~/utils/email-verification.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Your Profile - PaTan' },
    {
      name: 'description',
      content: 'Review your profile, story journey, and community footprint on PaTan.',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  const [profile, storyCount, aspirationCount, savedCount, followerCount, followingCount] = await Promise.all([
    db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        displayName: true,
        username: true,
        email: true,
        bio: true,
        profilePhotoUrl: true,
        city: true,
        country: true,
        pronouns: true,
        emailVerified: true,
        mfaEnabled: true,
        personalInterests: true,
        createdAt: true,
        reputationScore: true,
        trustLevel: true,
      },
    }),
    db.story.count({ where: { authorId: sessionUser.id, deletedAt: null } }),
    db.aspiration.count({ where: { authorId: sessionUser.id, deletedAt: null } }),
    db.savedStory.count({ where: { userId: sessionUser.id } }),
    db.follow.count({ where: { followingId: sessionUser.id } }),
    db.follow.count({ where: { followerId: sessionUser.id } }),
  ]);

  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }

  return {
    profile,
    stats: {
      storyCount,
      aspirationCount,
      savedCount,
      followerCount,
      followingCount,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();

  const intent = String(formData.get('intent') ?? '');
  const csrfToken = String(formData.get('csrfToken') ?? '');

  const hasValidCsrf = await verifyCsrfToken({
    request,
    submittedToken: csrfToken,
  });

  if (!hasValidCsrf) {
    await logAuthSecurityEvent({
      request,
      eventType: 'csrf_failure',
      severity: 'warn',
      outcome: 'blocked',
      userId: user.id,
      email: user.email,
      route: '/profile',
    });

    return redirect('/profile?error=invalid-csrf');
  }

  if (intent !== 'toggle-mfa') {
    return redirect('/profile');
  }

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      mfaEnabled: true,
    },
  });

  if (!current || !current.email) {
    return redirect('/profile?error=signup-failed');
  }

  const requestedMfaEnabled = String(formData.get('mfaEnabled') ?? '') === 'true';

  if (requestedMfaEnabled && !current.emailVerified) {
    await issueEmailVerification({
      userId: current.id,
      email: current.email,
      requestUrl: request.url,
    });

    await logAuthSecurityEvent({
      request,
      eventType: 'email_verification_sent',
      severity: 'info',
      outcome: 'mfa-enable-prerequisite',
      userId: current.id,
      email: current.email,
      route: '/profile',
    });

    return redirect('/profile?error=email-not-verified');
  }

  await db.user.update({
    where: { id: current.id },
    data: {
      mfaEnabled: requestedMfaEnabled,
    },
  });

  await logAuthSecurityEvent({
    request,
    eventType: requestedMfaEnabled ? 'mfa_enrollment_enabled' : 'mfa_enrollment_disabled',
    severity: 'info',
    outcome: requestedMfaEnabled ? 'enabled' : 'disabled',
    userId: current.id,
    email: current.email,
    route: '/profile',
  });

  return redirect(
    requestedMfaEnabled
      ? '/profile?security=mfa-enabled'
      : '/profile?security=mfa-disabled',
  );
}

export default function ProfileRoute() {
  const rootData = useRouteLoaderData<{
    csrfToken?: string;
    csrfFieldName?: string;
  }>('root');
  const { profile, stats } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isRefreshing = navigation.state === 'loading' && navigation.location?.pathname === '/profile';

  const csrfToken = rootData?.csrfToken ?? '';
  const csrfFieldName = rootData?.csrfFieldName ?? 'csrfToken';
  const authError = getAuthErrorMessage(searchParams.get('error'));
  const securityMessageKey = searchParams.get('security');

  const locationText = [profile.city, profile.country].filter(Boolean).join(', ');
  const securityMessage =
    securityMessageKey === 'mfa-enabled'
      ? 'Multi-factor authentication has been enabled for high-risk sign-ins.'
      : securityMessageKey === 'mfa-disabled'
        ? 'Multi-factor authentication has been disabled.'
        : null;

  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="bg-midnight text-dawn py-10 sm:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white/20 border border-white/30 text-white flex items-center justify-center text-xl font-semibold">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={`Profile avatar for ${profile.displayName}`} className="w-full h-full object-cover" />
              ) : (
                <span>{profile.displayName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight">{profile.displayName}</h1>
              <p className="mt-1 text-dawn/75">@{profile.username}</p>
              <p className="mt-2 text-sm text-dawn/70">{profile.email ?? 'No email on file'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {isRefreshing ? (
            <div className="mb-4 rounded-xl border border-midnight/15 bg-white px-4 py-3 text-xs text-night/70" role="status" aria-live="polite">
              Refreshing profile data...
            </div>
          ) : null}

          {authError ? (
            <div
              className="mb-4 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-4 py-3 text-sm text-[#7C2D12]"
              role="alert"
              aria-live="polite"
            >
              {authError}
            </div>
          ) : null}

          {securityMessage ? (
            <div
              className="mb-4 rounded-xl border border-[#2E6F40]/30 bg-[#DCFCE7]/60 px-4 py-3 text-sm text-[#14532D]"
              role="status"
              aria-live="polite"
            >
              {securityMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Stories</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.storyCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Aspirations</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.aspirationCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Saved</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.savedCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Followers</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.followerCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Following</p>
              <p className="mt-1 text-2xl font-bold text-midnight">{stats.followingCount}</p>
            </article>
            <article className="rounded-xl border border-midnight/10 bg-white p-4 shadow-sm">
              <p className="text-xs text-night/60 uppercase tracking-wide">Trust</p>
              <p className="mt-1 text-2xl font-bold text-midnight">L{profile.trustLevel}</p>
            </article>
          </div>

          <div className="mt-6 grid lg:grid-cols-3 gap-4 sm:gap-5">
            <section className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="font-heading text-xl text-midnight">About you</h2>
              <p className="mt-3 text-sm text-night/80 leading-relaxed">
                {profile.bio?.trim() || 'Add a short bio to help others connect with your journey and purpose.'}
              </p>

              <dl className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">Location</dt>
                  <dd className="mt-1 font-medium text-midnight">{locationText || 'Not set yet'}</dd>
                </div>
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">Pronouns</dt>
                  <dd className="mt-1 font-medium text-midnight">{profile.pronouns || 'Not set yet'}</dd>
                </div>
                <div className="rounded-xl border border-midnight/10 p-3 sm:col-span-2">
                  <dt className="text-night/60">Reputation</dt>
                  <dd className="mt-1 font-medium text-midnight">{profile.reputationScore} points</dd>
                </div>
              </dl>
            </section>

            <aside className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-xl text-midnight">Interests</h2>
              {profile.personalInterests.length === 0 ? (
                <p className="mt-3 text-sm text-night/70">No interests selected yet.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2" role="list">
                  {profile.personalInterests.map((interest) => (
                    <li key={interest} className="rounded-full bg-[#FDF3D6] text-[#7A5A00] px-3 py-1 text-xs font-semibold">
                      {interest}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-2">
                <Link to="/dashboard" className="btn-primary min-h-[44px] inline-flex w-full items-center justify-center text-sm">Go to dashboard</Link>
                <Link to="/profile/settings" className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">Edit profile settings</Link>
                <Link to={`/u/${profile.username}`} className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">View public profile</Link>
                <Link to="/stories/new" className="min-h-[44px] inline-flex w-full items-center justify-center rounded-xl border border-midnight/15 bg-white text-midnight text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden">Share new story</Link>
              </div>
            </aside>

            <aside className="rounded-2xl border border-midnight/10 bg-white p-5 shadow-sm lg:col-span-3">
              <h2 className="font-heading text-xl text-midnight">Account Security</h2>
              <p className="mt-2 text-sm text-night/70">
                Protect your account with multi-factor verification for high-risk sign-in attempts.
              </p>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">Email verification</dt>
                  <dd className="mt-1 font-medium text-midnight">
                    {profile.emailVerified ? 'Verified' : 'Not verified'}
                  </dd>
                </div>
                <div className="rounded-xl border border-midnight/10 p-3">
                  <dt className="text-night/60">High-risk MFA</dt>
                  <dd className="mt-1 font-medium text-midnight">
                    {profile.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
              </dl>

              <Form method="post" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <input type="hidden" name="intent" value="toggle-mfa" />
                <input type="hidden" name={csrfFieldName} value={csrfToken} />
                <input type="hidden" name="mfaEnabled" value={profile.mfaEnabled ? 'false' : 'true'} />

                <p className="text-sm text-night/70">
                  {profile.mfaEnabled
                    ? 'Disable high-risk MFA challenge requirements.'
                    : 'Enable MFA challenges when sign-in behavior appears suspicious.'}
                </p>

                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 border border-midnight/15 bg-white text-midnight hover:bg-surface"
                  aria-label={profile.mfaEnabled ? 'Disable high-risk MFA protection' : 'Enable high-risk MFA protection'}
                >
                  {profile.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                </button>
              </Form>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ErrorBoundary() {
  return (
    <main id="main-content" className="page-modern min-h-screen bg-dawn">
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="rounded-2xl border border-[#F59E0B]/40 bg-[#FEF3C7]/70 px-5 py-4 text-[#7C2D12]">
          <h1 className="font-heading text-2xl">Profile error state</h1>
          <p className="mt-2 text-sm">We could not load your profile right now.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
            >
              Back to dashboard
            </Link>
            <Link
              to="/profile"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#7C2D12]/30 px-3 py-2 text-sm font-semibold"
            >
              Retry profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
