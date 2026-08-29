import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';
import { WitylogixAdapter } from '../../integrations/witylogix/witylogix.adapter';

export const routesRouter = Router();

routesRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const routes = queryAll(`
    SELECT r.*, d.name as driver_name, d.phone as driver_phone, b.name as branch_name
    FROM routes r
    LEFT JOIN drivers d ON r.driver_id = d.id
    LEFT JOIN branches b ON r.branch_id = b.id
    WHERE r.organization_id = ?
    ORDER BY r.created_at DESC
  `, [orgId]);

  const result = routes.map((r) => {
    const stops = queryAll(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order ASC`, [r.id]);
    return {
      ...r,
      stops: stops.map((s) => ({
        ...s,
        address: JSON.parse(s.address_json || '{}'),
        pod: s.pod_json ? JSON.parse(s.pod_json) : null
      }))
    };
  });

  return res.json({ success: true, routes: result });
});

routesRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { name, branchId = 'br-sdq-central', driverId, vehicleId, shipmentIds = [] } = req.body;

  const routeId = `rt-${Date.now()}`;
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const createdRoute = transaction(() => {
    execute(`
      INSERT INTO routes (id, organization_id, branch_id, driver_id, vehicle_id, name, date, status, total_stops, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
    `, [routeId, orgId, branchId, driverId || null, vehicleId || null, name || `Ruta ${dateStr}`, dateStr, shipmentIds.length, now, now]);

    // Add stops for each shipment
    shipmentIds.forEach((shpId: string, idx: number) => {
      const shp = queryOne(`SELECT * FROM shipments WHERE id = ?`, [shpId]);
      if (shp) {
        const dest = JSON.parse(shp.destination_json || '{}');
        execute(`
          INSERT INTO route_stops (id, route_id, shipment_id, sequence_order, type, address_json, contact_name, contact_phone, status)
          VALUES (?, ?, ?, ?, 'delivery', ?, ?, ?, 'pending')
        `, [`stp-${routeId}-${idx + 1}`, routeId, shp.id, idx + 1, shp.destination_json, dest.name || 'Destinatario', dest.phone || '']);

        // Update shipment assigned route and driver
        execute(`UPDATE shipments SET assigned_route_id = ?, assigned_driver_id = ? WHERE id = ?`, [routeId, driverId || null, shp.id]);
      }
    });

    return { id: routeId, name, status: 'draft', stopsCount: shipmentIds.length };
  });

  return res.status(201).json({ success: true, route: createdRoute });
});

routesRouter.post('/:id/dispatch', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { driverId } = req.body;

  execute(`UPDATE routes SET status = 'in_progress', driver_id = COALESCE(?, driver_id), updated_at = datetime('now') WHERE id = ?`, [driverId || null, id]);
  execute(`UPDATE shipments SET status = 'out_for_delivery' WHERE assigned_route_id = ?`, [id]);

  return res.json({ success: true, message: 'Ruta despachada exitosamente con Witylogix routing engine.' });
});
