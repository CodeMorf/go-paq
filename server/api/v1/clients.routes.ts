import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const clientsRouter = Router();

// GET /api/v1/clients
clientsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const clients = queryAll(`SELECT * FROM clients WHERE organization_id = ? AND active = 1 ORDER BY created_at DESC`, [orgId]);
  return res.json({ success: true, clients });
});

// POST /api/v1/clients
clientsRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { name, companyName, email, phone, rncTaxId, tier = 'Standard', creditLimit = 0 } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, error: 'Nombre, email y teléfono son obligatorios.' });
  }

  const clientId = `cli-${Date.now()}`;
  const now = new Date().toISOString();

  execute(`
    INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at)
    VALUES (?, ?, 'br-sdq-central', ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
  `, [clientId, orgId, name, companyName || name, email, phone, rncTaxId || '', tier, Number(creditLimit) || 0, now, now]);

  return res.status(201).json({
    success: true,
    client: { id: clientId, name, companyName, email, phone, rncTaxId, tier, creditLimit, balance: 0, cod_pending_balance: 0 }
  });
});
