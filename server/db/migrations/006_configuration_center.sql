-- Tenant-scoped configuration center.
-- Secrets for PostgreSQL, Redis, TLS and external providers remain deployment
-- secrets; this table stores business policy and non-secret tenant settings.
CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS organization_setting_revisions (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  settings_json TEXT NOT NULL,
  changed_by TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, version),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_org_settings_updated
  ON organization_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_org_setting_revisions_org_created
  ON organization_setting_revisions(organization_id, created_at DESC);
