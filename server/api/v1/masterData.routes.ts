import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { isPostgres, queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { asyncHandler } from '../../core/http';
import { calculatePricing } from '../../modules/pricing/pricing.engine';

const adminRoles = ['SUPER_ADMIN', 'OWNER', 'ADMIN'];
const serviceTypes = ['local', 'nacional', 'internacional', 'express', 'mudanza', 'carga_pesada', 'programado'] as const;

function parseJsonOr<T>(value: unknown, fallback: T): T {
  try { return value == null || value === '' ? fallback : JSON.parse(String(value)) as T; } catch { return fallback; }
}

function validPolygon(value: string | undefined | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed?.type !== 'Polygon' || !Array.isArray(parsed.coordinates) || !parsed.coordinates.length) throw new Error();
    return JSON.stringify(parsed);
  } catch {
    throw Object.assign(new Error('El polígono debe ser un GeoJSON Polygon válido.'), { statusCode: 422 });
  }
}

export const dangerousZonesRouter = Router();

const zoneFields = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(600).default(''),
  riskLevel: z.enum(['bajo', 'moderado', 'alto', 'critico']),
  country: z.string().trim().length(2).default('DO'),
  province: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(120),
  sector: z.string().trim().max(120).optional(),
  latitude: z.union([z.null(), z.coerce.number().min(-90).max(90)]),
  longitude: z.union([z.null(), z.coerce.number().min(-180).max(180)]),
  radiusM: z.coerce.number().int().min(25).max(100000).default(500),
  surchargeAmount: z.coerce.number().min(0).max(100000000).default(0),
  restrictionPolicy: z.string().trim().min(2).max(300),
  alertReason: z.string().trim().max(600).default(''),
  polygonGeojson: z.string().max(200000).optional()
}).strict();

const zoneSchema = zoneFields.superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'La latitud y la longitud deben guardarse juntas.' });
});

const zonePatchSchema = zoneFields.partial().strict().superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null) && (value.latitude !== undefined || value.longitude !== undefined)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'La latitud y la longitud deben guardarse juntas.' });
});

dangerousZonesRouter.get('/', authenticate, requireRole(adminRoles), requireScope('zones:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const status = String(req.query.status || 'active');
  const filters = ['organization_id = ?']; const params: any[] = [req.organizationId];
  if (status === 'active') filters.push('active = 1'); else if (status === 'inactive') filters.push('active = 0');
  const q = String(req.query.q || '').trim().slice(0, 120);
  if (q) { filters.push(`(lower(name) LIKE ? OR lower(city) LIKE ? OR lower(coalesce(sector, '')) LIKE ?)`); const p = `%${q.toLowerCase()}%`; params.push(p, p, p); }
  const zones = await queryAllAsync(`SELECT id, organization_id, name, description, risk_level, country, province, city, sector, latitude, longitude, radius_m, surcharge_amount, restriction_policy, alert_reason, polygon_geojson, active, created_at, updated_at, updated_by FROM dangerous_zones WHERE ${filters.join(' AND ')} ORDER BY active DESC, created_at DESC`, params);
  return res.json({ success: true, zones });
}));

