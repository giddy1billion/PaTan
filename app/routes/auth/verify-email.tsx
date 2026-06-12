import type { LoaderFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { logAuthSecurityEvent } from '~/utils/auth-security.server';
import { consumeEmailVerificationToken } from '~/utils/email-verification.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/login?error=invalid-email-verification');
  }

  const result = await consumeEmailVerificationToken(token);
  if (!result.ok) {
    await logAuthSecurityEvent({
      request,
      eventType: 'email_verified',
      severity: 'warn',
      outcome: 'invalid-token',
      route: '/auth/verify-email',
    });

    return redirect('/login?error=invalid-email-verification');
  }

  await logAuthSecurityEvent({
    request,
    eventType: 'email_verified',
    severity: 'info',
    outcome: 'verified',
    userId: result.userId,
    email: result.email,
    route: '/auth/verify-email',
  });

  return redirect('/login?error=email-verified');
}

export default function VerifyEmailRoute() {
  return null;
}
