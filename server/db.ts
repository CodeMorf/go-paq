import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { resolveSpecialServiceRequirements } from "./specialServiceRules";
import { InsertUser, apiIdempotencyKeys, apiKeys, apiRequestLogs, auditLogs, branches, webhookEndpoints, webhookDeliveries, cashMovements, cashSessions, consolidationItems, consolidations, customerAddresses, customerContacts, customerProfiles, deliveryAttempts, inventoryMovements, invoices, manifests, memberships, organizations, packages, payments, pickups, receipts, rolePermissions, routeExpenses, routeStops, routes, shipmentDocuments, shipmentEvents, shipmentIncidents, shipmentServices, shipments, supportTickets, tariffZones, tariffs, trackingPoints, users, warehouses } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { issueApiKey, verifyApiKey } from "./apiKeys";
import { storagePut } from "./storage";
import { nextManifestStatus } from "./manifestState";
import { transitionShipment } from "./shipmentState";
import { decryptWebhookSecret, deliverWebhook, encryptWebhookSecret } from "./webhook";
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

export async function getOrganizationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(and(eq(organizations.slug, slug), eq(organizations.status, "active"))).limit(1);
  return result[0];
}

export async function canUser(userId: number, organizationId: number, resource: string, action: "view" | "create" | "edit" | "approve" | "assign" | "collect" | "refund" | "export" | "configure") {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId))).limit(1);
  if (!result[0]) return false;
  if (result[0].role === "owner") return true;
  const permissions = await db.select().from(rolePermissions).where(and(eq(rolePermissions.organizationId, organizationId), eq(rolePermissions.role, result[0].role), eq(rolePermissions.resource, resource), eq(rolePermissions.action, action))).limit(1);
  return Boolean(permissions[0]);
}

export async function getCustomerProfileForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const profile = await db.select().from(customerProfiles).where(and(eq(customerProfiles.organizationId, scope.organization.id), eq(customerProfiles.userId, userId))).limit(1);
  return { user: { id: userId, name: null as string | null, email: null as string | null }, profile: profile[0] ?? null };
}

export async function upsertCustomerProfileForUser(userId: number, input: { customerType: "individual" | "business"; legalName?: string | null; phone?: string | null; taxId?: string | null; preferredLanguage: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const existing = await db.select({ id: customerProfiles.id }).from(customerProfiles).where(and(eq(customerProfiles.organizationId, scope.organization.id), eq(customerProfiles.userId, userId))).limit(1);
  if (existing[0]) await db.update(customerProfiles).set(input).where(and(eq(customerProfiles.id, existing[0].id), eq(customerProfiles.organizationId, scope.organization.id), eq(customerProfiles.userId, userId)));
  else await db.insert(customerProfiles).values({ organizationId: scope.organization.id, userId, ...input });
  const rows = await db.select().from(customerProfiles).where(and(eq(customerProfiles.organizationId, scope.organization.id), eq(customerProfiles.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function listCustomerAddressesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(customerAddresses).where(and(eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId), eq(customerAddresses.isActive, true))).orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.updatedAt));
}

export async function createCustomerAddressForUser(userId: number, input: { label: string; recipientName: string; phone?: string | null; addressLine1: string; addressLine2?: string | null; city: string; province: string; country: string; postalCode?: string | null; deliveryInstructions?: string | null; latitude?: string | null; longitude?: string | null; isDefault?: boolean }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  let createdId = 0;
  await db.transaction(async (tx) => {
    if (input.isDefault) await tx.update(customerAddresses).set({ isDefault: false }).where(and(eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId), eq(customerAddresses.isActive, true)));
    const inserted = await tx.insert(customerAddresses).values({ organizationId: scope.organization.id, userId, ...input, isDefault: input.isDefault ?? false, isActive: true });
    createdId = Number(inserted[0].insertId);
  });
  const rows = await db.select().from(customerAddresses).where(and(eq(customerAddresses.id, createdId), eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function updateCustomerAddressForUser(userId: number, addressId: number, input: Partial<{ label: string; recipientName: string; phone: string | null; addressLine1: string; addressLine2: string | null; city: string; province: string; country: string; postalCode: string | null; deliveryInstructions: string | null; latitude: string | null; longitude: string | null; isDefault: boolean; isActive: boolean }>) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select({ id: customerAddresses.id }).from(customerAddresses).where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId))).limit(1);
  if (!current[0]) return null;
  await db.transaction(async (tx) => {
    if (input.isDefault) await tx.update(customerAddresses).set({ isDefault: false }).where(and(eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId), eq(customerAddresses.isActive, true)));
    await tx.update(customerAddresses).set(input).where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId)));
  });
  const rows = await db.select().from(customerAddresses).where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.organizationId, scope.organization.id), eq(customerAddresses.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function listCustomerContactsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(customerContacts).where(and(eq(customerContacts.organizationId, scope.organization.id), eq(customerContacts.userId, userId), eq(customerContacts.isActive, true))).orderBy(desc(customerContacts.updatedAt));
}

