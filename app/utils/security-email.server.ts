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

  console.info("[security-email]", {
    to: input.to,
    subject: template.subject,
    category: input.category,
    text: template.text,
    html: template.html,
    metadata: input.metadata ?? {},
  });

  return { sent: true, status: "sent", provider: "console" };
}
