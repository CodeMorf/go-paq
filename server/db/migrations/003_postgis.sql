CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE branches ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_location geography(Point, 4326);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_point geography(Point, 4326);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_point geography(Point, 4326);
ALTER TABLE dangerous_zones ADD COLUMN IF NOT EXISTS boundary geometry(Polygon, 4326);

CREATE INDEX IF NOT EXISTS idx_branches_location ON branches USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_drivers_current_location ON drivers USING GIST (current_location);
CREATE INDEX IF NOT EXISTS idx_shipments_origin_point ON shipments USING GIST (origin_point);
CREATE INDEX IF NOT EXISTS idx_shipments_destination_point ON shipments USING GIST (destination_point);
CREATE INDEX IF NOT EXISTS idx_dangerous_zones_boundary ON dangerous_zones USING GIST (boundary);
