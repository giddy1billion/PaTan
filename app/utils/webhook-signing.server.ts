import { createHmac } from "node:crypto";

type SignedWebhookHeadersInput = {
  body: string;
  secret: string;
  event: string;
  source: string;
  keyId?: string;
};

export function buildSignedWebhookHeaders(input: SignedWebhookHeadersInput) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadToSign = `${timestamp}.${input.body}`;

  const signature = createHmac("sha256", input.secret)
    .update(payloadToSign)
    .digest("hex");

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("X-PaTan-Webhook-Source", input.source);
  headers.set("X-PaTan-Webhook-Event", input.event);
  headers.set("X-PaTan-Webhook-Timestamp", timestamp);
  headers.set("X-PaTan-Webhook-Signature", `sha256=${signature}`);

  if (input.keyId) {
    headers.set("X-PaTan-Webhook-Key-Id", input.keyId);
  }

  return headers;
}
