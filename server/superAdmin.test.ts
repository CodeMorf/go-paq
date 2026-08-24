import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("super admin router", () => {
  it("rejects organization listing without authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as never);
    await expect(caller.superAdmin.organizations()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects organization status changes without authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as never);
    await expect(caller.superAdmin.updateOrganizationStatus({ organizationId: 1, status: "active" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects webhook delivery verification without authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as never);
    await expect(caller.webhooks.deliveries({ status: "delivered" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
