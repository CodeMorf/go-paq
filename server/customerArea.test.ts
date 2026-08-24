import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("customer area contracts", () => {
  it("requires authentication for the customer profile", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.customer.profile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.updateProfile({ customerType: "individual", preferredLanguage: "es" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication for address book operations", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.customer.addresses.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.addresses.create({ label: "Casa", recipientName: "Cliente", addressLine1: "Calle 1", city: "Santo Domingo", province: "Distrito Nacional", country: "DO" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.addresses.update({ addressId: 1, isDefault: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication for authorized contacts", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.customer.contacts.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.contacts.create({ name: "Contacto" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.contacts.update({ contactId: 1, isActive: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication for support tickets", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.customer.tickets.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.tickets.create({ subject: "Consulta de envío", description: "Necesito confirmar el estado de mi envío.", category: "shipment", priority: "normal" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.customer.tickets.manage({ ticketId: 1, status: "resolved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
