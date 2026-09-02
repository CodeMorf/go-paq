import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { isPostgres, queryAllAsync, queryOneAsync, executeAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';
import { readStoredFile, removeStoredFile, storeDataUrl } from '../../storage/storage.adapter';

export const driversRouter = Router();

const PHOTO_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const DRIVER_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function publicAppUrl(): string {
  const configured = process.env.GOPAQ_PUBLIC_URL || 'https://gopaq.lat';
  return configured.replace(/\/+$/, '');
}

function hashUploadToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildPhotoUpload(token: string, expiresAt: string) {
  return {
    url: `${publicAppUrl()}/driver-photo-upload?token=${encodeURIComponent(token)}`,
    expiresAt,
    expiresInHours: 24
  };
}

function driverResponse(driver: any) {
  if (!driver) return driver;
  const { photo_storage_key: photoStorageKey, ...safe } = driver;
  return {
    ...safe,
    has_photo: !!photoStorageKey,
    card_status: photoStorageKey && driver.card_number ? 'issued' : 'pending_photo'
  };
}

async function issuePhotoUploadToken(tx: any, organizationId: string, driverId: string, createdBy: string, now: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + PHOTO_UPLOAD_TTL_MS).toISOString();
  await tx.execute(
    `UPDATE driver_photo_upload_tokens SET revoked_at = ? WHERE organization_id = ? AND driver_id = ? AND used_at IS NULL AND revoked_at IS NULL`,
    [now, organizationId, driverId]
  );
  await tx.execute(
    `INSERT INTO driver_photo_upload_tokens (id, organization_id, driver_id, token_hash, expires_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [`dpt-${crypto.randomUUID()}`, organizationId, driverId, hashUploadToken(token), expiresAt, createdBy, now]
  );
  return buildPhotoUpload(token, expiresAt);
}

function generateCardNumber(): string {
  return `GP-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const driverCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(160).optional(),
  phone: z.string().trim().min(5).max(40),
  licenseNumber: z.string().trim().min(2).max(80),
  vehicleType: z.string().trim().min(2).max(100),
  vehiclePlate: z.string().trim().min(2).max(40),
  branchId: z.string().trim().min(1).max(120),
  userId: z.string().trim().min(1).max(120).optional()
}).strict();

driversRouter.post('/', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('drivers:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = driverCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de conductor inválidos.' });
  const organizationId = req.organizationId!;
  const branch = await queryOneAsync<{ id: string }>('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [parsed.data.branchId, organizationId]);
  if (!branch) return res.status(422).json({ success: false, error: 'La sucursal seleccionada no pertenece a esta organización.' });
  if (parsed.data.userId) {
    const user = await queryOneAsync<{ id: string }>(`SELECT id FROM users WHERE id = ? AND organization_id = ? AND active = 1 AND role IN ('DRIVER', 'COURIER')`, [parsed.data.userId, organizationId]);
    if (!user) return res.status(422).json({ success: false, error: 'La cuenta enlazada no es un conductor activo de esta organización.' });
  }
  const duplicate = await queryOneAsync<{ id: string }>('SELECT id FROM drivers WHERE organization_id = ? AND (lower(license_number) = lower(?) OR lower(vehicle_plate) = lower(?)) AND active = 1', [organizationId, parsed.data.licenseNumber, parsed.data.vehiclePlate]);
  if (duplicate) return res.status(409).json({ success: false, error: 'Ya existe un conductor activo con esa licencia o placa.' });

  const driverId = `drv-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO drivers (id, organization_id, branch_id, user_id, name, email, phone, license_number, vehicle_type, vehicle_plate, status, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', 1, ?, ?)`, [
      driverId, organizationId, parsed.data.branchId, parsed.data.userId || null, parsed.data.name, parsed.data.email || null, parsed.data.phone,
      parsed.data.licenseNumber, parsed.data.vehicleType, parsed.data.vehiclePlate, now, now
    ]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'driver.created', 'driver', ?, 'success', ?, ?, ?)`, [
      `aud-${crypto.randomUUID()}`, organizationId, req.user!.userId, driverId, req.ip,
      JSON.stringify({ branchId: parsed.data.branchId, hasLinkedUser: !!parsed.data.userId }), now
    ]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'driver.created', 'driver', ?, ?, 'pending', 0, ?)`, [
      `out-${crypto.randomUUID()}`, organizationId, driverId, JSON.stringify({ driverId, organizationId, branchId: parsed.data.branchId }), now
    ]);
    const photoUpload = await issuePhotoUploadToken(tx, organizationId, driverId, req.user!.userId, now);
    return {
      driver: { id: driverId, organization_id: organizationId, branch_id: parsed.data.branchId, user_id: parsed.data.userId || null, name: parsed.data.name, email: parsed.data.email || null, phone: parsed.data.phone, license_number: parsed.data.licenseNumber, vehicle_type: parsed.data.vehicleType, vehicle_plate: parsed.data.vehiclePlate, status: 'available', active: 1, photo_storage_key: null, photo_uploaded_at: null, card_number: null, card_issued_at: null, created_at: now, updated_at: now },
      photoUpload
    };
  });
  return res.status(201).json({ success: true, driver: driverResponse(result.driver), photoUpload: result.photoUpload });
}));

