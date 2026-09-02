import { Router } from 'express';
import { queryAllAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const heavyCargoRouter = Router();

heavyCargoRouter.get('/orders', authenticate, requireScope('heavy_cargo:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const own = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const orders = await queryAllAsync(`SELECT * FROM heavy_cargo_orders WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, orders: orders.map((o) => ({ ...o, dimensions: safeJson(o.dimensions_json), origin: safeJson(o.origin_json), destination: safeJson(o.destination_json) })) });
}));

function safeJson(value: unknown): Record<string, unknown> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, unknown>) || {}; } catch { return {}; } }
