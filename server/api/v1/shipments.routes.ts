import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { calculatePricing } from '../../modules/pricing/pricing.engine';
import { asyncHandler } from '../../core/http';

export const shipmentsRouter = Router();

const createShipmentSchema = z.object({
  serviceType: z.enum(['local', 'express', 'nacional', 'internacional', 'mudanza', 'carga_pesada']).default('local'),
  origin: z.record(z.string(), z.unknown()),
  destination: z.record(z.string(), z.unknown()),
  package: z.object({
    weightKg: z.coerce.number().positive().max(100000).default(1),
    lengthCm: z.coerce.number().positive().max(10000).default(20),
    widthCm: z.coerce.number().positive().max(10000).default(15),
    heightCm: z.coerce.number().positive().max(10000).default(10),
    declaredValueUsd: z.coerce.number().min(0).max(100000000).default(0),
    isFragile: z.boolean().optional().default(false)
  }).passthrough(),
  codAmount: z.coerce.number().min(0).max(100000000).default(0),
  codCurrency: z.string().trim().length(3).default('DOP'),
  clientId: z.string().trim().min(1).max(120).optional(),
  branchId: z.string().trim().min(1).max(120).nullable().optional()
}).passthrough();

function parseJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, unknown>;
  try { return JSON.parse(String(value)); } catch { return {}; }
}

