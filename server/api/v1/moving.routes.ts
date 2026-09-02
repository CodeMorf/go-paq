import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const movingRouter = Router();

movingRouter.get('/orders', authenticate, requireScope('moving:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const orders = await queryAllAsync(`SELECT * FROM moving_orders WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, orders: orders.map((o) => ({ ...o, origin: safeJson(o.origin_json), destination: safeJson(o.destination_json), inventory: o.inventory_json ? safeArray(o.inventory_json) : [] })) });
}));

const quoteSchema = z.object({ volumeM3: z.coerce.number().positive().max(1000).default(15), floors: z.coerce.number().int().min(1).max(100).default(1), hasElevator: z.boolean().default(false), crewCount: z.coerce.number().int().min(1).max(100).default(3), distanceKm: z.coerce.number().min(0).max(10000).default(10) });

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

const orderSchema = z.object({
  clientId: z.string().trim().min(1).max(160).optional(),
  origin: addressSchema,
  destination: addressSchema,
  movingDate: z.string().trim().min(8).max(80),
  volumeM3: z.coerce.number().positive().max(1000),
  floors: z.coerce.number().int().min(1).max(100).default(1),
  hasElevator: z.boolean().default(false),
  crewCount: z.coerce.number().int().min(1).max(100).default(3),
  distanceKm: z.coerce.number().min(0).max(10000).default(10),
  vehicleType: z.string().trim().min(2).max(120).optional(),
  inventory: z.array(z.record(z.string(), z.unknown())).max(500).default([]),
  notes: z.string().trim().max(1000).optional()
});

function calculateMovingQuote(input: z.infer<typeof quoteSchema>) {
  const baseRate = 4500;
  const volumeCost = input.volumeM3 * 450;
  const floorFee = !input.hasElevator && input.floors > 1 ? (input.floors - 1) * 600 : 0;
  const crewCost = input.crewCount * 1200;
  const distanceCost = input.distanceKm * 85;
  const total = baseRate + volumeCost + floorFee + crewCost + distanceCost;
  return { baseRate, volumeCost, floorFee, crewCost, distanceCost, total, currency: 'DOP', recommendedVehicle: input.volumeM3 > 25 ? 'Camión 5 Toneladas' : 'Camión 3.5 Toneladas' };
}

movingRouter.post('/quote', asyncHandler(async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cotización de mudanza inválidos.' });
  return res.json({ success: true, quote: calculateMovingQuote(parsed.data) });
}));

movingRouter.post('/orders', authenticate, requireScope('moving:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de reserva de mudanza inválidos.' });
  const orgId = req.organizationId!;
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
  const orderId = `mov-${crypto.randomUUID()}`;
  const jobId = `job-${crypto.randomUUID()}`;
  const trackingNumber = `GP-MOV-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const quote = calculateMovingQuote(parsed.data);
  const vehicleType = parsed.data.vehicleType || quote.recommendedVehicle;
  const response = await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO moving_orders (id, organization_id, client_id, tracking_number, status, origin_json, destination_json, moving_date, volume_m3, floors, elevator, crew_count, vehicle_type, estimated_cost, currency, inventory_json, job_id, created_at) VALUES (?, ?, ?, ?, 'booked', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DOP', ?, ?, ?)`, [orderId, orgId, clientId, trackingNumber, JSON.stringify(parsed.data.origin), JSON.stringify(parsed.data.destination), parsed.data.movingDate, parsed.data.volumeM3, parsed.data.floors, parsed.data.hasElevator ? 1 : 0, parsed.data.crewCount, vehicleType, quote.total, JSON.stringify(parsed.data.inventory), jobId, now]);
    await tx.execute(`INSERT INTO logistics_jobs (id, organization_id, client_id, service_type, tracking_number, source_type, source_id, status, origin_json, destination_json, details_json, cost, currency, scheduled_at, created_at, updated_at) VALUES (?, ?, ?, 'mudanza', ?, 'moving_order', ?, 'booked', ?, ?, ?, ?, 'DOP', ?, ?, ?)`, [jobId, orgId, clientId, trackingNumber, orderId, JSON.stringify(parsed.data.origin), JSON.stringify(parsed.data.destination), JSON.stringify({ ...parsed.data, vehicleType, quote, notes: parsed.data.notes || null }), quote.total, parsed.data.movingDate, now, now]);
    await tx.execute(`INSERT INTO logistics_job_events (id, organization_id, job_id, status, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, 'booked', 'Reserva de mudanza creada', 'user', ?, ?, ?)`, [`jbe-${crypto.randomUUID()}`, orgId, jobId, req.user?.userId || null, JSON.stringify({ trackingNumber }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'moving.order_created', 'logistics_job', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, jobId, JSON.stringify({ jobId, orderId, trackingNumber, serviceType: 'mudanza', clientId }), now]);
    const result = { success: true, order: { id: orderId, jobId, trackingNumber, organizationId: orgId, clientId, status: 'booked', origin: parsed.data.origin, destination: parsed.data.destination, movingDate: parsed.data.movingDate, volumeM3: parsed.data.volumeM3, floors: parsed.data.floors, hasElevator: parsed.data.hasElevator, crewCount: parsed.data.crewCount, vehicleType, inventory: parsed.data.inventory, cost: quote.total, currency: 'DOP' }, quote };
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 201, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(result), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    return result;
  });
  return res.status(201).json(response);
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
function safeArray(value: unknown): unknown[] { try { const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
