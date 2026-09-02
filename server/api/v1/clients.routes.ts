import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const clientsRouter = Router();

clientsRouter.get('/', authenticate, requireScope('clients:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const isClient = ['CLIENT', 'CUSTOMER'].includes(normalizeRole(req.user?.role)) || req.authType === 'api_key';
  const rows = isClient && req.clientId
    ? await queryAllAsync('SELECT * FROM clients WHERE organization_id = ? AND id = ? AND active = 1 ORDER BY created_at DESC', [orgId, req.clientId])
    : await queryAllAsync('SELECT * FROM clients WHERE organization_id = ? AND active = 1 ORDER BY created_at DESC', [orgId]);
  return res.json({ success: true, clients: rows });
}));

const clientSchema = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(160).optional(),
  email: z.string().email().max(254),
  phone: z.string().trim().min(5).max(40),
  rncTaxId: z.string().trim().max(40).optional(),
  tier: z.string().trim().max(60).default('Standard'),
  creditLimit: z.coerce.number().min(0).max(100000000).default(0),
  branchId: z.string().trim().min(1).max(120).optional()
});

clientsRouter.post('/', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER']), requireScope('clients:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cliente inválidos.', details: parsed.error.flatten() });
  const orgId = req.organizationId!;
  const input = parsed.data;
  const branchId = input.branchId || req.user?.branchId || null;
  if (branchId && !(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [branchId, orgId]))) return res.status(422).json({ success: false, error: 'Sucursal inválida para esta organización.' });
  const email = input.email.toLowerCase().trim();
  if (await queryOneAsync('SELECT id FROM clients WHERE organization_id = ? AND email = ? AND active = 1', [orgId, email])) return res.status(409).json({ success: false, error: 'Ya existe un cliente activo con ese correo.' });
  const clientId = `cli-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)`, [clientId, orgId, branchId, input.name, input.companyName || input.name, email, input.phone, input.rncTaxId || '', input.tier, input.creditLimit, now, now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'client.created', 'client', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, clientId, JSON.stringify({ clientId }), now]);
  });
  return res.status(201).json({ success: true, client: { id: clientId, ...input, email, branchId, balance: 0, cod_pending_balance: 0 } });
}));
