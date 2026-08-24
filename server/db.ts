import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { resolveSpecialServiceRequirements } from "./specialServiceRules";
import { InsertUser, apiKeys, auditLogs, branches, cashMovements, cashSessions, consolidationItems, consolidations, deliveryAttempts, inventoryMovements, invoices, manifests, memberships, organizations, packages, payments, pickups, receipts, rolePermissions, routeStops, routes, shipmentDocuments, shipmentEvents, shipmentIncidents, shipmentServices, shipments, tariffs, trackingPoints, users, warehouses } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { issueApiKey, verifyApiKey } from "./apiKeys";
import { storagePut } from "./storage";
import { nextManifestStatus } from "./manifestState";
import { transitionShipment } from "./shipmentState";
import { transitionPackage, type PackageState } from "./packageState";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOrganizationForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ organization: organizations, membership: memberships }).from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(eq(memberships.userId, userId)).limit(1);
  return result[0];
}

export async function canUser(userId: number, organizationId: number, resource: string, action: "view" | "create" | "edit" | "approve" | "assign" | "collect" | "refund" | "export" | "configure") {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId))).limit(1);
  if (!result[0]) return false;
  if (result[0].role === "owner" || result[0].role === "manager") return true;
  const permissions = await db.select().from(rolePermissions).where(and(eq(rolePermissions.organizationId, organizationId), eq(rolePermissions.role, result[0].role), eq(rolePermissions.resource, resource), eq(rolePermissions.action, action))).limit(1);
  return Boolean(permissions[0]);
}

export async function getActiveTariffForOrganization(organizationId: number, serviceType: string) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const rows = await db.select().from(tariffs).where(and(eq(tariffs.organizationId, organizationId), eq(tariffs.serviceType, serviceType), eq(tariffs.isActive, true), lte(tariffs.validFrom, now), or(isNull(tariffs.validUntil), gte(tariffs.validUntil, now)))).orderBy(desc(tariffs.version), desc(tariffs.validFrom)).limit(1);
  return rows[0] ?? null;
}

export async function getPublicTrackingByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const query = db.select({ trackingCode: shipments.trackingCode, serviceType: shipments.serviceType, physicalStatus: shipments.physicalStatus, transportStatus: shipments.transportStatus, originCountry: shipments.originCountry, destinationCountry: shipments.destinationCountry, updatedAt: shipments.updatedAt }).from(shipments).where(eq(shipments.trackingCode, code)).limit(1);
  const result = await Promise.race([query, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("tracking_timeout")), 750))]).catch(() => []);
  const shipment = result[0];
  if (!shipment) return null;
  return { ...shipment, message: shipment.physicalStatus === "delivered" ? "Envío entregado" : "Envío monitorizado por GoPaq" };
}

export async function shipmentBelongsToUser(userId: number, shipmentId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  return Boolean(rows[0]);
}

export async function routeBelongsToUser(userId: number, routeId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  return Boolean(rows[0]);
}

export async function updateOrganizationProfileForUser(userId: number, input: { country: string; language: string; currency: string; timezone: string; activeServices: string[] }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  await db.update(organizations).set(input).where(eq(organizations.id, scope.organization.id));
  return { success: true } as const;
}

type ShipmentInput = {
  branchId?: number;
  serviceType: "local" | "national" | "international" | "assisted_purchase" | "heavy_cargo" | "moving";
  senderName: string;
  recipientName: string;
  originAddress: string;
  destinationAddress: string;
  originCountry: string;
  destinationCountry: string;
  estimatedAmount?: string;
};

async function branchBelongsToOrganization(db: Awaited<ReturnType<typeof getDb>>, organizationId: number, branchId?: number) {
  if (!db || branchId === undefined) return branchId === undefined;
  const rows = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, branchId), eq(branches.organizationId, organizationId), eq(branches.isActive, true))).limit(1);
  return Boolean(rows[0]);
}

