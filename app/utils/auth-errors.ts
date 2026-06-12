const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "rate-limited": "Too many attempts detected. Please wait a moment and try again.",
  "invalid-csrf": "Your session security token is invalid or expired. Please refresh and try again.",
  "captcha-required": "Please complete the verification challenge to continue.",
  "captcha-failed": "Verification challenge failed. Please try again.",
  "captcha-unavailable": "Verification service is unavailable. Please try again shortly.",
  "missing-credentials": "Enter both your email and password to continue.",
  "invalid-credentials": "That email and password combination did not match our records.",
  "invalid-signup": "Review your signup details and try again.",
  "weak-password": "Choose a stronger password with at least 12 characters, mixed case, numbers, and symbols.",
  "breached-password": "That password has appeared in known breaches. Choose a different one.",
  "email-not-verified": "Verify your email before logging in. We sent you a fresh verification link.",
  "email-verification-resent": "If the account is pending verification, we sent a fresh verification link.",
  "invalid-email-verification-request": "Enter a valid email address to resend your verification link.",
  "verify-email-sent": "Account created. Check your email for a verification link before logging in.",
  "email-verified": "Email verified successfully. You can now log in.",
  "invalid-email-verification": "This verification link is invalid or expired.",
  "mfa-required": "A verification code is required for this sign-in attempt.",
  "mfa-invalid": "The verification code is invalid. Please try again.",
  "mfa-expired": "The verification code expired. Request a new code.",
  "mfa-session-expired": "Your sign-in verification session expired. Please log in again.",
  "mfa-code-resent": "A new verification code has been sent to your email.",
  "invalid-reset-request": "Enter a valid email address to request a password reset.",
  "invalid-reset-token": "Password reset link is invalid or expired.",
  "reset-password-mismatch": "Password confirmation does not match.",
  "reset-password-success": "Your password was reset successfully. You can now log in.",
  "email-taken": "An account with that email already exists. Try logging in instead.",
  "signup-failed": "We could not create your account. Please try again.",
  "signed-out": "You signed out successfully.",
  "oauth-invalid-provider": "That sign-in option is unavailable right now.",
  "oauth-misconfigured": "Social sign-in is not configured yet. Please use email and password for now.",
  "oauth-start-failed": "We could not start social sign-in. Please try again.",
  "oauth-session-expired": "Your sign-in session expired. Please try again.",
  "oauth-invalid-state": "We could not verify your sign-in request. Please try again.",
  "oauth-missing-code": "Sign-in was incomplete. Please try again.",
  "oauth-cancelled": "Sign-in was cancelled. You can try again anytime.",
  "oauth-denied": "Access was denied by the provider. Please try another option.",
  "oauth-callback-failed": "We could not finish social sign-in. Please try again.",
  "oauth-email-missing": "Your account does not provide an email address. Please use a different sign-in method.",
};

export function getAuthErrorMessage(errorCode: string | null | undefined) {
  if (!errorCode) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[errorCode] ?? "Something went wrong. Please try again.";
}
