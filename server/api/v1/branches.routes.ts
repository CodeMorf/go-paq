import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const branchesRouter = Router();

// Public branch directory intentionally returns only public contact/location data.
branchesRouter.get('/public', asyncHandler(async (_req, res) => {
  const orgId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  const branches = await queryAllAsync(`SELECT id, code, name, city, address, phone, latitude, longitude, is_hub FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC`, [orgId]);
  return res.json({ success: true, branches });
}));

branchesRouter.get('/', authenticate, requireScope('branches:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const branchScoped = req.user && ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user.branchId;
  const branches = branchScoped
    ? await queryAllAsync('SELECT * FROM branches WHERE organization_id = ? AND id = ? AND active = 1 ORDER BY is_hub DESC, name ASC', [orgId, req.user!.branchId])
    : await queryAllAsync('SELECT * FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC', [orgId]);
  return res.json({ success: true, branches });
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
    const shipment = await tx.queryOne<any>('SELECT id, tracking_number, branch_id, status, assigned_route_id FROM shipments WHERE organization_id = ? AND (id = ? OR tracking_number = ?)', [orgId, parsed.data.trackingNumber, parsed.data.trackingNumber]);
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
    const response = { success: true, shipmentId: shipment.id, trackingNumber: shipment.tracking_number, branchId, action: parsed.data.action, status: nextStatus, processedAt: now };
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
