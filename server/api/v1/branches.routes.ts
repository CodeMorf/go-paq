import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { isPostgres, queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';
import { readStoredFile, storeDataUrl } from '../../storage/storage.adapter';

export const branchesRouter = Router();

function branchResponse(branch: any) {
  if (!branch) return branch;
  const { logo_storage_key: _logoStorageKey, business_hours_json: businessHoursJson, ...safe } = branch;
  let businessHours = {};
  try { businessHours = businessHoursJson ? JSON.parse(String(businessHoursJson)) : {}; } catch { businessHours = {}; }
  return { ...safe, business_hours: businessHours, logo_url: _logoStorageKey ? `/api/v1/branches/${encodeURIComponent(branch.id)}/logo` : null };
}

// Public branch directory intentionally returns only public contact/location data.
branchesRouter.get('/public', asyncHandler(async (_req, res) => {
  const orgId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  const branches = await queryAllAsync(`SELECT id, code, name, city, address, phone, latitude, longitude, is_hub, country, province, sector, postal_code, whatsapp, email, branch_type FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC`, [orgId]);
  return res.json({ success: true, branches: branches.map(branchResponse) });
}));

branchesRouter.get('/', authenticate, requireScope('branches:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const branchScoped = req.user && ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user.branchId;
  const branches = branchScoped
    ? await queryAllAsync('SELECT * FROM branches WHERE organization_id = ? AND id = ? AND active = 1 ORDER BY is_hub DESC, name ASC', [orgId, req.user!.branchId])
    : await queryAllAsync('SELECT * FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC', [orgId]);
  return res.json({ success: true, branches: branches.map(branchResponse) });
}));

const branchFields = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, 'El código solo puede contener letras, números, guiones y guiones bajos.'),
  name: z.string().trim().min(2).max(160),
  city: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().max(40).optional(),
  managerName: z.string().trim().max(160).optional(),
  managerPhone: z.string().trim().max(40).optional(),
  managerEmail: z.string().email().max(254).optional().or(z.literal('')),
  country: z.string().trim().length(2).default('DO'),
  province: z.string().trim().max(120).optional(),
  sector: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(24).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  businessHours: z.record(z.string(), z.string().max(80)).default({}),
  branchType: z.enum(['branch', 'agency', 'warehouse', 'hub', 'delivery_point', 'pickup_point']).default('branch'),
  logo: z.string().optional(),
  isHub: z.boolean().default(false),
  latitude: z.union([z.null(), z.coerce.number().min(-90).max(90)]).optional(),
  longitude: z.union([z.null(), z.coerce.number().min(-180).max(180)]).optional()
}).strict();

const branchCreateSchema = branchFields.superRefine((value, context) => {
  if ((value.latitude === null || value.latitude === undefined) !== (value.longitude === null || value.longitude === undefined)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'La latitud y la longitud deben guardarse juntas.' });
  }
});

