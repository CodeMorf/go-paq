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

describe("package separation and repackaging", () => {
  it("requires authentication before splitting packages", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.packages.split({ packageId: 1, children: [{ weight: 1 }, { weight: 1 }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication before repackaging packages", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.packages.repack({ packageId: 1, weight: 2, locationCode: "A-01-03" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