dangerousZonesRouter.post('/', authenticate, requireRole(adminRoles), requireScope('zones:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = zoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de zona inválidos.' });
  const input = parsed.data; const polygon = validPolygon(input.polygonGeojson); const id = `zone-${crypto.randomUUID()}`; const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO dangerous_zones (id, organization_id, name, description, city, risk_level, country, province, sector, latitude, longitude, radius_m, surcharge_amount, restriction_policy, alert_reason, polygon_geojson, active, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`, [id, req.organizationId, input.name, input.description, input.city, input.riskLevel, input.country.toUpperCase(), input.province || null, input.sector || null, input.latitude, input.longitude, input.radiusM, input.surchargeAmount, input.restrictionPolicy, input.alertReason, polygon, req.user!.userId, now, now]);
    if (isPostgres && input.latitude !== null && input.longitude !== null) await tx.execute('UPDATE dangerous_zones SET center = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ? AND organization_id = ?', [input.longitude, input.latitude, id, req.organizationId]);
    if (isPostgres && polygon) await tx.execute('UPDATE dangerous_zones SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ? AND organization_id = ?', [polygon, id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'dangerous_zone.created', 'dangerous_zone', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, id, req.ip, JSON.stringify({ hasPoint: input.latitude !== null, hasPolygon: !!polygon }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'dangerous_zone.created', 'dangerous_zone', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, req.organizationId, id, JSON.stringify({ id, organizationId: req.organizationId }), now]);
  });
  return res.status(201).json({ success: true, zone: { id, organization_id: req.organizationId, ...input, polygonGeojson: polygon, active: 1, created_at: now, updated_at: now, updated_by: req.user!.userId } });
}));

dangerousZonesRouter.patch('/:id', authenticate, requireRole(adminRoles), requireScope('zones:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = zonePatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de zona inválidos.' });
  const current = await queryOneAsync<any>('SELECT * FROM dangerous_zones WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
  if (!current) return res.status(404).json({ success: false, error: 'Zona peligrosa no encontrada.' });
  const input = parsed.data; const polygon = input.polygonGeojson === undefined ? current.polygon_geojson : validPolygon(input.polygonGeojson); const latitude = input.latitude === undefined ? current.latitude : input.latitude; const longitude = input.longitude === undefined ? current.longitude : input.longitude; const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`UPDATE dangerous_zones SET name = ?, description = ?, risk_level = ?, country = ?, province = ?, city = ?, sector = ?, latitude = ?, longitude = ?, radius_m = ?, surcharge_amount = ?, restriction_policy = ?, alert_reason = ?, polygon_geojson = ?, updated_by = ?, updated_at = ? WHERE id = ? AND organization_id = ?`, [input.name ?? current.name, input.description ?? current.description, input.riskLevel ?? current.risk_level, input.country?.toUpperCase() ?? current.country, input.province === undefined ? current.province : input.province || null, input.city ?? current.city, input.sector === undefined ? current.sector : input.sector || null, latitude, longitude, input.radiusM ?? current.radius_m, input.surchargeAmount ?? current.surcharge_amount, input.restrictionPolicy ?? current.restriction_policy, input.alertReason ?? current.alert_reason, polygon, req.user!.userId, now, req.params.id, req.organizationId]);
    if (isPostgres) {
      if (latitude !== null && longitude !== null) await tx.execute('UPDATE dangerous_zones SET center = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography WHERE id = ? AND organization_id = ?', [longitude, latitude, req.params.id, req.organizationId]);
      else await tx.execute('UPDATE dangerous_zones SET center = NULL WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
      if (polygon) await tx.execute('UPDATE dangerous_zones SET boundary = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ? AND organization_id = ?', [polygon, req.params.id, req.organizationId]);
      else await tx.execute('UPDATE dangerous_zones SET boundary = NULL WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
    }
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'dangerous_zone.updated', 'dangerous_zone', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, JSON.stringify({ fields: Object.keys(input) }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'dangerous_zone.updated', 'dangerous_zone', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, req.organizationId, req.params.id, JSON.stringify({ id: req.params.id, organizationId: req.organizationId }), now]);
  });
  return res.json({ success: true, zone: await queryOneAsync<any>('SELECT * FROM dangerous_zones WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]) });
}));

dangerousZonesRouter.delete('/:id', authenticate, requireRole(adminRoles), requireScope('zones:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const zone = await tx.queryOne<any>('SELECT id, active FROM dangerous_zones WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
    if (!zone) throw Object.assign(new Error('Zona peligrosa no encontrada.'), { statusCode: 404 });
    if (!zone.active) return false;
    await tx.execute('UPDATE dangerous_zones SET active = 0, updated_by = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1', [req.user!.userId, now, req.params.id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'dangerous_zone.deactivated', 'dangerous_zone', ?, 'success', ?, '{}', ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'dangerous_zone.deactivated', 'dangerous_zone', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, req.organizationId, req.params.id, JSON.stringify({ id: req.params.id, organizationId: req.organizationId }), now]);
    return true;
  });
  return res.json({ success: true, status: result ? 'deactivated' : 'already_inactive' });
}));

export const ratesRouter = Router();
const tierSchema = z.object({ min: z.coerce.number().min(0), max: z.coerce.number().gt(0), price: z.coerce.number().min(0), additionalRate: z.coerce.number().min(0).optional() }).strict().refine((value) => value.max >= value.min, 'El máximo del rango debe ser mayor o igual al mínimo.');
const surchargeSchema = z.object({ type: z.enum(['fixed', 'percent', 'unit']), value: z.coerce.number().min(0), unit: z.string().trim().max(30).optional() }).strict();
const rateSchema = z.object({
  ruleCode: z.string().trim().max(80).optional(), serviceType: z.enum(serviceTypes), serviceVariant: z.string().trim().max(40).optional(), originZone: z.string().trim().max(120).default('*'), destZone: z.string().trim().max(120).default('*'),
  baseRate: z.coerce.number().min(0).max(100000000), perKgRate: z.coerce.number().min(0).max(100000000).default(0), perVolRate: z.coerce.number().min(0).max(100000000).default(0), minCharge: z.coerce.number().min(0).max(100000000),
  pricingMode: z.enum(['flat', 'per_km', 'base_plus_km', 'base_plus_weight', 'hybrid', 'tiered']).default('base_plus_weight'), weightUnit: z.enum(['kg', 'lb']).default('kg'), includedWeight: z.coerce.number().min(0).default(1), additionalWeightStep: z.coerce.number().gt(0).default(1), additionalWeightRate: z.coerce.number().min(0).optional(), includedDistanceKm: z.coerce.number().min(0).default(0), distanceRate: z.coerce.number().min(0).default(0),
  currency: z.enum(['DOP', 'USD', 'EUR']).default('DOP'), priority: z.coerce.number().int().min(1).max(10000).default(100), clientId: z.string().trim().max(120).nullable().optional(), branchId: z.string().trim().max(120).nullable().optional(), tiers: z.array(tierSchema).max(50).default([]), surcharges: z.record(z.string(), surchargeSchema).default({})
}).strict();

ratesRouter.get('/', authenticate, requireRole(adminRoles), requireScope('rates:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const filters = ['organization_id = ?']; const params: any[] = [req.organizationId];
  if (req.query.serviceType) { filters.push('service_type = ?'); params.push(String(req.query.serviceType)); }
  const status = String(req.query.status || 'active'); if (status === 'active') filters.push('active = 1'); else if (status === 'inactive') filters.push('active = 0');
  const rates = await queryAllAsync(`SELECT * FROM rates_matrix WHERE ${filters.join(' AND ')} ORDER BY priority ASC, service_type ASC, created_at DESC`, params);
  return res.json({ success: true, rates: rates.map((rate: any) => ({ ...rate, tiers: parseJsonOr(rate.tiers_json, []), surcharges: parseJsonOr(rate.surcharges_json, {}) })) });
}));

ratesRouter.post('/', authenticate, requireRole(adminRoles), requireScope('rates:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = rateSchema.safeParse(req.body); if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de tarifa inválidos.' });
  const input = parsed.data; const id = `rate-${crypto.randomUUID()}`; const ruleCode = input.ruleCode || `TARIFA-${input.serviceType.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO rates_matrix (id, organization_id, rule_code, service_type, service_variant, origin_zone, dest_zone, base_rate, per_kg_rate, per_vol_rate, min_charge, pricing_mode, weight_unit, included_weight, additional_weight_step, additional_weight_rate, included_distance_km, distance_rate, currency, priority, client_id, branch_id, tiers_json, surcharges_json, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [id, req.organizationId, ruleCode, input.serviceType, input.serviceVariant || null, input.originZone, input.destZone, input.baseRate, input.perKgRate, input.perVolRate, input.minCharge, input.pricingMode, input.weightUnit, input.includedWeight, input.additionalWeightStep, input.additionalWeightRate ?? null, input.includedDistanceKm, input.distanceRate, input.currency, input.priority, input.clientId || null, input.branchId || null, JSON.stringify(input.tiers), JSON.stringify(input.surcharges), now, now]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'rate.created', 'rate', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, id, req.ip, JSON.stringify({ ruleCode, serviceType: input.serviceType }), now]);
  });
  return res.status(201).json({ success: true, rate: { id, ruleCode, ...input, active: 1, createdAt: now, updatedAt: now } });
}));

