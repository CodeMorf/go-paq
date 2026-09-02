import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, executeAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';
import { storeDataUrl } from '../../storage/storage.adapter';

export const driversRouter = Router();

driversRouter.get('/', authenticate, requireScope('drivers:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const ownOnly = ['DRIVER', 'COURIER'].includes(role);
  const drivers = ownOnly
    ? await queryAllAsync(`SELECT d.*, b.name AS branch_name, u.email AS user_email FROM drivers d LEFT JOIN branches b ON d.branch_id = b.id AND b.organization_id = d.organization_id LEFT JOIN users u ON d.user_id = u.id AND u.organization_id = d.organization_id WHERE d.organization_id = ? AND d.user_id = ? AND d.active = 1`, [orgId, req.user!.userId])
    : await queryAllAsync(`SELECT d.*, b.name AS branch_name, u.email AS user_email FROM drivers d LEFT JOIN branches b ON d.branch_id = b.id AND b.organization_id = d.organization_id LEFT JOIN users u ON d.user_id = u.id AND u.organization_id = d.organization_id WHERE d.organization_id = ? AND d.active = 1 ORDER BY d.name ASC`, [orgId]);
  return res.json({ success: true, drivers });
}));

const telemetrySchema = z.object({ driverId: z.string().trim().min(1).max(120), lat: z.coerce.number().finite().min(-90).max(90), lng: z.coerce.number().finite().min(-180).max(180), speed: z.coerce.number().finite().min(0).max(300).default(0), heading: z.coerce.number().finite().min(0).max(360).default(0), battery: z.coerce.number().finite().min(0).max(100).default(100) });

driversRouter.post('/telemetry', authenticate, requireScope('driver:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = telemetrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Telemetría inválida.' });
  const { driverId, lat, lng, speed, heading, battery } = parsed.data;
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const driver = await queryOneAsync<{ id: string; user_id: string | null }>('SELECT id, user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [driverId, orgId]);
  if (!driver) return res.status(404).json({ success: false, error: 'Driver no encontrado en esta organización.' });
  if (['DRIVER', 'COURIER'].includes(role) && driver.user_id !== req.user!.userId) return res.status(403).json({ success: false, error: 'No autorizado para enviar telemetría de otro conductor.' });
  const status = speed > 5 ? 'in_motion' : 'idle';
  const setLocation = process.env.DATABASE_URL?.startsWith('postgres') ? ', current_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography' : '';
  const params: any[] = [lat, lng, speed, heading, battery, status];
  if (setLocation) params.push(lng, lat);
  params.push(driverId, orgId);
  const result = await executeAsync(`UPDATE drivers SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, battery = ?, status = ?${setLocation}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ? AND active = 1`, params);
  if (result.changes !== 1) return res.status(409).json({ success: false, error: 'La telemetría no pudo actualizar el conductor.' });
  return res.json({ success: true, processed: { driverId, position: { lat, lng }, telemetry: { speedKmh: speed, headingDeg: heading, batteryPct: battery, timestamp: new Date().toISOString() }, status } });
}));

driversRouter.get('/active-manifest', authenticate, requireScope('driver:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const requestedId = typeof req.query.driverId === 'string' ? req.query.driverId : undefined;
  const driver = ['DRIVER', 'COURIER'].includes(role)
    ? await queryOneAsync('SELECT * FROM drivers WHERE user_id = ? AND organization_id = ? AND active = 1', [req.user!.userId, orgId])
    : requestedId
      ? await queryOneAsync('SELECT * FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [requestedId, orgId])
      : await queryOneAsync('SELECT * FROM drivers WHERE organization_id = ? AND active = 1 ORDER BY name ASC LIMIT 1', [orgId]);
  if (!driver) return res.status(404).json({ success: false, error: 'Driver no encontrado.' });
  const route = await queryOneAsync(`SELECT * FROM routes WHERE driver_id = ? AND organization_id = ? AND status IN ('in_progress', 'draft') ORDER BY created_at DESC LIMIT 1`, [driver.id, orgId]);
  const stops = route ? await queryAllAsync('SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order ASC', [route.id]) : [];
  return res.json({ success: true, driver, route, stops: stops.map((s) => ({ ...s, address: safeJson(s.address_json), pod: s.pod_json ? safeJson(s.pod_json) : null })) });
}));

