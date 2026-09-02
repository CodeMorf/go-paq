-- Driver identity photo onboarding and persistent printable card metadata.
-- The raw upload token is never persisted; only its SHA-256 hash is stored.

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_storage_key TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS card_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS card_issued_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS driver_photo_upload_tokens (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_photo_tokens_active
  ON driver_photo_upload_tokens(organization_id, driver_id, expires_at, used_at, revoked_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_org_card_number
  ON drivers(organization_id, card_number)
  WHERE card_number IS NOT NULL;
