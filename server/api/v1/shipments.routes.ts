import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute, transaction } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { calculatePricing } from '../../modules/pricing/pricing.engine';

export const shipmentsRouter = Router();

// GET /api/v1/shipments
shipmentsRouter.get('/', authenticate, requireScope('shipments:read'), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { status, limit = 100, search } = req.query;

  let sql = `SELECT * FROM shipments WHERE organization_id = ?`;
  const params: any[] = [orgId];

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (tracking_number LIKE ? OR destination_json LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(Number(limit));

  const rows = queryAll(sql, params);
  const formatted = rows.map((r) => ({
    ...r,
    origin: JSON.parse(r.origin_json || '{}'),
    destination: JSON.parse(r.destination_json || '{}'),
    package: JSON.parse(r.package_json || '{}'),
    pricing: JSON.parse(r.pricing_json || '{}'),
    pod: r.pod_json ? JSON.parse(r.pod_json) : null
  }));

  return res.json({ success: true, count: formatted.length, shipments: formatted });
});

// POST /api/v1/shipments
shipmentsRouter.post('/', authenticate, requireScope('shipments:write'), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const {
    serviceType = 'local',
    origin,
    destination,
    package: pkg,
    codAmount = 0,
    codCurrency = 'DOP',
    clientId,
    branchId = 'br-sdq-central'
  } = req.body;

  if (!origin || !destination || !pkg) {
    return res.status(400).json({ success: false, error: 'Origen, destino y datos de paquete son requeridos.' });
  }

  // Calculate pricing server-side
  const pricing = calculatePricing({
    serviceType,
    originCity: origin.city || 'Santo Domingo',
    destCity: destination.city || 'Santo Domingo',
    weightKg: pkg.weightKg || 1,
    lengthCm: pkg.lengthCm || 20,
    widthCm: pkg.widthCm || 15,
    heightCm: pkg.heightCm || 10,
    declaredValueUsd: pkg.declaredValueUsd || 0,
    isFragile: pkg.isFragile || false,
    codAmount: Number(codAmount) || 0
  }, orgId);

  // Cryptographic collision-safe tracking number generator with retry
  let trackingNumber = '';
  let attempts = 0;
  while (attempts < 5) {
    const entropy = crypto.randomBytes(4).toString('hex').toUpperCase();
    const candidate = `GP-${entropy}`;
    const exists = queryOne('SELECT id FROM shipments WHERE tracking_number = ?', [candidate]);
    if (!exists) {
      trackingNumber = candidate;
      break;
    }
    attempts++;
  }

  if (!trackingNumber) {
    return res.status(500).json({ success: false, error: 'Error generando número de guía único.' });
  }

  const shipmentId = `shp-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const now = new Date().toISOString();

  const newShipment = transaction(() => {
    execute(`
      INSERT INTO shipments (
        id, organization_id, branch_id, client_id, tracking_number, service_type, status,
        origin_json, destination_json, package_json, pricing_json, shipping_cost, currency,
        cod_amount, cod_currency, cod_collected, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [
      shipmentId, orgId, branchId, clientId || null, trackingNumber, serviceType,
      JSON.stringify(origin), JSON.stringify(destination), JSON.stringify(pkg), JSON.stringify(pricing),
      pricing.total, pricing.currency, codAmount, codCurrency, now, now
    ]);

    // Initial event
    execute(`
      INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, created_at)
      VALUES (?, ?, 'pending', ?, 'Envío creado y registrado en sistema', 'system', ?)
    `, [`evt-${Date.now()}`, shipmentId, origin.city || 'Sede Central', now]);

    // COD Transaction if applicable
    if (codAmount > 0) {
      execute(`
        INSERT INTO cod_transactions (
          id, organization_id, shipment_id, branch_id, client_id, amount, currency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_collection', ?)
      `, [`cod-tx-${shipmentId}`, orgId, shipmentId, branchId, clientId || null, codAmount, codCurrency, now]);
    }

    return {
      id: shipmentId,
      trackingNumber,
      serviceType,
      status: 'pending',
      origin,
      destination,
      package: pkg,
      pricing,
      shippingCost: pricing.total,
      currency: pricing.currency,
      codAmount,
      codCurrency,
      createdAt: now
    };
  });

  return res.status(201).json({ success: true, shipment: newShipment });
});

// GET /api/v1/shipments/:id (Audited with organization_id isolation)
shipmentsRouter.get('/:id', authenticate, requireScope('shipments:read'), (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { id } = req.params;

  const row = queryOne(`
    SELECT * FROM shipments 
    WHERE organization_id = ? AND (id = ? OR tracking_number = ?)
  `, [orgId, id, id]);

  if (!row) {
    return res.status(404).json({ success: false, error: 'Envío no encontrado en su organización.' });
  }

  const events = queryAll(`SELECT * FROM shipment_events WHERE shipment_id = ? ORDER BY created_at ASC`, [row.id]);

  return res.json({
    success: true,
    shipment: {
      ...row,
      origin: JSON.parse(row.origin_json || '{}'),
      destination: JSON.parse(row.destination_json || '{}'),
      package: JSON.parse(row.package_json || '{}'),
      pricing: JSON.parse(row.pricing_json || '{}'),
      events
    }
  });
});
