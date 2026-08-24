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
const createPickupForUser = vi.fn();
const createRouteForUser = vi.fn();
const assignRouteForUser = vi.fn();
const listPackagesForUser = vi.fn();
const createPackageForUser = vi.fn();
const updatePackageForUser = vi.fn();
const listInventoryMovementsForUser = vi.fn();
const recordInventoryMovementForUser = vi.fn();
const listConsolidationsForUser = vi.fn();
const createConsolidationForUser = vi.fn();
const addPackageToConsolidationForUser = vi.fn();
const advanceConsolidationForUser = vi.fn();
const listIncidentsForUser = vi.fn();
const createIncidentForUser = vi.fn();
const resolveIncidentForUser = vi.fn();
const listDeliveryAttemptsForUser = vi.fn();
const recordDeliveryAttemptForUser = vi.fn();
const listPaymentsForUser = vi.fn();
const collectPaymentForUser = vi.fn();
const listCashSessionsForUser = vi.fn();
const openCashSessionForUser = vi.fn();
const closeCashSessionForUser = vi.fn();
const listInvoicesForUser = vi.fn();
const issueInvoiceForUser = vi.fn();
const listShipmentServicesForUser = vi.fn();
const createShipmentServiceForUser = vi.fn();
const updateShipmentServiceForUser = vi.fn();

