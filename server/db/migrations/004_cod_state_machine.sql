ALTER TABLE cod_transactions ADD COLUMN IF NOT EXISTS received_branch_at TIMESTAMPTZ;
ALTER TABLE cod_transactions ADD COLUMN IF NOT EXISTS received_branch_by TEXT;
ALTER TABLE cod_transactions ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;
ALTER TABLE cod_transactions ADD COLUMN IF NOT EXISTS reconciled_by TEXT;

CREATE INDEX IF NOT EXISTS idx_cod_org_status_branch
  ON cod_transactions(organization_id, status, branch_id, created_at);

ALTER TABLE international_packages ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE international_packages ADD COLUMN IF NOT EXISTS prealert_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_intl_packages_org_client_status
  ON international_packages(organization_id, client_id, status, created_at);
