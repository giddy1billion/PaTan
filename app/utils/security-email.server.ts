import { Resend } from "resend";
import { buildSecurityEmailTemplate } from "~/utils/security-email.templates";
import { buildSignedWebhookHeaders } from "~/utils/webhook-signing.server";

export type SecurityEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  requireDelivery?: boolean;
  category:
    | "email-verification"
    | "mfa"
    | "security-alert"
    | "password-reset"
    | "generic";
  metadata?: Record<string, unknown>;
};

export type SecurityEmailResult = {
  sent: boolean;
  status: "sent" | "failed";
  provider: "resend" | "webhook" | "console" | "none";
  failureReason?:
    | "resend-unavailable"
    | "resend-rejected"
    | "webhook-unavailable"
    | "webhook-failed"
    | "delivery-unavailable";
};

const DEFAULT_FROM_EMAIL = "PaTan Security <security@notifications.patan.app>";

function getFromEmail() {
  const configured = process.env.AUTH_EMAIL_FROM?.trim();
  return configured || DEFAULT_FROM_EMAIL;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function shouldUseWebhookFallback() {
  return process.env.AUTH_EMAIL_WEBHOOK_URL?.trim() ? true : false;
}

export function getSecurityEmailServiceStatus() {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const webhookConfigured = Boolean(process.env.AUTH_EMAIL_WEBHOOK_URL?.trim());

  return {
    resendConfigured,
    webhookConfigured,
    deliveryReady: resendConfigured || webhookConfigured,
  };
}

export async function sendSecurityEmail(input: SecurityEmailInput): Promise<SecurityEmailResult> {
  const template = buildSecurityEmailTemplate({
    category: input.category,
    subject: input.subject,
    text: input.text,
    html: input.html,
    metadata: input.metadata,
  });

  let failureReason: SecurityEmailResult["failureReason"];

  const resend = getResendClient();
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: getFromEmail(),
        to: [input.to],
        subject: template.subject,
        text: template.text,
        html: template.html,
        tags: [
          {
            name: "category",
            value: input.category,
          },
        ],
      });

      if (!response.error) {
        return { sent: true, status: "sent", provider: "resend" };
      }

      failureReason = "resend-rejected";
    } catch {
      // Continue to fallback providers when Resend is temporarily unavailable.
      failureReason = "resend-unavailable";
    }
  }

  const webhookUrl = process.env.AUTH_EMAIL_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.AUTH_EMAIL_WEBHOOK_SECRET?.trim();
  const webhookKeyId = process.env.AUTH_EMAIL_WEBHOOK_KEY_ID?.trim();

  if (webhookUrl && shouldUseWebhookFallback()) {
    const payload = JSON.stringify({
      to: input.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      category: input.category,
      metadata: input.metadata ?? {},
    });

    try {
      const headers = webhookSecret
        ? buildSignedWebhookHeaders({
            body: payload,
            secret: webhookSecret,
            event: input.category,
            source: "security-email",
            keyId: webhookKeyId,
          })
        : new Headers({
            "Content-Type": "application/json",
            "X-PaTan-Webhook-Source": "security-email",
            "X-PaTan-Webhook-Event": input.category,
          });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: payload,
      });

      if (response.ok) {
        return { sent: true, status: "sent", provider: "webhook" };
      }

      failureReason = "webhook-failed";
    } catch {
      // Fall through to console logging when webhook delivery fails.
      failureReason = "webhook-failed";
    }
  } else {
    failureReason = failureReason ?? "webhook-unavailable";
  }

  if (input.requireDelivery) {
    return {
      sent: false,
      status: "failed",
      provider: "none",
      failureReason: failureReason ?? "delivery-unavailable",
    };
  }

  // Redact sensitive information from metadata before logging
  const redactedMetadata = input.metadata ? redactSensitiveMetadata(input.metadata) : {};

  console.info("[security-email]", {
    to: input.to,
    subject: template.subject,
    category: input.category,
    text: template.text,
    html: template.html,
    metadata: redactedMetadata,
  });

  return { sent: true, status: "sent", provider: "console" };
}

/**
 * Redacts sensitive information from metadata before logging
 * Prevents tokens, codes, URLs with secrets from appearing in logs
 */
export function redactSensitiveMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    
    // Redact fields that commonly contain secrets
    if (
      lowerKey.includes("token") ||
      lowerKey.includes("code") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("password") ||
      lowerKey.includes("key") ||
      lowerKey.includes("auth")
    ) {
      redacted[key] = "[REDACTED]";
      continue;
    }
    
    // Redact URLs that might contain tokens
    if (typeof value === "string" && 
        (lowerKey.includes("url") || lowerKey.includes("link")) &&
        (value.includes("token=") || value.includes("code=") || value.includes("secret="))) {
      redacted[key] = "[REDACTED_URL]";
      continue;
    }
    
    // Recursively redact nested objects
    if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveMetadata(value as Record<string, unknown>);
      continue;
    }
    
    redacted[key] = value;
  }
  
  return redacted;
}
