-- Geographic catalog for operational coverage. These are not dangerous zones.
-- Country/province/zone records are global reference data and carry no tenant
-- data. A service zone is an operational label until a polygon is explicitly
-- supplied; the system never invents coordinates for it.
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  iso2 TEXT NOT NULL UNIQUE,
  iso3 TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provinces (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  capital TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (country_id, code),
  UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS service_zones (
  id TEXT PRIMARY KEY,
  province_id TEXT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_number SMALLINT NOT NULL CHECK (zone_number BETWEEN 1 AND 3),
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (province_id, code),
  UNIQUE (province_id, zone_number)
);

ALTER TABLE rates_matrix ADD COLUMN IF NOT EXISTS max_weight NUMERIC;

CREATE INDEX IF NOT EXISTS idx_provinces_country_active ON provinces(country_id, active, name);
CREATE INDEX IF NOT EXISTS idx_service_zones_province_active ON service_zones(province_id, active, zone_number);
CREATE INDEX IF NOT EXISTS idx_service_zones_code ON service_zones(code);
CREATE INDEX IF NOT EXISTS idx_rates_matrix_weight_cap ON rates_matrix(organization_id, service_type, max_weight, active);
