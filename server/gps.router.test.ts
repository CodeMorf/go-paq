import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getOrganizationForUser = vi.fn();
const canUser = vi.fn();
const listTrackingPointsForUser = vi.fn();
const recordTrackingPoint = vi.fn();
const appendAuditLog = vi.fn();
const listAuditLogsForUser = vi.fn();
const listShipmentsForUser = vi.fn();
const listEventsForUser = vi.fn();
const appendShipmentEvent = vi.fn();
const uploadShipmentDocumentForUser = vi.fn();
const confirmShipmentDeliveryForUser = vi.fn();

vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), getOrganizationForUser, canUser, listTrackingPointsForUser, recordTrackingPoint, appendAuditLog, listAuditLogsForUser, listShipmentsForUser, listEventsForUser, appendShipmentEvent, uploadShipmentDocumentForUser, confirmShipmentDeliveryForUser }));
const { appRouter } = await import("./routers");

function context(): TrpcContext { return { user: { id: 9, openId: "gps-user", email: "gps@example.com", name: "GPS User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("router authorization and audit", () => {
  it("rejects overview without shipments:view and avoids shipment lookup", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); listShipmentsForUser.mockClear();
    await expect(appRouter.createCaller(context()).logistics.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listShipmentsForUser).not.toHaveBeenCalled();
  });

  it("rejects audit writes without audit:create and does not persist", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).logistics.audit({ category: "security", action: "forbidden.test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects shipment and audit listing without permissions", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false);
    await expect(appRouter.createCaller(context()).logistics.shipments.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).audit.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listShipmentsForUser).not.toHaveBeenCalled(); expect(listAuditLogsForUser).not.toHaveBeenCalled();
  });

  it("rejects timeline and GPS reads without tracking:view and writes no audit", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).logistics.timeline({ shipmentId: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).gps.points({ routeId: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listEventsForUser).not.toHaveBeenCalled(); expect(listTrackingPointsForUser).not.toHaveBeenCalled(); expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects event and GPS writes without tracking:create and writes no audit", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); appendShipmentEvent.mockClear(); recordTrackingPoint.mockClear(); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).logistics.appendEvent({ shipmentId: 12, eventType: "scan", idempotencyKey: "idem-123456", origin: "operator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).gps.record({ routeId: 4, latitude: 18.4, longitude: -69.9, capturedAt: new Date(), source: "driver" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendShipmentEvent).not.toHaveBeenCalled(); expect(recordTrackingPoint).not.toHaveBeenCalled(); expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits authorized timeline, GPS reads and event/point writes", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); listEventsForUser.mockResolvedValue([]); listTrackingPointsForUser.mockResolvedValue([{ id: 1 }]); appendShipmentEvent.mockResolvedValue(undefined); recordTrackingPoint.mockResolvedValue({ success: true }); appendAuditLog.mockClear();
    await appRouter.createCaller(context()).logistics.timeline({ shipmentId: 12 });
    await appRouter.createCaller(context()).gps.points({ shipmentId: 12 });
    await appRouter.createCaller(context()).logistics.appendEvent({ shipmentId: 12, eventType: "scan", idempotencyKey: "idem-123456", origin: "operator" });
    await appRouter.createCaller(context()).gps.record({ shipmentId: 12, latitude: 18.4, longitude: -69.9, capturedAt: new Date(), source: "driver" });
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.event.appended", resourceId: "12" }));
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "tracking.point.recorded", resourceId: "12" }));
  });

  it("rejects private tracking without tracking:view", async () => { getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); await expect(appRouter.createCaller(context()).tracking.privateByShipment({ shipmentId: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" }); });

  it("rejects GPS when the persistence layer reports an out-of-tenant reference", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); recordTrackingPoint.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).gps.record({ shipmentId: 999, latitude: 18.4, longitude: -69.9, capturedAt: new Date(), source: "driver" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects delivery confirmation without tracking:create", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); confirmShipmentDeliveryForUser.mockClear(); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).logistics.confirmDelivery({ shipmentId: 12, recipientName: "María Pérez", idempotencyKey: "pod-no-perm-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(confirmShipmentDeliveryForUser).not.toHaveBeenCalled(); expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized delivery confirmation and preserves idempotency input", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); confirmShipmentDeliveryForUser.mockResolvedValue({ id: 12, physicalStatus: "delivered" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).logistics.confirmDelivery({ shipmentId: 12, recipientName: "María Pérez", note: "Recibido en recepción", idempotencyKey: "pod-ok-1234" });
    expect(result.physicalStatus).toBe("delivered");
    expect(confirmShipmentDeliveryForUser).toHaveBeenCalledWith(9, expect.objectContaining({ shipmentId: 12, idempotencyKey: "pod-ok-1234" }));
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.delivery.confirmed", resourceId: "12" }));
  });

  it("rejects document upload when the shipment is outside the active organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); uploadShipmentDocumentForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).documents.upload({ shipmentId: 999, documentType: "label", fileName: "label.pdf", mimeType: "application/pdf", dataBase64: "ZmFrZQ==" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });
});
