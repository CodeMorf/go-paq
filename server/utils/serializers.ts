export function serializeShipment(row: any) {
  const origin = row.origin ?? safeJson(row.origin_json, {});
  const destination = row.destination ?? safeJson(row.destination_json, {});
  const pkg = row.package ?? safeJson(row.package_json, {});
  const pricing = row.pricing ?? safeJson(row.pricing_json, {});
  const pod = row.pod ?? safeJson(row.pod_json, null);
  return {
    ...row,
    trackingNumber: row.trackingNumber ?? row.tracking_number,
    externalTracking: row.externalTracking ?? row.external_tracking,
    serviceType: row.serviceType ?? row.service_type,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    shippingCost: Number(row.shippingCost ?? row.shipping_cost ?? 0),
    currency: row.currency || 'DOP',
    codAmount: Number(row.codAmount ?? row.cod_amount ?? 0),
    codCurrency: row.codCurrency ?? row.cod_currency ?? 'DOP',
    codCollected: Boolean(row.codCollected ?? row.cod_collected),
    driverId: row.driverId ?? row.assigned_driver_id,
    branchId: row.branchId ?? row.branch_id,
    clientId: row.clientId ?? row.client_id,
    origin,
    destination,
    package: pkg,
    pricing,
    pod
  };
}

export function serializeClient(row: any) {
  return {
    ...row,
    companyName: row.companyName ?? row.company_name ?? row.name,
    rncOrDni: row.rncOrDni ?? row.rnc_tax_id ?? '',
    clientType: row.clientType ?? (String(row.tier || '').toLowerCase().includes('enterprise') ? 'enterprise' : 'corporate'),
    status: row.active === 0 ? 'suspended' : 'active',
    lockerCode: row.lockerCode ?? row.locker_code ?? '',
    activeShipments: Number(row.activeShipments ?? row.active_shipments ?? 0),
    balanceDop: Number(row.balanceDop ?? row.balance ?? 0),
    creditLimitDop: Number(row.creditLimitDop ?? row.credit_limit ?? 0),
    codPendingPayoutDop: Number(row.codPendingPayoutDop ?? row.cod_pending_balance ?? 0),
    discountRatePercent: Number(row.discountRatePercent ?? 0),
    addressesCount: Number(row.addressesCount ?? 0),
    registeredDate: row.registeredDate ?? row.created_at ?? new Date().toISOString()
  };
}

export function serializeDriver(row: any) {
  return {
    ...row,
    email: row.email || row.user_email || '',
    avatar: row.avatar || '',
    rating: Number(row.rating ?? 5),
    status: row.status || 'available',
    assignedVehicleId: row.assignedVehicleId ?? '',
    vehicleName: row.vehicleName ?? row.vehicle_type ?? '',
    vehicleType: row.vehicleType ?? row.vehicle_type ?? 'moto',
    licensePlate: row.licensePlate ?? row.vehicle_plate ?? '',
    vehiclePlate: row.vehiclePlate ?? row.vehicle_plate ?? '',
    currentLat: Number(row.currentLat ?? row.current_lat ?? 0),
    currentLng: Number(row.currentLng ?? row.current_lng ?? 0),
    pendingDeliveriesCount: Number(row.pendingDeliveriesCount ?? 0),
    completedDeliveriesToday: Number(row.completedDeliveriesToday ?? 0),
    completedDeliveries: Number(row.completedDeliveries ?? 0),
    codCollectedToday: Number(row.codCollectedToday ?? 0),
    codPendingSettlement: Number(row.codPendingSettlement ?? 0),
    batteryLevel: Number(row.batteryLevel ?? row.battery ?? 100),
    isOnline: row.isOnline ?? row.status !== 'offline',
    branchId: row.branchId ?? row.branch_id ?? '',
    licenseNumber: row.licenseNumber ?? row.license_number ?? ''
  };
}

