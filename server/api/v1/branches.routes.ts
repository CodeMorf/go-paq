import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const branchesRouter = Router();

// GET /api/v1/branches
branchesRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const branches = queryAll(`SELECT * FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, name ASC`, [orgId]);
  return res.json({ success: true, branches });
});

// GET /api/v1/branches/:id/inventory
branchesRouter.get('/:id/inventory', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const packages = queryAll(`
    SELECT * FROM shipments 
    WHERE branch_id = ? AND status IN ('at_branch', 'pending', 'picked_up')
    ORDER BY updated_at DESC
  `, [id]);

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
  const { totalCash, totalPos, totalTransfers, notes } = req.body;

  return res.json({
    success: true,
    message: 'Arqueo y cierre de caja procesado exitosamente.',
    summary: {
      branchId: id,
      totalCash: Number(totalCash) || 0,
      totalPos: Number(totalPos) || 0,
      totalTransfers: Number(totalTransfers) || 0,
      grandTotal: (Number(totalCash) || 0) + (Number(totalPos) || 0) + (Number(totalTransfers) || 0),
      timestamp: new Date().toISOString(),
      closedBy: req.user?.name || 'Operador de Caja'
    }
  });
});
