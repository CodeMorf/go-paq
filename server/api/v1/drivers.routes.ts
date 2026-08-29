import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const driversRouter = Router();

// GET /api/v1/drivers
driversRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const drivers = queryAll(`
    SELECT d.*, b.name as branch_name, u.email as user_email
    FROM drivers d
    LEFT JOIN branches b ON d.branch_id = b.id
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.organization_id = ? AND d.active = 1
  `, [orgId]);

  return res.json({ success: true, drivers });
});

// POST /api/v1/drivers/telemetry (GPS Telemetry stream)
driversRouter.post('/telemetry', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { driverId, lat, lng, speed = 0, heading = 0, battery = 100 } = req.body;

  if (!driverId || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, error: 'driverId, lat y lng son obligatorios.' });
  }

  const status = speed > 5 ? 'in_motion' : 'idle';

  execute(`
    UPDATE drivers 
    SET current_lat = ?, current_lng = ?, speed = ?, heading = ?, battery = ?, status = ?, updated_at = datetime('now')
    WHERE id = ? AND organization_id = ?
  `, [lat, lng, speed, heading, battery, status, driverId, orgId]);

  return res.json({
    success: true,
    processed: {
      driverId,
      position: { lat, lng },
      telemetry: { speedKmh: speed, headingDeg: heading, batteryPct: battery, timestamp: new Date().toISOString() },
      status
    }
  });
});

// GET /api/v1/drivers/active-manifest
driversRouter.get('/active-manifest', authenticate, (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const driver = queryOne(`SELECT * FROM drivers WHERE user_id = ? OR id = ? LIMIT 1`, [userId, req.query.driverId || 'drv-01']);

  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver no encontrado.' });
  }

  const route = queryOne(`
    SELECT * FROM routes 
    WHERE driver_id = ? AND status IN ('in_progress', 'draft') 
    ORDER BY created_at DESC LIMIT 1
  `, [driver.id]) || queryOne(`SELECT * FROM routes ORDER BY created_at DESC LIMIT 1`);

  let stops: any[] = [];
  if (route) {
    stops = queryAll(`SELECT * FROM route_stops WHERE route_id = ? ORDER BY sequence_order ASC`, [route.id]);
  }

  return res.json({
    success: true,
    driver,
    route,
    stops: stops.map((s) => ({
      ...s,
      address: JSON.parse(s.address_json || '{}'),
      pod: s.pod_json ? JSON.parse(s.pod_json) : null
    }))
  });
});
