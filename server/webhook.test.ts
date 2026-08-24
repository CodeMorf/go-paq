import { describe, expect, it } from "vitest";
import { signWebhook, verifyWebhook } from "./webhook";

describe("webhook signatures", () => {
  it("verifies signed payloads and rejects tampering or replay", () => {
    const payload = JSON.stringify({ type: "shipment.updated", id: "shp_123" });
    const secret = "test-secret";
    const timestamp = 1_800_000_000_000;
    const signature = signWebhook(payload, secret, timestamp);
    expect(verifyWebhook(payload, signature, secret, timestamp)).toBe(true);
    expect(verifyWebhook(`${payload}!`, signature, secret, timestamp)).toBe(false);
    expect(verifyWebhook(payload, signature, secret, timestamp + 6 * 60 * 1000)).toBe(false);
  });

  it("rejects malformed signatures safely", () => {
    const payload = JSON.stringify({ type: "shipment.updated", id: "shp_123" });
    expect(verifyWebhook(payload, "t=1700000000000,v1=not-hex", "test-secret", 1700000000000)).toBe(false);
    expect(verifyWebhook(payload, "v1=", "test-secret", 1700000000000)).toBe(false);
  });
});