driversRouter.post('/routes/:routeId/start', authenticate, requireScope('driver:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const route = await queryOneAsync<any>(`SELECT r.*, d.user_id FROM routes r LEFT JOIN drivers d ON d.id = r.driver_id AND d.organization_id = r.organization_id WHERE r.id = ? AND r.organization_id = ?`, [req.params.routeId, orgId]);
  if (!route) return res.status(404).json({ success: false, error: 'Ruta no encontrada en esta organización.' });
  const role = normalizeRole(req.user?.role);
  if (['DRIVER', 'COURIER'].includes(role) && route.user_id !== req.user!.userId) return res.status(403).json({ success: false, error: 'Solo puedes iniciar una ruta asignada a tu cuenta.' });
  if (!['draft', 'published', 'assigned'].includes(String(route.status))) return res.status(409).json({ success: false, error: 'La ruta no puede iniciarse desde su estado actual.' });
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`UPDATE routes SET status = 'in_progress', updated_at = ? WHERE id = ? AND organization_id = ? AND status IN ('draft', 'published', 'assigned')`, [now, route.id, orgId]);
    await tx.execute(`UPDATE drivers SET status = 'on_route', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ?`, [route.driver_id, orgId]);
    await tx.execute(`UPDATE shipments SET status = 'out_for_delivery', updated_at = ? WHERE assigned_route_id = ? AND organization_id = ? AND status NOT IN ('delivered', 'cancelled')`, [now, route.id, orgId]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'route.started', 'route', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, route.id, JSON.stringify({ routeId: route.id, driverId: route.driver_id }), now]);
  });
  return res.json({ success: true, routeId: route.id, status: 'in_progress', startedAt: now });
}));

const podSchema = z.object({
  recipientName: z.string().trim().min(2).max(160),
  recipientDni: z.string().trim().max(80).optional(),
  signatureUrl: z.string().max(800000).optional(),
  photoUrl: z.string().max(2000000).optional(),
  lat: z.coerce.number().finite().min(-90).max(90).optional(),
  lng: z.coerce.number().finite().min(-180).max(180).optional(),
  notes: z.string().trim().max(500).optional()
});
const completeStopSchema = z.object({ pod: podSchema, collectedCod: z.coerce.number().min(0).max(100000000).default(0), codMethod: z.enum(['cash', 'card', 'transfer']).default('cash') });

