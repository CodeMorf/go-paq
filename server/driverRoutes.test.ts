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

describe("driver route contracts", () => {
  it("requires authentication to read assigned routes", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.routes.myAssigned()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to start or close a driver shift", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.routes.myStatus({ routeId: 1, nextStatus: "active" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
