CREATE TABLE IF NOT EXISTS route_dispatches (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  route_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'dispatching',
  provider TEXT NOT NULL DEFAULT 'witylogix',
  remote_route_id TEXT,
  remote_order_ids_json TEXT NOT NULL DEFAULT '[]',
  integration_json TEXT NOT NULL DEFAULT '{}',
  error TEXT,
  response_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, route_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_route_dispatches_org_status ON route_dispatches(organization_id, status, updated_at);
