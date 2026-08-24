import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrganizationForUser = vi.fn();
const canUser = vi.fn();
const updateOrganizationProfileForUser = vi.fn();
const appendAuditLog = vi.fn();

vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), getOrganizationForUser, canUser, updateOrganizationProfileForUser, appendAuditLog }));
const { appRouter } = await import("./routers");

const context = () => ({ user: { id: 7, role: "user", name: "Operador", email: "operator@example.com", openId: "profile-test", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {}, res: {} } as never);

describe("organization.updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrganizationForUser.mockResolvedValue({ organization: { id: 42 } });
    canUser.mockResolvedValue(true);
    updateOrganizationProfileForUser.mockResolvedValue({ success: true });
  });

  it("persists regional settings in the active tenant and audits the mutation", async () => {
    const input = { country: "DO", language: "es", currency: "DOP", timezone: "America/Santo_Domingo", activeServices: ["national", "international"] };
    await appRouter.createCaller(context()).organization.updateProfile(input);
    expect(canUser).toHaveBeenCalledWith(7, 42, "organization", "configure");
    expect(updateOrganizationProfileForUser).toHaveBeenCalledWith(7, input);
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 42, actorUserId: 7, action: "organization.profile.updated", metadata: input }));
  });

  it("rejects the mutation before persistence when configuration permission is missing", async () => {
    canUser.mockResolvedValueOnce(false);
    await expect(appRouter.createCaller(context()).organization.updateProfile({ country: "DO", language: "es", currency: "DOP", timezone: "America/Santo_Domingo", activeServices: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(updateOrganizationProfileForUser).not.toHaveBeenCalled();
    expect(appendAuditLog).not.toHaveBeenCalled();
  });
});
