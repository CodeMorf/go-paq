export function buildTrackingAuditMetadata(input: { shipmentId?: number; routeId?: number }, resultCount: number) {
  return { shipmentId: input.shipmentId, routeId: input.routeId, resultCount };
}

export function trackingResourceId(input: { shipmentId?: number; routeId?: number }) {
  return String(input.shipmentId ?? input.routeId ?? "organization");
}
