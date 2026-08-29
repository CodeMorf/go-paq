import { Router } from 'express';
import { queryAll, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const heavyCargoRouter = Router();

heavyCargoRouter.get('/orders', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const orders = queryAll(`SELECT * FROM heavy_cargo_orders WHERE organization_id = ? ORDER BY created_at DESC`, [orgId]);
  return res.json({
    success: true,
    orders: orders.map((o) => ({
      ...o,
      dimensions: JSON.parse(o.dimensions_json || '{}'),
      origin: JSON.parse(o.origin_json || '{}'),
      destination: JSON.parse(o.destination_json || '{}')
    }))
  });
});
