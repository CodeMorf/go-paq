import { queryOneAsync } from '../../db/database';

export interface QuoteInput {
  serviceType: 'local' | 'nacional' | 'internacional' | 'express' | 'mudanza' | 'carga_pesada';
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
}

export interface QuoteResult {
  baseRate: number;
  weightCost: number;
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
}

export async function calculatePricing(input: QuoteInput, organizationId: string = 'org-gopaq'): Promise<QuoteResult> {
  // Volumetric weight formula: (L * W * H) / 5000 (IATA standard)
  const volWeight = (input.lengthCm * input.widthCm * input.heightCm) / 5000;
  const billableWeight = Math.max(input.weightKg, volWeight);

  // Fetch rate matrix from DB
  const rate = await queryOneAsync<any>(`
    SELECT * FROM rates_matrix 
    WHERE organization_id = ? AND service_type = ?
    AND active = 1
    ORDER BY created_at DESC
    LIMIT 1
  `, [organizationId, input.serviceType]);
  if (!rate) throw Object.assign(new Error('La tarifa de este servicio no está configurada.'), { statusCode: 503 });

  const base = rate.base_rate;
  const weightExcess = Math.max(0, billableWeight - 1);
  const weightCost = weightExcess * rate.per_kg_rate;

  const fragileSurcharge = input.isFragile ? 75 : 0;
  const insuranceCost = (input.declaredValueUsd && input.declaredValueUsd > 100)
    ? Math.round(input.declaredValueUsd * 0.015 * 60) // 1.5% in DOP
    : 0;

  let dangerousZoneSurcharge = 0;
  if (input.dangerousZoneId) {
    const dz = await queryOneAsync<{ surcharge_amount: number }>('SELECT surcharge_amount FROM dangerous_zones WHERE id = ? AND organization_id = ? AND active = 1', [input.dangerousZoneId, organizationId]);
    if (dz) dangerousZoneSurcharge = dz.surcharge_amount;
  }

  // COD fee: 2% of COD amount with minimum of RD$ 50
  let codFee = 0;
  if (input.codAmount && input.codAmount > 0) {
    codFee = Math.max(50, Math.round(input.codAmount * 0.02));
  }

  const subtotal = Math.max(rate.min_charge, base + weightCost + fragileSurcharge + insuranceCost + dangerousZoneSurcharge + codFee);
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% ITBIS
  const total = subtotal + tax;

  let estimatedDays = '1 día hábil (24 horas)';
  if (input.serviceType === 'express') estimatedDays = 'Mismo día (2 a 4 horas)';
  if (input.serviceType === 'internacional') estimatedDays = '3 a 5 días hábiles';
  if (input.serviceType === 'nacional') estimatedDays = '24 a 48 horas';

  return {
    baseRate: base,
    weightCost,
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
    estimatedDays
  };
}
