import { describe, expect, it } from "vitest";
import { resolveSpecialServiceRequirements } from "./specialServiceRules";

describe("reglas de servicios especiales", () => {
  it("asigna requisitos mínimos de mudanza", () => {
    expect(resolveSpecialServiceRequirements({ serviceType: "moving", vehicleType: "camión de mudanza" })).toEqual({ valid: true, requiresTwoPersonCrew: true, requiresSpecialVehicle: true, crewSize: 2, vehicleType: "camión de mudanza" });
  });

  it("rechaza mudanza sin cuadrilla mínima", () => {
    expect(resolveSpecialServiceRequirements({ serviceType: "moving", crewSize: 1, vehicleType: "camión" })).toEqual({ valid: false, reason: "invalid_crew_size" });
  });

  it("exige vehículo especial para carga pesada", () => {
    expect(resolveSpecialServiceRequirements({ serviceType: "heavy_cargo" })).toEqual({ valid: false, reason: "vehicle_required" });
    expect(resolveSpecialServiceRequirements({ serviceType: "heavy_cargo", vehicleType: "camión plataforma" })).toMatchObject({ valid: true, requiresTwoPersonCrew: false, requiresSpecialVehicle: true, crewSize: 1, vehicleType: "camión plataforma" });
  });

  it("mantiene compra asistida como servicio estándar", () => {
    expect(resolveSpecialServiceRequirements({ serviceType: "assisted_purchase" })).toEqual({ valid: true, requiresTwoPersonCrew: false, requiresSpecialVehicle: false, crewSize: 1, vehicleType: null });
  });
});
