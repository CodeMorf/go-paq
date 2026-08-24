import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function hashApiSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function issueApiKey(prefix = "gpq_live_") {
  const secret = `${prefix}${randomBytes(24).toString("hex")}`;
  return { secret, keyPrefix: secret.slice(0, 20), secretHash: hashApiSecret(secret) };
}

export function verifyApiKey(secret: string, expectedHash: string) {
  const actual = Buffer.from(hashApiSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
