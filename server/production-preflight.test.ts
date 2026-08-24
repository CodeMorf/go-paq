import { describe, expect, it } from "vitest";
import { validateProductionEnv } from "../scripts/production-preflight.mjs";

const completeEnv = {
  DATABASE_URL: "mysql://db",
  JWT_SECRET: "secret",
  VITE_APP_ID: "app",
  OAUTH_SERVER_URL: "https://oauth",
  VITE_OAUTH_PORTAL_URL: "https://portal",
  BUILT_IN_FORGE_API_URL: "https://forge",
  BUILT_IN_FORGE_API_KEY: "forge-secret",
  REDIS_URL: "rediss://redis.example.com:6380",
};

describe("preflight de producción", () => {
  it("acepta variables críticas completas y Redis TLS", () => {
    expect(validateProductionEnv(completeEnv)).toEqual({ ok: true, missing: [], errors: [] });
  });

  it("rechaza REDIS_URL sin TLS y reporta solo nombres de variables faltantes", () => {
    const result = validateProductionEnv({ ...completeEnv, REDIS_URL: "redis://localhost", JWT_SECRET: "" });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["JWT_SECRET"]);
    expect(result.errors).toEqual(["REDIS_URL debe usar TLS con esquema rediss://"]);
    expect(JSON.stringify(result)).not.toContain("forge-secret");
  });
});
