import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("route expense contracts", () => {
  it("requires authentication to list expenses", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.routes.expenses()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to submit an expense", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.routes.expenseCreate({ routeId: 1, expenseType: "fuel", amount: "10.00", description: "Combustible" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication to review an expense", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.routes.expenseReview({ expenseId: 1, status: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
