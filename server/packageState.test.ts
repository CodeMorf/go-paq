import { describe, expect, it } from "vitest";
import { canTransitionPackage, transitionPackage } from "./packageState";

describe("package state machine", () => {
  it("allows the operational receiving and warehouse lifecycle", () => {
    expect(transitionPackage("expected", "received")).toBe("received");
    expect(transitionPackage("received", "inspected")).toBe("inspected");
    expect(transitionPackage("inspected", "stored")).toBe("stored");
    expect(transitionPackage("stored", "dispatched")).toBe("dispatched");
    expect(transitionPackage("dispatched", "delivered")).toBe("delivered");
  });

  it("rejects skipped transitions and terminal package changes", () => {
    expect(canTransitionPackage("expected", "stored")).toBe(false);
    expect(() => transitionPackage("expected", "stored")).toThrow("Transición de paquete no permitida");
    expect(() => transitionPackage("delivered", "stored")).toThrow("Transición de paquete no permitida");
  });
});
