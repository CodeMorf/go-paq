export type TariffInput = {
  minAmount: number;
  perKg: number;
  perKm: number;
  fuelSurchargePct: number;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  distanceKm: number;
};

export function calculateQuote(input: TariffInput) {
  const volumetricWeightKg = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
  const billableWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);
  const base = Math.max(input.minAmount, billableWeightKg * input.perKg + input.distanceKm * input.perKm);
  const fuelSurcharge = base * (input.fuelSurchargePct / 100);
  return { volumetricWeightKg: Number(volumetricWeightKg.toFixed(2)), billableWeightKg: Number(billableWeightKg.toFixed(2)), base: Number(base.toFixed(2)), fuelSurcharge: Number(fuelSurcharge.toFixed(2)), total: Number((base + fuelSurcharge).toFixed(2)) };
}
