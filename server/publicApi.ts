import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Application, Request, Response } from "express";
import {
  authenticateApiKey,
  createPickupForOrganization,
  createShipmentForOrganization,
  getActiveTariffForOrganization,
  getShipmentByTrackingForOrganization,
  beginApiIdempotencyForRequest,
  completeApiIdempotencyForRequest,
  releaseApiIdempotencyForRequest,
} from "./db";
import { hasApiScope, isSupportedApiVersion, parseApiAuthorization } from "./apiAuth";
import { calculateQuote } from "./tariffEngine";
import { consumeApiRateLimit } from "./apiRateLimit";

const quoteInput = z.object({ actualWeightKg: z.number().positive(), lengthCm: z.number().positive(), widthCm: z.number().positive(), heightCm: z.number().positive(), distanceKm: z.number().nonnegative(), zoneCode: z.string().trim().min(1).max(40).optional(), serviceType: z.enum(["local", "national", "international", "assisted_purchase", "heavy_cargo", "moving"]).default("national") });
const shipmentInput = z.object({
  branchId: z.number().int().positive().optional(),
  serviceType: z.enum(["local", "national", "international", "assisted_purchase", "heavy_cargo", "moving"]),
  senderName: z.string().trim().min(2).max(160),
  recipientName: z.string().trim().min(2).max(160),
  originAddress: z.string().trim().min(3),
  destinationAddress: z.string().trim().min(3),
  originCountry: z.string().trim().min(2).max(80),
  destinationCountry: z.string().trim().min(2).max(80),
  estimatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});
const pickupInput = z.object({
  shipmentId: z.number().int().positive().optional(),
  address: z.string().trim().min(3),
  contactName: z.string().trim().min(2).max(160),
  windowStart: z.coerce.date().optional(),
  windowEnd: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

function requestId() {
  return `req_${randomUUID()}`;
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalize(nested)]));
  return value;
}
function requestHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(payload ?? null))).digest("hex");
}
function readIdempotencyKey(req: Request) {
  const key = req.header("Idempotency-Key")?.trim();
  return key && key.length >= 8 && key.length <= 120 ? key : null;
}

async function authorize(req: Request, requiredScope: string) {
  if (!isSupportedApiVersion(req.header("X-GoPaq-Version"))) return { ok: false, error: { status: 400, code: "unsupported_version", message: "Versión de API no soportada" } } as const;
  const secret = parseApiAuthorization(req.header("Authorization"));
  if (!secret) return { ok: false, error: { status: 401, code: "unauthorized", message: "Se requiere una API key Bearer" } } as const;
  const key = await authenticateApiKey(secret);
  if (!key || !hasApiScope(key.scopes, requiredScope)) return { ok: false, error: { status: 403, code: "forbidden", message: `Se requiere el scope ${requiredScope}` } } as const;
  return { ok: true, key } as const;
}

