import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole } from '../../auth/middleware';
import { serializeClient } from '../../utils/serializers';

export const clientsRouter = Router();

clientsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const clients = queryAll(`
    SELECT c.*,
      (SELECT COUNT(*) FROM shipments s WHERE s.client_id = c.id AND s.organization_id = c.organization_id AND s.status NOT IN ('delivered','cancelled')) AS active_shipments,
      (SELECT locker_code FROM international_lockers l WHERE l.client_id = c.id AND l.organization_id = c.organization_id LIMIT 1) AS locker_code
    FROM clients c
    WHERE c.organization_id = ? AND c.active = 1
    ORDER BY c.created_at DESC
  `, [orgId]);
  return res.json({ success: true, clients: clients.map(serializeClient) });
});

clientsRouter.post('/', authenticate, requireRole(['ADMIN', 'MANAGER', 'Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { name, companyName, email, phone, rncTaxId, rncOrDni, tier = 'Standard', creditLimit = 0, creditLimitDop, branchId = 'br-sdq-central' } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ success: false, error: 'Nombre, email y teléfono son obligatorios.' });

  const duplicate = queryOne(`SELECT id FROM clients WHERE organization_id = ? AND lower(email) = lower(?) AND active = 1`, [orgId, email]);
  if (duplicate) return res.status(409).json({ success: false, error: 'Ya existe un cliente activo con ese email.' });

  const clientId = `cli-${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();
  execute(`
    INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
  `, [clientId, orgId, branchId, name, companyName || name, email, phone, rncTaxId || rncOrDni || '', tier, Number(creditLimitDop ?? creditLimit) || 0, now, now]);

  const row = queryOne(`SELECT * FROM clients WHERE id = ? AND organization_id = ?`, [clientId, orgId]);
  return res.status(201).json({ success: true, client: serializeClient(row) });
});

clientsRouter.patch('/:id', authenticate, requireRole(['ADMIN', 'MANAGER', 'Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { id } = req.params;
  const current = queryOne<any>(`SELECT * FROM clients WHERE id = ? AND organization_id = ? AND active = 1`, [id, orgId]);
  if (!current) return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });

  const next = {
    name: req.body.name ?? current.name,
    companyName: req.body.companyName ?? current.company_name,
    email: req.body.email ?? current.email,
    phone: req.body.phone ?? current.phone,
    rnc: req.body.rncOrDni ?? req.body.rncTaxId ?? current.rnc_tax_id,
    tier: req.body.tier ?? current.tier,
    creditLimit: Number(req.body.creditLimitDop ?? req.body.creditLimit ?? current.credit_limit),
    balance: Number(req.body.balanceDop ?? current.balance),
    codPending: Number(req.body.codPendingPayoutDop ?? current.cod_pending_balance)
  };

  execute(`UPDATE clients SET name=?, company_name=?, email=?, phone=?, rnc_tax_id=?, tier=?, credit_limit=?, balance=?, cod_pending_balance=?, updated_at=datetime('now') WHERE id=? AND organization_id=?`,
    [next.name, next.companyName, next.email, next.phone, next.rnc, next.tier, next.creditLimit, next.balance, next.codPending, id, orgId]);
  const row = queryOne(`SELECT * FROM clients WHERE id = ? AND organization_id = ?`, [id, orgId]);
  return res.json({ success: true, client: serializeClient(row) });
});

clientsRouter.delete('/:id', authenticate, requireRole(['ADMIN', 'MANAGER', 'Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const result: any = execute(`UPDATE clients SET active = 0, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND active = 1`, [req.params.id, orgId]);
  if (!result?.changes) return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
  return res.json({ success: true, message: 'Cliente desactivado correctamente.' });
});

clientsRouter.patch('/:id/credit', authenticate, requireRole(['ADMIN', 'MANAGER', 'Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const limit = Number(req.body.creditLimitDop ?? req.body.creditLimit);
  if (!Number.isFinite(limit) || limit < 0) return res.status(400).json({ success: false, error: 'Límite de crédito inválido.' });
  const result: any = execute(`UPDATE clients SET credit_limit = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND active = 1`, [limit, req.params.id, orgId]);
  if (!result?.changes) return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
  const row = queryOne(`SELECT * FROM clients WHERE id = ? AND organization_id = ?`, [req.params.id, orgId]);
  return res.json({ success: true, client: serializeClient(row) });
});
