import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";

const expectedTables = ["users", "customer_profiles", "customer_addresses", "customer_contacts", "support_tickets", "organizations", "branches", "memberships", "shipments", "packages", "shipment_services", "shipment_events", "api_keys", "shipment_documents", "tracking_points", "pickups", "routes", "route_stops", "route_expenses", "manifests", "tariff_zones", "tariffs", "warehouses", "role_permissions", "inventory_movements", "consolidations", "consolidation_items", "shipment_incidents", "delivery_attempts", "payments", "cash_sessions", "cash_movements", "invoices", "receipts", "api_idempotency_keys", "api_request_logs", "audit_logs"];
const databaseUrl = process.env.CLEAN_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL es obligatorio");
const parsed = new URL(databaseUrl);
const baseConfig = { host: parsed.hostname, port: Number(parsed.port || 3306), user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password), ...(process.env.CLEAN_DATABASE_URL ? {} : { ssl: { rejectUnauthorized: false } }) };
const database = `gopaq_clean_${Date.now()}_${randomBytes(3).toString("hex")}`;
let admin;
let clean;
try {
  admin = await mysql.createConnection(baseConfig);
  await admin.query(`CREATE DATABASE \`${database}\``);
  clean = await mysql.createConnection({ ...baseConfig, database, multipleStatements: false });
  const migrationFiles = JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8")).entries.map((entry) => `../drizzle/${entry.tag}.sql`);
  for (const migrationFile of migrationFiles) {
    const migration = await readFile(new URL(migrationFile, import.meta.url), "utf8");
    for (const statement of migration.split(/--> statement-breakpoint/).map((item) => item.trim()).filter(Boolean)) await clean.query(statement);
  }
  const [rows] = await clean.query("SHOW TABLES");
  const actualTables = rows.map((row) => Object.values(row)[0]).sort();
  if (actualTables.length !== expectedTables.length || expectedTables.some((table) => !actualTables.includes(table))) throw new Error(`Tablas inesperadas: ${actualTables.join(", ")}`);
  const [defaults] = await clean.query("SELECT COLUMN_DEFAULT AS languageDefault FROM information_schema.columns WHERE table_schema = ? AND table_name = 'organizations' AND column_name = 'language'", [database]);
  const languageDefault = String(defaults[0]?.languageDefault ?? "").replace(/^'|'$/g, "");
  if (languageDefault !== "es") throw new Error(`Default de idioma inesperado: ${defaults[0]?.languageDefault}`);
  console.log(JSON.stringify({ database, tables: actualTables.length, languageDefault, status: "ok" }));
} finally {
  await clean?.end();
  if (admin) { await admin.query(`DROP DATABASE IF EXISTS \`${database}\``); await admin.end(); }
}
