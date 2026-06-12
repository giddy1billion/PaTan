type SecurityEmailCategory =
  | "email-verification"
  | "mfa"
  | "security-alert"
  | "password-reset"
  | "generic";

type SecurityEmailTemplateInput = {
  category: SecurityEmailCategory;
  subject: string;
  text?: string;
  html?: string;
  metadata?: Record<string, unknown>;
};

type SecurityEmailTemplateOutput = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function asString(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asStringList(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function fallbackTemplate(input: SecurityEmailTemplateInput): SecurityEmailTemplateOutput {
  const safeText = input.text?.trim() || "Security update for your PaTan account.";
  const escapedText = escapeHtml(safeText);

  return {
    subject: input.subject,
    text: safeText,
    html: `<div style=\"font-family:Inter,Segoe UI,Arial,sans-serif;color:#0D2B45;line-height:1.6;\"><p>${escapedText}</p></div>`,
  };
}

function buildEmailVerificationTemplate(input: SecurityEmailTemplateInput): SecurityEmailTemplateOutput {
  const verifyUrl = asString(input.metadata, "verifyUrl");
  const expiresAt = asString(input.metadata, "expiresAt");

  if (!verifyUrl || !expiresAt) {
    return fallbackTemplate(input);
  }

  const safeVerifyUrl = escapeHtml(verifyUrl);
  const safeExpiresAt = escapeHtml(expiresAt);

  const text = [
    "Confirm your PaTan email address.",
    "",
    `Open this secure link: ${verifyUrl}`,
    `This link expires at ${expiresAt}.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#0D2B45;background:#F8FAFC;padding:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px;background:#0D2B45;color:#F8FAFC;">
            <h1 style="margin:0;font-size:24px;line-height:1.3;font-family:Merriweather,Georgia,serif;">Confirm your email</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px 0;">Protect your PaTan account by confirming this email address before enabling high-risk MFA.</p>
            <p style="margin:0 0 20px 0;">
              <a href="${safeVerifyUrl}" style="display:inline-block;background:#0D2B45;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Verify my email</a>
            </p>
            <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">Or copy and paste this URL into your browser:</p>
            <p style="margin:0 0 16px 0;font-size:14px;word-break:break-word;"><a href="${safeVerifyUrl}">${safeVerifyUrl}</a></p>
            <p style="margin:0;font-size:13px;color:#64748B;">This link expires at ${safeExpiresAt}.</p>
            <p style="margin:8px 0 0 0;font-size:13px;color:#64748B;">If you did not request this, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: input.subject,
    text,
    html,
  };
}

function buildMfaTemplate(input: SecurityEmailTemplateInput): SecurityEmailTemplateOutput {
  const code = asString(input.metadata, "code");
  const expiresAt = asString(input.metadata, "expiresAt");
  const riskScore = asNumber(input.metadata, "riskScore");
  const riskReasons = asStringList(input.metadata, "riskReasons");

  if (!code || !expiresAt) {
    return fallbackTemplate(input);
  }

  const safeCode = escapeHtml(code);
  const safeExpiresAt = escapeHtml(expiresAt);
  const safeRiskReasons = riskReasons.map((reason) => escapeHtml(reason));

  const riskSummary =
    typeof riskScore === "number"
      ? `Risk score: ${riskScore}${riskReasons.length ? ` (${riskReasons.join(", ")})` : ""}`
      : null;

  const text = [
    "Your PaTan verification code",
    "",
    `Code: ${code}`,
    `Expires at: ${expiresAt}`,
    riskSummary,
    "If this was not you, reset your password immediately.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#0D2B45;background:#F8FAFC;padding:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px;background:#0D2B45;color:#F8FAFC;">
            <h1 style="margin:0;font-size:24px;line-height:1.3;font-family:Merriweather,Georgia,serif;">Verification code</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px 0;">Use this one-time code to complete your sign-in:</p>
            <p style="margin:0 0 16px 0;font-size:30px;letter-spacing:4px;font-weight:700;color:#0D2B45;">${safeCode}</p>
            <p style="margin:0 0 8px 0;font-size:13px;color:#64748B;">Expires at ${safeExpiresAt}.</p>
            ${
              typeof riskScore === "number"
                ? `<p style="margin:0 0 8px 0;font-size:13px;color:#64748B;">Risk score: ${riskScore}</p>`
                : ""
            }
            ${
              safeRiskReasons.length > 0
                ? `<p style="margin:0;font-size:13px;color:#64748B;">Detected signals: ${safeRiskReasons.join(", ")}.</p>`
                : ""
            }
            <p style="margin:12px 0 0 0;font-size:13px;color:#64748B;">If you did not request this code, secure your account immediately.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: input.subject,
    text,
    html,
  };
}

function buildPasswordResetTemplate(input: SecurityEmailTemplateInput): SecurityEmailTemplateOutput {
  const resetUrl = asString(input.metadata, "resetUrl");
  const expiresAt = asString(input.metadata, "expiresAt");

  if (!resetUrl || !expiresAt) {
    return fallbackTemplate(input);
  }

  const safeResetUrl = escapeHtml(resetUrl);
  const safeExpiresAt = escapeHtml(expiresAt);

  const text = [
    "Reset your PaTan password.",
    "",
    `Open this secure link: ${resetUrl}`,
    `This link expires at ${expiresAt}.`,
    "If you did not request a reset, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#0D2B45;background:#F8FAFC;padding:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px;background:#0D2B45;color:#F8FAFC;">
            <h1 style="margin:0;font-size:24px;line-height:1.3;font-family:Merriweather,Georgia,serif;">Reset your password</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px 0;">Use this secure link to choose a new PaTan password:</p>
            <p style="margin:0 0 20px 0;">
              <a href="${safeResetUrl}" style="display:inline-block;background:#0D2B45;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Reset my password</a>
            </p>
            <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">Or copy and paste this URL into your browser:</p>
            <p style="margin:0 0 16px 0;font-size:14px;word-break:break-word;"><a href="${safeResetUrl}">${safeResetUrl}</a></p>
            <p style="margin:0;font-size:13px;color:#64748B;">This link expires at ${safeExpiresAt}.</p>
            <p style="margin:8px 0 0 0;font-size:13px;color:#64748B;">If you did not request this, no further action is required.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: input.subject,
    text,
    html,
  };
}

export function buildSecurityEmailTemplate(
  input: SecurityEmailTemplateInput,
): SecurityEmailTemplateOutput {
  if (input.html?.trim() && input.text?.trim()) {
    return {
      subject: input.subject,
      text: input.text.trim(),
      html: input.html.trim(),
    };
  }

  if (input.category === "email-verification") {
    return buildEmailVerificationTemplate(input);
  }

  if (input.category === "mfa") {
    return buildMfaTemplate(input);
  }

  if (input.category === "password-reset") {
    return buildPasswordResetTemplate(input);
  }

  return fallbackTemplate(input);
}