branchesRouter.post('/', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = branchCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de sucursal inválidos.' });
  const organizationId = req.organizationId!;
  const duplicate = await queryOneAsync<{ id: string }>('SELECT id FROM branches WHERE organization_id = ? AND lower(code) = lower(?)', [organizationId, parsed.data.code]);
  if (duplicate) return res.status(409).json({ success: false, error: 'Ya existe una sucursal con ese código en esta organización.' });

  const branchId = `br-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const latitude = parsed.data.latitude ?? null;
  const longitude = parsed.data.longitude ?? null;
  const logoStorageKey = parsed.data.logo ? await storeDataUrl(parsed.data.logo, 'branch-logos', 2 * 1024 * 1024) : null;
  const branch = await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO branches (id, organization_id, code, name, city, address, phone, manager_name, manager_phone, manager_email, country, province, sector, postal_code, whatsapp, email, business_hours_json, branch_type, logo_storage_key, latitude, longitude, is_hub, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
      branchId, organizationId, parsed.data.code, parsed.data.name, parsed.data.city, parsed.data.address,
      parsed.data.phone || null, parsed.data.managerName || null, parsed.data.managerPhone || null, parsed.data.managerEmail || null,
      parsed.data.country.toUpperCase(), parsed.data.province || null, parsed.data.sector || null, parsed.data.postalCode || null,
      parsed.data.whatsapp || null, parsed.data.email || null, JSON.stringify(parsed.data.businessHours), parsed.data.branchType,
      logoStorageKey, latitude, longitude, parsed.data.isHub ? 1 : 0, now, now
    ]);
    if (isPostgres && latitude !== null && longitude !== null) {
      await tx.execute('UPDATE branches SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ? AND organization_id = ?', [longitude, latitude, branchId, organizationId]);
    }
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'branch.created', 'branch', ?, 'success', ?, ?, ?)`, [
      `aud-${crypto.randomUUID()}`, organizationId, req.user!.userId, branchId, req.ip,
      JSON.stringify({ code: parsed.data.code, name: parsed.data.name, hasCoordinates: latitude !== null && longitude !== null }), now
    ]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'branch.created', 'branch', ?, ?, 'pending', 0, ?)`, [
      `out-${crypto.randomUUID()}`, organizationId, branchId, JSON.stringify({ branchId, organizationId, code: parsed.data.code, name: parsed.data.name }), now
    ]);
    return branchResponse({ id: branchId, organization_id: organizationId, code: parsed.data.code, name: parsed.data.name, city: parsed.data.city, address: parsed.data.address, phone: parsed.data.phone || null, manager_name: parsed.data.managerName || null, manager_phone: parsed.data.managerPhone || null, manager_email: parsed.data.managerEmail || null, country: parsed.data.country.toUpperCase(), province: parsed.data.province || null, sector: parsed.data.sector || null, postal_code: parsed.data.postalCode || null, whatsapp: parsed.data.whatsapp || null, email: parsed.data.email || null, business_hours_json: JSON.stringify(parsed.data.businessHours), branch_type: parsed.data.branchType, logo_storage_key: logoStorageKey, latitude, longitude, is_hub: parsed.data.isHub ? 1 : 0, active: 1, created_at: now, updated_at: now });
  });
  return res.status(201).json({ success: true, branch });
}));

const branchUpdateSchema = branchFields.partial().omit({ code: true }).extend({
  logo: z.union([z.string(), z.null()]).optional(),
  latitude: z.union([z.null(), z.coerce.number().min(-90).max(90)]).optional(),
  longitude: z.union([z.null(), z.coerce.number().min(-180).max(180)]).optional()
}).strict().superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null) && (value.latitude !== undefined || value.longitude !== undefined)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'La latitud y la longitud deben guardarse juntas.' });
});

branchesRouter.patch('/:id', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = branchUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de sucursal inválidos.' });
  const organizationId = req.organizationId!;
  const branchId = String(req.params.id || '').trim();
  const current = await queryOneAsync<any>('SELECT * FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, organizationId]);
  if (!current) return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
  const logoStorageKey = parsed.data.logo === undefined ? current.logo_storage_key : parsed.data.logo === null ? null : await storeDataUrl(parsed.data.logo, 'branch-logos', 2 * 1024 * 1024);
  const now = new Date().toISOString();
  const latitude = parsed.data.latitude === undefined ? current.latitude : parsed.data.latitude;
  const longitude = parsed.data.longitude === undefined ? current.longitude : parsed.data.longitude;
  const values: any[] = [
    parsed.data.name ?? current.name, parsed.data.city ?? current.city, parsed.data.address ?? current.address,
    parsed.data.phone === undefined ? current.phone : parsed.data.phone || null, parsed.data.managerName === undefined ? current.manager_name : parsed.data.managerName || null,
    parsed.data.managerPhone === undefined ? current.manager_phone : parsed.data.managerPhone || null, parsed.data.managerEmail === undefined ? current.manager_email : parsed.data.managerEmail || null,
    parsed.data.country?.toUpperCase() ?? current.country, parsed.data.province === undefined ? current.province : parsed.data.province || null,
    parsed.data.sector === undefined ? current.sector : parsed.data.sector || null, parsed.data.postalCode === undefined ? current.postal_code : parsed.data.postalCode || null,
    parsed.data.whatsapp === undefined ? current.whatsapp : parsed.data.whatsapp || null, parsed.data.email === undefined ? current.email : parsed.data.email || null,
    parsed.data.businessHours === undefined ? current.business_hours_json : JSON.stringify(parsed.data.businessHours), parsed.data.branchType ?? current.branch_type,
    logoStorageKey, latitude, longitude, parsed.data.isHub === undefined ? current.is_hub : parsed.data.isHub ? 1 : 0, now, branchId, organizationId
  ];
  const updated = await transactionAsync(async (tx) => {
    const result = isPostgres && latitude !== null && longitude !== null
      ? await tx.execute(`UPDATE branches SET name = ?, city = ?, address = ?, phone = ?, manager_name = ?, manager_phone = ?, manager_email = ?, country = ?, province = ?, sector = ?, postal_code = ?, whatsapp = ?, email = ?, business_hours_json = ?, branch_type = ?, logo_storage_key = ?, latitude = ?, longitude = ?, is_hub = ?, location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, [...values.slice(0, 16), latitude, longitude, values[18], longitude, latitude, ...values.slice(19)])
      : await tx.execute(`UPDATE branches SET name = ?, city = ?, address = ?, phone = ?, manager_name = ?, manager_phone = ?, manager_email = ?, country = ?, province = ?, sector = ?, postal_code = ?, whatsapp = ?, email = ?, business_hours_json = ?, branch_type = ?, logo_storage_key = ?, latitude = ?, longitude = ?, is_hub = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, values);
    if (result.changes !== 1) throw Object.assign(new Error('La sucursal cambió mientras se guardaba.'), { statusCode: 409 });
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'branch.updated', 'branch', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, organizationId, req.user!.userId, branchId, req.ip, JSON.stringify({ fields: Object.keys(parsed.data).filter((field) => field !== 'logo') }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'branch.updated', 'branch', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, organizationId, branchId, JSON.stringify({ branchId, organizationId }), now]);
    return tx.queryOne<any>('SELECT * FROM branches WHERE id = ? AND organization_id = ?', [branchId, organizationId]);
  });
  return res.json({ success: true, branch: branchResponse(updated) });
}));

branchesRouter.get('/:id/logo', authenticate, requireScope('branches:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const branch = await queryOneAsync<{ logo_storage_key: string | null }>('SELECT logo_storage_key FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [req.params.id, req.organizationId]);
  if (!branch?.logo_storage_key) return res.status(404).end();
  const file = await readStoredFile(branch.logo_storage_key);
  if (!file) return res.status(404).end();
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.type(file.mimeType).send(file.buffer);
}));

branchesRouter.patch('/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const active = req.body?.active === true ? 1 : req.body?.active === false ? 0 : null;
  if (active === null) return res.status(422).json({ success: false, error: 'Indica active como true o false.' });
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const updated = await tx.execute('UPDATE branches SET active = ?, updated_at = ? WHERE id = ? AND organization_id = ?', [active, now, req.params.id, req.organizationId]);
    if (updated.changes !== 1) throw Object.assign(new Error('Sucursal no encontrada.'), { statusCode: 404 });
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, ?, 'branch', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, active ? 'branch.activated' : 'branch.deactivated', req.params.id, req.ip, JSON.stringify({ active: !!active }), now]);
    return active;
  });
  return res.json({ success: true, active: !!result });
}));

branchesRouter.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const branch = await tx.queryOne<any>('SELECT id, active FROM branches WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
    if (!branch) throw Object.assign(new Error('Sucursal no encontrada.'), { statusCode: 404 });
    if (!branch.active) return false;
    await tx.execute('UPDATE branches SET active = 0, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1', [now, req.params.id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'branch.deactivated', 'branch', ?, 'success', ?, '{}', ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, now]);
    return true;
  });
  return res.json({ success: true, status: result ? 'deactivated' : 'already_inactive' });
}));

const locationSchema = z.object({
  latitude: z.union([z.null(), z.coerce.number().min(-90).max(90)]),
  longitude: z.union([z.null(), z.coerce.number().min(-180).max(180)]),
  address: z.string().trim().min(5).max(300).optional()
}).strict().superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'La latitud y la longitud deben guardarse juntas.' });
  }
});

// Branch coordinates are operational master data. Only tenant administrators
// can change them, and every change is persisted together with its audit/outbox
// records so public maps never depend on browser-only state.
branchesRouter.patch('/:id/location', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Coordenadas inválidas.' });

  const branchId = String(req.params.id || '').trim();
  const organizationId = req.organizationId!;
  const now = new Date().toISOString();
  const branch = await transactionAsync(async (tx) => {
    const current = await tx.queryOne<any>('SELECT id, code, name, city, address, latitude, longitude FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, organizationId]);
    if (!current) throw Object.assign(new Error('Sucursal no encontrada.'), { statusCode: 404 });

    let updated;
    if (isPostgres && parsed.data.latitude !== null && parsed.data.longitude !== null) {
      // PostGIS receives longitude first, latitude second (X/Y).
      updated = await tx.execute(`UPDATE branches SET address = COALESCE(?, address), latitude = ?, longitude = ?, location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, [parsed.data.address || null, parsed.data.latitude, parsed.data.longitude, parsed.data.longitude, parsed.data.latitude, now, branchId, organizationId]);
    } else {
      updated = await tx.execute(`UPDATE branches SET address = COALESCE(?, address), latitude = ?, longitude = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, [parsed.data.address || null, parsed.data.latitude, parsed.data.longitude, now, branchId, organizationId]);
    }
    if (updated.changes !== 1) throw Object.assign(new Error('La sucursal cambió mientras se guardaba su ubicación.'), { statusCode: 409 });

    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'branch.location_updated', 'branch', ?, 'success', ?, ?, ?)`, [
      `aud-${crypto.randomUUID()}`, organizationId, req.user!.userId, branchId, req.ip,
      JSON.stringify({ latitude: parsed.data.latitude, longitude: parsed.data.longitude, address: parsed.data.address || null, previousLatitude: current.latitude, previousLongitude: current.longitude }), now
    ]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'branch.location_updated', 'branch', ?, ?, 'pending', 0, ?)`, [
      `out-${crypto.randomUUID()}`, organizationId, branchId,
      JSON.stringify({ branchId, latitude: parsed.data.latitude, longitude: parsed.data.longitude, updatedAt: now }), now
    ]);

    return { ...current, address: parsed.data.address || current.address, latitude: parsed.data.latitude, longitude: parsed.data.longitude, updated_at: now };
  });

  return res.json({ success: true, branch });
}));

branchesRouter.get('/:id/inventory', authenticate, requireScope('branches:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  if (req.user?.branchId && ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user.branchId !== id) return res.status(403).json({ success: false, error: 'La cuenta no puede consultar otra sucursal.' });
  if (!(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [id, orgId]))) return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
  const packages = await queryAllAsync(`SELECT * FROM shipments WHERE organization_id = ? AND branch_id = ? AND status IN ('at_branch', 'pending', 'picked_up') ORDER BY updated_at DESC`, [orgId, id]);
  return res.json({ success: true, branchId: id, count: packages.length, inventory: packages.map((p) => ({ ...p, destination: safeJson(p.destination_json), package: safeJson(p.package_json) })) });
}));

const closeSchema = z.object({ totalCash: z.coerce.number().min(0).max(100000000), totalPos: z.coerce.number().min(0).max(100000000), totalTransfers: z.coerce.number().min(0).max(100000000), notes: z.string().trim().max(500).optional() });

const scanSchema = z.object({
  trackingNumber: z.string().trim().min(4).max(160),
  action: z.enum(['receive', 'store', 'dispatch']).default('store'),
  location: z.string().trim().max(120).optional()
});

branchesRouter.post('/:id/scan', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'WAREHOUSE', 'DISPATCHER']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de escaneo inválidos.' });
  const orgId = req.organizationId!;
  const branchId = req.params.id;
  const role = normalizeRole(req.user?.role);
  const branchScoped = ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'WAREHOUSE', 'DISPATCHER', 'CASHIER'].includes(role);
  if (branchScoped && req.user?.branchId !== branchId) return res.status(403).json({ success: false, error: 'La cuenta no puede operar otra sucursal.' });
  if (!(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, orgId]))) return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });

  const idempotencyKey = req.header('idempotency-key')?.trim();
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 200)) return res.status(400).json({ success: false, error: 'Idempotency-Key inválida.' });
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  if (idempotencyKey) {
    const previous = await queryOneAsync<{ request_hash: string; status_code: number; response_json: string }>('SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?', [orgId, idempotencyKey]);
    if (previous?.request_hash !== requestHash && previous) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous) return res.status(previous.status_code || 200).json(JSON.parse(previous.response_json));
  }

  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const shipment = await tx.queryOne<any>(`SELECT s.id, s.tracking_number, s.branch_id, s.status, s.assigned_route_id,
      c.name AS client_name, b.name AS branch_name
      FROM shipments s
      LEFT JOIN clients c ON c.id = s.client_id AND c.organization_id = s.organization_id
      LEFT JOIN branches b ON b.id = s.branch_id AND b.organization_id = s.organization_id
      WHERE s.organization_id = ? AND (s.id = ? OR s.tracking_number = ?)${isPostgres ? ' FOR UPDATE' : ''}`, [orgId, parsed.data.trackingNumber, parsed.data.trackingNumber]);
    if (!shipment) throw Object.assign(new Error('Guía no encontrada en esta organización.'), { statusCode: 404 });
    if (shipment.branch_id && shipment.branch_id !== branchId) throw Object.assign(new Error('La guía pertenece a otra sucursal.'), { statusCode: 403 });
    if (parsed.data.action === 'dispatch' && !shipment.assigned_route_id) throw Object.assign(new Error('La guía debe estar asignada a una ruta antes del despacho.'), { statusCode: 409 });
    const nextStatus = parsed.data.action === 'dispatch' ? 'out_for_delivery' : 'at_branch';
    if (parsed.data.action === 'receive' && !['pending', 'picked_up', 'failed', 'at_branch'].includes(String(shipment.status))) throw Object.assign(new Error('La guía no puede recibirse desde su estado actual.'), { statusCode: 409 });
    if (parsed.data.action === 'store' && !['pending', 'picked_up', 'at_branch'].includes(String(shipment.status))) throw Object.assign(new Error('La guía no puede almacenarse desde su estado actual.'), { statusCode: 409 });
    if (parsed.data.action === 'dispatch' && shipment.status !== 'at_branch') throw Object.assign(new Error('La guía debe estar en sucursal antes de despacharse.'), { statusCode: 409 });
    const locationJson = parsed.data.action === 'store' ? JSON.stringify({ branchId, location: parsed.data.location || null, updatedAt: now }) : null;
    const updated = await tx.execute(`UPDATE shipments SET branch_id = ?, status = ?, current_location_json = ?, updated_at = ? WHERE id = ? AND organization_id = ?`, [branchId, nextStatus, locationJson, now, shipment.id, orgId]);
    if (updated.changes !== 1) throw Object.assign(new Error('La guía cambió mientras se registraba el escaneo.'), { statusCode: 409 });
    await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)`, [`evt-${crypto.randomUUID()}`, shipment.id, nextStatus, parsed.data.location || branchId, parsed.data.action === 'dispatch' ? 'Envío despachado desde sucursal' : parsed.data.action === 'receive' ? 'Envío recibido en sucursal' : 'Envío almacenado en sucursal', req.user!.userId, JSON.stringify({ action: parsed.data.action, branchId, location: parsed.data.location || null }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, ?, 'shipment', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, `shipment.branch_${parsed.data.action}`, shipment.id, JSON.stringify({ shipmentId: shipment.id, trackingNumber: shipment.tracking_number, branchId, action: parsed.data.action, status: nextStatus }), now]);
    const response = { success: true, shipmentId: shipment.id, trackingNumber: shipment.tracking_number, clientName: shipment.client_name || null, branchName: shipment.branch_name || null, branchId, action: parsed.data.action, previousStatus: shipment.status, status: nextStatus, processedAt: now, processedBy: req.user!.name };
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 200, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(response), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    return response;
  });
  return res.json(result);
}));

