import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  legalName: varchar("legalName", { length: 220 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 80 }).notNull().default("DO"),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  language: varchar("language", { length: 8 }).notNull().default("it"),
  timezone: varchar("timezone", { length: 80 }).notNull().default("America/Santo_Domingo"),
  activeServices: json("activeServices"),
  status: mysqlEnum("status", ["trial", "active", "suspended"]).notNull().default("trial"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  branchId: int("branchId"),
  warehouseId: int("warehouseId"),
  role: mysqlEnum("role", ["owner", "manager", "support", "finance", "supervisor", "warehouse", "dispatcher", "driver", "customer"]).notNull().default("customer"),
  permissions: json("permissions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId"),
  trackingCode: varchar("trackingCode", { length: 48 }).notNull().unique(),
  serviceType: mysqlEnum("serviceType", ["local", "national", "international", "assisted_purchase", "heavy_cargo"]).notNull().default("national"),
  commercialStatus: mysqlEnum("commercialStatus", ["draft", "quoted", "confirmed", "cancelled", "closed"]).notNull().default("draft"),
  physicalStatus: mysqlEnum("physicalStatus", ["expected", "received", "inspection", "ready", "in_transit", "at_destination", "out_for_delivery", "delivered", "incident", "returned"]).notNull().default("expected"),
  transportStatus: mysqlEnum("transportStatus", ["unassigned", "assigned", "route_active", "completed"]).notNull().default("unassigned"),
  financialStatus: mysqlEnum("financialStatus", ["unpaid", "partial", "paid", "refunded"]).notNull().default("unpaid"),
  assistedPurchaseStatus: mysqlEnum("assistedPurchaseStatus", ["none", "requested", "quoted", "approved", "purchased", "received", "reconciled", "rejected"]).notNull().default("none"),
  incidentStatus: mysqlEnum("incidentStatus", ["none", "open", "investigating", "resolved", "returned"]).notNull().default("none"),
  senderName: varchar("senderName", { length: 180 }).notNull(),
  recipientName: varchar("recipientName", { length: 180 }).notNull(),
  originAddress: text("originAddress").notNull(),
  destinationAddress: text("destinationAddress").notNull(),
  originCountry: varchar("originCountry", { length: 80 }).notNull().default("DO"),
  destinationCountry: varchar("destinationCountry", { length: 80 }).notNull().default("DO"),
  estimatedAmount: decimal("estimatedAmount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  organizationId: int("organizationId").notNull(),
  packageCode: varchar("packageCode", { length: 48 }).notNull().unique(),
  description: text("description"),
  restrictions: text("restrictions"),
  status: mysqlEnum("status", ["expected", "received", "inspected", "stored", "dispatched", "delivered", "incident", "returned"]).notNull().default("expected"),
  weightKg: decimal("weightKg", { precision: 9, scale: 3 }),
  volumetricWeightKg: decimal("volumetricWeightKg", { precision: 9, scale: 3 }),
  lengthCm: decimal("lengthCm", { precision: 8, scale: 2 }),
  widthCm: decimal("widthCm", { precision: 8, scale: 2 }),
  heightCm: decimal("heightCm", { precision: 8, scale: 2 }),
  declaredValue: decimal("declaredValue", { precision: 12, scale: 2 }),
  locationCode: varchar("locationCode", { length: 80 }),
  barcodeValue: varchar("barcodeValue", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shipmentEvents = mysqlTable("shipment_events", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  actorUserId: int("actorUserId"),
  branchId: int("branchId"),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  previousStatus: varchar("previousStatus", { length: 80 }),
  nextStatus: varchar("nextStatus", { length: 80 }),
  note: text("note"),
  evidenceUrl: text("evidenceUrl"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull().unique(),
  origin: varchar("origin", { length: 80 }).notNull().default("system"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shipmentDocuments = mysqlTable("shipment_documents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  documentType: mysqlEnum("documentType", ["label", "invoice", "customs", "pod", "incident", "receipt"]).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trackingPoints = mysqlTable("tracking_points", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId"),
  routeId: int("routeId"),
  driverUserId: int("driverUserId"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracyMeters: decimal("accuracyMeters", { precision: 8, scale: 2 }),
  capturedAt: timestamp("capturedAt").notNull(),
  source: mysqlEnum("source", ["driver", "branch", "system"]).notNull().default("driver"),
});

export const pickups = mysqlTable("pickups", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId"),
  address: text("address").notNull(),
  contactName: varchar("contactName", { length: 160 }).notNull(),
  windowStart: timestamp("windowStart"),
  windowEnd: timestamp("windowEnd"),
  status: mysqlEnum("status", ["requested", "assigned", "en_route", "collected", "failed", "cancelled"]).notNull().default("requested"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId"),
  code: varchar("code", { length: 48 }).notNull().unique(),
  driverUserId: int("driverUserId"),
  vehicleLabel: varchar("vehicleLabel", { length: 100 }),
  status: mysqlEnum("status", ["draft", "assigned", "active", "closed"]).notNull().default("draft"),
  startedAt: timestamp("startedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const routeStops = mysqlTable("route_stops", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  routeId: int("routeId").notNull(),
  shipmentId: int("shipmentId"),
  pickupId: int("pickupId"),
  sequence: int("sequence").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  status: mysqlEnum("status", ["pending", "arrived", "completed", "failed", "skipped"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const manifests = mysqlTable("manifests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId"),
  code: varchar("code", { length: 48 }).notNull().unique(),
  direction: mysqlEnum("direction", ["outbound", "inbound", "transfer"]).notNull(),
  status: mysqlEnum("status", ["open", "sealed", "in_transit", "received", "reconciled"]).notNull().default("open"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tariffs = mysqlTable("tariffs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  serviceType: varchar("serviceType", { length: 48 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  minAmount: decimal("minAmount", { precision: 12, scale: 2 }).notNull().default("0"),
  perKg: decimal("perKg", { precision: 12, scale: 2 }).notNull().default("0"),
  perKm: decimal("perKm", { precision: 12, scale: 2 }).notNull().default("0"),
  fuelSurchargePct: decimal("fuelSurchargePct", { precision: 6, scale: 3 }).notNull().default("0"),
  version: int("version").notNull().default(1),
  validFrom: timestamp("validFrom").defaultNow().notNull(),
  validUntil: timestamp("validUntil"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const warehouses = mysqlTable("warehouses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 40 }).notNull(),
  address: text("address"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  role: varchar("role", { length: 48 }).notNull(),
  resource: varchar("resource", { length: 80 }).notNull(),
  action: mysqlEnum("action", ["view", "create", "edit", "approve", "assign", "collect", "refund", "export", "configure"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  actorUserId: int("actorUserId"),
  category: mysqlEnum("category", ["operational", "financial", "security", "llm"]).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }),
  resourceId: varchar("resourceId", { length: 80 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Pickup = typeof pickups.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Manifest = typeof manifests.$inferSelect;
export type Tariff = typeof tariffs.$inferSelect;
export type ShipmentDocument = typeof shipmentDocuments.$inferSelect;
export type TrackingPoint = typeof trackingPoints.$inferSelect;
