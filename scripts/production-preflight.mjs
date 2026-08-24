const REQUIRED_PRODUCTION_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "VITE_APP_ID",
  "OAUTH_SERVER_URL",
  "VITE_OAUTH_PORTAL_URL",
  "BUILT_IN_FORGE_API_URL",
  "BUILT_IN_FORGE_API_KEY",
  "REDIS_URL",
];

export function validateProductionEnv(env) {
  const missing = REQUIRED_PRODUCTION_VARS.filter((key) => !String(env[key] ?? "").trim());
  const errors = [];
  const redisUrl = String(env.REDIS_URL ?? "").trim();
  if (redisUrl && !redisUrl.startsWith("rediss://")) errors.push("REDIS_URL debe usar TLS con esquema rediss://");
  return { ok: missing.length === 0 && errors.length === 0, missing, errors };
}

if (process.env.NODE_ENV === "production") {
  const result = validateProductionEnv(process.env);
  if (!result.ok) {
    if (result.missing.length) console.error(`Faltan variables críticas: ${result.missing.join(", ")}`);
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log("Preflight de producción OK: variables críticas presentes y REDIS_URL usa TLS.");
  }
} else {
  console.log("Preflight omitido: NODE_ENV no es production.");
}
