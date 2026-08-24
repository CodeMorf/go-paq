export type TariffInput = {
  minAmount: number;
  perKg: number;
  perKm: number;
  fixedSurcharge?: number;
  fuelSurchargePct: number;
  discountPct?: number;
  taxPct?: number;
  volumetricDivisor?: number;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  distanceKm: number;
};

const money = (value: number) => Number(value.toFixed(2));

export function calculateQuote(input: TariffInput) {
  const volumetricDivisor = input.volumetricDivisor && input.volumetricDivisor > 0 ? input.volumetricDivisor : 5000;
  const volumetricWeightKg = (input.lengthCm * input.widthCm * input.heightCm) / volumetricDivisor;
  const billableWeightKg = Math.max(input.actualWeightKg, volumetricWeightKg);
  const variableBase = billableWeightKg * input.perKg + input.distanceKm * input.perKm;
  const base = Math.max(input.minAmount, variableBase) + (input.fixedSurcharge ?? 0);
  const fuelSurcharge = base * (input.fuelSurchargePct / 100);
  const beforeDiscount = base + fuelSurcharge;
  const discount = beforeDiscount * ((input.discountPct ?? 0) / 100);
  const taxableSubtotal = Math.max(0, beforeDiscount - discount);
  const tax = taxableSubtotal * ((input.taxPct ?? 0) / 100);
  const total = taxableSubtotal + tax;
  return {
    volumetricWeightKg: money(volumetricWeightKg),
    billableWeightKg: money(billableWeightKg),
    base: money(base),
    fuelSurcharge: money(fuelSurcharge),
    discount: money(discount),
    subtotal: money(taxableSubtotal),
    tax: money(tax),
    total: money(total),
  };
}