function requestHash(body: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

async function existingIdempotent(orgId: string, key: string, body: unknown) {
  const row = await queryOneAsync<{ request_hash: string; status_code: number; response_json: string }>(`SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?`, [orgId, key]);
  if (!row) return null;
  if (row.request_hash !== requestHash(body)) return { conflict: true as const };
  return { conflict: false as const, statusCode: row.status_code || 201, response: JSON.parse(row.response_json) };
}

shipmentsRouter.get('/', authenticate, requireScope('shipments:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const { status, search } = req.query;
  const parsedLimit = Number(req.query.limit || 100);
  const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 100;
  let sql = `SELECT * FROM shipments WHERE organization_id = ?`;
  const params: any[] = [orgId];

  if (req.clientId && (!req.user || ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key')) {
    sql += ` AND client_id = ?`;
    params.push(req.clientId);
  }
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role)) {
    if (!req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });
    sql += ` AND branch_id = ?`;
    params.push(req.user.branchId);
  }
  if (status && typeof status === 'string') { sql += ` AND status = ?`; params.push(status); }
  if (search && typeof search === 'string') { sql += ` AND (tracking_number LIKE ? OR destination_json LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const rows = await queryAllAsync(sql, params);
  const formatted = rows.map((row) => ({
    ...row,
    origin: parseJson(row.origin_json),
    destination: parseJson(row.destination_json),
    package: parseJson(row.package_json),
    pricing: parseJson(row.pricing_json),
    pod: row.pod_json ? parseJson(row.pod_json) : null
  }));
  return res.json({ success: true, count: formatted.length, shipments: formatted });
}));

shipmentsRouter.post('/', authenticate, requireScope('shipments:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const parsed = createShipmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de envío inválidos.', details: parsed.error.flatten() });
  const input = parsed.data;
  const role = normalizeRole(req.user?.role);
  const clientScoped = !!req.clientId && (!req.user || ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key');
  const clientId = clientScoped ? req.clientId : input.clientId || null;
  const branchId = input.branchId || (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) ? req.user?.branchId || null : null);
  const idempotencyKey = req.header('idempotency-key')?.trim();

  if (clientScoped && input.clientId && input.clientId !== req.clientId) return res.status(403).json({ success: false, error: 'No puedes crear un envío para otro cliente.' });
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user?.branchId && branchId && branchId !== req.user.branchId) return res.status(403).json({ success: false, error: 'La cuenta solo puede crear envíos de su sucursal.' });
  if (idempotencyKey) {
    if (idempotencyKey.length < 8 || idempotencyKey.length > 200) return res.status(400).json({ success: false, error: 'Idempotency-Key inválida.' });
    const previous = await existingIdempotent(orgId, idempotencyKey, req.body);
    if (previous?.conflict) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous) return res.status(previous.statusCode).json(previous.response);
  }

  if (branchId) {
    const branch = await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, orgId]);
    if (!branch) return res.status(422).json({ success: false, error: 'Sucursal inválida para esta organización.' });
  }
  if (clientId) {
    const client = await queryOneAsync('SELECT id FROM clients WHERE id = ? AND organization_id = ? AND active = 1', [clientId, orgId]);
    if (!client) return res.status(422).json({ success: false, error: 'Cliente inválido para esta organización.' });
  }

  const pricing = await calculatePricing({
    serviceType: input.serviceType,
    originCity: String(input.origin.city || 'Santo Domingo'),
    destCity: String(input.destination.city || 'Santo Domingo'),
    weightKg: input.package.weightKg,
    lengthCm: input.package.lengthCm,
    widthCm: input.package.widthCm,
    heightCm: input.package.heightCm,
    declaredValueUsd: input.package.declaredValueUsd,
    isFragile: input.package.isFragile,
    codAmount: input.codAmount,
    clientId,
    branchId,
    distanceKm: Number(input.distanceKm || 0),
    serviceVariant: typeof input.serviceVariant === 'string' ? input.serviceVariant : undefined
  }, orgId);

  const trackingNumber = `GP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const shipmentId = `shp-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const newShipment = {
    id: shipmentId,
    trackingNumber,
    serviceType: input.serviceType,
    status: 'pending',
    origin: input.origin,
    destination: input.destination,
    package: input.package,
    pricing,
    shippingCost: pricing.total,
    currency: pricing.currency,
    codAmount: input.codAmount,
    codCurrency: input.codCurrency,
    createdAt: now
  };
  const response = { success: true, shipment: newShipment };

  await transactionAsync(async (tx) => {
    await tx.execute(`
      INSERT INTO shipments (id, organization_id, branch_id, client_id, tracking_number, service_type, status, origin_json, destination_json, package_json, pricing_json, shipping_cost, currency, cod_amount, cod_currency, cod_collected, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [shipmentId, orgId, branchId, clientId, trackingNumber, input.serviceType, JSON.stringify(input.origin), JSON.stringify(input.destination), JSON.stringify(input.package), JSON.stringify(pricing), pricing.total, pricing.currency, input.codAmount, input.codCurrency, now, now]);
    await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, created_at) VALUES (?, ?, 'pending', ?, 'Envío creado y registrado en sistema', ?, ?, ?)`, [`evt-${crypto.randomUUID()}`, shipmentId, String(input.origin.city || 'Origen'), req.user ? 'user' : 'api_key', req.user?.userId || null, now]);
    if (input.codAmount > 0) {
      await tx.execute(`INSERT INTO cod_transactions (id, organization_id, shipment_id, branch_id, client_id, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_collection', ?)`, [`cod-tx-${shipmentId}`, orgId, shipmentId, branchId, clientId, input.codAmount, input.codCurrency, now]);
    }
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'shipment.created', 'shipment', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, shipmentId, JSON.stringify({ shipmentId, trackingNumber, status: 'pending' }), now]);
    if (idempotencyKey) {
      await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash(req.body), 201, JSON.stringify(response), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    }
  });
  return res.status(201).json(response);
}));

shipmentsRouter.get('/:id', authenticate, requireScope('shipments:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const clientFilter = req.clientId && (!req.user || ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key') ? ' AND client_id = ?' : '';
  const params: any[] = [orgId, req.params.id, req.params.id];
  if (clientFilter) params.push(req.clientId);
  const row = await queryOneAsync(`SELECT * FROM shipments WHERE organization_id = ? AND (id = ? OR tracking_number = ?)` + clientFilter, params);
  if (!row) return res.status(404).json({ success: false, error: 'Envío no encontrado en su organización.' });
  const events = await queryAllAsync(`SELECT * FROM shipment_events WHERE shipment_id = ? ORDER BY created_at ASC`, [row.id]);
  return res.json({ success: true, shipment: { ...row, origin: parseJson(row.origin_json), destination: parseJson(row.destination_json), package: parseJson(row.package_json), pricing: parseJson(row.pricing_json), pod: row.pod_json ? parseJson(row.pod_json) : null, events } });
}));
