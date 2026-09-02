import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole } from '../../auth/middleware';
import { serializeDriver } from '../../utils/serializers';

export const driversRouter = Router();

driversRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const drivers = queryAll(`SELECT d.*, b.name as branch_name, u.email as user_email FROM drivers d LEFT JOIN branches b ON d.branch_id=b.id LEFT JOIN users u ON d.user_id=u.id WHERE d.organization_id=? AND d.active=1`, [orgId]);
  return res.json({ success: true, drivers: drivers.map(serializeDriver) });
});

driversRouter.post('/', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const p = req.body || {};
  if (!p.name || !p.phone || !(p.licenseNumber || p.license_number) || !(p.vehiclePlate || p.licensePlate)) {
    return res.status(400).json({ success:false, error:'Nombre, teléfono, licencia y placa son obligatorios.' });
  }
  const id = `drv-${crypto.randomBytes(5).toString('hex')}`;
  execute(`INSERT INTO drivers (id, organization_id, branch_id, name, email, phone, license_number, vehicle_type, vehicle_plate, status, current_lat, current_lng, battery, rating, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`, [
    id, orgId, p.branchId || 'br-sdq-central', p.name, p.email || '', p.phone, p.licenseNumber || p.license_number, p.vehicleType || 'moto', p.vehiclePlate || p.licensePlate, p.status || 'available', Number(p.currentLat || 0), Number(p.currentLng || 0), Number(p.batteryLevel ?? 100), Number(p.rating ?? 5)
  ]);
  return res.status(201).json({ success:true, driver:serializeDriver(queryOne(`SELECT * FROM drivers WHERE id=? AND organization_id=?`, [id, orgId])) });
});

driversRouter.patch('/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const current = queryOne<any>(`SELECT * FROM drivers WHERE id=? AND organization_id=? AND active=1`, [req.params.id, orgId]);
  if (!current) return res.status(404).json({success:false,error:'Conductor no encontrado.'});
  const p = req.body || {};
  execute(`UPDATE drivers SET name=?, email=?, phone=?, license_number=?, vehicle_type=?, vehicle_plate=?, status=?, branch_id=?, rating=?, updated_at=datetime('now') WHERE id=? AND organization_id=?`, [
    p.name ?? current.name, p.email ?? current.email, p.phone ?? current.phone, p.licenseNumber ?? current.license_number, p.vehicleType ?? current.vehicle_type, p.vehiclePlate ?? p.licensePlate ?? current.vehicle_plate, p.status ?? current.status, p.branchId ?? current.branch_id, Number(p.rating ?? current.rating), req.params.id, orgId
  ]);
  return res.json({ success:true, driver:serializeDriver(queryOne(`SELECT * FROM drivers WHERE id=? AND organization_id=?`, [req.params.id, orgId])) });
});

driversRouter.delete('/:id', authenticate, requireRole(['ADMIN','MANAGER','Owner']), (req: AuthenticatedRequest, res) => {
  const result:any = execute(`UPDATE drivers SET active=0, status='offline', updated_at=datetime('now') WHERE id=? AND organization_id=? AND active=1`, [req.params.id, req.organizationId!]);
  if (!result?.changes) return res.status(404).json({success:false,error:'Conductor no encontrado.'});
  return res.json({success:true,message:'Conductor desactivado correctamente.'});
});

driversRouter.post('/telemetry', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { driverId, lat, lng, speed = 0, heading = 0, battery = 100 } = req.body;
  if (!driverId || lat === undefined || lng === undefined) return res.status(400).json({ success:false, error:'driverId, lat y lng son obligatorios.' });
  const driver = queryOne<any>(`SELECT id,user_id FROM drivers WHERE id=? AND organization_id=? AND active=1`, [driverId, orgId]);
  if (!driver) return res.status(404).json({success:false,error:'Conductor no encontrado en esta organización.'});
  if (req.user?.role === 'DRIVER' && driver.user_id && driver.user_id !== req.user.userId) return res.status(403).json({success:false,error:'No autorizado para actualizar otro conductor.'});
  const status = speed > 5 ? 'in_motion' : 'idle';
  execute(`UPDATE drivers SET current_lat=?, current_lng=?, speed=?, heading=?, battery=?, status=?, updated_at=datetime('now') WHERE id=? AND organization_id=?`, [lat,lng,speed,heading,battery,status,driverId,orgId]);
  return res.json({success:true,processed:{driverId,position:{lat,lng},telemetry:{speedKmh:speed,headingDeg:heading,batteryPct:battery,timestamp:new Date().toISOString()},status}});
});

driversRouter.get('/active-manifest', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const requestedDriverId = String(req.query.driverId || '');
  let driver:any;
  if (requestedDriverId) driver = queryOne(`SELECT * FROM drivers WHERE id=? AND organization_id=? AND active=1`, [requestedDriverId, orgId]);
  else if (req.user?.userId) driver = queryOne(`SELECT * FROM drivers WHERE user_id=? AND organization_id=? AND active=1 LIMIT 1`, [req.user.userId, orgId]);
  if (!driver) return res.status(404).json({success:false,error:'Driver no encontrado.'});
  const route:any = queryOne(`SELECT * FROM routes WHERE organization_id=? AND driver_id=? AND status IN ('in_progress','draft') ORDER BY created_at DESC LIMIT 1`, [orgId, driver.id]);
  const stops = route ? queryAll(`SELECT * FROM route_stops WHERE route_id=? ORDER BY sequence_order ASC`, [route.id]) : [];
  return res.json({success:true,driver:serializeDriver(driver),route,stops:stops.map((s:any)=>({...s,address:JSON.parse(s.address_json||'{}'),pod:s.pod_json?JSON.parse(s.pod_json):null}))});
});
