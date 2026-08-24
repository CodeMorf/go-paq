import { describe, expect, it } from "vitest";
import { isAllowedPickupTransition } from "./db";

describe("pickup state transitions", () => {
  it("allows the operational pickup progression", () => {
    expect(isAllowedPickupTransition("requested", "assigned")).toBe(true);
    expect(isAllowedPickupTransition("assigned", "en_route")).toBe(true);
    expect(isAllowedPickupTransition("en_route", "collected")).toBe(true);
  });

  it("allows cancellation before collection and failure during route", () => {
    expect(isAllowedPickupTransition("requested", "cancelled")).toBe(true);
    expect(isAllowedPickupTransition("assigned", "cancelled")).toBe(true);
    expect(isAllowedPickupTransition("en_route", "failed")).toBe(true);
  });

  it("blocks invalid and terminal transitions", () => {
    expect(isAllowedPickupTransition("collected", "en_route")).toBe(false);
    expect(isAllowedPickupTransition("failed", "collected")).toBe(false);
    expect(isAllowedPickupTransition("cancelled", "assigned")).toBe(false);
  });
});
