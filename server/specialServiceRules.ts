export type SpecialServiceType = "assisted_purchase" | "heavy_cargo" | "moving";

export type SpecialServiceRequirements = {
  valid: true;
  requiresTwoPersonCrew: boolean;
  requiresSpecialVehicle: boolean;
  crewSize: number;
  vehicleType: string | null;
} | {
  valid: false;
  reason: "invalid_crew_size" | "vehicle_required";
};

export function resolveSpecialServiceRequirements(input: { serviceType: SpecialServiceType; crewSize?: number; vehicleType?: string }): SpecialServiceRequirements {
  const requiresTwoPersonCrew = input.serviceType === "moving";
  const requiresSpecialVehicle = requiresTwoPersonCrew || input.serviceType === "heavy_cargo";
  const crewSize = input.crewSize ?? (requiresTwoPersonCrew ? 2 : 1);
  const vehicleType = input.vehicleType?.trim() || null;
  if (!Number.isInteger(crewSize) || crewSize < (requiresTwoPersonCrew ? 2 : 1)) return { valid: false, reason: "invalid_crew_size" };
  if (requiresSpecialVehicle && !vehicleType) return { valid: false, reason: "vehicle_required" };
  return { valid: true, requiresTwoPersonCrew, requiresSpecialVehicle, crewSize, vehicleType };
}
