import { describe, expect, it } from "vitest";
import { nextManifestStatus } from "./manifestState";

describe("manifest state machine", () => {
  it("advances through the operational lifecycle", () => {
    expect(nextManifestStatus("open", "sealed")).toBe("sealed");
    expect(nextManifestStatus("sealed", "in_transit")).toBe("in_transit");
    expect(nextManifestStatus("in_transit", "received")).toBe("received");
    expect(nextManifestStatus("received", "reconciled")).toBe("reconciled");
  });

  it("rejects skipped and terminal transitions", () => {
    expect(() => nextManifestStatus("open", "received")).toThrow("Transizione manifest non valida");
    expect(() => nextManifestStatus("reconciled", "sealed")).toThrow("Transizione manifest non valida");
  });
});
