import { describe, expect, it } from "vitest";
import { buildTrackingAuditMetadata, trackingResourceId } from "./trackingAudit";

describe("tracking audit", () => {
  it("keeps the organization-safe filters and result count", () => {
    expect(buildTrackingAuditMetadata({ shipmentId: 42, routeId: 7 }, 3)).toEqual({ shipmentId: 42, routeId: 7, resultCount: 3 });
  });

  it("uses the most specific resource identifier available", () => {
    expect(trackingResourceId({ shipmentId: 42, routeId: 7 })).toBe("42");
    expect(trackingResourceId({ routeId: 7 })).toBe("7");
    expect(trackingResourceId({})).toBe("organization");
  });
});