export function registerPublicApi(app: Application) {
  app.post("/api/v1/quotes", async (req: Request, res: Response) => {
    const id = requestId();
    res.setHeader("X-Request-Id", id);
    const auth = await authorize(req, "quotes:read");
    if (!auth.ok) return res.status(auth.error.status).json({ error: { code: auth.error.code, message: auth.error.message }, requestId: id });
    const rate = await consumeApiRateLimit(String(auth.key.id));
    if (!rate.allowed) return res.status(429).setHeader("Retry-After", String(rate.retryAfterSeconds ?? 60)).json({ error: { code: "rate_limited", message: "Demasiados intentos; inténtalo más tarde" }, requestId: id });
    const parsed = quoteInput.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: { code: "validation_error", message: "Datos de cotización no válidos" }, requestId: id });
    const tariff = await getActiveTariffForOrganization(auth.key.organizationId, parsed.data.serviceType, parsed.data.zoneCode);
    if (!tariff) return res.status(409).json({ error: { code: "tariff_unavailable", message: "No existe una tarifa vigente para este servicio en la organización" }, requestId: id });
    const resolvedTariff = { minAmount: Number(tariff.minAmount), perKg: Number(tariff.perKg), perKm: Number(tariff.perKm), fixedSurcharge: Number(tariff.fixedSurcharge ?? 0), fuelSurchargePct: Number(tariff.fuelSurchargePct ?? 0), discountPct: Number(tariff.discountPct ?? 0), taxPct: Number(tariff.taxPct ?? 0), volumetricDivisor: Number(tariff.volumetricDivisor ?? 5000), currency: tariff.currency };
    const { serviceType, zoneCode, ...measurements } = parsed.data;
    return res.status(200).json({ data: { ...calculateQuote({ ...measurements, ...resolvedTariff }), currency: resolvedTariff.currency, serviceType, zoneCode: zoneCode ?? null, tariffSource: "organization" }, requestId: id });
  });

  app.post("/api/v1/shipments", async (req: Request, res: Response) => {
    const id = requestId();
    res.setHeader("X-Request-Id", id);
    const auth = await authorize(req, "shipments:write");
    if (!auth.ok) return res.status(auth.error.status).json({ error: { code: auth.error.code, message: auth.error.message }, requestId: id });
    const rate = await consumeApiRateLimit(String(auth.key.id));
    if (!rate.allowed) return res.status(429).setHeader("Retry-After", String(rate.retryAfterSeconds ?? 60)).json({ error: { code: "rate_limited", message: "Demasiados intentos; inténtalo más tarde" }, requestId: id });
    const parsed = shipmentInput.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: { code: "validation_error", message: "Datos de envío no válidos" }, requestId: id });
    const idempotencyKey = readIdempotencyKey(req);
    if (!idempotencyKey) return res.status(400).json({ error: { code: "missing_idempotency_key", message: "Se requiere un Idempotency-Key de 8 a 120 caracteres" }, requestId: id });
    const idempotency = await beginApiIdempotencyForRequest({ organizationId: auth.key.organizationId, apiKeyId: auth.key.id, idempotencyKey, method: "POST", route: "/api/v1/shipments", requestHash: requestHash(parsed.data) });
    if (!idempotency) return res.status(503).json({ error: { code: "idempotency_unavailable", message: "No se pudo reservar la operación de forma segura" }, requestId: id });
    if (idempotency.status === "replay") return res.status(idempotency.statusCode).json(idempotency.body);
    if (idempotency.status === "conflict") return res.status(409).json({ error: { code: "idempotency_conflict", message: "La clave ya fue usada con una solicitud diferente" }, requestId: id });
    if (idempotency.status === "in_flight") return res.status(409).json({ error: { code: "idempotency_in_flight", message: "La operación con esta clave continúa en proceso" }, requestId: id });
    const shipment = await createShipmentForOrganization(auth.key.organizationId, parsed.data);
    if (!shipment) { await releaseApiIdempotencyForRequest(idempotency.id); return res.status(422).json({ error: { code: "invalid_branch", message: "La sucursal no pertenece a la organización activa" }, requestId: id }); }
    const responseBody = { data: shipment, requestId: id };
    await completeApiIdempotencyForRequest(idempotency.id, 201, responseBody, "shipment", shipment.id);
    return res.status(201).json(responseBody);
  });

  app.post("/api/v1/pickups", async (req: Request, res: Response) => {
    const id = requestId();
    res.setHeader("X-Request-Id", id);
    const auth = await authorize(req, "pickups:write");
    if (!auth.ok) return res.status(auth.error.status).json({ error: { code: auth.error.code, message: auth.error.message }, requestId: id });
    const rate = await consumeApiRateLimit(String(auth.key.id));
    if (!rate.allowed) return res.status(429).setHeader("Retry-After", String(rate.retryAfterSeconds ?? 60)).json({ error: { code: "rate_limited", message: "Demasiados intentos; inténtalo más tarde" }, requestId: id });
    const parsed = pickupInput.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ error: { code: "validation_error", message: "Datos de recogida no válidos" }, requestId: id });
    const idempotencyKey = readIdempotencyKey(req);
    if (!idempotencyKey) return res.status(400).json({ error: { code: "missing_idempotency_key", message: "Se requiere un Idempotency-Key de 8 a 120 caracteres" }, requestId: id });
    const idempotency = await beginApiIdempotencyForRequest({ organizationId: auth.key.organizationId, apiKeyId: auth.key.id, idempotencyKey, method: "POST", route: "/api/v1/pickups", requestHash: requestHash(parsed.data) });
    if (!idempotency) return res.status(503).json({ error: { code: "idempotency_unavailable", message: "No se pudo reservar la operación de forma segura" }, requestId: id });
    if (idempotency.status === "replay") return res.status(idempotency.statusCode).json(idempotency.body);
    if (idempotency.status === "conflict") return res.status(409).json({ error: { code: "idempotency_conflict", message: "La clave ya fue usada con una solicitud diferente" }, requestId: id });
    if (idempotency.status === "in_flight") return res.status(409).json({ error: { code: "idempotency_in_flight", message: "La operación con esta clave continúa en proceso" }, requestId: id });
    const pickup = await createPickupForOrganization(auth.key.organizationId, parsed.data);
    if (!pickup) { await releaseApiIdempotencyForRequest(idempotency.id); return res.status(422).json({ error: { code: "invalid_shipment", message: "El envío no pertenece a la organización activa" }, requestId: id }); }
    const responseBody = { data: pickup, requestId: id };
    await completeApiIdempotencyForRequest(idempotency.id, 201, responseBody, "pickup", pickup.id);
    return res.status(201).json(responseBody);
  });

  app.get("/api/v1/tracking/:trackingCode", async (req: Request, res: Response) => {
    const id = requestId();
    res.setHeader("X-Request-Id", id);
    const auth = await authorize(req, "tracking:read");
    if (!auth.ok) return res.status(auth.error.status).json({ error: { code: auth.error.code, message: auth.error.message }, requestId: id });
    const trackingCode = String(req.params.trackingCode ?? "").trim();
    if (!trackingCode) return res.status(422).json({ error: { code: "validation_error", message: "Código de tracking no válido" }, requestId: id });
    const shipment = await getShipmentByTrackingForOrganization(auth.key.organizationId, trackingCode);
    if (!shipment) return res.status(404).json({ error: { code: "not_found", message: "Envío no encontrado" }, requestId: id });
    return res.status(200).json({ data: shipment, requestId: id });
  });
}
