import { describe, expect, it } from "vitest";
import { calculateQuote } from "./tariffEngine";

describe("calculateQuote", () => {
  it("uses volumetric weight when it is higher", () => {
    const quote = calculateQuote({ minAmount: 10, perKg: 5, perKm: 1, fuelSurchargePct: 10, actualWeightKg: 2, lengthCm: 50, widthCm: 40, heightCm: 30, distanceKm: 20 });
    expect(quote.volumetricWeightKg).toBe(12);
    expect(quote.billableWeightKg).toBe(12);
    expect(quote.total).toBe(88);
  });

  it("respects the configured volumetric divisor and minimum amount", () => {
    const quote = calculateQuote({ minAmount: 50, perKg: 2, perKm: 0, fuelSurchargePct: 0, volumetricDivisor: 4000, actualWeightKg: 1, lengthCm: 40, widthCm: 20, heightCm: 20, distanceKm: 0 });
    expect(quote.volumetricWeightKg).toBe(4);
    expect(quote.billableWeightKg).toBe(4);
    expect(quote.base).toBe(50);
    expect(quote.total).toBe(50);
  });

  it("applies fixed surcharge, discount and tax in the declared order", () => {
    const quote = calculateQuote({ minAmount: 100, perKg: 10, perKm: 0, fixedSurcharge: 20, fuelSurchargePct: 10, discountPct: 10, taxPct: 18, actualWeightKg: 5, lengthCm: 10, widthCm: 10, heightCm: 10, distanceKm: 0 });
    expect(quote.base).toBe(120);
    expect(quote.fuelSurcharge).toBe(12);
    expect(quote.discount).toBe(13.2);
    expect(quote.subtotal).toBe(118.8);
    expect(quote.tax).toBe(21.38);
    expect(quote.total).toBe(140.18);
  });
});
