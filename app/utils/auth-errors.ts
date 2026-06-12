const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "missing-credentials": "Enter both your email and password to continue.",
  "invalid-credentials": "That email and password combination did not match our records.",
  "invalid-signup": "Review your signup details and try again.",
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