export async function createCustomerContactForUser(userId: number, input: { name: string; relationship?: string | null; phone?: string | null; email?: string | null; notes?: string | null }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const inserted = await db.insert(customerContacts).values({ organizationId: scope.organization.id, userId, ...input, isActive: true });
  const rows = await db.select().from(customerContacts).where(and(eq(customerContacts.id, Number(inserted[0].insertId)), eq(customerContacts.organizationId, scope.organization.id), eq(customerContacts.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function updateCustomerContactForUser(userId: number, contactId: number, input: Partial<{ name: string; relationship: string | null; phone: string | null; email: string | null; notes: string | null; isActive: boolean }>) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const result = await db.update(customerContacts).set(input).where(and(eq(customerContacts.id, contactId), eq(customerContacts.organizationId, scope.organization.id), eq(customerContacts.userId, userId)));
  if (!result[0].affectedRows) return null;
  const rows = await db.select().from(customerContacts).where(and(eq(customerContacts.id, contactId), eq(customerContacts.organizationId, scope.organization.id), eq(customerContacts.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function listSupportTicketsForUser(userId: number, ownOnly = false) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(supportTickets.organizationId, scope.organization.id)];
  if (ownOnly) filters.push(eq(supportTickets.userId, userId));
  return db.select().from(supportTickets).where(and(...filters)).orderBy(desc(supportTickets.updatedAt)).limit(300);
}

export async function createSupportTicketForUser(userId: number, input: { shipmentId?: number | null; subject: string; description: string; category: "shipment" | "billing" | "pickup" | "delivery" | "account" | "other"; priority: "low" | "normal" | "high" | "urgent" }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  if (input.shipmentId) {
    const shipment = await db.select({ id: shipments.id, createdBy: shipments.createdBy }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
    if (!shipment[0] || (scope.membership.role === "customer" && shipment[0].createdBy !== userId)) return null;
  }
  const inserted = await db.insert(supportTickets).values({ organizationId: scope.organization.id, userId, ...input, status: "open" });
  const rows = await db.select().from(supportTickets).where(and(eq(supportTickets.id, Number(inserted[0].insertId)), eq(supportTickets.organizationId, scope.organization.id), eq(supportTickets.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function updateSupportTicketForUser(userId: number, ticketId: number, input: { status?: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"; priority?: "low" | "normal" | "high" | "urgent"; resolution?: string | null; assignedTo?: number | null }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select({ id: supportTickets.id }).from(supportTickets).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  await db.update(supportTickets).set(input).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, scope.organization.id)));
  const rows = await db.select().from(supportTickets).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function getActiveTariffForOrganization(organizationId: number, serviceType: string, zoneCode?: string) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const common = and(eq(tariffs.organizationId, organizationId), eq(tariffs.serviceType, serviceType), eq(tariffs.isActive, true), lte(tariffs.validFrom, now), or(isNull(tariffs.validUntil), gte(tariffs.validUntil, now)));
  if (zoneCode) {
    const zoned = await db.select({ tariff: tariffs }).from(tariffs).innerJoin(tariffZones, eq(tariffs.zoneId, tariffZones.id)).where(and(common, eq(tariffZones.organizationId, organizationId), eq(tariffZones.code, zoneCode), eq(tariffZones.isActive, true))).orderBy(desc(tariffs.version), desc(tariffs.validFrom)).limit(1);
    if (zoned[0]?.tariff) return zoned[0].tariff;
  }
  const global = await db.select().from(tariffs).where(and(common, isNull(tariffs.zoneId))).orderBy(desc(tariffs.version), desc(tariffs.validFrom)).limit(1);
  return global[0] ?? null;
}

export async function listTariffZonesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(tariffZones).where(eq(tariffZones.organizationId, scope.organization.id)).orderBy(desc(tariffZones.createdAt)).limit(200);
}

export async function createTariffZoneForUser(userId: number, input: { code: string; name: string; originCountry: string; destinationCountry: string; originPostalPrefix?: string; destinationPostalPrefix?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  await db.insert(tariffZones).values({ ...input, organizationId: scope.organization.id });
  const rows = await db.select().from(tariffZones).where(and(eq(tariffZones.organizationId, scope.organization.id), eq(tariffZones.code, input.code))).orderBy(desc(tariffZones.id)).limit(1);
  return rows[0] ?? null;
}

export async function listTariffsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ tariff: tariffs, zone: tariffZones }).from(tariffs).leftJoin(tariffZones, eq(tariffs.zoneId, tariffZones.id)).where(eq(tariffs.organizationId, scope.organization.id)).orderBy(desc(tariffs.version), desc(tariffs.validFrom)).limit(200);
}

export async function createTariffForUser(userId: number, input: { name: string; serviceType: string; zoneId?: number; currency: string; minAmount: string; perKg: string; perKm: string; fixedSurcharge: string; fuelSurchargePct: string; discountPct: string; taxPct: string; volumetricDivisor: string; version: number; validFrom: Date; validUntil?: Date }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  if (input.zoneId !== undefined) {
    const zone = await db.select({ id: tariffZones.id }).from(tariffZones).where(and(eq(tariffZones.id, input.zoneId), eq(tariffZones.organizationId, scope.organization.id), eq(tariffZones.isActive, true))).limit(1);
    if (!zone[0]) return null;
  }
  await db.insert(tariffs).values({ ...input, organizationId: scope.organization.id });
  const rows = await db.select().from(tariffs).where(and(eq(tariffs.organizationId, scope.organization.id), eq(tariffs.serviceType, input.serviceType), eq(tariffs.version, input.version))).orderBy(desc(tariffs.id)).limit(1);
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
  deliveryPin?: string;
};

async function branchBelongsToOrganization(db: Awaited<ReturnType<typeof getDb>>, organizationId: number, branchId?: number) {
  if (!db || branchId === undefined) return branchId === undefined;
  const rows = await db.select({ id: branches.id }).from(branches).where(and(eq(branches.id, branchId), eq(branches.organizationId, organizationId), eq(branches.isActive, true))).limit(1);
  return Boolean(rows[0]);
}

function newTrackingCode() {
  return `GPQ-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function hashDeliveryPin(pin: string) {
  return createHash("sha256").update(pin, "utf8").digest("hex");
}

export function matchesDeliveryPin(pin: string, storedHash: string) {
  const expected = Buffer.from(hashDeliveryPin(pin), "hex");
  const actual = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function withoutDeliveryPinHash<T extends { deliveryPinHash?: string | null }>(shipment: T) {
  const { deliveryPinHash: _deliveryPinHash, ...safeShipment } = shipment;
  return safeShipment;
}

export async function createShipmentForUser(userId: number, input: ShipmentInput) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId))) return null;
  const trackingCode = newTrackingCode();
  const { deliveryPin, ...shipmentInput } = input;
  await db.insert(shipments).values({ ...shipmentInput, trackingCode, organizationId: scope.organization.id, createdBy: userId, currency: "DOP", estimatedAmount: input.estimatedAmount, deliveryPinHash: deliveryPin ? hashDeliveryPin(deliveryPin) : null });
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, scope.organization.id), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
}

export async function createShipmentForOrganization(organizationId: number, input: ShipmentInput) {
  const db = await getDb();
  if (!db || !(await branchBelongsToOrganization(db, organizationId, input.branchId))) return null;
  const trackingCode = newTrackingCode();
  const { deliveryPin: _deliveryPin, ...shipmentInput } = input;
  await db.insert(shipments).values({ ...shipmentInput, trackingCode, organizationId, createdBy: null, currency: "DOP", estimatedAmount: input.estimatedAmount, deliveryPinHash: null });
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, organizationId), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
}

export async function getShipmentByTrackingForOrganization(organizationId: number, trackingCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shipments).where(and(eq(shipments.organizationId, organizationId), eq(shipments.trackingCode, trackingCode))).limit(1);
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
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
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
}

export async function cancelShipmentForUser(userId: number, shipmentId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select({ id: shipments.id, commercialStatus: shipments.commercialStatus, physicalStatus: shipments.physicalStatus, transportStatus: shipments.transportStatus }).from(shipments).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  const shipment = current[0];
  if (!shipment || (shipment.commercialStatus !== "draft" && shipment.commercialStatus !== "quoted" && shipment.commercialStatus !== "confirmed") || shipment.physicalStatus !== "expected" || shipment.transportStatus !== "unassigned") return null;
  transitionShipment("commercial", shipment.commercialStatus, "cancelled");
  await db.update(shipments).set({ commercialStatus: "cancelled" }).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id)));
  const rows = await db.select().from(shipments).where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
}

export async function confirmShipmentDeliveryForUser(userId: number, input: { shipmentId: number; recipientName: string; deliveryPin?: string; note?: string; evidenceUrl?: string; latitude?: string; longitude?: string; idempotencyKey: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (current[0].deliveryPinHash && (!input.deliveryPin || !matchesDeliveryPin(input.deliveryPin, current[0].deliveryPinHash))) return null;
  if (scope.membership?.role === "driver") {
    const assignedStop = await db.select({ stopId: routeStops.id }).from(routeStops).innerJoin(routes, eq(routeStops.routeId, routes.id)).where(and(eq(routeStops.shipmentId, input.shipmentId), eq(routeStops.organizationId, scope.organization.id), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId), inArray(routes.status, ["assigned", "active"]))).limit(1);
    if (!assignedStop[0]) return null;
  }
  const existingEvent = await db.select({ id: shipmentEvents.id }).from(shipmentEvents).where(and(eq(shipmentEvents.organizationId, scope.organization.id), eq(shipmentEvents.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existingEvent[0]) return withoutDeliveryPinHash(current[0]);
  transitionShipment("transport", current[0].physicalStatus, "delivered");
  const eventNote = [input.recipientName ? `Recibido por: ${input.recipientName}` : "", input.deliveryPin ? "PIN de entrega verificado" : "", input.note ?? ""].filter(Boolean).join(" · ");
  await db.transaction(async (tx) => {
    await tx.update(shipments).set({ physicalStatus: "delivered", transportStatus: "completed" }).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id)));
    await tx.insert(shipmentEvents).values({ organizationId: scope.organization.id, shipmentId: input.shipmentId, actorUserId: userId, eventType: "delivery_confirmed", previousStatus: current[0].physicalStatus, nextStatus: "delivered", note: eventNote, evidenceUrl: input.evidenceUrl, latitude: input.latitude, longitude: input.longitude, idempotencyKey: input.idempotencyKey, origin: "driver" });
  });
  await dispatchWebhooksForEvent(scope.organization.id, "delivery_confirmed", { shipmentId: input.shipmentId, recipientName: input.recipientName, evidenceUrl: input.evidenceUrl }).catch(() => undefined);
  const rows = await db.select().from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
  return rows[0] ? withoutDeliveryPinHash(rows[0]) : null;
}

export async function listShipmentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId);
  const db = await getDb();
  if (!db || !scope) return [];
  const rows = await db.select().from(shipments).where(eq(shipments.organizationId, scope.organization.id)).orderBy(desc(shipments.createdAt)).limit(100);
  return rows.map(withoutDeliveryPinHash);
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
type PackageSplitItem = { description?: string; weight: number; weightUnit?: PackageInput["weightUnit"]; length?: number; width?: number; height?: number; dimensionUnit?: PackageInput["dimensionUnit"]; declaredValue?: string; barcodeValue?: string; locationCode?: string };

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

export async function splitPackageForUser(userId: number, packageId: number, children: PackageSplitItem[]) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || children.length < 2 || children.length > 20) return null;
  const parentRows = await db.select().from(packages).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  const parent = parentRows[0];
  if (!parent || ["delivered", "returned"].includes(parent.status) || parent.packagingStatus === "split_parent") return null;
  const normalizedWeights = children.map((child) => Number(normalizeWeight(child.weight, child.weightUnit)));
  if (normalizedWeights.some((weight) => !Number.isFinite(weight) || weight <= 0)) throw new Error("Cada paquete separado requiere un peso válido");
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  if (parent.weightKg && totalWeight > Number(parent.weightKg) + 0.01) throw new Error("El peso separado no puede superar el peso registrado del paquete padre");
  const childCodes = children.map((_, index) => `${parent.packageCode}-S${String(index + 1).padStart(2, "0")}-${randomUUID().slice(0, 4).toUpperCase()}`);
  await db.transaction(async (tx) => {
    await tx.update(packages).set({ packagingStatus: "split_parent" }).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id)));
    await tx.insert(packages).values(children.map((child, index) => ({ shipmentId: parent.shipmentId, organizationId: scope.organization.id, packageCode: childCodes[index], description: child.description ?? parent.description, restrictions: parent.restrictions, status: "received" as const, weightKg: String(normalizedWeights[index].toFixed(3)), lengthCm: normalizeDimension(child.length, child.dimensionUnit), widthCm: normalizeDimension(child.width, child.dimensionUnit), heightCm: normalizeDimension(child.height, child.dimensionUnit), declaredValue: child.declaredValue ?? null, warehouseId: parent.warehouseId, locationCode: child.locationCode ?? null, barcodeValue: child.barcodeValue ?? null, parentPackageId: packageId, packagingStatus: "split_child" as const })));
    const createdChildren = await tx.select({ id: packages.id, packageCode: packages.packageCode }).from(packages).where(and(eq(packages.organizationId, scope.organization.id), inArray(packages.packageCode, childCodes)));
    await tx.insert(inventoryMovements).values([{ organizationId: scope.organization.id, packageId, warehouseId: parent.warehouseId, movementType: "adjustment", fromLocation: parent.locationCode, toLocation: parent.locationCode, note: `Separación en ${children.length} paquetes`, actorUserId: userId }, ...createdChildren.map((child) => { const index = childCodes.indexOf(child.packageCode); return { organizationId: scope.organization.id, packageId: child.id, warehouseId: parent.warehouseId, movementType: "received" as const, fromLocation: parent.locationCode, toLocation: children[index].locationCode ?? parent.locationCode, note: `Paquete hijo de ${parent.packageCode}`, actorUserId: userId }; })]);
  });
  const childRows = await db.select().from(packages).where(and(eq(packages.organizationId, scope.organization.id), inArray(packages.packageCode, childCodes))).orderBy(packages.id);
  return { parent: { ...parent, packagingStatus: "split_parent" as const }, children: childRows };
}

export async function repackPackageForUser(userId: number, packageId: number, input: { weight?: number; weightUnit?: PackageInput["weightUnit"]; length?: number; width?: number; height?: number; dimensionUnit?: PackageInput["dimensionUnit"]; locationCode?: string; warehouseId?: number; note?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !(await warehouseBelongsToOrganization(db, scope.organization.id, input.warehouseId))) return null;
  const currentRows = await db.select().from(packages).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id))).limit(1);
  const current = currentRows[0];
  if (!current || ["delivered", "returned"].includes(current.status)) return null;
  const normalizedWeight = normalizeWeight(input.weight, input.weightUnit);
  if (normalizedWeight !== undefined && Number(normalizedWeight) <= 0) throw new Error("El peso del reempaque debe ser mayor que cero");
  await db.transaction(async (tx) => {
    await tx.update(packages).set({ packagingStatus: "repacked", warehouseId: input.warehouseId ?? current.warehouseId, weightKg: normalizedWeight, lengthCm: normalizeDimension(input.length, input.dimensionUnit), widthCm: normalizeDimension(input.width, input.dimensionUnit), heightCm: normalizeDimension(input.height, input.dimensionUnit), locationCode: input.locationCode ?? current.locationCode }).where(and(eq(packages.id, packageId), eq(packages.organizationId, scope.organization.id)));
    await tx.insert(inventoryMovements).values({ organizationId: scope.organization.id, packageId, warehouseId: input.warehouseId ?? current.warehouseId, movementType: "adjustment", fromLocation: current.locationCode, toLocation: input.locationCode ?? current.locationCode, note: input.note ?? "Reempaque registrado", actorUserId: userId });
  });
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
  await dispatchWebhooksForEvent(scope.organization.id, "incident_created", { shipmentId: input.shipmentId, packageId: input.packageId, type: input.type, severity: input.severity }).catch(() => undefined);
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
  await dispatchWebhooksForEvent(scope.organization.id, "delivery_attempted", { shipmentId: input.shipmentId, routeStopId: input.routeStopId, status: input.status, reason: input.reason }).catch(() => undefined);
  const rows = await db.select().from(deliveryAttempts).where(and(eq(deliveryAttempts.organizationId, scope.organization.id), eq(deliveryAttempts.shipmentId, input.shipmentId))).orderBy(desc(deliveryAttempts.attemptedAt)).limit(1);
  return rows[0] ?? null;
}

const serviceTransitions: Record<string, string[]> = { requested: ["quoted", "awaiting_approval", "cancelled"], quoted: ["awaiting_approval", "approved", "rejected", "cancelled"], awaiting_approval: ["approved", "rejected", "cancelled"], approved: ["purchasing", "scheduled", "cancelled"], purchasing: ["purchased", "cancelled"], purchased: ["fulfillment", "scheduled", "cancelled"], fulfillment: ["scheduled", "in_progress", "cancelled"], scheduled: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [], rejected: [] };

export function isAllowedSpecialServiceTransition(currentStatus: string, nextStatus: string) {
  return serviceTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

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

export async function updateShipmentServiceForUser(userId: number, serviceId: number, input: { status: "quoted" | "awaiting_approval" | "approved" | "purchasing" | "purchased" | "fulfillment" | "scheduled" | "in_progress" | "completed" | "cancelled" | "rejected"; quoteReference?: string; handlingNotes?: string; scheduledAt?: Date }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(shipmentServices).where(and(eq(shipmentServices.id, serviceId), eq(shipmentServices.organizationId, scope.organization.id))).limit(1);
  if (!current[0]) return null;
  if (!isAllowedSpecialServiceTransition(current[0].status, input.status)) throw new Error("Transición de servicio especial no permitida");
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

export async function refundPaymentForUser(userId: number, input: { paymentId: number; reason: string; cashSessionId?: number }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const paymentRows = await db.select().from(payments).where(and(eq(payments.id, input.paymentId), eq(payments.organizationId, scope.organization.id))).limit(1);
  const payment = paymentRows[0];
  if (!payment || payment.status !== "collected") return null;
  if (payment.method === "cash") {
    if (!input.cashSessionId) return null;
    const session = await db.select({ id: cashSessions.id }).from(cashSessions).where(and(eq(cashSessions.id, input.cashSessionId), eq(cashSessions.organizationId, scope.organization.id), eq(cashSessions.status, "open"))).limit(1);
    if (!session[0]) return null;
  } else if (input.cashSessionId) {
    return null;
  }
  await db.transaction(async (tx) => {
    await tx.update(payments).set({ status: "refunded", reference: `${payment.reference ?? ""}${payment.reference ? " | " : ""}REFUND: ${input.reason}`.slice(0, 160) }).where(and(eq(payments.id, payment.id), eq(payments.organizationId, scope.organization.id), eq(payments.status, "collected")));
    if (payment.method === "cash" && input.cashSessionId) await tx.insert(cashMovements).values({ organizationId: scope.organization.id, cashSessionId: input.cashSessionId, paymentId: payment.id, movementType: "refund", amount: payment.amount, note: input.reason, actorUserId: userId });
    await tx.update(shipments).set({ financialStatus: "unpaid" }).where(and(eq(shipments.id, payment.shipmentId), eq(shipments.organizationId, scope.organization.id), eq(shipments.financialStatus, "paid")));
  });
  const updated = await db.select().from(payments).where(and(eq(payments.id, payment.id), eq(payments.organizationId, scope.organization.id))).limit(1);
  return updated[0] ?? null;
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
  if (!(await branchBelongsToOrganization(db, input.organizationId, input.branchId ?? undefined))) return false;
  await db.insert(shipmentEvents).values(input);
  await dispatchWebhooksForEvent(input.organizationId, input.eventType, { shipmentId: input.shipmentId, eventId: input.idempotencyKey, origin: input.origin }).catch(() => undefined);
  return true;
}

type RolePermissionAction = "view" | "create" | "edit" | "approve" | "assign" | "collect" | "refund" | "export" | "configure";

export async function listRolePermissionsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(rolePermissions).where(eq(rolePermissions.organizationId, scope.organization.id)).orderBy(rolePermissions.role, rolePermissions.resource, rolePermissions.action).limit(1000);
}

export async function grantRolePermissionForUser(userId: number, input: { role: string; resource: string; action: RolePermissionAction }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const existing = await db.select().from(rolePermissions).where(and(eq(rolePermissions.organizationId, scope.organization.id), eq(rolePermissions.role, input.role), eq(rolePermissions.resource, input.resource), eq(rolePermissions.action, input.action))).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(rolePermissions).values({ organizationId: scope.organization.id, role: input.role, resource: input.resource, action: input.action });
  const rows = await db.select().from(rolePermissions).where(and(eq(rolePermissions.organizationId, scope.organization.id), eq(rolePermissions.role, input.role), eq(rolePermissions.resource, input.resource), eq(rolePermissions.action, input.action))).limit(1);
  return rows[0] ?? null;
}

export async function revokeRolePermissionForUser(userId: number, permissionId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(rolePermissions).where(and(eq(rolePermissions.id, permissionId), eq(rolePermissions.organizationId, scope.organization.id))).limit(1);
  if (!rows[0]) return null;
  await db.delete(rolePermissions).where(and(eq(rolePermissions.id, permissionId), eq(rolePermissions.organizationId, scope.organization.id)));
  return rows[0];
}

export async function listMembershipsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ membership: memberships, user: { id: users.id, name: users.name, email: users.email }, branch: { id: branches.id, name: branches.name, code: branches.code }, warehouse: { id: warehouses.id, name: warehouses.name, code: warehouses.code } })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .leftJoin(branches, eq(memberships.branchId, branches.id))
    .leftJoin(warehouses, eq(memberships.warehouseId, warehouses.id))
    .where(eq(memberships.organizationId, scope.organization.id))
    .orderBy(users.name)
    .limit(250);
}

export async function updateMembershipScopeForUser(userId: number, input: { membershipId: number; branchId?: number | null; warehouseId?: number | null }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const membership = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, scope.organization.id))).limit(1);
  if (!membership[0]) return null;
  if (input.branchId !== undefined && !(await branchBelongsToOrganization(db, scope.organization.id, input.branchId ?? undefined))) return null;
  if (input.warehouseId !== undefined && !(await warehouseBelongsToOrganization(db, scope.organization.id, input.warehouseId ?? undefined))) return null;
  await db.update(memberships).set({ branchId: input.branchId === undefined ? undefined : input.branchId, warehouseId: input.warehouseId === undefined ? undefined : input.warehouseId }).where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, scope.organization.id)));
  const rows = await db.select().from(memberships).where(and(eq(memberships.id, input.membershipId), eq(memberships.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
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

export async function listRouteExpensesForUser(userId: number, routeId?: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const filters = [eq(routeExpenses.organizationId, scope.organization.id)];
  if (routeId !== undefined) filters.push(eq(routeExpenses.routeId, routeId));
  if (scope.membership?.role === "driver") filters.push(eq(routeExpenses.driverUserId, userId));
  return db.select().from(routeExpenses).where(and(...filters)).orderBy(desc(routeExpenses.createdAt)).limit(100);
}

export async function createRouteExpenseForUser(userId: number, input: { routeId: number; expenseType: "fuel" | "toll" | "parking" | "meal" | "other"; amount: string; description: string; receiptUrl?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !/^\d+(\.\d{1,2})?$/.test(input.amount) || Number(input.amount) <= 0 || Number(input.amount) > 100000) return null;
  const routeRows = await db.select({ id: routes.id, driverUserId: routes.driverUserId, status: routes.status }).from(routes).where(and(eq(routes.id, input.routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  const route = routeRows[0];
  if (!route || !route.driverUserId) return null;
  if (scope.membership?.role === "driver" && (route.driverUserId !== userId || route.status !== "active")) return null;
  await db.insert(routeExpenses).values({ organizationId: scope.organization.id, routeId: route.id, driverUserId: route.driverUserId, expenseType: input.expenseType, amount: input.amount, currency: "DOP", description: input.description.trim(), receiptUrl: input.receiptUrl?.trim() || null });
  const rows = await db.select().from(routeExpenses).where(and(eq(routeExpenses.organizationId, scope.organization.id), eq(routeExpenses.routeId, route.id), eq(routeExpenses.driverUserId, route.driverUserId))).orderBy(desc(routeExpenses.id)).limit(1);
  return rows[0] ?? null;
}

export async function reviewRouteExpenseForUser(userId: number, expenseId: number, nextStatus: "approved" | "rejected" | "reimbursed") {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(routeExpenses).where(and(eq(routeExpenses.id, expenseId), eq(routeExpenses.organizationId, scope.organization.id))).limit(1);
  const expense = rows[0];
  if (!expense || (nextStatus === "reimbursed" ? expense.status !== "approved" : expense.status !== "submitted")) return null;
  await db.update(routeExpenses).set({ status: nextStatus, reviewedBy: userId, reviewedAt: new Date() }).where(and(eq(routeExpenses.id, expenseId), eq(routeExpenses.organizationId, scope.organization.id)));
  const updated = await db.select().from(routeExpenses).where(and(eq(routeExpenses.id, expenseId), eq(routeExpenses.organizationId, scope.organization.id))).limit(1);
  return updated[0] ?? null;
}

export async function listRoutesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(routes).where(eq(routes.organizationId, scope.organization.id)).orderBy(desc(routes.createdAt)).limit(100);
}

export async function listAssignedRoutesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(routes).where(and(eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).orderBy(desc(routes.createdAt)).limit(50);
}

export async function listAssignedRouteStopsForUser(userId: number, routeId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ id: routeStops.id, organizationId: routeStops.organizationId, routeId: routeStops.routeId, shipmentId: routeStops.shipmentId, pickupId: routeStops.pickupId, sequence: routeStops.sequence, address: routeStops.address, latitude: routeStops.latitude, longitude: routeStops.longitude, status: routeStops.status, createdAt: routeStops.createdAt }).from(routeStops).innerJoin(routes, eq(routeStops.routeId, routes.id)).where(and(eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, routeId), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).orderBy(routeStops.sequence);
}

export async function isRouteAssignedToUser(userId: number, routeId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ id: routes.id }).from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).limit(1);
  return Boolean(rows[0]);
}

export async function isRouteStopAssignedToUser(userId: number, stopId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ id: routeStops.id }).from(routeStops).innerJoin(routes, eq(routeStops.routeId, routes.id)).where(and(eq(routeStops.id, stopId), eq(routeStops.organizationId, scope.organization.id), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).limit(1);
  return Boolean(rows[0]);
}

export async function isActiveRouteStopAssignedToUser(userId: number, stopId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ id: routeStops.id }).from(routeStops).innerJoin(routes, eq(routeStops.routeId, routes.id)).where(and(eq(routeStops.id, stopId), eq(routeStops.organizationId, scope.organization.id), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId), eq(routes.status, "active"))).limit(1);
  return Boolean(rows[0]);
}

export async function isShipmentOnAssignedRouteForUser(userId: number, shipmentId: number, routeId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return false;
  const rows = await db.select({ stopId: routeStops.id }).from(routeStops).innerJoin(routes, eq(routeStops.routeId, routes.id)).where(and(eq(routeStops.shipmentId, shipmentId), eq(routeStops.routeId, routeId), eq(routeStops.organizationId, scope.organization.id), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).limit(1);
  return Boolean(rows[0]);
}

export async function updateAssignedRouteForUser(userId: number, routeId: number, nextStatus: "active" | "closed") {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId))).limit(1);
  const route = rows[0];
  if (!route) return null;
  if (nextStatus === "active" && route.status !== "assigned") throw new Error("Solo una ruta asignada puede iniciar turno");
  if (nextStatus === "closed" && route.status !== "active") throw new Error("Solo una ruta activa puede cerrarse");
  await db.update(routes).set(nextStatus === "active" ? { status: "active", startedAt: new Date() } : { status: "closed", closedAt: new Date() }).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id), eq(routes.driverUserId, userId)));
  const updated = await db.select().from(routes).where(and(eq(routes.id, routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
  return updated[0] ?? null;
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

export type ApiIdempotencyBeginInput = { organizationId: number; apiKeyId: number; idempotencyKey: string; method: string; route: string; requestHash: string };
export type ApiIdempotencyBeginResult = { status: "new"; id: number } | { status: "replay"; statusCode: number; body: unknown } | { status: "conflict" } | { status: "in_flight" };

export async function beginApiIdempotencyForRequest(input: ApiIdempotencyBeginInput): Promise<ApiIdempotencyBeginResult | null> {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const existing = await db.select().from(apiIdempotencyKeys).where(and(eq(apiIdempotencyKeys.organizationId, input.organizationId), eq(apiIdempotencyKeys.apiKeyId, input.apiKeyId), eq(apiIdempotencyKeys.idempotencyKey, input.idempotencyKey))).limit(1);
  if (existing[0] && existing[0].expiresAt > now) {
    if (existing[0].requestHash !== input.requestHash || existing[0].method !== input.method || existing[0].route !== input.route) return { status: "conflict" };
    if (existing[0].responseStatus !== null && existing[0].responseBody !== null) return { status: "replay", statusCode: existing[0].responseStatus, body: existing[0].responseBody };
    return { status: "in_flight" };
  }
  if (existing[0]) await db.delete(apiIdempotencyKeys).where(eq(apiIdempotencyKeys.id, existing[0].id));
  try {
    await db.insert(apiIdempotencyKeys).values({ ...input, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) });
    const created = await db.select({ id: apiIdempotencyKeys.id }).from(apiIdempotencyKeys).where(and(eq(apiIdempotencyKeys.organizationId, input.organizationId), eq(apiIdempotencyKeys.apiKeyId, input.apiKeyId), eq(apiIdempotencyKeys.idempotencyKey, input.idempotencyKey))).limit(1);
    return created[0] ? { status: "new", id: created[0].id } : null;
  } catch {
    const raced = await db.select().from(apiIdempotencyKeys).where(and(eq(apiIdempotencyKeys.organizationId, input.organizationId), eq(apiIdempotencyKeys.apiKeyId, input.apiKeyId), eq(apiIdempotencyKeys.idempotencyKey, input.idempotencyKey))).limit(1);
    if (!raced[0]) return null;
    if (raced[0].requestHash !== input.requestHash || raced[0].method !== input.method || raced[0].route !== input.route) return { status: "conflict" };
    if (raced[0].responseStatus !== null && raced[0].responseBody !== null) return { status: "replay", statusCode: raced[0].responseStatus, body: raced[0].responseBody };
    return { status: "in_flight" };
  }
}
export async function completeApiIdempotencyForRequest(id: number, responseStatus: number, responseBody: unknown, resourceType?: string, resourceId?: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(apiIdempotencyKeys).set({ responseStatus, responseBody: responseBody as never, resourceType, resourceId }).where(eq(apiIdempotencyKeys.id, id));
  return result[0].affectedRows > 0;
}
export async function releaseApiIdempotencyForRequest(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(apiIdempotencyKeys).where(eq(apiIdempotencyKeys.id, id));
  return result[0].affectedRows > 0;
}
export async function recordApiRequestLog(input: { organizationId?: number; apiKeyId?: number; requestId: string; method: string; route: string; statusCode: number; success: boolean; errorCode?: string; idempotencyKey?: string }) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(apiRequestLogs).values(input);
  return true;
}
export async function listApiRequestLogsForUser(userId: number, filters?: { statusCode?: number; route?: string }) {
  const db = await getDb();
  const scope = await getOrganizationForUser(userId);
  if (!db || !scope) return [];
  const conditions = [eq(apiRequestLogs.organizationId, scope.organization.id)];
  if (filters?.statusCode) conditions.push(eq(apiRequestLogs.statusCode, filters.statusCode));
  if (filters?.route) conditions.push(eq(apiRequestLogs.route, filters.route));
  return db.select().from(apiRequestLogs).where(and(...conditions)).orderBy(desc(apiRequestLogs.createdAt)).limit(200);
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

export function canDriverRecordGps(role: string | undefined, input: { routeId?: number | null; routeAssigned: boolean; routeActive: boolean; shipmentId?: number | null; shipmentOnRoute: boolean }) {
  if (role !== "driver") return true;
  return Boolean(input.routeId && input.routeAssigned && input.routeActive && (!input.shipmentId || input.shipmentOnRoute));
}

export async function recordTrackingPoint(userId: number, input: Omit<typeof trackingPoints.$inferInsert, "organizationId" | "driverUserId">) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  if (!input.shipmentId && !input.routeId) return null;
  if (input.shipmentId) {
    const shipment = await db.select({ id: shipments.id }).from(shipments).where(and(eq(shipments.id, input.shipmentId), eq(shipments.organizationId, scope.organization.id))).limit(1);
    if (!shipment[0]) return null;
  }
  let routeAssigned = false;
  let routeActive = false;
  let shipmentOnRoute = !input.shipmentId;
  if (input.routeId) {
    const route = await db.select({ id: routes.id, driverUserId: routes.driverUserId, status: routes.status }).from(routes).where(and(eq(routes.id, input.routeId), eq(routes.organizationId, scope.organization.id))).limit(1);
    if (!route[0]) return null;
    routeAssigned = route[0].driverUserId === userId;
    routeActive = route[0].status === "active";
    if (input.shipmentId) {
      const stop = await db.select({ id: routeStops.id }).from(routeStops).where(and(eq(routeStops.organizationId, scope.organization.id), eq(routeStops.routeId, input.routeId), eq(routeStops.shipmentId, input.shipmentId))).limit(1);
      shipmentOnRoute = Boolean(stop[0]);
    }
  }
  if (!canDriverRecordGps(scope.membership?.role, { routeId: input.routeId, routeAssigned, routeActive, shipmentId: input.shipmentId, shipmentOnRoute })) return null;
  await db.insert(trackingPoints).values({ ...input, organizationId: scope.organization.id, driverUserId: userId });
  await dispatchWebhooksForEvent(scope.organization.id, "tracking_point_recorded", { shipmentId: input.shipmentId, routeId: input.routeId, latitude: input.latitude, longitude: input.longitude, capturedAt: input.capturedAt }).catch(() => undefined);
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


export async function listOrganizationsForSuperAdmin(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const actor = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (actor[0]?.role !== "admin") return null;
  return db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(500);
}

export async function updateOrganizationStatusForSuperAdmin(userId: number, organizationId: number, status: "trial" | "active" | "suspended") {
  const db = await getDb();
  if (!db) return null;
  const actor = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (actor[0]?.role !== "admin") return null;
  const current = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (!current[0]) return null;
  await db.update(organizations).set({ status }).where(eq(organizations.id, organizationId));
  const updated = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  return { before: current[0], after: updated[0] ?? null };
}


export async function listWebhookEndpointsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select({ id: webhookEndpoints.id, organizationId: webhookEndpoints.organizationId, name: webhookEndpoints.name, url: webhookEndpoints.url, subscribedEvents: webhookEndpoints.subscribedEvents, isActive: webhookEndpoints.isActive, createdBy: webhookEndpoints.createdBy, createdAt: webhookEndpoints.createdAt, updatedAt: webhookEndpoints.updatedAt }).from(webhookEndpoints).where(eq(webhookEndpoints.organizationId, scope.organization.id)).orderBy(desc(webhookEndpoints.createdAt)).limit(100);
}

export async function createWebhookEndpointForUser(userId: number, input: { name: string; url: string; secret: string; subscribedEvents: string[] }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope || !/^https:\/\//i.test(input.url) || input.secret.length < 16 || input.subscribedEvents.length < 1) return null;
  const encrypted = encryptWebhookSecret(input.secret, process.env.JWT_SECRET ?? "");
  const inserted = await db.insert(webhookEndpoints).values({ organizationId: scope.organization.id, name: input.name.trim(), url: input.url.trim(), secretCiphertext: encrypted, subscribedEvents: input.subscribedEvents, isActive: true, createdBy: userId });
  const rows = await db.select({ id: webhookEndpoints.id, organizationId: webhookEndpoints.organizationId, name: webhookEndpoints.name, url: webhookEndpoints.url, subscribedEvents: webhookEndpoints.subscribedEvents, isActive: webhookEndpoints.isActive, createdBy: webhookEndpoints.createdBy, createdAt: webhookEndpoints.createdAt, updatedAt: webhookEndpoints.updatedAt }).from(webhookEndpoints).where(and(eq(webhookEndpoints.id, Number(inserted[0].insertId)), eq(webhookEndpoints.organizationId, scope.organization.id))).limit(1);
  return rows[0] ?? null;
}

export async function dispatchWebhooksForEvent(organizationId: number, eventType: string, data: unknown) {
  const db = await getDb();
  if (!db) return;
  const endpoints = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.organizationId, organizationId), eq(webhookEndpoints.isActive, true))).limit(100);
  for (const endpoint of endpoints) {
    const events = endpoint.subscribedEvents as unknown;
    if (!Array.isArray(events) || !events.includes(eventType)) continue;
    const payloadHash = createHash("sha256").update(JSON.stringify({ type: eventType, data })).digest("hex");
    const inserted = await db.insert(webhookDeliveries).values({ organizationId, endpointId: endpoint.id, eventType, payloadHash, status: "pending", attempts: 0 });
    const deliveryId = Number(inserted[0].insertId);
    let result: { ok: boolean; status: number } | null = null; let lastError: string | null = null; let attempts = 0;
    for (let attempt = 1; attempt <= 3; attempt += 1) { attempts = attempt; try { result = await deliverWebhook(endpoint.url, decryptWebhookSecret(endpoint.secretCiphertext, process.env.JWT_SECRET ?? ""), eventType, data); if (result.ok) break; lastError = `HTTP ${result.status}`; } catch (error) { lastError = error instanceof Error ? error.message.slice(0, 500) : "Webhook delivery failed"; } }
    const delivered = Boolean(result?.ok);
    await db.update(webhookDeliveries).set({ status: delivered ? "delivered" : "exhausted", attempts, responseStatus: result?.status ?? null, lastError: delivered ? null : lastError, deliveredAt: delivered ? new Date() : null }).where(and(eq(webhookDeliveries.id, deliveryId), eq(webhookDeliveries.organizationId, organizationId)));
  }
}

export async function dispatchWebhookForUser(userId: number, input: { endpointId: number; eventType: string; data: unknown }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const rows = await db.select().from(webhookEndpoints).where(and(eq(webhookEndpoints.id, input.endpointId), eq(webhookEndpoints.organizationId, scope.organization.id), eq(webhookEndpoints.isActive, true))).limit(1);
  const endpoint = rows[0];
  const subscribed = endpoint?.subscribedEvents as unknown;
  if (!endpoint || !Array.isArray(subscribed) || !subscribed.includes(input.eventType)) return null;
  const payloadHash = createHash("sha256").update(JSON.stringify({ type: input.eventType, data: input.data })).digest("hex");
  const inserted = await db.insert(webhookDeliveries).values({ organizationId: scope.organization.id, endpointId: endpoint.id, eventType: input.eventType, payloadHash, status: "pending", attempts: 0 });
  const deliveryId = Number(inserted[0].insertId);
  let result: { ok: boolean; status: number } | null = null;
  let lastError: string | null = null;
  let attemptCount = 0;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attemptCount = attempt;
    try {
      result = await deliverWebhook(endpoint.url, decryptWebhookSecret(endpoint.secretCiphertext, process.env.JWT_SECRET ?? ""), input.eventType, input.data);
      if (result.ok) break;
      lastError = `HTTP ${result.status}`;
    } catch (error) { lastError = error instanceof Error ? error.message.slice(0, 500) : "Webhook delivery failed"; }
  }
  const delivered = Boolean(result?.ok);
  await db.update(webhookDeliveries).set({ status: delivered ? "delivered" : "exhausted", attempts: attemptCount, responseStatus: result?.status ?? null, lastError: delivered ? null : lastError, deliveredAt: delivered ? new Date() : null }).where(and(eq(webhookDeliveries.id, deliveryId), eq(webhookDeliveries.organizationId, scope.organization.id)));
  return { deliveryId, status: delivered ? "delivered" : "exhausted", responseStatus: result?.status ?? null } as const;
}


export async function listWebhookDeliveriesForUser(userId: number, filters?: { endpointId?: number; eventType?: string; status?: "pending" | "delivered" | "failed" | "exhausted" }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  const conditions = [eq(webhookDeliveries.organizationId, scope.organization.id)];
  if (filters?.endpointId) conditions.push(eq(webhookDeliveries.endpointId, filters.endpointId));
  if (filters?.eventType) conditions.push(eq(webhookDeliveries.eventType, filters.eventType));
  if (filters?.status) conditions.push(eq(webhookDeliveries.status, filters.status));
  return db.select({ id: webhookDeliveries.id, organizationId: webhookDeliveries.organizationId, endpointId: webhookDeliveries.endpointId, eventType: webhookDeliveries.eventType, payloadHash: webhookDeliveries.payloadHash, status: webhookDeliveries.status, attempts: webhookDeliveries.attempts, responseStatus: webhookDeliveries.responseStatus, lastError: webhookDeliveries.lastError, nextAttemptAt: webhookDeliveries.nextAttemptAt, deliveredAt: webhookDeliveries.deliveredAt, createdAt: webhookDeliveries.createdAt, updatedAt: webhookDeliveries.updatedAt }).from(webhookDeliveries).where(and(...conditions)).orderBy(desc(webhookDeliveries.createdAt)).limit(200);
}


const pickupTransitions: Record<string, string[]> = { requested: ["assigned", "cancelled"], assigned: ["en_route", "cancelled"], en_route: ["collected", "failed", "cancelled"], collected: [], failed: [], cancelled: [] };

export function isAllowedPickupTransition(currentStatus: string, nextStatus: string) {
  return pickupTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export async function updatePickupStatusForUser(userId: number, input: { pickupId: number; status: "assigned" | "en_route" | "collected" | "failed" | "cancelled"; evidenceUrl?: string; failureReason?: string; notes?: string }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  const current = await db.select().from(pickups).where(and(eq(pickups.id, input.pickupId), eq(pickups.organizationId, scope.organization.id))).limit(1);
  if (!current[0] || !pickupTransitions[current[0].status]?.includes(input.status)) return null;
  if (input.status === "failed" && !input.failureReason?.trim()) return null;
  await db.update(pickups).set({ status: input.status, evidenceUrl: input.evidenceUrl ?? current[0].evidenceUrl, failureReason: input.failureReason ?? null, notes: input.notes ?? current[0].notes, statusChangedAt: new Date(), statusChangedBy: userId }).where(and(eq(pickups.id, input.pickupId), eq(pickups.organizationId, scope.organization.id), eq(pickups.status, current[0].status)));
  const updated = await db.select().from(pickups).where(and(eq(pickups.id, input.pickupId), eq(pickups.organizationId, scope.organization.id))).limit(1);
  if (!updated[0]) return null;
  await dispatchWebhooksForEvent(scope.organization.id, "pickup_status_changed", { pickupId: input.pickupId, shipmentId: updated[0].shipmentId, status: input.status, failureReason: input.failureReason }).catch(() => undefined);
  return { previousStatus: current[0].status, pickup: updated[0] };
}
