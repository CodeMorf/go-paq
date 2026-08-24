import { describe, expect, it } from "vitest";
import { canTransition, transitionShipment } from "./shipmentState";

describe("shipment state machine", () => {
  it("allows the operational happy path and rejects skips", () => {
    expect(canTransition("commercial", "draft", "confirmed")).toBe(true);
    expect(transitionShipment("physical", "confirmed", "received")).toBe("received");
    expect(canTransition("transport", "received", "delivered")).toBe(false);
    expect(() => transitionShipment("incident", "open", "delivered")).toThrow("Transizione non consentita");
  });

  it("allows cancellation only before physical processing", () => {
    expect(transitionShipment("commercial", "draft", "cancelled")).toBe("cancelled");
    expect(transitionShipment("commercial", "quoted", "cancelled")).toBe("cancelled");
    expect(transitionShipment("commercial", "confirmed", "cancelled")).toBe("cancelled");
    expect(canTransition("commercial", "cancelled", "confirmed")).toBe(false);
    expect(canTransition("commercial", "closed", "cancelled")).toBe(false);
    expect(() => transitionShipment("commercial", "closed", "cancelled")).toThrow("Transizione non consentita");
  });
});
