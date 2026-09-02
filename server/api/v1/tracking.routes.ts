import { Router } from 'express';
import { queryOneAsync, queryAllAsync } from '../../db/database';
import { asyncHandler } from '../../core/http';

export const trackingRouter = Router();

trackingRouter.get('/:trackingNumber', asyncHandler(async (req, res) => {
  const trackingNumber = String(req.params.trackingNumber || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,120}$/.test(trackingNumber)) return res.status(400).json({ success: false, error: 'Número de guía inválido.' });
  const shipment = await queryOneAsync(`
    SELECT s.id, s.tracking_number, s.service_type, s.status, s.origin_json, s.destination_json,
           s.package_json, s.created_at, s.updated_at, b.name AS branch_name
    FROM shipments s
    LEFT JOIN branches b ON s.branch_id = b.id AND b.organization_id = s.organization_id
    WHERE s.tracking_number = ?
  `, [trackingNumber]);
  if (!shipment) return res.status(404).json({ success: false, error: 'No se encontró una guía con ese número.' });
  const events = await queryAllAsync(`SELECT id, status, location, description, actor_type, created_at FROM shipment_events WHERE shipment_id = ? ORDER BY created_at ASC`, [shipment.id]);
  return res.json({ success: true, shipment: { id: shipment.id, trackingNumber: shipment.tracking_number, serviceType: shipment.service_type, status: shipment.status, origin: safeJson(shipment.origin_json), destination: redactDestination(safeJson(shipment.destination_json)), package: safeJson(shipment.package_json), branchName: shipment.branch_name, createdAt: shipment.created_at, updatedAt: shipment.updated_at, events } });
}));

function safeJson(value: unknown): Record<string, any> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, any>) || {}; } catch { return {}; } }
function redactDestination(value: Record<string, any>) { const { phone: _phone, email: _email, ...safe } = value; return safe; }
