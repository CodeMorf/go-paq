import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const internationalRouter = Router();

internationalRouter.get('/lockers', authenticate, requireScope('international:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const sql = `SELECT l.*, c.name AS client_name, c.company_name FROM international_lockers l JOIN clients c ON l.client_id = c.id AND c.organization_id = l.organization_id WHERE l.organization_id = ?${own && req.clientId ? ' AND l.client_id = ?' : ''} ORDER BY l.created_at DESC`;
  const lockers = await queryAllAsync(sql, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, lockers });
}));

internationalRouter.get('/packages', authenticate, requireScope('international:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const sql = `SELECT p.*, l.locker_code, c.company_name AS client_name FROM international_packages p LEFT JOIN international_lockers l ON p.locker_id = l.id AND l.organization_id = p.organization_id LEFT JOIN clients c ON p.client_id = c.id AND c.organization_id = p.organization_id WHERE p.organization_id = ?${own && req.clientId ? ' AND p.client_id = ?' : ''} ORDER BY p.created_at DESC`;
  const packages = await queryAllAsync(sql, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, count: packages.length, packages });
}));

const consolidateSchema = z.object({ packageIds: z.array(z.string().trim().min(1).max(160)).min(2).max(500), clientId: z.string().trim().min(1).max(160).optional(), notes: z.string().trim().max(500).optional() });

internationalRouter.post('/consolidate', authenticate, requireScope('international:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = consolidateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Datos de consolidación inválidos.' });
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const clientScoped = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const ids = [...new Set(parsed.data.packageIds)];
  if (clientScoped && parsed.data.clientId && parsed.data.clientId !== req.clientId) return res.status(403).json({ success: false, error: 'No puedes consolidar paquetes de otro cliente.' });
  const consolidationId = `csl-${crypto.randomUUID()}`;
  const masterTracking = `GP-CONSOL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const placeholders = ids.map(() => '?').join(',');
    const packages = await tx.queryAll<any>(`SELECT id, client_id, weight_lbs, status FROM international_packages WHERE organization_id = ? AND id IN (${placeholders})`, [orgId, ...ids]);
    if (packages.length !== ids.length) throw Object.assign(new Error('Uno o más paquetes no pertenecen a esta organización.'), { statusCode: 404 });
    const clientId = clientScoped ? req.clientId : parsed.data.clientId || packages[0].client_id;
    if (!clientId || packages.some((item) => item.client_id !== clientId)) throw Object.assign(new Error('Todos los paquetes deben pertenecer al mismo cliente.'), { statusCode: 422 });
    if (packages.some((item) => item.status === 'consolidated')) throw Object.assign(new Error('Uno o más paquetes ya fueron consolidados.'), { statusCode: 409 });
    const totalWeight = packages.reduce((sum, item) => sum + Number(item.weight_lbs || 0), 0);
    await tx.execute(`INSERT INTO international_consolidations (id, organization_id, client_id, master_tracking, packages_count, total_weight_lbs, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, 'consolidated', ?, ?)`, [consolidationId, orgId, clientId, masterTracking, ids.length, totalWeight, parsed.data.notes || null, now]);
    const updated = await tx.execute(`UPDATE international_packages SET status = 'consolidated', consolidation_id = ?, updated_at = ? WHERE organization_id = ? AND id IN (${placeholders}) AND status <> 'consolidated'`, [consolidationId, now, orgId, ...ids]);
    if (updated.changes !== ids.length) throw Object.assign(new Error('No se pudieron actualizar todos los paquetes.'), { statusCode: 409 });
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'international.consolidated', 'consolidation', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, consolidationId, JSON.stringify({ consolidationId, packageIds: ids, masterTracking }), now]);
    return { clientId, totalWeight };
  });
  return res.status(201).json({ success: true, message: 'Consolidación guardada en el servidor.', masterTracking, consolidationId, packagesConsolidated: ids.length, totalWeightLbs: result.totalWeight });
}));
