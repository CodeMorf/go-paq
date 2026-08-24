import { describe, expect, it } from "vitest";
import { deliverWebhook, signWebhook, verifyWebhook } from "./webhook";

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

  it("delivers an HTTPS JSON payload with an HMAC signature", async () => {
    let request: RequestInit | undefined;
    const response = await deliverWebhook("https://hooks.example.test/gopaq", "test-secret", "shipment.cancelled", { trackingCode: "GPQ-123" }, async (_url, init) => { request = init; return new Response(null, { status: 202 }); });
    expect(response).toEqual({ ok: true, status: 202 });
    expect(request?.method).toBe("POST");
    expect(request?.headers).toMatchObject({ "x-gopaq-event": "shipment.cancelled", "content-type": "application/json" });
    expect(String(request?.body)).toContain("shipment.cancelled");
    await expect(deliverWebhook("http://hooks.example.test/gopaq", "test-secret", "shipment.cancelled", {})).rejects.toThrow("HTTPS");
  });
});
