import { describe, expect, it } from "vitest";
import { hashDeliveryPin, matchesDeliveryPin } from "./db";

describe("delivery PIN security", () => {
  it("stores a deterministic SHA-256 digest rather than the raw PIN", () => {
    const hash = hashDeliveryPin("4821");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("4821");
  });

  it("matches the correct PIN and rejects an incorrect one", () => {
    const hash = hashDeliveryPin("4821");
    expect(matchesDeliveryPin("4821", hash)).toBe(true);
    expect(matchesDeliveryPin("4822", hash)).toBe(false);
  });

  it("rejects malformed stored hashes safely", () => {
    expect(matchesDeliveryPin("4821", "not-a-hash")).toBe(false);
  });
});
