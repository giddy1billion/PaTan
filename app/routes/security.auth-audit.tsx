import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, redirect, useLoaderData } from 'react-router';
import { requireUser } from '~/utils/auth.server';
import { getAuthAuditDashboardData } from '~/utils/auth-security.server';
import { db } from '~/utils/db.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Auth Security Audit - PaTan' },
    { name: 'description', content: 'Operational visibility into authentication security events and anomalies.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  const roleLookup = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true },
  });

  const elevatedRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'MODERATOR']);
  if (!roleLookup || !elevatedRoles.has(roleLookup.role)) {
    return redirect('/dashboard');
  }

  const dashboard = await getAuthAuditDashboardData();

  return {
    dashboard,
  };
}

export default function SecurityAuthAuditRoute() {
  const { dashboard } = useLoaderData<typeof loader>();

  return (
    <main id="main-content" className="page-modern min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-midnight">Authentication Security Audit</h1>
            <p className="mt-2 text-night/70">Live security metrics across login, signup, OAuth, MFA, and reset workflows.</p>
          </div>
          <Link
            to="/dashboard"
            className="btn-tertiary rounded-lg border border-mist px-4 py-2 text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-night/70">Events (24h)</h2>
            <p className="mt-2 text-2xl font-bold text-midnight">{dashboard.totals.last24hEvents}</p>
          </article>
          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-night/70">Failures (24h)</h2>
            <p className="mt-2 text-2xl font-bold text-[#B91C1C]">{dashboard.totals.last24hFailures}</p>
          </article>
          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-night/70">High Severity (24h)</h2>
            <p className="mt-2 text-2xl font-bold text-[#92400E]">{dashboard.totals.last24hHighSeverity}</p>
          </article>
          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-night/70">Rate-Limited (24h)</h2>
            <p className="mt-2 text-2xl font-bold text-midnight">{dashboard.totals.last24hRateLimited}</p>
          </article>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-midnight">Top Failure IPs</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-mist text-night/70">
                    <th className="py-2 pr-4 font-medium">IP address</th>
                    <th className="py-2 font-medium">Failures</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topFailureIps.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-3 text-night/60">No recent failed-attempt hotspots.</td>
                    </tr>
                  ) : (
                    dashboard.topFailureIps.map((entry) => (
                      <tr key={`${entry.ipAddress}-${entry.failures}`} className="border-b border-mist/60">
                        <td className="py-2 pr-4 text-night">{entry.ipAddress}</td>
                        <td className="py-2 text-night">{entry.failures}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-xl border border-mist bg-white p-4 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-midnight">Recent High-Risk Events</h2>
            <div className="mt-4 space-y-3">
              {dashboard.recentHighRiskEvents.length === 0 ? (
                <p className="text-sm text-night/60">No high-risk events detected recently.</p>
              ) : (
                dashboard.recentHighRiskEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-mist/80 bg-[#F8FAFC] p-3">
                    <p className="text-sm font-semibold text-midnight">{event.eventType}</p>
                    <p className="mt-1 text-xs text-night/70">
                      Severity: {event.severity} | Outcome: {event.outcome}
                    </p>
                    <p className="mt-1 text-xs text-night/70">
                      IP: {event.ipAddress ?? 'unknown'} | Risk: {event.riskScore ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-night/60">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
