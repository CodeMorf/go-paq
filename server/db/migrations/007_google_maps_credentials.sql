-- Google Maps browser key stored separately from tenant business settings.
-- The value is encrypted with WEBHOOK_ENCRYPTION_KEY and never exposed by
-- the authenticated configuration response. The public map endpoint only
-- returns the browser key because Google Maps requires it client-side.
CREATE TABLE IF NOT EXISTS organization_integration_credentials (
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  key_hint TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, provider),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_integration_credentials_provider
  ON organization_integration_credentials(provider, updated_at DESC);
