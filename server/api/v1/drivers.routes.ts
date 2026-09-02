import { Router } from 'express';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, executeAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

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

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
