-- Operational indexes for the query paths used by tracking, client portals,
-- branch receiving and driver route manifests. No business data is changed.
CREATE INDEX IF NOT EXISTS idx_shipments_org_client_status_created
  ON shipments(organization_id, client_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_shipments_org_branch_status_updated
  ON shipments(organization_id, branch_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_created
  ON shipment_events(shipment_id, created_at);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_status_sequence
  ON route_stops(route_id, status, sequence_order);

CREATE INDEX IF NOT EXISTS idx_route_stops_shipment
  ON route_stops(shipment_id);
