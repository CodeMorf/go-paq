import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tariff catalog contracts", () => {
  it("requires an authenticated session for tariff catalog administration", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.tariffs.zones()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.tariffs.create({ name: "Nacional v1", serviceType: "national", currency: "DOP", minAmount: "100", perKg: "10", perKm: "2", fixedSurcharge: "0", fuelSurchargePct: "0", discountPct: "0", taxPct: "0", volumetricDivisor: "5000", version: 1, validFrom: new Date("2026-01-01T00:00:00.000Z") })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not calculate a public quote without a resolvable active organization", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.quote.preview({ organizationSlug: "__missing_public_org__", actualWeightKg: 2, lengthCm: 20, widthCm: 20, heightCm: 20, distanceKm: 10 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

