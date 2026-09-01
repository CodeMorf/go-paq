import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';
import { serializeBranch } from '../../utils/serializers';

export const branchesRouter = Router();

// GET /api/v1/branches
branchesRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const branches = queryAll(`SELECT * FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC`, [orgId]);
  return res.json({ success: true, branches: branches.map(serializeBranch) });
});

// GET /api/v1/branches/:id/inventory
branchesRouter.get('/:id/inventory', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const orgId = req.organizationId!;
  const branch = queryOne(`SELECT id FROM branches WHERE id=? AND organization_id=? AND active=1`, [id, orgId]);
  if (!branch) return res.status(404).json({ success:false, error:'Sucursal no encontrada.' });
  const packages = queryAll(`
    SELECT * FROM shipments 
    WHERE branch_id = ? AND organization_id = ? AND status IN ('at_branch', 'pending', 'picked_up')
    ORDER BY updated_at DESC
  `, [id, orgId]);

  return res.json({
    success: true,
    branchId: id,
    count: packages.length,
    inventory: packages.map((p) => ({
      ...p,
      destination: JSON.parse(p.destination_json || '{}'),
      package: JSON.parse(p.package_json || '{}')
    }))
  });
});

// POST /api/v1/branches/:id/cash-close
branchesRouter.post('/:id/cash-close', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const orgId = req.organizationId!;
  const branch = queryOne(`SELECT id FROM branches WHERE id=? AND organization_id=? AND active=1`, [id, orgId]);
  if (!branch) return res.status(404).json({ success:false, error:'Sucursal no encontrada.' });
  const { totalCash, totalPos, totalTransfers, notes } = req.body;
  const grandTotal = (Number(totalCash)||0)+(Number(totalPos)||0)+(Number(totalTransfers)||0);
  execute(`INSERT INTO branch_cash_closures (id, organization_id, branch_id, total_cash, total_pos, total_transfers, grand_total, notes, closed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [`cash-${Date.now()}`, orgId, id, Number(totalCash)||0, Number(totalPos)||0, Number(totalTransfers)||0, grandTotal, notes||'', req.user?.userId||null, new Date().toISOString()]);

  return res.json({
    success: true,
    message: 'Arqueo y cierre de caja procesado exitosamente.',
    summary: {
      branchId: id,
      totalCash: Number(totalCash) || 0,
      totalPos: Number(totalPos) || 0,
      totalTransfers: Number(totalTransfers) || 0,
      grandTotal,
      timestamp: new Date().toISOString(),
      closedBy: req.user?.name || 'Operador de Caja'
    }
  });
});
