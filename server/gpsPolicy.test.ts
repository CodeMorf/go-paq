import { describe, expect, it } from "vitest";
import { canDriverRecordGps } from "./db";

describe("driver GPS policy", () => {
  it("allows non-driver operational users when the route scope is valid elsewhere", () => {
    expect(canDriverRecordGps("manager", { routeId: 10, routeAssigned: false, routeActive: false, shipmentId: null, shipmentOnRoute: false })).toBe(true);
  });

  it("rejects a driver without an assigned active route", () => {
    expect(canDriverRecordGps("driver", { routeId: 10, routeAssigned: false, routeActive: true, shipmentId: null, shipmentOnRoute: true })).toBe(false);
    expect(canDriverRecordGps("driver", { routeId: 10, routeAssigned: true, routeActive: false, shipmentId: null, shipmentOnRoute: true })).toBe(false);
  });

  it("rejects a shipment that is not a stop on the driver's active route", () => {
    expect(canDriverRecordGps("driver", { routeId: 10, routeAssigned: true, routeActive: true, shipmentId: 99, shipmentOnRoute: false })).toBe(false);
  });

  it("allows a driver on their active route with an assigned shipment stop", () => {
    expect(canDriverRecordGps("driver", { routeId: 10, routeAssigned: true, routeActive: true, shipmentId: 99, shipmentOnRoute: true })).toBe(true);
  });
});
