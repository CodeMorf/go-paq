-- Unified job model for services that are not parcel-shaped.
-- A job can be assigned to the same route/stop/driver flow as a shipment.
CREATE TABLE IF NOT EXISTS logistics_jobs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  client_id TEXT,
  service_type TEXT NOT NULL,
  tracking_number TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  origin_json TEXT NOT NULL,
  destination_json TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  cost NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DOP',
  assigned_driver_id TEXT,
  assigned_route_id TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE moving_orders ADD COLUMN IF NOT EXISTS job_id TEXT;
ALTER TABLE heavy_cargo_orders ADD COLUMN IF NOT EXISTS job_id TEXT;
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS job_id TEXT;

CREATE TABLE IF NOT EXISTS logistics_job_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT NOT NULL,
  actor_type TEXT,
  actor_id TEXT,
  extra_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES logistics_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON logistics_jobs(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_org_driver_status ON logistics_jobs(organization_id, assigned_driver_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_org_route ON logistics_jobs(organization_id, assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_client ON logistics_jobs(organization_id, client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_events_org_job_created ON logistics_job_events(organization_id, job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_route_stops_job ON route_stops(job_id);