const simulationSchema = z.object({
  serviceType: z.enum(serviceTypes), originCity: z.string().trim().min(2).max(120), destCity: z.string().trim().min(2).max(120), weightKg: z.coerce.number().positive().max(100000), lengthCm: z.coerce.number().positive().max(10000), widthCm: z.coerce.number().positive().max(10000), heightCm: z.coerce.number().positive().max(10000), distanceKm: z.coerce.number().min(0).max(100000).default(0), codAmount: z.coerce.number().min(0).max(100000000).default(0), clientId: z.string().trim().max(120).optional(), branchId: z.string().trim().max(120).optional()
}).strict();

ratesRouter.post('/simulate', authenticate, requireRole(adminRoles), requireScope('rates:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = simulationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de simulación inválidos.' });
  const quote = await calculatePricing(parsed.data, req.organizationId!);
  return res.json({ success: true, quote });
}));

ratesRouter.patch('/:id', authenticate, requireRole(adminRoles), requireScope('rates:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = rateSchema.safeParse(req.body); if (!parsed.success) return res.status(422).json({ success: false, error: parsed.error.issues[0]?.message || 'Datos de tarifa inválidos.' });
  const input = parsed.data; const current = await queryOneAsync<any>('SELECT id FROM rates_matrix WHERE id = ? AND organization_id = ? AND active = 1', [req.params.id, req.organizationId]); if (!current) return res.status(404).json({ success: false, error: 'Tarifa no encontrada.' });
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`UPDATE rates_matrix SET rule_code = ?, service_type = ?, service_variant = ?, origin_zone = ?, dest_zone = ?, base_rate = ?, per_kg_rate = ?, per_vol_rate = ?, min_charge = ?, pricing_mode = ?, weight_unit = ?, included_weight = ?, additional_weight_step = ?, additional_weight_rate = ?, included_distance_km = ?, distance_rate = ?, currency = ?, priority = ?, client_id = ?, branch_id = ?, tiers_json = ?, surcharges_json = ?, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1`, [input.ruleCode || null, input.serviceType, input.serviceVariant || null, input.originZone, input.destZone, input.baseRate, input.perKgRate, input.perVolRate, input.minCharge, input.pricingMode, input.weightUnit, input.includedWeight, input.additionalWeightStep, input.additionalWeightRate ?? null, input.includedDistanceKm, input.distanceRate, input.currency, input.priority, input.clientId || null, input.branchId || null, JSON.stringify(input.tiers), JSON.stringify(input.surcharges), now, req.params.id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'rate.updated', 'rate', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, JSON.stringify({ ruleCode: input.ruleCode || null }), now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'rate.updated', 'rate', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, req.organizationId, req.params.id, JSON.stringify({ id: req.params.id, organizationId: req.organizationId }), now]);
  });
  return res.json({ success: true, rate: await queryOneAsync<any>('SELECT * FROM rates_matrix WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]) });
}));

ratesRouter.delete('/:id', authenticate, requireRole(adminRoles), requireScope('rates:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const now = new Date().toISOString();
  const result = await transactionAsync(async (tx) => {
    const rate = await tx.queryOne<any>('SELECT active FROM rates_matrix WHERE id = ? AND organization_id = ?', [req.params.id, req.organizationId]);
    if (!rate) throw Object.assign(new Error('Tarifa no encontrada.'), { statusCode: 404 });
    if (!rate.active) return false;
    await tx.execute('UPDATE rates_matrix SET active = 0, updated_at = ? WHERE id = ? AND organization_id = ? AND active = 1', [now, req.params.id, req.organizationId]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'rate.deactivated', 'rate', ?, 'success', ?, '{}', ?)`, [`aud-${crypto.randomUUID()}`, req.organizationId, req.user!.userId, req.params.id, req.ip, now]);
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'rate.deactivated', 'rate', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, req.organizationId, req.params.id, JSON.stringify({ id: req.params.id, organizationId: req.organizationId }), now]);
    return true;
  });
  return res.json({ success: true, status: result ? 'deactivated' : 'already_inactive' });
}));
