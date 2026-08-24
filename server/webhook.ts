import { createHmac, timingSafeEqual } from "node:crypto";

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