driversRouter.get('/', authenticate, requireScope('drivers:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const ownOnly = ['DRIVER', 'COURIER'].includes(role);
  const drivers = ownOnly
    ? await queryAllAsync(`SELECT d.*, b.name AS branch_name, u.email AS user_email FROM drivers d LEFT JOIN branches b ON d.branch_id = b.id AND b.organization_id = d.organization_id LEFT JOIN users u ON d.user_id = u.id AND u.organization_id = d.organization_id WHERE d.organization_id = ? AND d.user_id = ? AND d.active = 1`, [orgId, req.user!.userId])
    : await queryAllAsync(`SELECT d.*, b.name AS branch_name, u.email AS user_email FROM drivers d LEFT JOIN branches b ON d.branch_id = b.id AND b.organization_id = d.organization_id LEFT JOIN users u ON d.user_id = u.id AND u.organization_id = d.organization_id WHERE d.organization_id = ? AND d.active = 1 ORDER BY d.name ASC`, [orgId]);
  return res.json({ success: true, drivers: drivers.map(driverResponse) });
}));

driversRouter.post('/:id/photo-link', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('drivers:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const organizationId = req.organizationId!;
  const existing = await queryOneAsync<{ id: string }>('SELECT id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [req.params.id, organizationId]);
  if (!existing) return res.status(404).json({ success: false, error: 'Conductor no encontrado en esta organización.' });
  const now = new Date().toISOString();
  const photoUpload = await transactionAsync(async (tx) => {
    const upload = await issuePhotoUploadToken(tx, organizationId, req.params.id, req.user!.userId, now);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'driver.photo_link_created', 'driver', ?, 'success', ?, ?, ?)`, [
      `aud-${crypto.randomUUID()}`, organizationId, req.user!.userId, req.params.id, req.ip, JSON.stringify({ expiresAt: upload.expiresAt }), now
    ]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'driver.photo_link_created', 'driver', ?, ?, 'pending', 0, ?)`, [
      `out-${crypto.randomUUID()}`, organizationId, req.params.id, JSON.stringify({ driverId: req.params.id, organizationId, expiresAt: upload.expiresAt }), now
    ]);
    return upload;
  });
  return res.status(201).json({ success: true, photoUpload });
}));

const photoUploadSchema = z.object({ photoDataUrl: z.string().trim().min(1).max(3_000_000) }).strict();

