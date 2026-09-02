import { queryOneAsync } from '../../db/database';
import { assertServiceEnabled, getOrganizationConfiguration } from '../configuration/configuration.service';

export interface QuoteInput {
  serviceType: 'local' | 'nacional' | 'internacional' | 'express' | 'mudanza' | 'carga_pesada' | 'programado';
  originCity: string;
  destCity: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValueUsd?: number;
  isFragile?: boolean;
  codAmount?: number;
  dangerousZoneId?: string;
  distanceKm?: number;
  clientId?: string;
  branchId?: string;
  serviceVariant?: string;
}

export interface QuoteResult {
  baseRate: number;
  weightCost: number;
  distanceCost: number;
  configurableSurcharge: number;
  volumetricWeightKg: number;
  billableWeightKg: number;
  fragileSurcharge: number;
  insuranceCost: number;
  dangerousZoneSurcharge: number;
  codFee: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: 'DOP' | 'USD';
  estimatedDays: string;
  ruleCode?: string;
}

export async function calculatePricing(input: QuoteInput, organizationId: string = 'org-gopaq'): Promise<QuoteResult> {
  await assertServiceEnabled(organizationId, input.serviceType);
  const configuration = await getOrganizationConfiguration(organizationId);
  const finance = configuration.settings.finance;
  const taxRate = Number(configuration.settings.localization.taxRate ?? 18);

  if (input.codAmount && input.codAmount > 0) {
    if (finance.codEnabled === false) throw Object.assign(new Error('El pago contra entrega está deshabilitado para esta organización.'), { statusCode: 409 });
    if (input.codAmount > Number(finance.maxCodAmount ?? Number.MAX_SAFE_INTEGER)) throw Object.assign(new Error('El monto COD supera el límite configurado para esta organización.'), { statusCode: 422 });
  }

  // Volumetric weight formula: (L * W * H) / 5000 (IATA standard)
  const volWeight = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
  const billableWeight = Math.max(input.weightKg, volWeight);

  // Fetch rate matrix from DB
  let rate = await queryOneAsync<any>(`
    SELECT * FROM rates_matrix 
    WHERE organization_id = ? AND service_type = ?
    AND active = 1
    AND (origin_zone = '*' OR lower(origin_zone) = lower(?))
    AND (dest_zone = '*' OR lower(dest_zone) = lower(?))
    AND (client_id IS NULL OR client_id = ?)
    AND (branch_id IS NULL OR branch_id = ?)
    AND (service_variant IS NULL OR service_variant = ?)
    ORDER BY priority ASC, CASE WHEN client_id IS NOT NULL THEN 0 ELSE 1 END, CASE WHEN branch_id IS NOT NULL THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1
  `, [organizationId, input.serviceType, input.originCity || '*', input.destCity || '*', input.clientId || null, input.branchId || null, input.serviceVariant || null]);
  // Legacy matrices may use internal zone codes while quotes receive city
  // names. A service-level rule is the safe fallback; it remains tenant
  // scoped and ordered by the configured priority.
  if (!rate) rate = await queryOneAsync<any>(`SELECT * FROM rates_matrix WHERE organization_id = ? AND service_type = ? AND active = 1 AND (client_id IS NULL OR client_id = ?) AND (branch_id IS NULL OR branch_id = ?) AND (service_variant IS NULL OR service_variant = ?) ORDER BY priority ASC, created_at DESC LIMIT 1`, [organizationId, input.serviceType, input.clientId || null, input.branchId || null, input.serviceVariant || null]);
  if (!rate) throw Object.assign(new Error('La tarifa de este servicio no está configurada.'), { statusCode: 503 });

  const pricingMode = String(rate.pricing_mode || 'base_plus_weight');
  const billingWeight = String(rate.weight_unit || 'kg') === 'lb' ? billableWeight * 2.2046226218 : billableWeight;
  const maxWeight = rate.max_weight == null ? null : Number(rate.max_weight);
  if (maxWeight !== null && billingWeight > maxWeight + 0.000001) {
    throw Object.assign(new Error(`El peso facturable supera el máximo de ${maxWeight} ${String(rate.weight_unit || 'kg')}.`), { statusCode: 422 });
  }
  const includedWeight = Number(rate.included_weight ?? 1);
  const weightStep = Math.max(0.001, Number(rate.additional_weight_step ?? 1));
  const additionalWeightRate = Number(rate.additional_weight_rate ?? rate.per_kg_rate ?? 0);
  const weightExcess = Math.max(0, billingWeight - includedWeight);
  let weightCost = ['flat', 'per_km', 'tiered'].includes(pricingMode) ? 0 : Math.ceil(weightExcess / weightStep) * additionalWeightRate;
  const distanceKm = Math.max(0, Number(input.distanceKm || 0));
  const distanceCost = ['base_plus_weight', 'flat', 'tiered'].includes(pricingMode) ? 0 : Math.max(0, distanceKm - Number(rate.included_distance_km || 0)) * Number(rate.distance_rate ?? rate.per_kg_rate ?? 0);

  let base = Number(rate.base_rate || 0);
  if (pricingMode === 'per_km') base = Math.max(base, distanceKm * Number(rate.distance_rate ?? rate.per_kg_rate ?? 0));
  if (pricingMode === 'tiered') {
    let tiers: Array<{ min: number; max: number; price: number; additionalRate?: number }> = [];
    try { tiers = JSON.parse(rate.tiers_json || '[]'); } catch { tiers = []; }
    const tier = tiers.find((item) => billingWeight >= Number(item.min) && billingWeight <= Number(item.max));
    if (tier) {
      base = Number(tier.price);
      weightCost = 0;
    }
  }

  const fragileSurcharge = input.isFragile ? 75 : 0;
  const insuranceCost = (input.declaredValueUsd && input.declaredValueUsd > 100)
    ? Math.round(input.declaredValueUsd * 0.015 * 60) // 1.5% in DOP
    : 0;

  let dangerousZoneSurcharge = 0;
  if (input.dangerousZoneId) {
    const dz = await queryOneAsync<{ surcharge_amount: number }>('SELECT surcharge_amount FROM dangerous_zones WHERE id = ? AND organization_id = ? AND active = 1', [input.dangerousZoneId, organizationId]);
    if (dz) dangerousZoneSurcharge = dz.surcharge_amount;
  }

  // COD fee is a tenant policy; the default preserves the existing 2% rule.
  let codFee = 0;
  if (input.codAmount && input.codAmount > 0) {
    codFee = Math.max(50, Math.round(input.codAmount * (Number(finance.codCommissionRate ?? 2) / 100)));
  }

  let configurableSurcharge = 0;
  try {
    const surcharges = JSON.parse(rate.surcharges_json || '{}') as Record<string, { type: 'fixed' | 'percent' | 'unit'; value: number }>;
    const surchargeBase = base + weightCost + distanceCost + fragileSurcharge + insuranceCost + dangerousZoneSurcharge + codFee;
    configurableSurcharge = Object.values(surcharges).reduce((total, rule) => total + (rule.type === 'percent' ? surchargeBase * Number(rule.value || 0) / 100 : Number(rule.value || 0)), 0);
  } catch { configurableSurcharge = 0; }
  const subtotal = Math.max(Number(rate.min_charge || 0), base + weightCost + distanceCost + fragileSurcharge + insuranceCost + dangerousZoneSurcharge + codFee + configurableSurcharge);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = subtotal + tax;

  let estimatedDays = '1 día hábil (24 horas)';
  if (input.serviceType === 'express') estimatedDays = 'Mismo día (2 a 4 horas)';
  if (input.serviceType === 'internacional') estimatedDays = '3 a 5 días hábiles';
  if (input.serviceType === 'nacional') estimatedDays = '24 a 48 horas';

  return {
    baseRate: base,
    weightCost,
    distanceCost,
    configurableSurcharge,
    volumetricWeightKg: Math.round(volWeight * 100) / 100,
    billableWeightKg: Math.round(billableWeight * 100) / 100,
    fragileSurcharge,
    insuranceCost,
    dangerousZoneSurcharge,
    codFee,
    subtotal,
    tax,
    total,
    currency: (rate.currency as any) || 'DOP',
    estimatedDays,
    ruleCode: rate.rule_code || rate.id
  };
}