branchesRouter.post('/:id/cash-close', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'BRANCH_MANAGER', 'CASHIER']), requireScope('branches:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = closeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cierre inválidos.' });
  const { id } = req.params;
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  if (req.user?.branchId && ['BRANCH_MANAGER', 'CASHIER'].includes(role) && req.user.branchId !== id) return res.status(403).json({ success: false, error: 'La cuenta no puede cerrar otra sucursal.' });
  if (!(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [id, orgId]))) return res.status(404).json({ success: false, error: 'Sucursal no encontrada.' });
  const totals = parsed.data;
  const grandTotal = totals.totalCash + totals.totalPos + totals.totalTransfers;
  const now = new Date().toISOString();
  const closeId = `cash-${crypto.randomUUID()}`;
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO cash_closes (id, organization_id, branch_id, closed_by, total_cash, total_pos, total_transfers, grand_total, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [closeId, orgId, id, req.user!.userId, totals.totalCash, totals.totalPos, totals.totalTransfers, grandTotal, totals.notes || null, now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'branch.cash_closed', 'cash_close', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, closeId, JSON.stringify({ closeId, branchId: id, grandTotal }), now]);
  });
  return res.status(201).json({ success: true, message: 'Cierre de caja guardado en el servidor.', summary: { id: closeId, branchId: id, ...totals, grandTotal, timestamp: now, closedBy: req.user?.name } });
}));

function safeJson(value: unknown): Record<string, unknown> {
  try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; }
}