driversRouter.post('/stops/:stopId/complete', authenticate, requireScope('driver:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = completeStopSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'POD o cobro COD inválido.' });
  const orgId = req.organizationId!;
  const idempotencyKey = req.header('idempotency-key')?.trim();
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 200)) return res.status(400).json({ success: false, error: 'Idempotency-Key inválida.' });
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  if (idempotencyKey) {
    const previous = await queryOneAsync<{ request_hash: string; status_code: number; response_json: string }>('SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?', [orgId, idempotencyKey]);
    if (previous?.request_hash !== requestHash && previous) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous) return res.status(previous.status_code || 200).json(JSON.parse(previous.response_json));
  }

  const role = normalizeRole(req.user?.role);
  const now = new Date().toISOString();
  const storedSignatureUrl = await storeDataUrl(parsed.data.pod.signatureUrl, 'signatures', 800_000);
  const storedPhotoUrl = await storeDataUrl(parsed.data.pod.photoUrl, 'pod-photos', 2_000_000);
  const response = await transactionAsync(async (tx) => {
    const stop = await tx.queryOne<any>(`SELECT rs.*, r.organization_id, r.driver_id, r.status AS route_status, s.tracking_number, s.cod_amount, s.cod_currency FROM route_stops rs JOIN routes r ON r.id = rs.route_id AND r.organization_id = ? LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = r.organization_id WHERE rs.id = ?`, [orgId, req.params.stopId]);
    if (!stop) throw Object.assign(new Error('Parada no encontrada en esta organización.'), { statusCode: 404 });
    const driver = stop.driver_id ? await tx.queryOne<any>('SELECT id, user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [stop.driver_id, orgId]) : null;
    if (['DRIVER', 'COURIER'].includes(role) && (!driver || driver.user_id !== req.user!.userId)) throw Object.assign(new Error('No estás autorizado para completar esta parada.'), { statusCode: 403 });
    if (!['in_progress', 'published'].includes(String(stop.route_status))) throw Object.assign(new Error('La ruta no está activa.'), { statusCode: 409 });
    if (!['pending', 'arrived'].includes(String(stop.status))) throw Object.assign(new Error('La parada ya fue procesada.'), { statusCode: 409 });
    if (!stop.shipment_id || !stop.tracking_number) throw Object.assign(new Error('La parada no tiene un envío asociado para generar tracking.'), { statusCode: 422 });
    const codAmount = Number(stop.cod_amount || 0);
    if (codAmount > 0 && Math.abs(Number(parsed.data.collectedCod) - codAmount) > 0.01) throw Object.assign(new Error('El monto COD cobrado debe coincidir con el monto de la guía.'), { statusCode: 409 });

    const pod = { ...parsed.data.pod, signatureUrl: storedSignatureUrl, photoUrl: storedPhotoUrl, deliveredAt: now, actorId: req.user!.userId, codAmountCollected: parsed.data.collectedCod };
    const stopUpdated = await tx.execute(`UPDATE route_stops SET status = 'completed', completed_at = ?, pod_json = ?, notes = ? WHERE id = ? AND route_id = ? AND status IN ('pending', 'arrived')`, [now, JSON.stringify(pod), parsed.data.pod.notes || null, stop.id, stop.route_id]);
    if (stopUpdated.changes !== 1) throw Object.assign(new Error('La parada cambió mientras se registraba el POD.'), { statusCode: 409 });
    const shipmentUpdated = await tx.execute(`UPDATE shipments SET status = 'delivered', pod_json = ?, cod_collected = ?, payment_status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status NOT IN ('delivered', 'cancelled')`, [JSON.stringify(pod), codAmount > 0 ? 1 : 0, codAmount > 0 ? 'collected' : 'not_applicable', now, stop.shipment_id, orgId]);
    if (shipmentUpdated.changes !== 1) throw Object.assign(new Error('El envío no pudo cambiar a entregado.'), { statusCode: 409 });
    if (codAmount > 0) {
      const codUpdated = await tx.execute(`UPDATE cod_transactions SET status = 'collected_driver', driver_id = ?, collected_at = ?, method = ? WHERE shipment_id = ? AND organization_id = ? AND status = 'pending_collection'`, [stop.driver_id, now, parsed.data.codMethod, stop.shipment_id, orgId]);
      if (codUpdated.changes !== 1) throw Object.assign(new Error('El COD no está pendiente de cobro o ya fue procesado.'), { statusCode: 409 });
    }
    await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, 'delivered', ?, 'Entrega completada con POD registrado', 'driver', ?, ?, ?)`, [`evt-${crypto.randomUUID()}`, stop.shipment_id, parsed.data.pod.lat !== undefined ? `${parsed.data.pod.lat},${parsed.data.pod.lng}` : null, req.user!.userId, JSON.stringify({ codAmountCollected: parsed.data.collectedCod }), now]);
    const counts = await tx.queryOne<{ completed: number | string }>('SELECT COUNT(*) AS completed FROM route_stops WHERE route_id = ? AND status = \'completed\'', [stop.route_id]);
    await tx.execute('UPDATE routes SET completed_stops = ?, status = CASE WHEN total_stops > 0 AND ? >= total_stops THEN \'completed\' ELSE status END, updated_at = ? WHERE id = ? AND organization_id = ?', [Number(counts?.completed || 0), Number(counts?.completed || 0), now, stop.route_id, orgId]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'shipment.delivered', 'shipment', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, stop.shipment_id, JSON.stringify({ shipmentId: stop.shipment_id, trackingNumber: stop.tracking_number, stopId: stop.id, pod }), now]);
    const result = { success: true, stopId: stop.id, shipmentId: stop.shipment_id, trackingNumber: stop.tracking_number, status: 'delivered', completedAt: now, codStatus: codAmount > 0 ? 'collected_driver' : 'not_applicable' };
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 200, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(result), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    return result;
  });
  return res.json(response);
}));

const failStopSchema = z.object({ reason: z.string().trim().min(2).max(160), notes: z.string().trim().max(500).optional() });
driversRouter.post('/stops/:stopId/fail', authenticate, requireScope('driver:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = failStopSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Motivo de incidencia inválido.' });
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const stop = await tx.queryOne<any>(`SELECT rs.*, r.driver_id, r.status AS route_status, s.tracking_number FROM route_stops rs JOIN routes r ON r.id = rs.route_id AND r.organization_id = ? LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = r.organization_id WHERE rs.id = ?`, [orgId, req.params.stopId]);
    if (!stop) throw Object.assign(new Error('Parada no encontrada en esta organización.'), { statusCode: 404 });
    const driver = await tx.queryOne<any>('SELECT user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [stop.driver_id, orgId]);
    if (['DRIVER', 'COURIER'].includes(role) && (!driver || driver.user_id !== req.user!.userId)) throw Object.assign(new Error('No estás autorizado para registrar esta incidencia.'), { statusCode: 403 });
    if (!['pending', 'arrived'].includes(String(stop.status))) throw Object.assign(new Error('La parada ya fue procesada.'), { statusCode: 409 });
    const changed = await tx.execute(`UPDATE route_stops SET status = 'failed', completed_at = ?, notes = ? WHERE id = ? AND route_id = ? AND status IN ('pending', 'arrived')`, [now, `${parsed.data.reason}${parsed.data.notes ? `: ${parsed.data.notes}` : ''}`, stop.id, stop.route_id]);
    if (changed.changes !== 1) throw Object.assign(new Error('La parada cambió mientras se registraba la incidencia.'), { statusCode: 409 });
    if (stop.shipment_id) {
      await tx.execute(`UPDATE shipments SET status = 'failed', updated_at = ? WHERE id = ? AND organization_id = ? AND status NOT IN ('delivered', 'cancelled')`, [now, stop.shipment_id, orgId]);
      await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, 'failed', NULL, ?, 'driver', ?, ?, ?)`, [`evt-${crypto.randomUUID()}`, stop.shipment_id, `Intento de entrega fallido: ${parsed.data.reason}`, req.user!.userId, JSON.stringify({ notes: parsed.data.notes || null }), now]);
    }
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'shipment.delivery_failed', 'route_stop', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, stop.id, JSON.stringify({ stopId: stop.id, shipmentId: stop.shipment_id, trackingNumber: stop.tracking_number, reason: parsed.data.reason, notes: parsed.data.notes || null }), now]);
    return { success: true, stopId: stop.id, status: 'failed', failedAt: now };
  });
  return res.json(result);
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
