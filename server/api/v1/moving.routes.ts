import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const movingRouter = Router();

// GET /api/v1/moving/orders
movingRouter.get('/orders', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const orders = queryAll(`SELECT * FROM moving_orders WHERE organization_id = ? ORDER BY created_at DESC`, [orgId]);
  return res.json({
    success: true,
    orders: orders.map((o) => ({
      ...o,
      origin: JSON.parse(o.origin_json || '{}'),
      destination: JSON.parse(o.destination_json || '{}'),
      inventory: o.inventory_json ? JSON.parse(o.inventory_json) : []
    }))
  });
});

// POST /api/v1/moving/quote
movingRouter.post('/quote', (req, res) => {
  const { volumeM3 = 15, floors = 1, hasElevator = false, crewCount = 3, distanceKm = 10 } = req.body;

  const baseRate = 4500;
  const volumeCost = volumeM3 * 450;
  const floorFee = !hasElevator && floors > 1 ? (floors - 1) * 600 : 0;
  const crewCost = crewCount * 1200;
  const distanceCost = distanceKm * 85;

  const total = baseRate + volumeCost + floorFee + crewCost + distanceCost;

  return res.json({
    success: true,
    quote: {
      baseRate,
      volumeCost,
      floorFee,
      crewCost,
      distanceCost,
      total,
      currency: 'DOP',
      recommendedVehicle: volumeM3 > 25 ? 'Camión 5 Toneladas' : 'Camión 3.5 Toneladas'
    }
  });
});