// This endpoint is intentionally token-authenticated instead of JWT-authenticated:
// the administrator can send the one-time link to a driver who has not logged in yet.
driversRouter.post('/photo-upload/:token', asyncHandler(async (req, res) => {
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
  if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(410).json({ success: false, error: 'El enlace de carga no es válido o ya venció.' });
  const parsed = photoUploadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Selecciona una foto válida de máximo 2 MB.' });
  const storageValue = await storeDataUrl(parsed.data.photoDataUrl, 'driver-photos', DRIVER_PHOTO_MAX_BYTES);
  if (!storageValue) return res.status(422).json({ success: false, error: 'La foto es obligatoria.' });
  const now = new Date().toISOString();
  let committed = false;
  try {
    const result = await transactionAsync(async (tx) => {
      const tokenRow = await tx.queryOne<any>(`SELECT t.id, t.organization_id, t.driver_id, t.expires_at, t.used_at, t.revoked_at, d.name, d.card_number FROM driver_photo_upload_tokens t JOIN drivers d ON d.id = t.driver_id AND d.organization_id = t.organization_id WHERE t.token_hash = ?${isPostgres ? ' FOR UPDATE' : ''}`, [hashUploadToken(token)]);
      if (!tokenRow || tokenRow.revoked_at || new Date(String(tokenRow.expires_at)).getTime() <= Date.now()) throw Object.assign(new Error('El enlace de carga no es válido o ya venció.'), { statusCode: 410 });
      if (tokenRow.used_at) throw Object.assign(new Error('El enlace de carga ya fue utilizado.'), { statusCode: 409 });
      const used = await tx.execute(`UPDATE driver_photo_upload_tokens SET used_at = ? WHERE id = ? AND organization_id = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ?`, [now, tokenRow.id, tokenRow.organization_id, now]);
      if (used.changes !== 1) throw Object.assign(new Error('El enlace de carga ya fue utilizado o venció.'), { statusCode: 409 });
      const cardNumber = tokenRow.card_number || generateCardNumber();
      const updated = await tx.execute(`UPDATE drivers SET photo_storage_key = ?, photo_uploaded_at = ?, card_number = COALESCE(card_number, ?), card_issued_at = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, [storageValue, now, cardNumber, now, now, tokenRow.driver_id, tokenRow.organization_id]);
      if (updated.changes !== 1) throw Object.assign(new Error('El conductor no está disponible para recibir la foto.'), { statusCode: 409 });
      await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, NULL, 'driver.photo_uploaded', 'driver', ?, 'success', ?, ?, ?)`, [
        `aud-${crypto.randomUUID()}`, tokenRow.organization_id, tokenRow.driver_id, req.ip, JSON.stringify({ via: 'one_time_upload_link' }), now
      ]);
      await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'driver.photo_uploaded', 'driver', ?, ?, 'pending', 0, ?)`, [
        `out-${crypto.randomUUID()}`, tokenRow.organization_id, tokenRow.driver_id, JSON.stringify({ driverId: tokenRow.driver_id, organizationId: tokenRow.organization_id, cardNumber }), now
      ]);
      return { driverId: tokenRow.driver_id, driverName: tokenRow.name, cardNumber };
    });
    committed = true;
    return res.json({ success: true, card: { ...result, status: 'issued' } });
  } finally {
    if (!committed) await removeStoredFile(storageValue);
  }
}));

driversRouter.get('/:id/card', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('drivers:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const card = await queryOneAsync<any>(`SELECT d.id, d.organization_id, d.name, d.email, d.phone, d.license_number, d.vehicle_type, d.vehicle_plate, d.card_number, d.card_issued_at, d.photo_uploaded_at, d.photo_storage_key, b.name AS branch_name, b.code AS branch_code FROM drivers d LEFT JOIN branches b ON b.id = d.branch_id AND b.organization_id = d.organization_id WHERE d.id = ? AND d.organization_id = ? AND d.active = 1`, [req.params.id, req.organizationId]);
  if (!card) return res.status(404).json({ success: false, error: 'Conductor no encontrado en esta organización.' });
  return res.json({ success: true, card: { ...driverResponse(card), status: card.photo_storage_key && card.card_number ? 'issued' : 'pending_photo', photoUrl: card.photo_storage_key ? `/api/v1/drivers/${encodeURIComponent(card.id)}/photo` : null } });
}));

driversRouter.get('/:id/photo', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'DRIVER', 'COURIER']), requireScope('drivers:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const driver = await queryOneAsync<{ photo_storage_key: string | null; user_id: string | null }>('SELECT photo_storage_key, user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [req.params.id, req.organizationId]);
  if (!driver) return res.status(404).end();
  const role = normalizeRole(req.user?.role);
  if (['DRIVER', 'COURIER'].includes(role) && driver.user_id !== req.user!.userId) return res.status(403).json({ success: false, error: 'No autorizado para ver la foto de otro conductor.' });
  if (!driver.photo_storage_key) return res.status(404).end();
  const file = await readStoredFile(driver.photo_storage_key);
  if (!file) return res.status(404).end();
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.type(file.mimeType).send(file.buffer);
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
  const stops = route ? await queryAllAsync(`SELECT rs.*, COALESCE(s.tracking_number, j.tracking_number) AS tracking_number, COALESCE(s.destination_json, j.destination_json) AS destination_json, COALESCE(s.package_json, j.details_json) AS package_json, COALESCE(s.cod_amount, 0) AS cod_amount, COALESCE(s.service_type, j.service_type) AS service_type FROM route_stops rs LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = ? LEFT JOIN logistics_jobs j ON j.id = rs.job_id AND j.organization_id = ? WHERE rs.route_id = ? ORDER BY rs.sequence_order ASC`, [orgId, orgId, route.id]) : [];
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
    await tx.execute(`UPDATE logistics_jobs SET status = 'in_transit', updated_at = ? WHERE assigned_route_id = ? AND organization_id = ? AND status NOT IN ('completed', 'cancelled')`, [now, route.id, orgId]);
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
    const stop = await tx.queryOne<any>(`SELECT rs.*, r.organization_id, r.driver_id, r.status AS route_status, COALESCE(s.tracking_number, j.tracking_number) AS tracking_number, s.cod_amount, s.cod_currency, j.service_type AS job_service_type, j.status AS job_status, j.details_json AS job_details_json FROM route_stops rs JOIN routes r ON r.id = rs.route_id AND r.organization_id = ? LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = r.organization_id LEFT JOIN logistics_jobs j ON j.id = rs.job_id AND j.organization_id = r.organization_id WHERE rs.id = ?`, [orgId, req.params.stopId]);
    if (!stop) throw Object.assign(new Error('Parada no encontrada en esta organización.'), { statusCode: 404 });
    const driver = stop.driver_id ? await tx.queryOne<any>('SELECT id, user_id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [stop.driver_id, orgId]) : null;
    if (['DRIVER', 'COURIER'].includes(role) && (!driver || driver.user_id !== req.user!.userId)) throw Object.assign(new Error('No estás autorizado para completar esta parada.'), { statusCode: 403 });
    if (!['in_progress', 'published'].includes(String(stop.route_status))) throw Object.assign(new Error('La ruta no está activa.'), { statusCode: 409 });
    if (!['pending', 'arrived'].includes(String(stop.status))) throw Object.assign(new Error('La parada ya fue procesada.'), { statusCode: 409 });
    if ((!stop.shipment_id && !stop.job_id) || !stop.tracking_number) throw Object.assign(new Error('La parada no tiene un envío o trabajo asociado para generar tracking.'), { statusCode: 422 });
    const codAmount = Number(stop.cod_amount || 0);
    if (stop.job_id && Number(parsed.data.collectedCod) > 0) throw Object.assign(new Error('Los trabajos especiales no tienen COD configurado.'), { statusCode: 422 });
    if (codAmount > 0 && Math.abs(Number(parsed.data.collectedCod) - codAmount) > 0.01) throw Object.assign(new Error('El monto COD cobrado debe coincidir con el monto de la guía.'), { statusCode: 409 });

    const pod = { ...parsed.data.pod, signatureUrl: storedSignatureUrl, photoUrl: storedPhotoUrl, deliveredAt: now, actorId: req.user!.userId, codAmountCollected: parsed.data.collectedCod };
    const stopUpdated = await tx.execute(`UPDATE route_stops SET status = 'completed', completed_at = ?, pod_json = ?, notes = ? WHERE id = ? AND route_id = ? AND status IN ('pending', 'arrived')`, [now, JSON.stringify(pod), parsed.data.pod.notes || null, stop.id, stop.route_id]);
    if (stopUpdated.changes !== 1) throw Object.assign(new Error('La parada cambió mientras se registraba el POD.'), { statusCode: 409 });
    if (stop.shipment_id) {
      const shipmentUpdated = await tx.execute(`UPDATE shipments SET status = 'delivered', pod_json = ?, cod_collected = ?, payment_status = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status NOT IN ('delivered', 'cancelled')`, [JSON.stringify(pod), codAmount > 0 ? 1 : 0, codAmount > 0 ? 'collected' : 'not_applicable', now, stop.shipment_id, orgId]);
      if (shipmentUpdated.changes !== 1) throw Object.assign(new Error('El envío no pudo cambiar a entregado.'), { statusCode: 409 });
    } else {
      const jobDetails = safeJson(stop.job_details_json);
      jobDetails.pod = pod;
      const jobUpdated = await tx.execute(`UPDATE logistics_jobs SET status = 'completed', details_json = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status NOT IN ('completed', 'cancelled')`, [JSON.stringify(jobDetails), now, stop.job_id, orgId]);
      if (jobUpdated.changes !== 1) throw Object.assign(new Error('El trabajo no pudo cambiar a completado.'), { statusCode: 409 });
      await tx.execute(`INSERT INTO logistics_job_events (id, organization_id, job_id, status, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, 'completed', 'Trabajo completado con POD registrado', 'driver', ?, ?, ?)`, [`jbe-${crypto.randomUUID()}`, orgId, stop.job_id, req.user!.userId, JSON.stringify({ pod }), now]);
    }
    if (codAmount > 0) {
      const codUpdated = await tx.execute(`UPDATE cod_transactions SET status = 'collected_driver', driver_id = ?, collected_at = ?, method = ? WHERE shipment_id = ? AND organization_id = ? AND status = 'pending_collection'`, [stop.driver_id, now, parsed.data.codMethod, stop.shipment_id, orgId]);
      if (codUpdated.changes !== 1) throw Object.assign(new Error('El COD no está pendiente de cobro o ya fue procesado.'), { statusCode: 409 });
    }
    if (stop.shipment_id) await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, 'delivered', ?, 'Entrega completada con POD registrado', 'driver', ?, ?, ?)`, [`evt-${crypto.randomUUID()}`, stop.shipment_id, parsed.data.pod.lat !== undefined ? `${parsed.data.pod.lat},${parsed.data.pod.lng}` : null, req.user!.userId, JSON.stringify({ codAmountCollected: parsed.data.collectedCod }), now]);
    const counts = await tx.queryOne<{ completed: number | string }>('SELECT COUNT(*) AS completed FROM route_stops WHERE route_id = ? AND status = \'completed\'', [stop.route_id]);
    await tx.execute('UPDATE routes SET completed_stops = ?, status = CASE WHEN total_stops > 0 AND ? >= total_stops THEN \'completed\' ELSE status END, updated_at = ? WHERE id = ? AND organization_id = ?', [Number(counts?.completed || 0), Number(counts?.completed || 0), now, stop.route_id, orgId]);
    const aggregateType = stop.shipment_id ? 'shipment' : 'logistics_job';
    const aggregateId = stop.shipment_id || stop.job_id;
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, stop.shipment_id ? 'shipment.delivered' : 'job.completed', aggregateType, aggregateId, JSON.stringify({ shipmentId: stop.shipment_id || null, jobId: stop.job_id || null, trackingNumber: stop.tracking_number, stopId: stop.id, serviceType: stop.job_service_type || null, pod }), now]);
    const result = { success: true, stopId: stop.id, shipmentId: stop.shipment_id || null, jobId: stop.job_id || null, trackingNumber: stop.tracking_number, status: 'delivered', completedAt: now, codStatus: codAmount > 0 ? 'collected_driver' : 'not_applicable' };
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
    const stop = await tx.queryOne<any>(`SELECT rs.*, r.driver_id, r.status AS route_status, COALESCE(s.tracking_number, j.tracking_number) AS tracking_number FROM route_stops rs JOIN routes r ON r.id = rs.route_id AND r.organization_id = ? LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = r.organization_id LEFT JOIN logistics_jobs j ON j.id = rs.job_id AND j.organization_id = r.organization_id WHERE rs.id = ?`, [orgId, req.params.stopId]);
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
    if (stop.job_id) {
      await tx.execute(`UPDATE logistics_jobs SET status = 'failed', updated_at = ? WHERE id = ? AND organization_id = ? AND status NOT IN ('completed', 'cancelled')`, [now, stop.job_id, orgId]);
      await tx.execute(`INSERT INTO logistics_job_events (id, organization_id, job_id, status, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, 'failed', ?, 'driver', ?, ?, ?)`, [`jbe-${crypto.randomUUID()}`, orgId, stop.job_id, `Trabajo fallido: ${parsed.data.reason}`, req.user!.userId, JSON.stringify({ notes: parsed.data.notes || null }), now]);
    }
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, stop.job_id ? 'job.failed' : 'shipment.delivery_failed', stop.job_id ? 'logistics_job' : 'route_stop', stop.job_id || stop.id, JSON.stringify({ stopId: stop.id, shipmentId: stop.shipment_id || null, jobId: stop.job_id || null, trackingNumber: stop.tracking_number, reason: parsed.data.reason, notes: parsed.data.notes || null }), now]);
    return { success: true, stopId: stop.id, status: 'failed', failedAt: now };
  });
  return res.json(result);
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
