import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, auditLogs, memberships, organizations, pickups, rolePermissions, routeStops, routes, shipmentEvents, shipments, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

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

export async function listShipmentsForUser(userId: number) {
  const scope = await getOrganizationForUser(userId);
  const db = await getDb();
  if (!db || !scope) return [];
  return db.select().from(shipments).where(eq(shipments.organizationId, scope.organization.id)).orderBy(desc(shipments.createdAt)).limit(100);
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