function newTrackingCode() {
  return `GPQ-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createShipmentForUser(userId: number, input: ShipmentInput) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  const trackingCode = newTrackingCode();
  await db.insert(shipments).values({ ...input, trackingCode, organizationId: scope.organization.id, createdBy: userId, currency: "DOP", estimatedAmount: input.estimatedAmount });
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, scope.organization.id), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ?? null;
}

export async function createShipmentForOrganization(organizationId: number, input: ShipmentInput) {
  const db = await getDb();
  if (!db || !(await branchBelongsToOrganization(db, organizationId, input.branchId))) return null;
  const trackingCode = newTrackingCode();
  await db.insert(shipments).values({ ...input, trackingCode, organizationId, createdBy: null, currency: "DOP", estimatedAmount: input.estimatedAmount });
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, organizationId), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ?? null;
}

export async function getShipmentByTrackingForOrganization(organizationId: number, trackingCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, organizationId), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ?? null;
}

export async function createPickupForOrganization(organizationId: number, input: Omit<typeof pickups.$inferInsert, "organizationId">) {
  const db = await getDb();
  if (!db) return null;
  if (input.shipmentId !== undefined && input.shipmentId !== null) {
    const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, organizationId))).limit(1);
    if (!shipment[0]) return null;
  }
  await db.insert(pickups).values({ ...input, organizationId });
  const rows = await db.select().from(pickups).where(eq(pickups.organizationId, organizationId)).orderBy(desc(pickups.id)).limit(1);
  return rows[0] ?? null;
}

export async function updateShipmentForUser(userId: number, shipmentId: number, input: Partial<Omit<ShipmentInput, "serviceType">> & { serviceType?: ShipmentInput["serviceType"] }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  const current = await db.select({ id: shipments.id, commercialStatus: shipments.commercialStatus }).from(shipments).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!current[0] || !["draft", "quoted"].includes(current[0].commercialStatus)) return null;
  await db.update(shipments).set(input).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id)));
  const rows = await db.select().from(shipments).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function confirmShipmentDeliveryForUser(userId: number, input: { shipmentId: number; recipientName: string; note?: string; evidenceUrl?: string; latitude?: string; longitude?: string; idempotencyKey: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  const existingEvent = await db.select({ id: shipmentEvents.id }).from(shipmentEvents).where(and(eq(shipmentEvents.organizationId, scope.organization.id), eq(shipmentEvents.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existingEvent[0]) return current[0];
  transitionShipment("transport", current[0].physicalStatus, "delivered");
  const eventNote = [input.recipientName ? `Recibido por: ${input.recipientName}` : "", input.note ?? ""].filter(Boolean).join(" · ");
  await db.transaction(async (tx) => {
    await tx.update(shipments).set({ physicalStatus: "delivered", transportStatus: "completed" }).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id)));
    await tx.insert(shipmentEvents).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, actorUserId: userId, eventType: "delivery_confirmed", previousStatus: current[0].physicalStatus, nextStatus: "delivered", note: eventNote, evidenceUrl: input.evidenceUrl, latitude: input.latitude, longitude: input.longitude, idempotencyKey: input.idempotencyKey, origin: "driver" });
  });
  const rows = await db.select().from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listShipmentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId);
  const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipments).where(eq(shipments.organizationId, scope.organization.id)).orderBy(desc(shipments.createdAt)).limit(100);
}

type PackageInput = {
  shipmentId: number;
  packageCode?: string;
  description?: string;
  restrictions?: string;
  weight?: number;
  weightUnit?: "kg" | "g" | "lb" | "oz";
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: "cm" | "in";
  declaredValue?: string;
  locationCode?: string;
  barcodeValue?: string;
};

type PackageUpdate = Omit<PackageInput, "shipmentId" | "packageCode"> & { status?: PackageState };

function normalizeWeight(value?: number, unit: PackageInput["weightUnit"] = "kg") {
  if (value === undefined) return undefined;
  const factors = { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.028349523125 } as const;
  return (value * factors[unit]).toFixed(3);
}

function normalizeDimension(value?: number, unit: PackageInput["dimensionUnit"] = "cm") {
  if (value === undefined) return undefined;
  return (value * (unit === "in" ? 2.54 : 1)).toFixed(2);
}

export async function listPackagesForUser(userId: number, shipmentId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(packages.organizationId, scope.organization.id)];
  if (shipmentId !== undefined) filters.push(eq(packages.shipmentId, shipmentId));
  return db.select().from(packages).where(and(...filters)).orderBy(desc(packages.createdAt)).limit(200);
}

export async function createPackageForUser(userId: number, input: PackageInput) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  const packageCode = input.packageCode ?? `PKG-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  await db.insert(packages).values({ shipmentId: input.shipmentId, organizationId: scope.organization.id, packageCode, description: input.description ?? null, restrictions: input.restrictions ?? null, status: "expected", weightKg: normalizeWeight(input.weight, input.weightUnit), lengthCm: normalizeDimension(input.length, input.dimensionUnit), widthCm: normalizeDimension(input.width, input.dimensionUnit), heightCm: normalizeDimension(input.height, input.dimensionUnit), declaredValue: input.declaredValue ?? null, locationCode: input.locationCode ?? null, barcodeValue: input.barcodeValue ?? null });
  const rows = await db.select().from(packages).where(and(eq(packages.organizationId, scope.organization.id), eq(packages.packageCode, packageCode))).limit(1);
  return rows[0] ?? null;
}

export async function updatePackageForUser(userId: number, packageId: number, input: PackageUpdate) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(packages).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  const nextStatus = input.status ?? current[0].status;
  if (nextStatus !== current[0].status) transitionPackage(current[0].status, nextStatus);
  if (nextStatus === "stored" && !(input.locationCode || current[0].locationCode)) throw new Error("Un paquete almacenado requiere una ubicación");
  const changes = { description: input.description, restrictions: input.restrictions, status: input.status, weightKg: normalizeWeight(input.weight, input.weightUnit), lengthCm: normalizeDimension(input.length, input.dimensionUnit), widthCm: normalizeDimension(input.width, input.dimensionUnit), heightCm: normalizeDimension(input.height, input.dimensionUnit), declaredValue: input.declaredValue, locationCode: input.locationCode, barcodeValue: input.barcodeValue };
  await db.update(packages).set(Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined))).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id)));
  const rows = await db.select().from(packages).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

