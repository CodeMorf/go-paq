import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, apiKeys, auditLogs, manifests, memberships, organizations, pickups, rolePermissions, routeStops, routes, shipmentDocuments, shipmentEvents, shipments, trackingPoints, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { issueApiKey, verifyApiKey } from "./apiKeys";
import { storagePut } from "./storage";
import { nextManifestStatus } from "./manifestState";

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

export async function getPublicTrackingByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const query = db.select({ trackingCode: shipments.trackingCode, serviceType: shipments.serviceType, physicalStatus: shipments.physicalStatus, transportStatus: shipments.transportStatus, originCountry: shipments.originCountry, destinationCountry: shipments.destinationCountry, updatedAt: shipments.updatedAt }).from(shipments).where(eq(shipments.trackingCode, code)).limit(1);
  const result = await Promise.race([query, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("tracking_timeout")), 750))]).catch(() => []);
  const shipment = result[0];
  if (!shipment) return null;
  return { ...shipment, message: shipment.physicalStatus === "delivered" ? "Spedizione consegnata" : "Spedizione monitorata da GoPaq" };
}

export async function updateOrganizationProfileForUser(userId: number, input: { country: string; language: string; currency: string; timezone: string; activeServices: string[] }) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
  await db.update(organizations).set(input).where(eq(organizations.id, scope.organization.id));
  return { success: true } as const;
}

export async function listShipmentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId);
  const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipments).where(eq(shipments.organizationId, scope.organization.id)).orderBy(desc(shipments.createdAt)).limit(100);
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
  if (!db) return;
  await db.insert(shipmentEvents).values(input);
}

export async function listPickupsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(pickups).where(eq(pickups.organizationId, scope.organization.id)).orderBy(desc(pickups.createdAt)).limit(100);
}

export async function createPickupForUser(userId: number, input: Omit<typeof pickups.$inferInsert, "organizationId">) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return null;
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

export async function listRoutesForUser(userId: number) {
  const scope = await getOrganizationForUser(userId); const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(routes).where(eq(routes.organizationId, scope.organization.id)).orderBy(desc(routes.createdAt)).limit(100);
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
