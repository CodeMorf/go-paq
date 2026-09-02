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
  if (shipment) {
    const events = await queryAllAsync(`SELECT id, status, location, description, actor_type, created_at FROM shipment_events WHERE shipment_id = ? ORDER BY created_at ASC`, [shipment.id]);
    return res.json({ success: true, shipment: { kind: 'shipment', id: shipment.id, trackingNumber: shipment.tracking_number, serviceType: shipment.service_type, status: shipment.status, origin: safeJson(shipment.origin_json), destination: redactDestination(safeJson(shipment.destination_json)), package: safeJson(shipment.package_json), branchName: shipment.branch_name, createdAt: shipment.created_at, updatedAt: shipment.updated_at, events } });
  }

  // Special services use the same public tracking contract as parcel shipments.
  // Their canonical events live in logistics_job_events, so clients do not need
  // a second tracking product for moving/heavy-cargo work.
  const job = await queryOneAsync(`
    SELECT j.id, j.organization_id, j.tracking_number, j.service_type, j.status,
           j.origin_json, j.destination_json, j.created_at, j.updated_at,
           b.name AS branch_name
    FROM logistics_jobs j
    LEFT JOIN routes r ON r.id = j.assigned_route_id AND r.organization_id = j.organization_id
    LEFT JOIN branches b ON b.id = r.branch_id AND b.organization_id = j.organization_id
    WHERE j.tracking_number = ?
  `, [trackingNumber]);
  if (!job) return res.status(404).json({ success: false, error: 'No se encontró una guía con ese número.' });
  const events = await queryAllAsync(`SELECT id, status, NULL AS location, description, actor_type, created_at FROM logistics_job_events WHERE job_id = ? AND organization_id = ? ORDER BY created_at ASC`, [job.id, job.organization_id]);
  return res.json({ success: true, shipment: { kind: 'logistics_job', id: job.id, jobId: job.id, trackingNumber: job.tracking_number, serviceType: job.service_type, status: job.status, origin: safeJson(job.origin_json), destination: redactDestination(safeJson(job.destination_json)), package: {}, branchName: job.branch_name, createdAt: job.created_at, updatedAt: job.updated_at, events } });
}));

function safeJson(value: unknown): Record<string, any> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, any>) || {}; } catch { return {}; } }
function redactDestination(value: Record<string, any>) { const { phone: _phone, email: _email, ...safe } = value; return safe; }
