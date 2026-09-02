import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';
import { WitylogixBridge } from '../../integrations/witylogix/witylogix.adapter';

export const routesRouter = Router();

routesRouter.get('/', authenticate, requireScope('routes:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const filters = ['r.organization_id = ?'];
  const routeParams: any[] = [orgId];
  if (['DRIVER', 'COURIER'].includes(role)) {
    filters.push('r.driver_id IN (SELECT id FROM drivers WHERE user_id = ? AND organization_id = ?)');
    routeParams.push(req.user!.userId, orgId);
  }
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role)) {
    if (!req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });
    filters.push('r.branch_id = ?');
    routeParams.push(req.user.branchId);
  }
  const routes = await queryAllAsync(`SELECT r.*, d.name AS driver_name, d.phone AS driver_phone, b.name AS branch_name FROM routes r LEFT JOIN drivers d ON r.driver_id = d.id AND d.organization_id = r.organization_id LEFT JOIN branches b ON r.branch_id = b.id AND b.organization_id = r.organization_id WHERE ${filters.join(' AND ')} ORDER BY r.created_at DESC`, routeParams);
  const result = [];
  for (const route of routes) {
    const stops = await queryAllAsync(`SELECT rs.*, COALESCE(s.tracking_number, j.tracking_number) AS tracking_number, COALESCE(s.destination_json, j.destination_json) AS destination_json, COALESCE(s.package_json, j.details_json) AS package_json, COALESCE(s.shipping_cost, j.cost) AS shipping_cost, COALESCE(s.service_type, j.service_type) AS service_type FROM route_stops rs LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = ? LEFT JOIN logistics_jobs j ON j.id = rs.job_id AND j.organization_id = ? WHERE rs.route_id = ? ORDER BY rs.sequence_order ASC`, [route.organization_id, route.organization_id, route.id]);
    result.push({ ...route, stops: stops.map((s) => ({ ...s, address: safeJson(s.address_json), pod: s.pod_json ? safeJson(s.pod_json) : null })) });
  }
  return res.json({ success: true, routes: result });
}));

const routeSchema = z.object({ name: z.string().trim().max(160).optional(), branchId: z.string().trim().min(1).max(120), driverId: z.string().trim().min(1).max(120).nullable().optional(), vehicleId: z.string().trim().min(1).max(120).nullable().optional(), shipmentIds: z.array(z.string().trim().min(1).max(160)).max(500).default([]), jobIds: z.array(z.string().trim().min(1).max(160)).max(500).default([]) });

