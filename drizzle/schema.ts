import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, uniqueIndex } from "drizzle-orm/mysql-core";

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

export const customerProfiles = mysqlTable("customer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  customerType: mysqlEnum("customerType", ["individual", "business"]).notNull().default("individual"),
  legalName: varchar("legalName", { length: 220 }),
  phone: varchar("phone", { length: 40 }),
  taxId: varchar("taxId", { length: 80 }),
  preferredLanguage: varchar("preferredLanguage", { length: 8 }).notNull().default("es"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerAddresses = mysqlTable("customer_addresses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 80 }).notNull(),
  recipientName: varchar("recipientName", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  addressLine1: varchar("addressLine1", { length: 240 }).notNull(),
  addressLine2: varchar("addressLine2", { length: 240 }),
  city: varchar("city", { length: 120 }).notNull(),
  province: varchar("province", { length: 120 }).notNull(),
  country: varchar("country", { length: 80 }).notNull().default("DO"),
  postalCode: varchar("postalCode", { length: 24 }),
  deliveryInstructions: text("deliveryInstructions"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isDefault: boolean("isDefault").notNull().default(false),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerContacts = mysqlTable("customer_contacts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  relationship: varchar("relationship", { length: 80 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 320 }),
  notes: text("notes"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  shipmentId: int("shipmentId"),
  subject: varchar("subject", { length: 180 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["shipment", "billing", "pickup", "delivery", "account", "other"]).notNull().default("other"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).notNull().default("normal"),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_customer", "resolved", "closed"]).notNull().default("open"),
  resolution: text("resolution"),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  legalName: varchar("legalName", { length: 220 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  country: varchar("country", { length: 80 }).notNull().default("DO"),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  language: varchar("language", { length: 8 }).notNull().default("es"),
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
  serviceType: mysqlEnum("serviceType", ["local", "national", "international", "assisted_purchase", "heavy_cargo", "moving"]).notNull().default("national"),
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
  deliveryPinHash: varchar("deliveryPinHash", { length: 128 }),
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
  warehouseId: int("warehouseId"),
  locationCode: varchar("locationCode", { length: 80 }),
  barcodeValue: varchar("barcodeValue", { length: 120 }),
  parentPackageId: int("parentPackageId"),
  packagingStatus: mysqlEnum("packagingStatus", ["standard", "split_parent", "split_child", "repacked"]).notNull().default("standard"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shipmentServices = mysqlTable("shipment_services", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  serviceType: mysqlEnum("serviceType", ["assisted_purchase", "heavy_cargo", "moving"]).notNull(),
  quoteReference: varchar("quoteReference", { length: 160 }),
  handlingNotes: text("handlingNotes"),
  scheduledAt: timestamp("scheduledAt"),
  requiresTwoPersonCrew: boolean("requiresTwoPersonCrew").notNull().default(false),
  requiresSpecialVehicle: boolean("requiresSpecialVehicle").notNull().default(false),
  crewSize: int("crewSize").notNull().default(1),
  vehicleType: varchar("vehicleType", { length: 100 }),
  status: mysqlEnum("status", ["requested", "quoted", "awaiting_approval", "approved", "purchasing", "purchased", "fulfillment", "scheduled", "in_progress", "completed", "cancelled", "rejected"]).notNull().default("requested"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  reason: text("reason"),
  evidenceUrl: text("evidenceUrl"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull().unique(),
  origin: varchar("origin", { length: 80 }).notNull().default("system"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 24 }).notNull(),
  secretHash: varchar("secretHash", { length: 128 }).notNull(),
  scopes: text("scopes").notNull(),
  revokedAt: timestamp("revokedAt"),
  lastUsedAt: timestamp("lastUsedAt"),
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
  evidenceUrl: varchar("evidenceUrl", { length: 1000 }),
  failureReason: varchar("failureReason", { length: 500 }),
  statusChangedAt: timestamp("statusChangedAt"),
  statusChangedBy: int("statusChangedBy"),
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

export const routeExpenses = mysqlTable("route_expenses", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  routeId: int("routeId").notNull(),
  driverUserId: int("driverUserId").notNull(),
  expenseType: mysqlEnum("expenseType", ["fuel", "toll", "parking", "meal", "other"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  description: varchar("description", { length: 500 }).notNull(),
  receiptUrl: text("receiptUrl"),
  status: mysqlEnum("status", ["submitted", "approved", "rejected", "reimbursed"]).notNull().default("submitted"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

export const tariffZones = mysqlTable("tariff_zones", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  originCountry: varchar("originCountry", { length: 80 }).notNull().default("DO"),
  destinationCountry: varchar("destinationCountry", { length: 80 }).notNull().default("DO"),
  originPostalPrefix: varchar("originPostalPrefix", { length: 20 }),
  destinationPostalPrefix: varchar("destinationPostalPrefix", { length: 20 }),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tariffs = mysqlTable("tariffs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  serviceType: varchar("serviceType", { length: 48 }).notNull(),
  zoneId: int("zoneId"),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  minAmount: decimal("minAmount", { precision: 12, scale: 2 }).notNull().default("0"),
  perKg: decimal("perKg", { precision: 12, scale: 2 }).notNull().default("0"),
  perKm: decimal("perKm", { precision: 12, scale: 2 }).notNull().default("0"),
  fixedSurcharge: decimal("fixedSurcharge", { precision: 12, scale: 2 }).notNull().default("0"),
  fuelSurchargePct: decimal("fuelSurchargePct", { precision: 6, scale: 3 }).notNull().default("0"),
  discountPct: decimal("discountPct", { precision: 6, scale: 3 }).notNull().default("0"),
  taxPct: decimal("taxPct", { precision: 6, scale: 3 }).notNull().default("0"),
  volumetricDivisor: decimal("volumetricDivisor", { precision: 10, scale: 2 }).notNull().default("5000"),
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

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  packageId: int("packageId").notNull(),
  warehouseId: int("warehouseId"),
  movementType: mysqlEnum("movementType", ["received", "inspected", "putaway", "transfer_out", "transfer_in", "dispatch", "adjustment"]).notNull(),
  fromLocation: varchar("fromLocation", { length: 80 }),
  toLocation: varchar("toLocation", { length: 80 }),
  note: text("note"),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const consolidations = mysqlTable("consolidations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  fromBranchId: int("fromBranchId"),
  toBranchId: int("toBranchId"),
  status: mysqlEnum("status", ["open", "sealed", "in_transit", "received", "reconciled"]).notNull().default("open"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const consolidationItems = mysqlTable("consolidation_items", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  consolidationId: int("consolidationId").notNull(),
  packageId: int("packageId").notNull(),
  sequence: int("sequence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shipmentIncidents = mysqlTable("shipment_incidents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  packageId: int("packageId"),
  type: mysqlEnum("type", ["damage", "address", "recipient_unavailable", "customs", "other", "return_requested"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "returned"]).notNull().default("open"),
  description: text("description").notNull(),
  resolution: text("resolution"),
  reportedBy: int("reportedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deliveryAttempts = mysqlTable("delivery_attempts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  routeStopId: int("routeStopId"),
  attemptNumber: int("attemptNumber").notNull(),
  status: mysqlEnum("status", ["failed", "rescheduled", "completed"]).notNull(),
  reason: varchar("reason", { length: 160 }).notNull(),
  note: text("note"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  attemptedBy: int("attemptedBy"),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  method: mysqlEnum("method", ["cash", "card", "transfer", "other"]).notNull(),
  status: mysqlEnum("status", ["pending", "collected", "voided", "refunded"]).notNull().default("pending"),
  reference: varchar("reference", { length: 160 }),
  collectedBy: int("collectedBy"),
  collectedAt: timestamp("collectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cashSessions = mysqlTable("cash_sessions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  branchId: int("branchId").notNull(),
  openedBy: int("openedBy").notNull(),
  status: mysqlEnum("status", ["open", "closed"]).notNull().default("open"),
  openingAmount: decimal("openingAmount", { precision: 12, scale: 2 }).notNull().default("0"),
  closingAmount: decimal("closingAmount", { precision: 12, scale: 2 }),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export const cashMovements = mysqlTable("cash_movements", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  cashSessionId: int("cashSessionId").notNull(),
  paymentId: int("paymentId"),
  movementType: mysqlEnum("movementType", ["collection", "refund", "adjustment", "deposit"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  shipmentId: int("shipmentId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 48 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "issued", "paid", "voided"]).notNull().default("draft"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("DOP"),
  issuedBy: int("issuedBy"),
  issuedAt: timestamp("issuedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  paymentId: int("paymentId").notNull(),
  receiptNumber: varchar("receiptNumber", { length: 48 }).notNull().unique(),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const apiIdempotencyKeys = mysqlTable("api_idempotency_keys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  apiKeyId: int("apiKeyId").notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }).notNull(),
  method: varchar("method", { length: 12 }).notNull(),
  route: varchar("route", { length: 160 }).notNull(),
  requestHash: varchar("requestHash", { length: 64 }).notNull(),
  responseStatus: int("responseStatus"),
  responseBody: json("responseBody"),
  resourceType: varchar("resourceType", { length: 64 }),
  resourceId: int("resourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  scopeKey: uniqueIndex("api_idempotency_scope_key").on(table.organizationId, table.apiKeyId, table.idempotencyKey),
}));

export const apiRequestLogs = mysqlTable("api_request_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  apiKeyId: int("apiKeyId"),
  requestId: varchar("requestId", { length: 80 }).notNull(),
  method: varchar("method", { length: 12 }).notNull(),
  route: varchar("route", { length: 160 }).notNull(),
  statusCode: int("statusCode"),
  success: boolean("success").notNull().default(false),
  errorCode: varchar("errorCode", { length: 80 }),
  idempotencyKey: varchar("idempotencyKey", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  requestIdKey: uniqueIndex("api_request_logs_request_id_key").on(table.requestId),
}));

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

export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  secretCiphertext: text("secretCiphertext").notNull(),
  subscribedEvents: json("subscribedEvents").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  endpointId: int("endpointId").notNull(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  payloadHash: varchar("payloadHash", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "delivered", "failed", "exhausted"]).notNull().default("pending"),
  attempts: int("attempts").notNull().default(0),
  responseStatus: int("responseStatus"),
  lastError: varchar("lastError", { length: 500 }),
  nextAttemptAt: timestamp("nextAttemptAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type CustomerContact = typeof customerContacts.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type ShipmentEvent = typeof shipmentEvents.$inferSelect;
export type ShipmentService = typeof shipmentServices.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Consolidation = typeof consolidations.$inferSelect;
export type ConsolidationItem = typeof consolidationItems.$inferSelect;
export type ShipmentIncident = typeof shipmentIncidents.$inferSelect;
export type DeliveryAttempt = typeof deliveryAttempts.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type CashSession = typeof cashSessions.$inferSelect;
export type CashMovement = typeof cashMovements.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ApiIdempotencyKey = typeof apiIdempotencyKeys.$inferSelect;
export type ApiRequestLog = typeof apiRequestLogs.$inferSelect;
export type Pickup = typeof pickups.$inferSelect;
export type Route = typeof routes.$inferSelect;
export type RouteStop = typeof routeStops.$inferSelect;
export type Manifest = typeof manifests.$inferSelect;
export type TariffZone = typeof tariffZones.$inferSelect;
export type Tariff = typeof tariffs.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ShipmentDocument = typeof shipmentDocuments.$inferSelect;
export type TrackingPoint = typeof trackingPoints.$inferSelect;
