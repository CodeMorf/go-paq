import { closeDatabase, initDatabaseAsync, isPostgres, queryOneAsync, transactionAsync } from './database';

type Province = { code: string; name: string; capital: string };

const provinces: Province[] = [
  { code: 'DN', name: 'Distrito Nacional', capital: 'Santo Domingo' },
  { code: 'AZ', name: 'Azua', capital: 'Azua de Compostela' },
  { code: 'BH', name: 'Bahoruco', capital: 'Neiba' },
  { code: 'BA', name: 'Barahona', capital: 'Santa Cruz de Barahona' },
  { code: 'DA', name: 'Dajabón', capital: 'Dajabón' },
  { code: 'DU', name: 'Duarte', capital: 'San Francisco de Macorís' },
  { code: 'EP', name: 'Elías Piña', capital: 'Comendador' },
  { code: 'ES', name: 'El Seibo', capital: 'Santa Cruz de El Seibo' },
  { code: 'EM', name: 'Espaillat', capital: 'Moca' },
  { code: 'HM', name: 'Hato Mayor', capital: 'Hato Mayor del Rey' },
  { code: 'HR', name: 'Hermanas Mirabal', capital: 'Salcedo' },
  { code: 'IN', name: 'Independencia', capital: 'Jimaní' },
  { code: 'AL', name: 'La Altagracia', capital: 'Higüey' },
  { code: 'LR', name: 'La Romana', capital: 'La Romana' },
  { code: 'LV', name: 'La Vega', capital: 'Concepción de La Vega' },
  { code: 'MN', name: 'María Trinidad Sánchez', capital: 'Nagua' },
  { code: 'MB', name: 'Monseñor Nouel', capital: 'Bonao' },
  { code: 'MC', name: 'Monte Cristi', capital: 'Monte Cristi' },
  { code: 'MP', name: 'Monte Plata', capital: 'Monte Plata' },
  { code: 'PE', name: 'Pedernales', capital: 'Pedernales' },
  { code: 'PV', name: 'Peravia', capital: 'Baní' },
  { code: 'PP', name: 'Puerto Plata', capital: 'San Felipe de Puerto Plata' },
  { code: 'SM', name: 'Samaná', capital: 'Santa Bárbara de Samaná' },
  { code: 'SR', name: 'Sánchez Ramírez', capital: 'Cotuí' },
  { code: 'SC', name: 'San Cristóbal', capital: 'San Cristóbal' },
  { code: 'SO', name: 'San José de Ocoa', capital: 'San José de Ocoa' },
  { code: 'SJ', name: 'San Juan', capital: 'San Juan de la Maguana' },
  { code: 'SP', name: 'San Pedro de Macorís', capital: 'San Pedro de Macorís' },
  { code: 'ST', name: 'Santiago', capital: 'Santiago de los Caballeros' },
  { code: 'SG', name: 'Santiago Rodríguez', capital: 'San Ignacio de Sabaneta' },
  { code: 'SDO', name: 'Santo Domingo', capital: 'Santo Domingo Este' },
  { code: 'VA', name: 'Valverde', capital: 'Mao' }
];

const zoneLabels = [
  { number: 1, name: 'Centro provincial', description: 'Zona operativa de la cabecera y área urbana central.' },
  { number: 2, name: 'Norte operativo', description: 'Zona operativa para el corredor norte de la provincia.' },
  { number: 3, name: 'Sur operativo', description: 'Zona operativa para el corredor sur y periferia provincial.' }
] as const;

const nationalPoundRate = {
  ruleCode: 'RD-NACIONAL-LB-60',
  serviceType: 'nacional',
  originZone: '*',
  destZone: '*',
  baseRate: 190,
  perKgRate: 0,
  perVolRate: 0,
  minCharge: 190,
  maxWeight: 60,
  pricingMode: 'base_plus_weight',
  weightUnit: 'lb',
  includedWeight: 1,
  additionalWeightStep: 1,
  additionalWeightRate: 18,
  includedDistanceKm: 0,
  distanceRate: 0,
  currency: 'DOP',
  priority: 1,
  tiersJson: '[]',
  surchargesJson: '{}'
} as const;