routesRouter.post('/', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER', 'MANAGER', 'DISPATCHER']), requireScope('routes:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = routeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de ruta inválidos.' });
  const orgId = req.organizationId!;
  const input = parsed.data;
  const role = normalizeRole(req.user?.role);
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user?.branchId !== input.branchId) return res.status(403).json({ success: false, error: 'La cuenta solo puede crear rutas de su sucursal.' });
  if (!(await queryOneAsync('SELECT id FROM branches WHERE id = ? AND organization_id = ? AND active = 1', [input.branchId, orgId]))) return res.status(422).json({ success: false, error: 'Sucursal inválida para esta organización.' });
  if (input.driverId && !(await queryOneAsync('SELECT id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [input.driverId, orgId]))) return res.status(422).json({ success: false, error: 'Driver inválido para esta organización.' });
  if (input.vehicleId && !(await queryOneAsync('SELECT id FROM vehicles WHERE id = ? AND organization_id = ?', [input.vehicleId, orgId]))) return res.status(422).json({ success: false, error: 'Vehículo inválido para esta organización.' });
  const routeId = `rt-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10);
  const uniqueShipmentIds = [...new Set(input.shipmentIds)];
  const uniqueJobIds = [...new Set(input.jobIds)];
  const route = await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO routes (id, organization_id, branch_id, driver_id, vehicle_id, name, date, status, total_stops, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?)`, [routeId, orgId, input.branchId, input.driverId || null, input.vehicleId || null, input.name || `Ruta ${dateStr}`, dateStr, now, now]);
    let position = 0;
    for (const shipmentId of uniqueShipmentIds) {
      const shipment = await tx.queryOne<any>('SELECT id, destination_json FROM shipments WHERE id = ? AND organization_id = ?', [shipmentId, orgId]);
      if (!shipment) throw Object.assign(new Error('Uno de los envíos no pertenece a esta organización.'), { statusCode: 422 });
      const destination = safeJson(shipment.destination_json);
      position += 1;
      await tx.execute(`INSERT INTO route_stops (id, route_id, shipment_id, sequence_order, type, address_json, contact_name, contact_phone, status) VALUES (?, ?, ?, ?, 'delivery', ?, ?, ?, 'pending')`, [`stp-${crypto.randomUUID()}`, routeId, shipment.id, position, shipment.destination_json, String(destination.name || 'Destinatario'), String(destination.phone || '')]);
      await tx.execute('UPDATE shipments SET assigned_route_id = ?, assigned_driver_id = ?, updated_at = ? WHERE id = ? AND organization_id = ?', [routeId, input.driverId || null, now, shipment.id, orgId]);
    }
    for (const jobId of uniqueJobIds) {
      const job = await tx.queryOne<any>('SELECT id, tracking_number, destination_json, details_json, cost, service_type, status, assigned_route_id FROM logistics_jobs WHERE id = ? AND organization_id = ?', [jobId, orgId]);
      if (!job) throw Object.assign(new Error('Uno de los trabajos no pertenece a esta organización.'), { statusCode: 422 });
      if (!['booked', 'assigned'].includes(String(job.status)) || (job.assigned_route_id && job.assigned_route_id !== routeId)) throw Object.assign(new Error('Uno de los trabajos ya está asignado o no puede entrar en una ruta.'), { statusCode: 409 });
      const destination = safeJson(job.destination_json);
      position += 1;
      await tx.execute('INSERT INTO route_stops (id, route_id, shipment_id, job_id, sequence_order, type, address_json, contact_name, contact_phone, status) VALUES (?, ?, NULL, ?, ?, \'delivery\', ?, ?, ?, \'pending\')', [`stp-${crypto.randomUUID()}`, routeId, job.id, position, job.destination_json, String(destination.name || 'Contacto del trabajo'), String(destination.phone || '')]);
      await tx.execute('UPDATE logistics_jobs SET assigned_route_id = ?, assigned_driver_id = ?, status = \'assigned\', updated_at = ? WHERE id = ? AND organization_id = ?', [routeId, input.driverId || null, now, job.id, orgId]);
    }
    await tx.execute('UPDATE routes SET total_stops = ?, updated_at = ? WHERE id = ? AND organization_id = ?', [position, now, routeId, orgId]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'route.created', 'route', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, routeId, JSON.stringify({ routeId, shipmentIds: uniqueShipmentIds, jobIds: uniqueJobIds }), now]);
    return { id: routeId, name: input.name || `Ruta ${dateStr}`, date: dateStr, status: 'draft', stopsCount: position };
  });
  return res.status(201).json({ success: true, route });
}));

