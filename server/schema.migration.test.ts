import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const baselineTables = ["users", "organizations", "branches", "memberships", "shipments", "packages", "shipment_events", "api_keys", "shipment_documents", "tracking_points", "pickups", "routes", "route_stops", "manifests", "tariffs", "warehouses", "role_permissions", "audit_logs"];
const migrationDirectory = resolve(process.cwd(), "drizzle");

function migrationSqlFiles() {
  return readdirSync(migrationDirectory).filter((file) => /^\d+_.+\.sql$/.test(file)).map((file) => resolve(migrationDirectory, file));
}

describe("migraciones de checkout limpio", () => {
  it("incluye la línea base de 18 tablas sin operaciones destructivas", () => {
    const sql = readFileSync(resolve(migrationDirectory, "0000_open_micromax.sql"), "utf8");
    for (const table of baselineTables) expect(sql).toContain(`CREATE TABLE \`${table}\``);
    expect(sql.toUpperCase()).not.toContain("DROP TABLE");
    expect(sql.match(/CREATE TABLE/g)?.length).toBe(baselineTables.length);
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
    expect(migrationSqlFiles().length).toBeGreaterThanOrEqual(13);
    for (const file of migrationSqlFiles()) {
      const sql = readFileSync(file, "utf8").toUpperCase();
      expect(sql, file).not.toMatch(/DROP\s+(TABLE|DATABASE)/);
      expect(sql, file).not.toContain("TRUNCATE");
    }
  });
});
