-- Tenant-aware lookup used by COD ledger and shipment reconciliation.
-- This is an additive index only; no financial data is changed.
CREATE INDEX IF NOT EXISTS idx_cod_org_shipment
  ON cod_transactions(organization_id, shipment_id);
