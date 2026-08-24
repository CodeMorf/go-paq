import { describe, expect, it } from "vitest";
import { hashApiSecret, issueApiKey, verifyApiKey } from "./apiKeys";

describe("api key service", () => {
  it("returns a one-time secret and verifies only the matching hash", () => {
    const issued = issueApiKey();
    expect(issued.secret.startsWith("gpq_live_")).toBe(true);
    expect(verifyApiKey(issued.secret, issued.secretHash)).toBe(true);
    expect(verifyApiKey(`${issued.secret}x`, issued.secretHash)).toBe(false);
    expect(hashApiSecret(issued.secret)).toBe(issued.secretHash);
  });
});