routesRouter.post('/:id/dispatch', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER', 'MANAGER', 'DISPATCHER']), requireScope('routes:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const orgId = req.organizationId!;
  const driverId = typeof req.body?.driverId === 'string' ? req.body.driverId : undefined;
  const route = await queryOneAsync<any>('SELECT * FROM routes WHERE id = ? AND organization_id = ?', [id, orgId]);
  if (!route) return res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
  const role = normalizeRole(req.user?.role);
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role) && req.user?.branchId !== route.branch_id) return res.status(403).json({ success: false, error: 'La cuenta solo puede despachar rutas de su sucursal.' });
  const effectiveDriverId = driverId || route.driver_id;
  if (!effectiveDriverId) return res.status(422).json({ success: false, error: 'La ruta necesita un driver asignado antes de despachar.' });
  if (!(await queryOneAsync('SELECT id FROM drivers WHERE id = ? AND organization_id = ? AND active = 1', [effectiveDriverId, orgId]))) return res.status(422).json({ success: false, error: 'Driver inválido para esta organización.' });
  const stops = await queryAllAsync(`SELECT rs.*, COALESCE(s.tracking_number, j.tracking_number) AS tracking_number, COALESCE(s.destination_json, j.destination_json) AS destination_json, COALESCE(s.package_json, j.details_json) AS package_json, COALESCE(s.shipping_cost, j.cost) AS shipping_cost, COALESCE(s.service_type, j.service_type) AS service_type FROM route_stops rs LEFT JOIN shipments s ON s.id = rs.shipment_id AND s.organization_id = ? LEFT JOIN logistics_jobs j ON j.id = rs.job_id AND j.organization_id = ? WHERE rs.route_id = ? ORDER BY rs.sequence_order ASC`, [orgId, orgId, id]);
  const integration = { provider: 'witylogix', configured: WitylogixBridge.isConfigured(), synchronized: false, routeId: null as string | null, status: WitylogixBridge.isConfigured() ? 'pending' : 'provider_unavailable', error: null as string | null };
  if (integration.configured && stops.length > 0) {
    const remoteOrderIds: string[] = [];
    for (const stop of stops) {
      if (!stop.tracking_number) continue;
      const destination = safeJson(stop.destination_json);
      const pkg = safeJson(stop.package_json);
      const created = await WitylogixBridge.createDeliveryOrder({ shopifyOrderId: `gopaq:${stop.tracking_number}`, shopifyOrderNumber: stop.tracking_number, customerName: String(destination.name || 'Cliente GoPaq'), customerEmail: destination.email ? String(destination.email) : undefined, customerPhone: destination.phone ? String(destination.phone) : undefined, addressLine1: String(destination.street || destination.address || destination.reference || ''), city: destination.city ? String(destination.city) : undefined, province: destination.provinceState ? String(destination.provinceState) : undefined, postalCode: destination.postalCode ? String(destination.postalCode) : undefined, country: String(destination.country || 'DO'), latitude: typeof destination.lat === 'number' ? destination.lat : undefined, longitude: typeof destination.lng === 'number' ? destination.lng : undefined, totalPrice: Number(stop.shipping_cost || 0), totalWeight: Number(pkg.weightKg || 0), itemCount: 1, lineItems: [], notes: `GoPaq shipment ${stop.tracking_number}`, tags: ['gopaq'] });
      if ('error' in created) { integration.error = created.error; integration.status = 'provider_unavailable'; return res.status(502).json({ success: false, error: 'El proveedor externo no confirmó el despacho.', integration }); }
      const remoteId = (created.data as any)?.id || (created.data as any)?.data?.id;
      if (!remoteId) { integration.error = 'missing_remote_id'; integration.status = 'provider_unavailable'; return res.status(502).json({ success: false, error: 'El proveedor externo no devolvió un ID de despacho.', integration }); }
      remoteOrderIds.push(remoteId);
    }
    const remoteRoute = await WitylogixBridge.createRoute({ name: route.name || `GoPaq ${id}`, date: route.date || new Date().toISOString().slice(0, 10), orderIds: remoteOrderIds });
    if ('error' in remoteRoute) { integration.error = remoteRoute.error; integration.status = 'provider_unavailable'; return res.status(502).json({ success: false, error: 'El proveedor externo no confirmó la ruta.', integration }); }
    integration.routeId = (remoteRoute.data as any)?.id || (remoteRoute.data as any)?.data?.id || null;
    if (!integration.routeId) return res.status(502).json({ success: false, error: 'El proveedor externo no devolvió un ID de ruta.', integration });
    integration.synchronized = true;
    integration.status = 'online';
  }
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`UPDATE routes SET status = 'in_progress', driver_id = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND status IN ('draft', 'assigned')`, [effectiveDriverId, now, id, orgId]);
    await tx.execute(`UPDATE shipments SET status = 'out_for_delivery', updated_at = ? WHERE assigned_route_id = ? AND organization_id = ? AND status NOT IN ('delivered', 'cancelled')`, [now, id, orgId]);
    await tx.execute(`UPDATE logistics_jobs SET status = 'in_transit', assigned_driver_id = ?, updated_at = ? WHERE assigned_route_id = ? AND organization_id = ? AND status NOT IN ('completed', 'cancelled')`, [effectiveDriverId, now, id, orgId]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'route.dispatched', 'route', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, id, JSON.stringify({ routeId: id, driverId: effectiveDriverId, integration }), now]);
  });
  return res.json({ success: true, message: integration.synchronized ? 'Ruta despachada y confirmada por Witylogix.' : 'Ruta despachada en GoPaq; Witylogix está NO CONFIGURADO.', integration });
}));

function safeJson(value: unknown): Record<string, any> { try { return typeof value === 'string' ? JSON.parse(value || '{}') : (value as Record<string, any>) || {}; } catch { return {}; } }
