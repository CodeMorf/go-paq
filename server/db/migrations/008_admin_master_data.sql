-- Admin master data: branch branding, geospatial risk points and flexible tariff rules.
-- All columns are additive so an existing production database keeps its records.
ALTER TABLE branches ADD COLUMN IF NOT EXISTS logo_storage_key TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'DO';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS business_hours_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS branch_type TEXT NOT NULL DEFAULT 'branch';
ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_phone TEXT;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_email TEXT;

ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS radius_m INTEGER NOT NULL DEFAULT 500;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS center geography(Point, 4326);
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'DO';
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS alert_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'base_plus_weight';
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS weight_unit TEXT NOT NULL DEFAULT 'kg';
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS included_weight NUMERIC NOT NULL DEFAULT 1;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS additional_weight_step NUMERIC NOT NULL DEFAULT 1;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS additional_weight_rate NUMERIC;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS included_distance_km NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS distance_rate NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS rule_code TEXT;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS service_variant TEXT;
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS tiers_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS surcharges_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_dangerous_zones_org_active ON dangerous_zones(organization_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dangerous_zones_center ON dangerous_zones USING GIST (center);
CREATE INDEX IF NOT EXISTS idx_rates_matrix_org_service_active ON rates_matrix(organization_id, service_type, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rates_matrix_org_zones ON rates_matrix(organization_id, origin_zone, dest_zone, active);
CREATE INDEX IF NOT EXISTS idx_rates_matrix_org_priority ON rates_matrix(organization_id, service_type, priority, active);
