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
  provider: "webhook" | "console";
};

export async function sendSecurityEmail(input: SecurityEmailInput): Promise<SecurityEmailResult> {
  const webhookUrl = process.env.AUTH_EMAIL_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.AUTH_EMAIL_WEBHOOK_SECRET?.trim();
  const webhookKeyId = process.env.AUTH_EMAIL_WEBHOOK_KEY_ID?.trim();

  if (webhookUrl) {
    const payload = JSON.stringify({
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
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
    subject: input.subject,
    category: input.category,
    text: input.text,
    metadata: input.metadata ?? {},
  });

  return { sent: true, provider: "console" };
}
