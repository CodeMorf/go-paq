import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { issueSession } from './auth.routes';
import { writeAuditLog } from '../../auth/audit';
import { asyncHandler } from '../../core/http';

export const clientsRouter = Router();
const adminRoles = ['SUPER_ADMIN', 'OWNER', 'ADMIN'];

clientsRouter.get('/', authenticate, requireScope('clients:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const isClient = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const branchScoped = ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role);
  if (branchScoped && !req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });
  const filters = ['c.organization_id = ?'];
  const params: any[] = [orgId];
  const status = String(req.query.status || 'active');
  if (status === 'active') filters.push('c.active = 1');
  else if (status === 'inactive') filters.push('c.active = 0');
  if (isClient && req.clientId) { filters.push('c.id = ?'); params.push(req.clientId); }
  if (branchScoped) { filters.push('c.branch_id = ?'); params.push(req.user!.branchId); }
  const q = String(req.query.q || '').trim().slice(0, 160);
  if (q) {
    const pattern = `%${q.toLowerCase()}%`;
    filters.push(`(lower(coalesce(c.name, '')) LIKE ? OR lower(coalesce(c.company_name, '')) LIKE ? OR lower(coalesce(c.email, '')) LIKE ? OR lower(coalesce(c.phone, '')) LIKE ? OR lower(coalesce(c.city, '')) LIKE ?)`);
    params.push(pattern, pattern, pattern, pattern, pattern);
  }
  if (req.query.branchId && !branchScoped) { filters.push('c.branch_id = ?'); params.push(String(req.query.branchId)); }
  if (req.query.country) { filters.push('c.country = ?'); params.push(String(req.query.country).slice(0, 2).toUpperCase()); }
  if (req.query.city) { filters.push('lower(coalesce(c.city, \'\')) LIKE ?'); params.push(`%${String(req.query.city).toLowerCase().slice(0, 120)}%`); }
  if (req.query.tier) { filters.push('c.tier = ?'); params.push(String(req.query.tier).slice(0, 60)); }
  if (String(req.query.balance || '') === 'positive') filters.push('(coalesce(c.balance, 0) > 0 OR coalesce(c.cod_pending_balance, 0) > 0)');
  if (req.query.createdFrom) { filters.push('c.created_at >= ?'); params.push(String(req.query.createdFrom).slice(0, 30)); }
  if (req.query.createdTo) { filters.push('c.created_at < ?'); params.push(String(req.query.createdTo).slice(0, 30)); }
  const allowedSort = new Set(['created_at', 'name', 'company_name', 'email', 'balance', 'updated_at']);
  const sort = allowedSort.has(String(req.query.sort)) ? String(req.query.sort) : 'created_at';
  const direction = String(req.query.direction).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '50'), 10) || 50));
  const offset = (page - 1) * limit;
  const where = filters.join(' AND ');
  const countRow = await queryOneAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM clients c WHERE ${where}`, params);
  const rows = await queryAllAsync(`
    SELECT c.id, c.organization_id, c.branch_id, c.name, c.company_name, c.email, c.phone,
           c.rnc_tax_id, c.tier, c.credit_limit, c.balance, c.cod_pending_balance, c.addresses_json,
           c.active, c.created_at, c.updated_at, b.name AS branch_name,
           (SELECT COUNT(*) FROM shipments s WHERE s.organization_id = c.organization_id AND s.client_id = c.id) AS shipment_count,
           (SELECT MAX(s.updated_at) FROM shipments s WHERE s.organization_id = c.organization_id AND s.client_id = c.id) AS last_activity_at,
           CASE WHEN EXISTS (SELECT 1 FROM users u WHERE u.organization_id = c.organization_id AND lower(u.email) = lower(c.email) AND u.active = 1) THEN 1 ELSE 0 END AS has_login
    FROM clients c LEFT JOIN branches b ON b.id = c.branch_id AND b.organization_id = c.organization_id
    WHERE ${where}
    ORDER BY c.${sort} ${direction}, c.id ASC LIMIT ? OFFSET ?
  `, [...params, limit, offset]);
  return res.json({ success: true, clients: rows, pagination: { page, limit, total: Number(countRow?.count || 0), pages: Math.ceil(Number(countRow?.count || 0) / limit) } });
}));

const clientSchema = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(160).optional(),
  email: z.string().email().max(254),
  phone: z.string().trim().min(5).max(40),
  rncTaxId: z.string().trim().max(40).optional(),
  country: z.string().trim().length(2).default('DO'),
  province: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  tier: z.string().trim().max(60).default('Standard'),
  creditLimit: z.coerce.number().min(0).max(100000000).default(0),
  branchId: z.string().trim().min(1).max(120)
});

clientsRouter.post('/', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER']), requireScope('clients:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cliente inválidos.', details: parsed.error.flatten() });
  const orgId = req.organizationId!;
  const input = parsed.data;
  const role = normalizeRole(req.user?.role);
  const branchScopedRoles = ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'];
  if (branchScopedRoles.includes(role) && !req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });
  if (branchScopedRoles.includes(role) && input.branchId !== req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta solo puede crear clientes en su sucursal.' });
  if (!(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [input.branchId, orgId]))) return res.status(422).json({ success: false, error: 'Sucursal inválida para esta organización.' });
  const email = input.email.toLowerCase().trim();
  if (await queryOneAsync('SELECT id FROM clients WHERE organization_id = ? AND email = ? AND active = 1', [orgId, email])) return res.status(409).json({ success: false, error: 'Ya existe un cliente activo con ese correo.' });
  const clientId = `cli-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, country, province, city, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)`, [clientId, orgId, input.branchId, input.name, input.companyName || input.name, email, input.phone, input.rncTaxId || '', input.country.toUpperCase(), input.province || null, input.city || null, input.tier, input.creditLimit, now, now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'client.created', 'client', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, clientId, JSON.stringify({ clientId }), now]);
  });
  return res.status(201).json({ success: true, client: { id: clientId, ...input, email, branchId: input.branchId, balance: 0, cod_pending_balance: 0, active: 1, created_at: now } });
}));

const clientPatchSchema = clientSchema.omit({ email: true }).partial();
clientsRouter.patch('/:id', authenticate, requireRole(adminRoles), requireScope('clients:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = clientPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cliente inválidos.' });
  const current = await queryOneAsync<any>('SELECT * FROM clients WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
  if (!current) return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
  const input = parsed.data; const branchId = input.branchId ?? current.branch_id;
  if (branchId && !(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, req.organizationId]))) return res.status(422).json({ success: false, error: 'Sucursal inválida para esta organización.' });
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`UPDATE clients SET name = ?, company_name = ?, phone = ?, rnc_tax_id = ?, country = ?, province = ?, city = ?, tier = ?, credit_limit = ?, branch_id = ?, updated_at = ? WHERE id = ? AND organization_id = ?`, [input.name ?? current.name, input.companyName === undefined ? current.company_name : input.companyName || null, input.phone ?? current.phone, input.rncTaxId === undefined ? current.rnc_tax_id : input.rncTaxId || null, input.country?.toUpperCase() ?? current.country, input.province === undefined ? current.province : input.province || null, input.city === undefined ? current.city : input.city || null, input.tier ?? current.tier, input.creditLimit ?? current.credit_limit, branchId, now, req.params.id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'client.updated', 'client', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, JSON.stringify({ fields: Object.keys(input) }), now]);
  });
  return res.json({ success: true, client: await queryOneAsync<any>('SELECT * FROM clients WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]) });
}));

clientsRouter.delete('/:id', authenticate, requireRole(adminRoles), requireScope('clients:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const clientId = String(req.params.id || '').trim();
  const orgId = req.organizationId!;
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const client = await tx.queryOne<any>('SELECT id, email, active FROM clients WHERE id = ? AND organization_id = ?', [clientId, orgId]);
    if (!client) throw Object.assign(new Error('Cliente no encontrado.'), { statusCode: 404 });
    if (!client.active) return { alreadyInactive: true };
    await tx.execute('UPDATE clients SET active = 0, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1', [now, clientId, orgId]);
    await tx.execute('UPDATE users SET active = 0, updated_at = ? WHERE organization_id = ? AND lower(email) = lower(?) AND role IN (\'CLIENT\', \'CUSTOMER\')', [now, orgId, client.email]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'client.deactivated', 'client', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, orgId, req.user!.userId, clientId, req.ip, JSON.stringify({ accessRevoked: true }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'client.deactivated', 'client', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, clientId, JSON.stringify({ clientId, organizationId: orgId }), now]);
    return { alreadyInactive: false };
  });
  return res.json({ success: true, status: result.alreadyInactive ? 'already_inactive' : 'deactivated' });
}));

clientsRouter.post('/:id/support-session', authenticate, requireRole(adminRoles), requireScope('clients:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const clientId = String(req.params.id || '').trim();
  const client = await queryOneAsync<any>(`
    SELECT c.id, c.organization_id, c.email AS client_email, u.id AS user_id, u.email, u.name, u.role, u.phone, u.branch_id,
           o.name AS organization_name, o.slug AS organization_slug, b.name AS branch_name
    FROM clients c JOIN users u ON u.organization_id = c.organization_id AND lower(u.email) = lower(c.email)
    JOIN organizations o ON o.id = c.organization_id
    LEFT JOIN branches b ON b.id = u.branch_id AND b.organization_id = u.organization_id
    WHERE c.id = ? AND c.organization_id = ? AND c.active = 1 AND u.active = 1 AND u.role IN ('CLIENT', 'CUSTOMER')
    LIMIT 1
  `, [clientId, req.organizationId]);
  if (!client) return res.status(409).json({ success: false, error: 'Este cliente no tiene una cuenta de portal activa para asistencia.' });
  const session = await issueSession({ ...client, id: client.user_id, organization_id: client.organization_id, client_id: client.id }, req, res, { setRefreshCookie: false, supportSession: true, supportingUserId: req.user!.userId });
  await writeAuditLog({ organizationId: req.organizationId, userId: req.user!.userId, action: 'support.client_session_started', resourceType: 'client', resourceId: clientId, outcome: 'success', ipAddress: req.ip, metadata: { targetUserId: client.user_id, readOnly: true } });
  return res.json({ success: true, token: session.token, expiresAt: session.expiresAt, support: { clientId, startedBy: req.user!.userId, readOnly: true } });
}));
