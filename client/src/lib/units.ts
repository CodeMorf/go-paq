export const weightUnits = {
  kg: { label: "Kilogramo (kg)", toKg: 1 },
  g: { label: "Gramo (g)", toKg: 0.001 },
  lb: { label: "Libra (lb)", toKg: 0.45359237 },
  oz: { label: "Onza (oz)", toKg: 0.0283495231 },
} as const;

export const dimensionUnits = {
  cm: { label: "Centímetros (cm)", toCm: 1 },
  in: { label: "Pulgadas (in)", toCm: 2.54 },
} as const;

export type WeightUnit = keyof typeof weightUnits;
export type DimensionUnit = keyof typeof dimensionUnits;

export function toKg(value: number, unit: WeightUnit) {
  return value * weightUnits[unit].toKg;
}

export function toCm(value: number, unit: DimensionUnit) {
  return value * dimensionUnits[unit].toCm;
}
