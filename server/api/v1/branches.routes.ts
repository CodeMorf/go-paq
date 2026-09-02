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
