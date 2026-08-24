export const DEFAULT_DOP_TARIFF = {
  currency: "DOP",
  minAmount: 450,
  perKg: 180,
  perKm: 12,
  fixedSurcharge: 0,
  fuelSurchargePct: 8,
  discountPct: 0,
  taxPct: 0,
  volumetricDivisor: 5000,
} as const;

export type PublicQuoteInput = {
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  distanceKm: number;
};

export function buildDopTariffInput(input: PublicQuoteInput) {
  return { ...DEFAULT_DOP_TARIFF, ...input };
}

