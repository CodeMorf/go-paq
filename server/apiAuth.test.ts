import { describe, expect, it } from "vitest";
import { hasApiScope, isSupportedApiVersion, parseApiAuthorization } from "./apiAuth";

describe("api authorization", () => {
  it("parses bearer tokens and enforces scopes/version", () => {
    expect(parseApiAuthorization("Bearer gpq_live_1234567890")).toBe("gpq_live_1234567890");
    expect(parseApiAuthorization("Basic gpq_live_1234567890")).toBeNull();
    expect(hasApiScope(JSON.stringify(["shipments:read"]), "shipments:read")).toBe(true);
    expect(hasApiScope("not-json", "shipments:read")).toBe(false);
    expect(isSupportedApiVersion("2026-01")).toBe(true);
    expect(isSupportedApiVersion("2024-01")).toBe(false);
  });
});
