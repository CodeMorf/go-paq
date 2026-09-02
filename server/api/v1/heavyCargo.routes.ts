import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';
import { assertServiceEnabled } from '../../modules/configuration/configuration.service';

export const heavyCargoRouter = Router();

const addressSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(120),
  provinceState: z.string().trim().max(120).optional(),
  country: z.string().trim().length(2).default('DO'),
  lat: z.coerce.number().finite().min(-90).max(90).optional(),
  lng: z.coerce.number().finite().min(-180).max(180).optional()
});

const quoteSchema = z.object({
  palletsCount: z.coerce.number().int().positive().max(10000).default(1),
  totalWeightKg: z.coerce.number().positive().max(1000000),
  lengthM: z.coerce.number().positive().max(100),
  widthM: z.coerce.number().positive().max(100),
  heightM: z.coerce.number().positive().max(100),
  equipmentRequired: z.string().trim().max(240).optional()
});

const orderSchema = quoteSchema.extend({
  clientId: z.string().trim().min(1).max(160).optional(),
  cargoType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(1000),
  origin: addressSchema,
  destination: addressSchema,
  scheduledDate: z.string().trim().min(8).max(80),
  notes: z.string().trim().max(1000).optional()
});

function calculateHeavyQuote(input: z.infer<typeof quoteSchema>) {
  const volumeM3 = input.lengthM * input.widthM * input.heightM;
  const baseRate = 8500;
  const palletsCost = input.palletsCount * 750;
  const weightCost = input.totalWeightKg * 18;
  const volumeCost = volumeM3 * 500;
  const equipmentCost = input.equipmentRequired ? 2500 : 0;
  const total = baseRate + palletsCost + weightCost + volumeCost + equipmentCost;
  return { baseRate, palletsCost, weightCost, volumeCost, equipmentCost, volumeM3, total, currency: 'DOP' };
}

heavyCargoRouter.get('/orders', authenticate, requireScope('heavy_cargo:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const orders = await queryAllAsync(`SELECT * FROM heavy_cargo_orders WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, orders: orders.map((o) => ({ ...o, dimensions: safeJson(o.dimensions_json), origin: safeJson(o.origin_json), destination: safeJson(o.destination_json) })) });
}));

heavyCargoRouter.post('/quote', asyncHandler(async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cotización de carga pesada inválidos.' });
  await assertServiceEnabled(process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq', 'carga_pesada');
  return res.json({ success: true, quote: calculateHeavyQuote(parsed.data) });
}));

heavyCargoRouter.post('/orders', authenticate, requireScope('heavy_cargo:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de orden de carga pesada inválidos.' });
  const orgId = req.organizationId!;
  await assertServiceEnabled(orgId, 'carga_pesada');
  const idempotencyKey = req.header('idempotency-key')?.trim();
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 200)) return res.status(400).json({ success: false, error: 'Idempotency-Key inválida.' });
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
  if (idempotencyKey) {
    const previous = await queryOneAsync<{ request_hash: string; status_code: number; response_json: string }>('SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?', [orgId, idempotencyKey]);
    if (previous?.request_hash !== requestHash && previous) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous) return res.status(previous.status_code || 201).json(JSON.parse(previous.response_json));
  }

  const role = normalizeRole(req.user?.role);
  const clientId = req.clientId || parsed.data.clientId || null;
  if (clientId && !(await queryOneAsync('SELECT id FROM clients WHERE id = ? AND organization_id = ? AND active = 1', [clientId, orgId]))) return res.status(422).json({ success: false, error: 'Cliente inválido para esta organización.' });
  if (['CLIENT', 'CUSTOMER'].includes(role) && !req.clientId) return res.status(403).json({ success: false, error: 'La cuenta cliente no tiene un cliente asociado.' });

  const now = new Date().toISOString();
  const orderId = `hvy-${crypto.randomUUID()}`;
  const jobId = `job-${crypto.randomUUID()}`;
  const trackingNumber = `GP-HVY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const quote = calculateHeavyQuote(parsed.data);
  const response = await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO heavy_cargo_orders (id, organization_id, client_id, tracking_number, status, cargo_type, pallets_count, total_weight_kg, dimensions_json, equipment_required, origin_json, destination_json, cost, currency, job_id, created_at) VALUES (?, ?, ?, ?, 'booked', ?, ?, ?, ?, ?, ?, ?, ?, 'DOP', ?, ?)`, [orderId, orgId, clientId, trackingNumber, parsed.data.cargoType, parsed.data.palletsCount, parsed.data.totalWeightKg, JSON.stringify({ lengthM: parsed.data.lengthM, widthM: parsed.data.widthM, heightM: parsed.data.heightM, volumeM3: quote.volumeM3 }), parsed.data.equipmentRequired || null, JSON.stringify(parsed.data.origin), JSON.stringify(parsed.data.destination), quote.total, jobId, now]);
    await tx.execute(`INSERT INTO logistics_jobs (id, organization_id, client_id, service_type, tracking_number, source_type, source_id, status, origin_json, destination_json, details_json, cost, currency, scheduled_at, created_at, updated_at) VALUES (?, ?, ?, 'carga_pesada', ?, 'heavy_cargo_order', ?, 'booked', ?, ?, ?, ?, 'DOP', ?, ?, ?)`, [jobId, orgId, clientId, trackingNumber, orderId, JSON.stringify(parsed.data.origin), JSON.stringify(parsed.data.destination), JSON.stringify({ ...parsed.data, quote, notes: parsed.data.notes || null }), quote.total, parsed.data.scheduledDate, now, now]);
    await tx.execute(`INSERT INTO logistics_job_events (id, organization_id, job_id, status, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, 'booked', 'Orden de carga pesada creada', 'user', ?, ?, ?)`, [`jbe-${crypto.randomUUID()}`, orgId, jobId, req.user?.userId || null, JSON.stringify({ trackingNumber }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'heavy_cargo.order_created', 'logistics_job', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, jobId, JSON.stringify({ jobId, orderId, trackingNumber, serviceType: 'carga_pesada', clientId }), now]);
    const result = { success: true, order: { id: orderId, jobId, trackingNumber, organizationId: orgId, clientId, status: 'booked', cargoType: parsed.data.cargoType, description: parsed.data.description, palletsCount: parsed.data.palletsCount, totalWeightKg: parsed.data.totalWeightKg, dimensions: { lengthM: parsed.data.lengthM, widthM: parsed.data.widthM, heightM: parsed.data.heightM }, equipmentRequired: parsed.data.equipmentRequired || null, origin: parsed.data.origin, destination: parsed.data.destination, scheduledDate: parsed.data.scheduledDate, cost: quote.total, currency: 'DOP' }, quote };
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 201, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(result), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    return result;
  });
  return res.status(201).json(response);
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
