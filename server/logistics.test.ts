import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tracking.publicByCode", () => {
  it("returns a protected not-found response for an unknown code", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.tracking.publicByCode({ code: "GPQ-240823-0184" });
    expect(result).toEqual({
      trackingCode: "GPQ-240823-0184",
      status: "not_found",
      message: "Inserisci un codice valido o accedi al tuo spazio cliente.",
    });
  });
});
