import { Router } from 'express';
import { z } from 'zod';
import { queryAllAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const movingRouter = Router();

movingRouter.get('/orders', authenticate, requireScope('moving:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const orders = await queryAllAsync(`SELECT * FROM moving_orders WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, orders: orders.map((o) => ({ ...o, origin: safeJson(o.origin_json), destination: safeJson(o.destination_json), inventory: o.inventory_json ? safeArray(o.inventory_json) : [] })) });
}));

const quoteSchema = z.object({ volumeM3: z.coerce.number().positive().max(1000).default(15), floors: z.coerce.number().int().min(1).max(100).default(1), hasElevator: z.boolean().default(false), crewCount: z.coerce.number().int().min(1).max(100).default(3), distanceKm: z.coerce.number().min(0).max(10000).default(10) });

movingRouter.post('/quote', asyncHandler(async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cotización de mudanza inválidos.' });
  const { volumeM3, floors, hasElevator, crewCount, distanceKm } = parsed.data;
  const baseRate = 4500;
  const volumeCost = volumeM3 * 450;
  const floorFee = !hasElevator && floors > 1 ? (floors - 1) * 600 : 0;
  const crewCost = crewCount * 1200;
  const distanceCost = distanceKm * 85;
  const total = baseRate + volumeCost + floorFee + crewCost + distanceCost;
  return res.json({ success: true, quote: { baseRate, volumeCost, floorFee, crewCost, distanceCost, total, currency: 'DOP', recommendedVehicle: volumeM3 > 25 ? 'Camión 5 Toneladas' : 'Camión 3.5 Toneladas' } });
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
function safeArray(value: unknown): unknown[] { try { const parsed = typeof value === 'string' ? JSON.parse(value || '[]') : value; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