vi.mock("./db", async (importOriginal) => ({ ...(await importOriginal<typeof import("./db")>()), getOrganizationForUser, canUser, listTrackingPointsForUser, recordTrackingPoint, appendAuditLog, listAuditLogsForUser, listShipmentsForUser, listEventsForUser, appendShipmentEvent, uploadShipmentDocumentForUser, confirmShipmentDeliveryForUser, createPickupForUser, createRouteForUser, assignRouteForUser, listPackagesForUser, createPackageForUser, updatePackageForUser, listInventoryMovementsForUser, recordInventoryMovementForUser, listConsolidationsForUser, createConsolidationForUser, addPackageToConsolidationForUser, advanceConsolidationForUser, listIncidentsForUser, createIncidentForUser, resolveIncidentForUser, listDeliveryAttemptsForUser, recordDeliveryAttemptForUser, listPaymentsForUser, collectPaymentForUser, listCashSessionsForUser, openCashSessionForUser, closeCashSessionForUser, listInvoicesForUser, issueInvoiceForUser, listShipmentServicesForUser, createShipmentServiceForUser, updateShipmentServiceForUser }));
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

  it("rejects route assignment without routes:assign", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); assignRouteForUser.mockClear(); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).routes.assign({ routeId: 4, driverUserId: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(assignRouteForUser).not.toHaveBeenCalled(); expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized route creation", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createRouteForUser.mockResolvedValue({ id: 4, code: "RUT-REAL", branchId: 2 }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).routes.create({ branchId: 2, vehicleLabel: "Van 01" });
    expect(result.code).toBe("RUT-REAL"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "route.created", resourceId: "4" }));
  });

  it("rejects pickup when the persistence layer reports an out-of-tenant shipment", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createPickupForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).pickups.create({ shipmentId: 999, address: "Av. Independencia 100", contactName: "María Pérez" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects timeline event when the persistence layer reports an out-of-tenant shipment", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); appendShipmentEvent.mockResolvedValue(false); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).logistics.appendEvent({ shipmentId: 999, eventType: "scan", idempotencyKey: "tenant-event-1", origin: "operator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
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

  it("rejects package listing without packages:view", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(false); listPackagesForUser.mockClear();
    await expect(appRouter.createCaller(context()).packages.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(listPackagesForUser).not.toHaveBeenCalled();
  });

  it("rejects package creation when its shipment belongs to another organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createPackageForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).packages.create({ shipmentId: 999, description: "Caja", weight: 2, weightUnit: "kg", dimensionUnit: "cm" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects an inventory movement when the package or warehouse is outside the organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); recordInventoryMovementForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).inventory.move({ packageId: 999, warehouseId: 888, movementType: "putaway", toLocation: "A-01-03" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized package movement", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); updatePackageForUser.mockResolvedValue({ id: 8, packageCode: "PKG-REAL", status: "stored", locationCode: "A-01-03" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).packages.update({ id: 8, status: "stored", locationCode: "A-01-03" });
    expect(result.status).toBe("stored");
    expect(updatePackageForUser).toHaveBeenCalledWith(9, 8, expect.objectContaining({ status: "stored", locationCode: "A-01-03" }));
    expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "package.updated", resourceId: "8" }));
  });

  it("audits consolidation creation and rejects packages outside its tenant", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createConsolidationForUser.mockResolvedValue({ id: 5, code: "CON-REAL", status: "open" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).consolidations.create({ fromBranchId: 2, toBranchId: 3 });
    expect(result.code).toBe("CON-REAL"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "consolidation.created", resourceId: "5" }));
    addPackageToConsolidationForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).consolidations.addPackage({ consolidationId: 5, packageId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("rejects an incident when its shipment is outside the active organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createIncidentForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).incidents.create({ shipmentId: 999, type: "return_requested", severity: "high", description: "Devolución solicitada por el cliente" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized return incident", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createIncidentForUser.mockResolvedValue({ id: 21, shipmentId: 12, type: "return_requested", status: "returned" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).incidents.create({ shipmentId: 12, type: "return_requested", severity: "high", description: "Cliente solicita devolución" });
    expect(result.status).toBe("returned"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.incident.created", resourceId: "21" }));
  });

  it("rejects a delivery attempt when its shipment or stop is outside the active organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); recordDeliveryAttemptForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).deliveryAttempts.create({ shipmentId: 999, routeStopId: 888, status: "failed", reason: "Destinatario ausente" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized failed delivery attempt", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); recordDeliveryAttemptForUser.mockResolvedValue({ id: 22, shipmentId: 12, attemptNumber: 1, status: "failed", reason: "Destinatario ausente" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).deliveryAttempts.create({ shipmentId: 12, status: "failed", reason: "Destinatario ausente" });
    expect(result.attemptNumber).toBe(1); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.delivery_attempt.recorded", resourceId: "22" }));
  });

  it("rejects a collection when the shipment is outside the active organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); collectPaymentForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).payments.collect({ shipmentId: 999, amount: "500.00", method: "cash", cashSessionId: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an authorized collection with receipt", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); collectPaymentForUser.mockResolvedValue({ payment: { id: 31, shipmentId: 12, amount: "500.00" }, receipt: { receiptNumber: "REC-REAL" } }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).payments.collect({ shipmentId: 12, amount: "500.00", method: "transfer", reference: "BANK-01" });
    expect(result.receipt.receiptNumber).toBe("REC-REAL"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "payment.collected", resourceId: "31" }));
  });

  it("rejects opening a cash session for an invalid branch", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); openCashSessionForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).cash.open({ branchId: 999, openingAmount: "1000.00" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits an issued invoice", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); issueInvoiceForUser.mockResolvedValue({ id: 41, invoiceNumber: "FAC-REAL", shipmentId: 12, total: "575.00", currency: "DOP" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).invoices.issue({ shipmentId: 12, subtotal: "500.00", tax: "75.00" });
    expect(result.invoiceNumber).toBe("FAC-REAL"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "invoice.issued", resourceId: "41" }));
  });

  it("rejects a special service when its shipment is outside the active organization", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createShipmentServiceForUser.mockResolvedValue(null); appendAuditLog.mockClear();
    await expect(appRouter.createCaller(context()).services.create({ shipmentId: 999, serviceType: "moving", handlingNotes: "Dos personas y vehículo especial" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("audits a special service request and status update", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); createShipmentServiceForUser.mockResolvedValue({ id: 51, shipmentId: 12, serviceType: "heavy_cargo", status: "requested", requiresSpecialVehicle: true }); appendAuditLog.mockClear();
    const created = await appRouter.createCaller(context()).services.create({ shipmentId: 12, serviceType: "heavy_cargo" });
    expect(created.requiresSpecialVehicle).toBe(true); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.service.created", resourceId: "51" }));
    updateShipmentServiceForUser.mockResolvedValue({ id: 51, status: "approved", shipmentId: 12 }); appendAuditLog.mockClear();
    const updated = await appRouter.createCaller(context()).services.update({ serviceId: 51, status: "approved" });
    expect(updated.status).toBe("approved"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "shipment.service.updated", resourceId: "51" }));
  });

  it("audits an authorized consolidation advance", async () => {
    getOrganizationForUser.mockResolvedValue({ organization: { id: 3 } }); canUser.mockResolvedValue(true); advanceConsolidationForUser.mockResolvedValue({ id: 5, status: "in_transit" }); appendAuditLog.mockClear();
    const result = await appRouter.createCaller(context()).consolidations.advance({ consolidationId: 5, nextStatus: "in_transit" });
    expect(result.status).toBe("in_transit"); expect(appendAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "consolidation.advanced", resourceId: "5" }));
  });
});
