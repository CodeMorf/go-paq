import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function cryptoKey(key: string) { return createHash("sha256").update(key).digest(); }

export function encryptWebhookSecret(secret: string, key: string) {
  if (!key) throw new Error("Webhook encryption key is not configured");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cryptoKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}.${cipher.getAuthTag().toString("hex")}.${ciphertext.toString("hex")}`;
}

export function decryptWebhookSecret(value: string, key: string) {
  if (!key) throw new Error("Webhook encryption key is not configured");
  const [ivHex, tagHex, ciphertextHex] = value.split(".");
  if (!ivHex || !tagHex || !ciphertextHex) throw new Error("Invalid encrypted webhook secret");
  const decipher = createDecipheriv("aes-256-gcm", cryptoKey(key), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]).toString("utf8");
}

export function signWebhook(payload: string, secret: string, timestamp: number) {
  const signed = `${timestamp}.${payload}`;
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(signed).digest("hex")}`;
}

export function verifyWebhook(payload: string, signature: string, secret: string, now = Date.now(), toleranceMs = 5 * 60 * 1000) {
  const values = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2) as [string, string]));
  const timestamp = Number(values.t);
  const received = values.v1 ?? "";
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > toleranceMs || !/^[a-f0-9]{64}$/.test(received)) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function deliverWebhook(url: string, secret: string, eventType: string, body: unknown, fetchImpl: typeof fetch = fetch) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Webhook URL must use HTTPS");
  const payload = JSON.stringify({ type: eventType, data: body });
  const timestamp = Date.now();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "GoPaq-Webhooks/1.0", "x-gopaq-event": eventType, "x-gopaq-signature": signWebhook(payload, secret, timestamp) },
    body: payload,
    signal: AbortSignal.timeout(10000),
  });
  return { ok: response.ok, status: response.status };
}
