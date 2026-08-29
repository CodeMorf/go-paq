import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';
import { WitylogixBridge } from '../../integrations/witylogix/witylogix.adapter';

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

    shipmentIds.forEach((shpId: string, idx: number) => {
      const shp = queryOne(`SELECT * FROM shipments WHERE id = ? AND organization_id = ?`, [shpId, orgId]);
      if (shp) {
        const dest = JSON.parse(shp.destination_json || '{}');
        execute(`
          INSERT INTO route_stops (id, route_id, shipment_id, sequence_order, type, address_json, contact_name, contact_phone, status)
          VALUES (?, ?, ?, ?, 'delivery', ?, ?, ?, 'pending')
        `, [`stp-${routeId}-${idx + 1}`, routeId, shp.id, idx + 1, shp.destination_json, dest.name || 'Destinatario', dest.phone || '']);
        execute(`UPDATE shipments SET assigned_route_id = ?, assigned_driver_id = ? WHERE id = ? AND organization_id = ?`, [routeId, driverId || null, shp.id, orgId]);
      }
    });

    return { id: routeId, name: name || `Ruta ${dateStr}`, date: dateStr, status: 'draft', stopsCount: shipmentIds.length };
  });

  return res.status(201).json({ success: true, route: createdRoute });
});

routesRouter.post('/:id/dispatch', authenticate, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const orgId = req.organizationId || 'org-gopaq';
  const { driverId } = req.body;

  const route = queryOne(`SELECT * FROM routes WHERE id = ? AND organization_id = ?`, [id, orgId]);
  if (!route) return res.status(404).json({ success: false, error: 'Ruta no encontrada.' });

  const stops = queryAll(`
    SELECT rs.*, s.tracking_number, s.destination_json, s.package_json, s.shipping_cost
    FROM route_stops rs
    LEFT JOIN shipments s ON s.id = rs.shipment_id
    WHERE rs.route_id = ?
    ORDER BY rs.sequence_order ASC
  `, [id]);

  const remote = {
    provider: 'witylogix',
    configured: WitylogixBridge.isConfigured(),
    synchronized: false,
    routeId: null as string | null,
    error: null as string | null
  };

  if (remote.configured && stops.length > 0) {
    const remoteOrderIds: string[] = [];
    for (const stop of stops) {
      if (!stop.tracking_number) continue;
      const destination = JSON.parse(stop.destination_json || '{}');
      const pkg = JSON.parse(stop.package_json || '{}');
      const created = await WitylogixBridge.createDeliveryOrder({
        shopifyOrderId: `gopaq:${stop.tracking_number}`,
        shopifyOrderNumber: stop.tracking_number,
        customerName: destination.name || 'Cliente GoPaq',
        customerEmail: destination.email || undefined,
        customerPhone: destination.phone || undefined,
        addressLine1: destination.street || destination.address || destination.reference || undefined,
        city: destination.city || undefined,
        province: destination.provinceState || undefined,
        postalCode: destination.postalCode || undefined,
        country: destination.country || 'DO',
        latitude: destination.lat,
        longitude: destination.lng,
        totalPrice: Number(stop.shipping_cost || 0),
        totalWeight: Number(pkg.weightKg || 0),
        itemCount: 1,
        lineItems: [],
        notes: `GoPaq shipment ${stop.tracking_number}`,
        tags: ['gopaq']
      });

      if ('error' in created) {
        remote.error = `order_sync_failed:${created.error}`;
        break;
      }

      const orderData: any = created.data;
      const remoteOrderId = orderData?.id || orderData?.data?.id;
      if (!remoteOrderId) {
        remote.error = 'order_sync_failed:missing_remote_id';
        break;
      }
      remoteOrderIds.push(remoteOrderId);
    }

    if (!remote.error && remoteOrderIds.length > 0) {
      const remoteRoute = await WitylogixBridge.createRoute({
        name: route.name || `GoPaq ${id}`,
        date: route.date || new Date().toISOString().slice(0, 10),
        orderIds: remoteOrderIds
      });
      if ('error' in remoteRoute) remote.error = `route_sync_failed:${remoteRoute.error}`;
      else {
        const data: any = remoteRoute.data;
        remote.routeId = data?.id || data?.data?.id || null;
        remote.synchronized = !!remote.routeId;
      }
    }
  }

  execute(`UPDATE routes SET status = 'in_progress', driver_id = COALESCE(?, driver_id), updated_at = datetime('now') WHERE id = ? AND organization_id = ?`, [driverId || null, id, orgId]);
  execute(`UPDATE shipments SET status = 'out_for_delivery' WHERE assigned_route_id = ? AND organization_id = ?`, [id, orgId]);

  return res.json({
    success: true,
    message: remote.synchronized ? 'Ruta despachada y sincronizada con Witylogix.' : 'Ruta despachada en GoPaq.',
    integration: remote
  });
});