async function warehouseBelongsToOrganization(db: Awaited<ReturnType<typeof getDb>>, organizationId: number, warehouseId?: number) {
  if (!db || warehouseId === undefined) return warehouseId === undefined;
  const rows = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId), eq(warehouses.isActive, true))).limit(1);
  return Boolean(rows[0]);
}

type InventoryMovementInput = {
  packageId: number;
  warehouseId?: number;
  movementType: "received" | "inspected" | "putaway" | "transfer_out" | "transfer_in" | "dispatch" | "adjustment";
  fromLocation?: string;
  toLocation?: string;
  note?: string;
};

const movementTargetStatus: Partial<Record<InventoryMovementInput["movementType"], PackageState>> = { received: "received", inspected: "inspected", putaway: "stored", dispatch: "dispatched" };

export async function listInventoryMovementsForUser(userId: number, packageId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(inventoryMovements.organizationId, scope.organization.id)];
  if (packageId !== undefined) filters.push(eq(inventoryMovements.packageId, packageId));
  return db.select().from(inventoryMovements).where(and(...filters)).orderBy(desc(inventoryMovements.createdAt)).limit(250);
}

export async function recordInventoryMovementForUser(userId: number, input: InventoryMovementInput) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await warehouseBelongsToOrganization(db, scope.organization.id, input.warehouseId))) return null;
  const current = await db.select().from(packages).where(and(eq(packages.id, input.packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (input.movementType === "putaway" && !input.toLocation?.trim()) throw new Error("El ingreso al almacén requiere una ubicación destino");
  const targetStatus = movementTargetStatus[input.movementType];
  if (targetStatus && targetStatus !== current[0].status) transitionPackage(current[0].status, targetStatus);
  await db.transaction(async (tx) => {
    if (targetStatus && targetStatus !== current[0].status) await tx.update(packages).set({ status: targetStatus, locationCode: input.toLocation ?? current[0].locationCode }).where(and(eq(packages.id, input.packageId), eq(packages.organizationId, scope.organization.id)));
    else if (input.toLocation !== undefined) await tx.update(packages).set({ locationCode: input.toLocation }).where(and(eq(packages.id, input.packageId), eq(packages.organizationId, scope.organization.id)));
    await tx.insert(inventoryMovements).values({ organizationId: scope.organization.id, packageId: input.packageId, warehouseId: input.warehouseId ?? null, movementType: input.movementType, fromLocation: input.fromLocation ?? null, toLocation: input.toLocation ?? null, note: input.note ?? null, actorUserId: userId });
  });
  const rows = await db.select().from(inventoryMovements).where(and(eq(inventoryMovements.organizationId, scope.organization.id), eq(inventoryMovements.packageId, input.packageId))).orderBy(desc(inventoryMovements.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function listConsolidationsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(consolidations).where(eq(consolidations.organizationId, scope.organization.id)).orderBy(desc(consolidations.createdAt)).limit(100);
}

export async function createConsolidationForUser(userId: number, input: { fromBranchId?: number; toBranchId?: number }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.fromBranchId)) || !(await branchBelongsToOrganization(db, scope.organization.id, input.toBranchId))) return null;
  const code = `CON-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  await db.insert(consolidations).values({ organizationId: scope.organization.id, code, fromBranchId: input.fromBranchId ?? null, toBranchId: input.toBranchId ?? null, createdBy: userId });
  const rows = await db.select().from(consolidations).where(and(eq(consolidations.organizationId, scope.organization.id), eq(consolidations.code, code))).limit(1);
  return rows[0] ?? null;
}

export async function addPackageToConsolidationForUser(userId: number, consolidationId: number, packageId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const consolidation = await db.select({ id: consolidations.id, status: consolidations.status }).from(consolidations).where(and(eq(consolidations.id, consolidationId), eq(consolidations.organizationId, scope.organization.id))).limit(1);
  const pkg = await db.select({ id: packages.id, status: packages.status }).from(packages).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  if (!consolidation[0] || consolidation[0].status !== "open" || !pkg[0] || ["delivered", "returned"].includes(pkg[0].status)) return null;
  const existing = await db.select({ id: consolidationItems.id }).from(consolidationItems).where(and(eq(consolidationItems.organizationId, scope.organization.id), eq(consolidationItems.consolidationId, consolidationId), eq(consolidationItems.packageId, packageId))).limit(1);
  if (existing[0]) return existing[0];
  const latest = await db.select({ sequence: consolidationItems.sequence }).from(consolidationItems).where(and(eq(consolidationItems.organizationId, scope.organization.id), eq(consolidationItems.consolidationId, consolidationId))).orderBy(desc(consolidationItems.sequence)).limit(1);
  await db.insert(consolidationItems).values({ organizationId: scope.organization.id, consolidationId, packageId, sequence: (latest[0]?.sequence ?? 0) + 1 });
  const rows = await db.select().from(consolidationItems).where(and(eq(consolidationItems.organizationId, scope.organization.id), eq(consolidationItems.consolidationId, consolidationId), eq(consolidationItems.packageId, packageId))).limit(1);
  return rows[0] ?? null;
}

export async function advanceConsolidationForUser(userId: number, consolidationId: number, nextStatus: "sealed" | "in_transit" | "received" | "reconciled") {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(consolidations).where(and(eq(consolidations.id, consolidationId), eq(consolidations.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  nextManifestStatus(current[0].status, nextStatus);
  await db.update(consolidations).set({ status: nextStatus }).where(and(eq(consolidations.id, consolidationId), eq(consolidations.organizationId, scope.organization.id)));
  const rows = await db.select().from(consolidations).where(and(eq(consolidations.id, consolidationId), eq(consolidations.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

const incidentTransitions: Record<string, string[]> = { open: ["investigating", "resolved", "returned"], investigating: ["resolved", "returned"], resolved: [], returned: [] };

export async function listIncidentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipmentIncidents).where(eq(shipmentIncidents.organizationId, scope.organization.id)).orderBy(desc(shipmentIncidents.createdAt)).limit(200);
}

export async function createIncidentForUser(userId: number, input: { shipmentId: number; packageId?: number; type: "damage" | "address" | "recipient_unavailable" | "customs" | "other" | "return_requested"; severity: "low" | "medium" | "high" | "critical"; description: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  if (input.packageId) { const pkg = await db.select({ id: packages.id, shipmentId: packages.shipmentId }).from(packages).where(and(eq(packages.id, input.packageId), eq(packages.organizationId, scope.organization.id), eq(packages.shipmentId, input.shipmentId))).limit(1); if (!pkg[0]) return null; }
  const nextPhysicalStatus = input.type === "return_requested" ? "returned" : "incident";
  const nextIncidentStatus = input.type === "return_requested" ? "returned" : "open";
  await db.transaction(async (tx) => {
    await tx.insert(shipmentIncidents).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, packageId: input.packageId ?? null, type: input.type, severity: input.severity, status: nextIncidentStatus, description: input.description, reportedBy: userId });
    await tx.update(shipments).set({ physicalStatus: nextPhysicalStatus, incidentStatus: nextIncidentStatus }).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id)));
    if (input.packageId && input.type === "return_requested") await tx.update(packages).set({ status: "returned" }).where(and(eq(packages.id, input.packageId), eq(packages.organizationId, scope.organization.id)));
  });
  const rows = await db.select().from(shipmentIncidents).where(and(eq(shipmentIncidents.organizationId, scope.organization.id), eq(shipmentIncidents.shipmentId, input.shipmentId))).orderBy(desc(shipmentIncidents.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function resolveIncidentForUser(userId: number, incidentId: number, input: { status: "investigating" | "resolved" | "returned"; resolution?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(shipmentIncidents).where(and(eq(shipmentIncidents.id, incidentId), eq(shipmentIncidents.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (!incidentTransitions[current[0].status].includes(input.status)) throw new Error("Transición de incidencia no permitida");
  await db.transaction(async (tx) => {
    await tx.update(shipmentIncidents).set({ status: input.status, resolution: input.resolution }).where(and(eq(shipmentIncidents.id, incidentId), eq(shipmentIncidents.organizationId, scope.organization.id)));
    await tx.update(shipments).set({ physicalStatus: input.status === "returned" ? "returned" : current[0].status === "returned" ? "returned" : "incident", incidentStatus: input.status }).where(and(eq(shipments.id, current[0].shipmentId), eq(shipments.organizationId, scope.organization.id)));
    if (input.status === "returned" && current[0].packageId) await tx.update(packages).set({ status: "returned" }).where(and(eq(packages.id, current[0].packageId), eq(packages.organizationId, scope.organization.id)));
  });
  const rows = await db.select().from(shipmentIncidents).where(and(eq(shipmentIncidents.id, incidentId), eq(shipmentIncidents.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listDeliveryAttemptsForUser(userId: number, shipmentId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(deliveryAttempts.organizationId, scope.organization.id)];
  if (shipmentId !== undefined) filters.push(eq(deliveryAttempts.shipmentId, shipmentId));
  return db.select().from(deliveryAttempts).where(and(...filters)).orderBy(desc(deliveryAttempts.attemptedAt)).limit(200);
}

export async function recordDeliveryAttemptForUser(userId: number, input: { shipmentId: number; routeStopId?: number; status: "failed" | "rescheduled" | "completed"; reason: string; note?: string; latitude?: string; longitude?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  if (input.routeStopId) { const stop = await db.select({ id: routeStops.id, shipmentId: routeStops.shipmentId }).from(routeStops).where(and(eq(routeStops.id, input.routeStopId), eq(routeStops.organizationId, scope.organization.id), eq(routeStops.shipmentId, input.shipmentId))).limit(1); if (!stop[0]) return null; }
  const latest = await db.select({ attemptNumber: deliveryAttempts.attemptNumber }).from(deliveryAttempts).where(and(eq(deliveryAttempts.organizationId, scope.organization.id), eq(deliveryAttempts.shipmentId, input.shipmentId))).orderBy(desc(deliveryAttempts.attemptNumber)).limit(1);
  const attemptNumber = (latest[0]?.attemptNumber ?? 0) + 1;
  await db.transaction(async (tx) => {
    await tx.insert(deliveryAttempts).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, routeStopId: input.routeStopId ?? null, attemptNumber, status: input.status, reason: input.reason, note: input.note ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null, attemptedBy: userId });
    if (input.status === "failed") await tx.update(shipments).set({ physicalStatus: "incident", incidentStatus: "open" }).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id)));
    if (input.routeStopId && input.status === "completed") await tx.update(routeStops).set({ status: "completed" }).where(and(eq(routeStops.id, input.routeStopId), eq(routeStops.organizationId, scope.organization.id)));
  });
  const rows = await db.select().from(deliveryAttempts).where(and(eq(deliveryAttempts.organizationId, scope.organization.id), eq(deliveryAttempts.shipmentId, input.shipmentId))).orderBy(desc(deliveryAttempts.attemptedAt)).limit(1);
  return rows[0] ?? null;
}

const serviceTransitions: Record<string, string[]> = { requested: ["quoted", "cancelled"], quoted: ["approved", "cancelled"], approved: ["scheduled", "cancelled"], scheduled: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [] };

export async function listShipmentServicesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipmentServices).where(eq(shipmentServices.organizationId, scope.organization.id)).orderBy(desc(shipmentServices.createdAt)).limit(100);
}

export async function createShipmentServiceForUser(userId: number, input: { shipmentId: number; serviceType: "assisted_purchase" | "heavy_cargo" | "moving"; quoteReference?: string; handlingNotes?: string; scheduledAt?: Date; crewSize?: number; vehicleType?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id, serviceType: shipments.serviceType }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0] || shipment[0].serviceType !== input.serviceType) return null;
  const requirements = resolveSpecialServiceRequirements(input);
  if (!requirements.valid) return null;
  await db.insert(shipmentServices).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, serviceType: input.serviceType, quoteReference: input.quoteReference ?? null, handlingNotes: input.handlingNotes ?? null, scheduledAt: input.scheduledAt ?? null, requiresTwoPersonCrew: requirements.requiresTwoPersonCrew, requiresSpecialVehicle: requirements.requiresSpecialVehicle, crewSize: requirements.crewSize, vehicleType: requirements.vehicleType, status: "requested", createdBy: userId });
  const rows = await db.select().from(shipmentServices).where(and(eq(shipmentServices.organizationId, scope.organization.id), eq(shipmentServices.shipmentId, input.shipmentId))).orderBy(desc(shipmentServices.id)).limit(1);
  return rows[0] ?? null;
}

export async function updateShipmentServiceForUser(userId: number, serviceId: number, input: { status: "quoted" | "approved" | "scheduled" | "in_progress" | "completed" | "cancelled"; quoteReference?: string; handlingNotes?: string; scheduledAt?: Date }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(shipmentServices).where(and(eq(shipmentServices.id, serviceId), eq(shipmentServices.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (!serviceTransitions[current[0].status].includes(input.status)) throw new Error("Transición de servicio especial no permitida");
  await db.update(shipmentServices).set({ status: input.status, quoteReference: input.quoteReference, handlingNotes: input.handlingNotes, scheduledAt: input.scheduledAt }).where(and(eq(shipmentServices.id, serviceId), eq(shipmentServices.organizationId, scope.organization.id)));
  const rows = await db.select().from(shipmentServices).where(and(eq(shipmentServices.id, serviceId), eq(shipmentServices.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listPaymentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(payments).where(eq(payments.organizationId, scope.organization.id)).orderBy(desc(payments.createdAt)).limit(200);
}

export async function collectPaymentForUser(userId: number, input: { shipmentId: number; amount: string; method: "cash" | "card" | "transfer" | "other"; reference?: string; cashSessionId?: number }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  if (input.method === "cash") {
    if (!input.cashSessionId) return null;
    const session = await db.select({ id: cashSessions.id }).from(cashSessions).where(and(eq(cashSessions.id, input.cashSessionId), eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.status, "open"))).limit(1);
    if (!session[0]) return null;
  }
  const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  let paymentId = 0;
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, amount: input.amount, currency: "DOP", method: input.method, status: "collected", reference: input.reference ?? null, collectedBy: userId, collectedAt: new Date() });
    const paymentRows = await tx.select({ id: payments.id }).from(payments).where(and(eq(payments.organizationId, scope.organization.id), eq(payments.shipmentId, input.shipmentId))).orderBy(desc(payments.id)).limit(1);
    paymentId = paymentRows[0]?.id ?? 0;
    if (input.method === "cash" && input.cashSessionId && paymentId) await tx.insert(cashMovements).values({ organizationId: scope.organization.id, cashSessionId: input.cashSessionId, paymentId, movementType: "collection", amount: input.amount, actorUserId: userId });
    if (paymentId) await tx.insert(receipts).values({ organizationId: scope.organization.id, paymentId, receiptNumber });
    await tx.update(shipments).set({ financialStatus: "paid" }).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id)));
  });
  const paymentRows = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.organizationId, scope.organization.id))).limit(1);
  const receiptRows = await db.select().from(receipts).where(and(eq(receipts.paymentId, paymentId), eq(receipts.organizationId, scope.organization.id))).limit(1);
  return paymentRows[0] && receiptRows[0] ? { payment: paymentRows[0], receipt: receiptRows[0] } : null;
}

export async function listCashSessionsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(cashSessions).where(eq(cashSessions.organizationId, scope.organization.id)).orderBy(desc(cashSessions.openedAt)).limit(100);
}

export async function openCashSessionForUser(userId: number, input: { branchId: number; openingAmount: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const branch = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, input.branchId), eq(branches.organizationId, scope.organization.id), eq(branches.isActive, true))).limit(1);
  if (!branch[0]) return null;
  const open = await db.select({ id: cashSessions.id }).from(cashSessions).where(and(eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.branchId, input.branchId), eq(cashSessions.status, "open"))).limit(1);
  if (open[0]) return null;
  await db.insert(cashSessions).values({ organizationId: scope.organization.id, branchId: input.branchId, openedBy: userId, openingAmount: input.openingAmount, status: "open" });
  const rows = await db.select().from(cashSessions).where(and(eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.branchId, input.branchId), eq(cashSessions.openedBy, userId))).orderBy(desc(cashSessions.id)).limit(1);
  return rows[0] ?? null;
}

export async function closeCashSessionForUser(userId: number, sessionId: number, closingAmount: string) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(cashSessions).where(and(eq(cashSessions.id, sessionId), eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.status, "open"))).limit(1);
  if (!current[0]) return null;
  await db.update(cashSessions).set({ status: "closed", closingAmount, closedAt: new Date() }).where(and(eq(cashSessions.id, sessionId), eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.status, "open")));
  const rows = await db.select().from(cashSessions).where(and(eq(cashSessions.id, sessionId), eq(cashSessions.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listInvoicesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(invoices).where(eq(invoices.organizationId, scope.organization.id)).orderBy(desc(invoices.createdAt)).limit(200);
}

export async function issueInvoiceForUser(userId: number, input: { shipmentId: number; subtotal: string; tax: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const total = (Number(input.subtotal) + Number(input.tax)).toFixed(2);
  await db.insert(invoices).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, invoiceNumber, status: "issued", subtotal: input.subtotal, tax: input.tax, total, currency: "DOP", issuedBy: userId, issuedAt: new Date() });
  const rows = await db.select().from(invoices).where(and(eq(invoices.organizationId, scope.organization.id), eq(invoices.invoiceNumber, invoiceNumber))).limit(1);
  return rows[0] ?? null;
}

export async function listAuditLogsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.organizationId, scope.organization.id)).orderBy(desc(auditLogs.createdAt)).limit(100);
}

export async function appendAuditLog(input: { organizationId?: number; actorUserId?: number; category: "operational" | "financial" | "security" | "llm"; action: string; resourceType?: string; resourceId?: string; metadata?: unknown; }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(input);
}

export async function listEventsForUser(userId: number, shipmentId: number) {
  const scope = await getOrganizationForUser(userId);
  const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipmentEvents).where(and(eq(shipmentEvents.organizationId, scope.organization.id), eq(shipmentEvents.shipmentId, shipmentId))).orderBy(desc(shipmentEvents.createdAt));
}

export async function appendShipmentEvent(input: typeof shipmentEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return false;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, input.organizationId))).limit(1);
  if (!shipment[0]) return false;
  await db.insert(shipmentEvents).values(input);
  return true;
}

export async function listBranchesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(branches).where(and(eq(branches.organizationId, scope.organization.id), eq(branches.isActive, true))).orderBy(branches.name).limit(100);
}

export async function listDriversForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ userId: memberships.userId, name: users.name, email: users.email }).from(memberships).innerJoin(users, eq(memberships.userId, users.id)).where(and(eq(memberships.organizationId, scope.organization.id), eq(memberships.role, "driver"))).orderBy(users.name).limit(100);
}

export async function listWarehousesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(warehouses).where(eq(warehouses.organizationId, scope.organization.id)).orderBy(desc(warehouses.createdAt)).limit(100);
}

export async function createWarehouseForUser(userId: number, input: { branchId: number; name: string; code: string; address?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  await db.insert(warehouses).values({ ...input, organizationId: scope.organization.id, address: input.address ?? null });
  const rows = await db.select().from(warehouses).where(and(eq(warehouses.organizationId, scope.organization.id), eq(warehouses.code, input.code))).limit(1);
  return rows[0] ?? null;
}

export async function updateWarehouseForUser(userId: number, warehouseId: number, input: { branchId?: number; name?: string; code?: string; address?: string; isActive?: boolean }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  const current = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  await db.update(warehouses).set(input).where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, scope.organization.id)));
  const rows = await db.select().from(warehouses).where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listPickupsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(pickups).where(eq(pickups.organizationId, scope.organization.id)).orderBy(desc(pickups.createdAt)).limit(100);
}

export async function createPickupForUser(userId: number, input: Omit<typeof pickups.$inferInsert, "organizationId">) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  if (input.shipmentId !== undefined && input.shipmentId !== null) {
    const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
    if (!shipment[0]) return null;
  }
  await db.insert(pickups).values({ ...input, organizationId: scope.organization.id });
  return { success: true } as const;
}

export async function listManifestsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(manifests).where(eq(manifests.organizationId, scope.organization.id)).orderBy(desc(manifests.createdAt)).limit(100);
}

export async function createManifestForUser(userId: number, input: { branchId?: number; direction: "outbound" | "inbound" | "transfer" }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const code = `MAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  await db.insert(manifests).values({ organizationId: scope.organization.id, branchId: input.branchId, code, direction: input.direction, createdBy: userId });
  return { code, direction: input.direction, status: "open" as const };
}

export async function advanceManifestForUser(userId: number, manifestId: number, nextStatus: "sealed" | "in_transit" | "received" | "reconciled") {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(manifests).where(and(eq(manifests.id, manifestId), eq(manifests.organizationId, scope.organization.id))).limit(1);
  const current = rows[0];
  if (!current) return null;
  nextManifestStatus(current.status, nextStatus);
  await db.update(manifests).set({ status: nextStatus }).where(and(eq(manifests.id, manifestId), eq(manifests.organizationId, scope.organization.id)));
  return { success: true, status: nextStatus } as const;
}

export async function createRouteForUser(userId: number, input: { branchId?: number; vehicleLabel?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  const code = `RUT-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  await db.insert(routes).values({ organizationId: scope.organization.id, branchId: input.branchId, code, vehicleLabel: input.vehicleLabel ?? null, status: "draft" });
  const rows = await db.select().from(routes).where(and(eq(routes.organizationId, scope.organization.id), eq(routes.code, code))).limit(1);
  return rows[0] ?? null;
}

export async function assignRouteForUser(userId: number, routeId: number, driverUserId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const driver = await db.select({ id: memberships.userId }).from(memberships).where(and(eq(memberships.organizationId, scope.organization.id), eq(memberships.userId, driverUserId), eq(memberships.role, "driver"))).limit(1);
  if (!driver[0]) return null;
  const route = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  if (!route[0]) return null;
  await db.update(routes).set({ driverUserId, status: "assigned" }).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id)));
  const rows = await db.select().from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function listRoutesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(routes).where(eq(routes.organizationId, scope.organization.id)).orderBy(desc(routes.createdAt)).limit(100);
}

export async function createRouteStopForUser(userId: number, input: { routeId: number; shipmentId?: number; pickupId?: number; address: string; sequence?: number; latitude?: string; longitude?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const route = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, input.routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  if (!route[0] || (!input.shipmentId && !input.pickupId)) return null;
  if (input.shipmentId) { const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1); if (!shipment[0]) return null; }
  if (input.pickupId) { const pickup = await db.select({ id: pickups.id }).from(pickups).where(and(eq(pickups.id, input.pickupId), eq(pickups.organizationId, scope.organization.id))).limit(1); if (!pickup[0]) return null; }
  const latest = await db.select({ sequence: routeStops.sequence }).from(routeStops).where(and(eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, input.routeId))).orderBy(desc(routeStops.sequence)).limit(1);
  const sequence = input.sequence ?? (latest[0]?.sequence ?? 0) + 1;
  await db.insert(routeStops).values({ organizationId: scope.organization.id, routeId: input.routeId, shipmentId: input.shipmentId ?? null, pickupId: input.pickupId ?? null, sequence, address: input.address, latitude: input.latitude ?? null, longitude: input.longitude ?? null, status: "pending" });
  const rows = await db.select().from(routeStops).where(and(eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, input.routeId), eq(routeStops.sequence, sequence))).orderBy(desc(routeStops.id)).limit(1);
  return rows[0] ?? null;
}

const allowedStopTransitions: Record<string, string[]> = { pending: ["arrived", "completed", "failed", "skipped"], arrived: ["completed", "failed", "skipped"], completed: [], failed: [], skipped: [] };

export async function updateRouteStopForUser(userId: number, stopId: number, input: { status?: "pending" | "arrived" | "completed" | "failed" | "skipped"; address?: string; latitude?: string; longitude?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(routeStops).where(and(eq(routeStops.id, stopId), eq(routeStops.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (input.status && input.status !== current[0].status && !allowedStopTransitions[current[0].status].includes(input.status)) throw new Error("Transición de parada no permitida");
  await db.update(routeStops).set({ status: input.status, address: input.address, latitude: input.latitude, longitude: input.longitude }).where(and(eq(routeStops.id, stopId), eq(routeStops.organizationId, scope.organization.id)));
  const rows = await db.select().from(routeStops).where(and(eq(routeStops.id, stopId), eq(routeStops.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function scanPackageForUser(userId: number, input: { barcodeValue: string; routeId?: number; stopId?: number }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(packages).where(and(eq(packages.organizationId, scope.organization.id), eq(packages.barcodeValue, input.barcodeValue))).limit(1);
  const pkg = rows[0];
  if (!pkg) return null;
  if (input.routeId) {
    const route = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, input.routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
    if (!route[0]) return null;
    const stopFilters = [eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, input.routeId), eq(routeStops.shipmentId, pkg.shipmentId)];
    if (input.stopId) stopFilters.push(eq(routeStops.id, input.stopId));
    const stop = await db.select({ id: routeStops.id }).from(routeStops).where(and(...stopFilters)).limit(1);
    if (!stop[0]) return null;
  }
  return pkg;
}

export async function listRouteStopsForUser(userId: number, routeId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(routeStops).where(and(eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, routeId))).orderBy(routeStops.sequence);
}

export async function listShipmentDocumentsForUser(userId: number, shipmentId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(shipmentDocuments.organizationId, scope.organization.id)];
  if (shipmentId) filters.push(eq(shipmentDocuments.shipmentId, shipmentId));
  return db.select({ id: shipmentDocuments.id, shipmentId: shipmentDocuments.shipmentId, documentType: shipmentDocuments.documentType, fileKey: shipmentDocuments.fileKey, mimeType: shipmentDocuments.mimeType, fileUrl: shipmentDocuments.fileUrl, uploadedBy: shipmentDocuments.uploadedBy, createdAt: shipmentDocuments.createdAt }).from(shipmentDocuments).where(and(...filters)).orderBy(desc(shipmentDocuments.createdAt)).limit(100);
}

export async function uploadShipmentDocumentForUser(userId: number, input: { shipmentId: number; documentType: "label" | "invoice" | "customs" | "pod" | "incident" | "receipt"; fileName: string; mimeType: string; dataBase64: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!shipment[0]) return null;
  const bytes = Buffer.from(input.dataBase64, "base64");
  if (bytes.length > 10 * 1024 * 1024) throw new Error("Documento oltre il limite di 10 MB");
  const stored = await storagePut(`organizations/${scope.organization.id}/shipments/${input.shipmentId}/${input.fileName}`, bytes, input.mimeType);
  await db.insert(shipmentDocuments).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, documentType: input.documentType, fileKey: stored.key, fileUrl: stored.url, mimeType: input.mimeType, uploadedBy: userId });
  return stored;
}

export async function createApiKeyForUser(userId: number, name: string, scopes: string[]) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const issued = issueApiKey();
  await db.insert(apiKeys).values({ organizationId: scope.organization.id, name, keyPrefix: issued.keyPrefix, secretHash: issued.secretHash, scopes: JSON.stringify(scopes) });
  return { secret: issued.secret, keyPrefix: issued.keyPrefix, scopes };
}

export async function revokeApiKeyForUser(userId: number, apiKeyId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const result = await db.update(apiKeys).set({ revokedAt: new Date() }).where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, scope.organization.id)));
  return result[0].affectedRows > 0;
}

export async function authenticateApiKey(secret: string) {
  const db = await getDb();
  if (!db) return null;
  const candidates = await db.select().from(apiKeys).where(isNull(apiKeys.revokedAt)).limit(100);
  const match = candidates.find((key) => verifyApiKey(secret, key.secretHash));
  if (!match) return null;
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, match.id));
  return match;
}

export async function listApiKeysForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, scopes: apiKeys.scopes, revokedAt: apiKeys.revokedAt, lastUsedAt: apiKeys.lastUsedAt, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.organizationId, scope.organization.id)).orderBy(desc(apiKeys.createdAt));
}

export async function recordTrackingPoint(userId: number, input: Omit<typeof trackingPoints.$inferInsert, "organizationId" | "driverUserId">) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  if (!input.shipmentId && !input.routeId) return null;
  if (input.shipmentId) {
    const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
    if (!shipment[0]) return null;
  }
  if (input.routeId) {
    const route = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, input.routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
    if (!route[0]) return null;
  }
  await db.insert(trackingPoints).values({ ...input, organizationId: scope.organization.id, driverUserId: userId });
  return { success: true } as const;
}

export async function listTrackingPointsForUser(userId: number, shipmentId?: number, routeId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(trackingPoints.organizationId, scope.organization.id)];
  if (shipmentId) filters.push(eq(trackingPoints.shipmentId, shipmentId));
  if (routeId) filters.push(eq(trackingPoints.routeId, routeId));
  return db.select().from(trackingPoints).where(and(...filters)).orderBy(desc(trackingPoints.capturedAt)).limit(500);
}