export function serializeBranch(row: any) {
  return {
    ...row,
    type: row.type ?? (row.is_hub ? 'hub' : 'sucursal'),
    country: row.country || 'DO',
    managerName: row.managerName ?? row.manager_name ?? '',
    capacityMaxPackages: Number(row.capacityMaxPackages ?? row.capacity_max_packages ?? 0),
    currentPackagesCount: Number(row.currentPackagesCount ?? row.current_packages_count ?? 0),
    activeDriversCount: Number(row.activeDriversCount ?? row.active_drivers_count ?? 0),
    cashInDrawer: Number(row.cashInDrawer ?? row.cash_in_drawer ?? 0),
    currency: row.currency || 'DOP',
    zones: row.zones || []
  };
}

export function serializeRoute(row: any, stops: any[] = []) {
  return {
    ...row,
    routeCode: row.routeCode ?? row.id,
    driverId: row.driverId ?? row.driver_id ?? '',
    driverName: row.driverName ?? row.driver_name ?? '',
    driverPhone: row.driverPhone ?? row.driver_phone ?? '',
    vehiclePlate: row.vehiclePlate ?? row.vehicle_plate ?? '',
    branchId: row.branchId ?? row.branch_id ?? '',
    branchName: row.branchName ?? row.branch_name ?? '',
    totalStops: Number(row.totalStops ?? row.total_stops ?? stops.length),
    completedStops: Number(row.completedStops ?? row.completed_stops ?? 0),
    totalDistanceKm: Number(row.totalDistanceKm ?? row.distance_km ?? 0),
    estimatedDurationHours: Number(row.estimatedDurationHours ?? (row.estimated_duration_min ? row.estimated_duration_min / 60 : 0)),
    totalCodAmount: Number(row.totalCodAmount ?? 0),
    collectedCodAmount: Number(row.collectedCodAmount ?? 0),
    stops: stops.map((s) => ({
      ...s,
      sequenceOrder: Number(s.sequenceOrder ?? s.sequence_order ?? 0),
      shipmentId: s.shipmentId ?? s.shipment_id ?? '',
      trackingNumber: s.trackingNumber ?? s.tracking_number ?? '',
      recipientName: s.recipientName ?? s.contact_name ?? '',
      phone: s.phone ?? s.contact_phone ?? '',
      address: typeof s.address === 'string' ? s.address : (s.address?.address || s.address?.street || ''),
      lat: Number(s.lat ?? s.address?.lat ?? 0),
      lng: Number(s.lng ?? s.address?.lng ?? 0),
      estimatedArrival: s.estimatedArrival ?? s.eta ?? '',
      packageSummary: s.packageSummary ?? '',
      completedAt: s.completedAt ?? s.completed_at
    }))
  };
}

export function serializeInternationalPackage(row: any) {
  const dimensions = safeJson(row.dimensions_json, {});
  return {
    ...row,
    lockerId: row.lockerId ?? row.locker_id ?? '',
    originCountry: row.originCountry ?? row.origin_country ?? 'US',
    storeName: row.storeName ?? row.store_name ?? '',
    externalTracking: row.externalTracking ?? row.external_tracking ?? '',
    internalTracking: row.internalTracking ?? row.internal_tracking ?? '',
    receivedDate: row.receivedDate ?? row.received_at ?? row.created_at ?? '',
    weightLbs: Number(row.weightLbs ?? row.weight_lbs ?? 0),
    weightKg: Number(row.weightKg ?? row.weight_kg ?? 0),
    dimensionsCm: row.dimensionsCm ?? dimensions,
    declaredValueUsd: Number(row.declaredValueUsd ?? row.declared_value_usd ?? 0),
    description: row.description || '',
    photoUrl: row.photoUrl ?? row.photo_url ?? '',
    isConsolidated: Boolean(row.isConsolidated ?? row.consolidation_id),
    consolidationId: row.consolidationId ?? row.consolidation_id
  };
}

function safeJson(value: any, fallback: any) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return fallback; }
}
