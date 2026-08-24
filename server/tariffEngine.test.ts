import { describe, expect, it } from "vitest";
import { calculateQuote } from "./tariffEngine";

describe("calculateQuote", () => {
  it("uses volumetric weight when it is higher", () => {
    const quote = calculateQuote({ minAmount: 10, perKg: 5, perKm: 1, fuelSurchargePct: 10, actualWeightKg: 2, lengthCm: 50, widthCm: 40, heightCm: 30, distanceKm: 20 });
    expect(quote.volumetricWeightKg).toBe(12);
    expect(quote.billableWeightKg).toBe(12);
    expect(quote.total).toBe(88);
  });
});
