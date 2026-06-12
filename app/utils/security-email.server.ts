import { Resend } from "resend";
import { buildSecurityEmailTemplate } from "~/utils/security-email.templates";
import { buildSignedWebhookHeaders } from "~/utils/webhook-signing.server";

export type SecurityEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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
  provider: "resend" | "webhook" | "console";
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

export async function sendSecurityEmail(input: SecurityEmailInput): Promise<SecurityEmailResult> {
  const template = buildSecurityEmailTemplate({
    category: input.category,
    subject: input.subject,
    text: input.text,
    html: input.html,
    metadata: input.metadata,
  });

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
        return { sent: true, provider: "resend" };
      }
    } catch {
      // Continue to fallback providers when Resend is temporarily unavailable.
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
        return { sent: true, provider: "webhook" };
      }
    } catch {
      // Fall through to console logging when webhook delivery fails.
    }
  }

  console.info("[security-email]", {
    to: input.to,
    subject: template.subject,
    category: input.category,
    text: template.text,
    html: template.html,
    metadata: input.metadata ?? {},
  });

  return { sent: true, provider: "console" };
}
