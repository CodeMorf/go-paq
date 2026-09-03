-- Preserve the legacy business defaults in the tenant tariff matrix so
-- special-service quotes are calculated by the central pricing engine.
UPDATE rates_matrix
SET pricing_mode = 'hybrid',
    included_distance_km = 0,
    distance_rate = 85,
    surcharges_json = '{"floor_no_elevator":{"type":"unit","value":600},"crew_member":{"type":"unit","value":1200}}',
    updated_at = CURRENT_TIMESTAMP
WHERE organization_id = 'org-gopaq'
  AND id = 'rate-prod-moving'
  AND service_type = 'mudanza'
  AND base_rate = 4500
  AND per_vol_rate = 850
  AND COALESCE(distance_rate, 0) = 0
  AND COALESCE(surcharges_json, '{}') = '{}';

UPDATE rates_matrix
SET pricing_mode = 'base_plus_weight',
    surcharges_json = '{"pallet":{"type":"unit","value":750},"equipment":{"type":"fixed","value":2500}}',
    updated_at = CURRENT_TIMESTAMP
WHERE organization_id = 'org-gopaq'
  AND id = 'rate-prod-heavy'
  AND service_type = 'carga_pesada'
  AND base_rate = 8500
  AND per_kg_rate = 18
  AND per_vol_rate = 500
  AND COALESCE(surcharges_json, '{}') = '{}';
