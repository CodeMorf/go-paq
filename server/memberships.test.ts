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

describe("memberships", () => {
  it("rejects membership listing without an authenticated session", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.memberships.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects scope updates without an authenticated session", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.memberships.updateScope({ membershipId: 1, branchId: null, warehouseId: null })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