async function main() {
  if (process.env.NODE_ENV !== 'production') throw new Error('El catálogo productivo requiere NODE_ENV=production.');
  if (!isPostgres) throw new Error('El catálogo productivo requiere PostgreSQL.');
  if (process.env.GOPAQ_GEO_BOOTSTRAP_CONFIRM !== 'I_UNDERSTAND') throw new Error('Falta GOPAQ_GEO_BOOTSTRAP_CONFIRM=I_UNDERSTAND.');

  await initDatabaseAsync();
  const now = new Date().toISOString();
  const organizationId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  await transactionAsync(async (tx) => {
    await tx.execute(`
      INSERT INTO countries (id, iso2, iso3, name, official_name, active, created_at, updated_at)
      VALUES ('country-do', 'DO', 'DOM', 'República Dominicana', 'República Dominicana', TRUE, ?, ?)
      ON CONFLICT (id) DO UPDATE SET iso2 = EXCLUDED.iso2, iso3 = EXCLUDED.iso3, name = EXCLUDED.name, official_name = EXCLUDED.official_name, active = TRUE, updated_at = EXCLUDED.updated_at
    `, [now, now]);

    for (const province of provinces) {
      const provinceId = `province-do-${province.code.toLowerCase()}`;
      await tx.execute(`
        INSERT INTO provinces (id, country_id, code, name, capital, active, created_at, updated_at)
        VALUES (?, 'country-do', ?, ?, ?, TRUE, ?, ?)
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, capital = EXCLUDED.capital, active = TRUE, updated_at = EXCLUDED.updated_at
      `, [provinceId, province.code, province.name, province.capital, now, now]);

      for (const zone of zoneLabels) {
        const zoneId = `zone-do-${province.code.toLowerCase()}-${zone.number}`;
        const zoneCode = `DO-${province.code}-${zone.number}`;
        await tx.execute(`
          INSERT INTO service_zones (id, province_id, code, name, zone_number, description, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?)
          ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, zone_number = EXCLUDED.zone_number, description = EXCLUDED.description, active = TRUE, updated_at = EXCLUDED.updated_at
        `, [zoneId, provinceId, zoneCode, zone.name, zone.number, zone.description, now, now]);
      }
    }

    const existingRate = await tx.queryOne<{ id: string }>(
      'SELECT id FROM rates_matrix WHERE organization_id = ? AND rule_code = ? LIMIT 1',
      [organizationId, nationalPoundRate.ruleCode]
    );
    if (!existingRate) {
      await tx.execute(`
        INSERT INTO rates_matrix (
          id, organization_id, rule_code, service_type, service_variant,
          origin_zone, dest_zone, base_rate, per_kg_rate, per_vol_rate,
          min_charge, pricing_mode, weight_unit, included_weight,
          additional_weight_step, additional_weight_rate, included_distance_km,
          distance_rate, max_weight, currency, priority, client_id, branch_id,
          tiers_json, surcharges_json, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 1, ?, ?)
      `, [
        `rate-${nationalPoundRate.ruleCode.toLowerCase()}`,
        organizationId,
        nationalPoundRate.ruleCode,
        nationalPoundRate.serviceType,
        nationalPoundRate.originZone,
        nationalPoundRate.destZone,
        nationalPoundRate.baseRate,
        nationalPoundRate.perKgRate,
        nationalPoundRate.perVolRate,
        nationalPoundRate.minCharge,
        nationalPoundRate.pricingMode,
        nationalPoundRate.weightUnit,
        nationalPoundRate.includedWeight,
        nationalPoundRate.additionalWeightStep,
        nationalPoundRate.additionalWeightRate,
        nationalPoundRate.includedDistanceKm,
        nationalPoundRate.distanceRate,
        nationalPoundRate.maxWeight,
        nationalPoundRate.currency,
        nationalPoundRate.priority,
        nationalPoundRate.tiersJson,
        nationalPoundRate.surchargesJson,
        now,
        now
      ]);
    }
  });

  const country = await queryOneAsync<{ count: string }>(`SELECT COUNT(*)::text AS count FROM countries WHERE iso2 = 'DO' AND active = TRUE`);
  const provinceCount = await queryOneAsync<{ count: string }>(`SELECT COUNT(*)::text AS count FROM provinces WHERE country_id = 'country-do' AND active = TRUE`);
  const zoneCount = await queryOneAsync<{ count: string }>(`SELECT COUNT(*)::text AS count FROM service_zones z JOIN provinces p ON p.id = z.province_id WHERE p.country_id = 'country-do' AND z.active = TRUE`);
  const configuredRate = await queryOneAsync<{ id: string }>(`SELECT id FROM rates_matrix WHERE organization_id = ? AND rule_code = ? AND active = 1`, [organizationId, nationalPoundRate.ruleCode]);
  console.log(JSON.stringify({
    success: true,
    country: Number(country?.count || 0),
    provinces: Number(provinceCount?.count || 0),
    zones: Number(zoneCount?.count || 0),
    zoneModel: 'operational_labels_without_invented_coordinates',
    rate: configuredRate ? nationalPoundRate : null
  }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'dominican_republic_seed_failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
