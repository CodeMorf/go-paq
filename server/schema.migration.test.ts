import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const expectedTables = ["users", "customer_profiles", "customer_addresses", "customer_contacts", "support_tickets", "organizations", "branches", "memberships", "shipments", "packages", "shipment_services", "shipment_events", "api_keys", "shipment_documents", "tracking_points", "pickups", "routes", "route_stops", "route_expenses", "manifests", "tariff_zones", "tariffs", "warehouses", "role_permissions", "inventory_movements", "consolidations", "consolidation_items", "shipment_incidents", "delivery_attempts", "payments", "cash_sessions", "cash_movements", "invoices", "receipts", "api_idempotency_keys", "api_request_logs", "audit_logs", "webhook_endpoints", "webhook_deliveries"];
const migrationDirectory = resolve(process.cwd(), "drizzle");

function migrationSqlFiles() {
  return readdirSync(migrationDirectory).filter((file) => /^\d+_.+\.sql$/.test(file)).map((file) => resolve(migrationDirectory, file));
}

describe("migraciones de checkout limpio", () => {
  it("incluye la migración inicial referenciada por el journal sin operaciones destructivas", () => {
    const sql = readFileSync(resolve(migrationDirectory, "0000_greedy_black_tom.sql"), "utf8");
    expect(sql).toContain("CREATE TABLE `users`");
    expect(sql.toUpperCase()).not.toMatch(/DROP\s+(TABLE|DATABASE)/);
  });

  it("declara las 39 tablas del schema actual en el conjunto de migraciones", () => {
    const sql = migrationSqlFiles().map((file) => readFileSync(file, "utf8")).join("\n");
    for (const table of expectedTables) expect(sql).toContain(`CREATE TABLE \`${table}\``);
  });

  it("crea la tabla de idempotencia REST con scope único", () => {
    const sql = readFileSync(resolve(migrationDirectory, "0020_omniscient_william_stryker.sql"), "utf8");
    expect(sql).toContain("CREATE TABLE `api_idempotency_keys`");
    expect(sql).toContain("UNIQUE(`organizationId`,`apiKeyId`,`idempotencyKey`)");
    expect(sql.toUpperCase()).not.toMatch(/DROP\s+(TABLE|DATABASE)/);
  });

  it("crea el log persistente de solicitudes REST", () => {
    const sql = readFileSync(resolve(migrationDirectory, "0021_minor_risque.sql"), "utf8");
    expect(sql).toContain("CREATE TABLE `api_request_logs`");
    expect(sql).toContain("UNIQUE(`requestId`)");
    expect(sql.toUpperCase()).not.toMatch(/DROP\s+(TABLE|DATABASE)/);
  });

  it("mantiene toda la cadena SQL incremental libre de DROP y TRUNCATE", () => {
    expect(migrationSqlFiles().length).toBe(24);
    for (const file of migrationSqlFiles()) {
      const sql = readFileSync(file, "utf8").toUpperCase();
      expect(sql, file).not.toMatch(/DROP\s+(TABLE|DATABASE)/);
      expect(sql, file).not.toContain("TRUNCATE");
    }
  });
});
