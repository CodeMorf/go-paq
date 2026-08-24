import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tables = ["users", "organizations", "branches", "memberships", "shipments", "packages", "shipment_events", "api_keys", "shipment_documents", "tracking_points", "pickups", "routes", "route_stops", "manifests", "tariffs", "warehouses", "role_permissions", "audit_logs"];

describe("migración inicial de checkout limpio", () => {
  it("incluye todas las tablas del schema sin operaciones destructivas", () => {
    const sql = readFileSync(resolve(process.cwd(), "drizzle/0000_open_micromax.sql"), "utf8");
    for (const table of tables) expect(sql).toContain(`CREATE TABLE \`${table}\``);
    expect(sql.toUpperCase()).not.toContain("DROP TABLE");
    expect(sql.match(/CREATE TABLE/g)?.length).toBe(tables.length);
  });
});
