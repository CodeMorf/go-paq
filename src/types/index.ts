export type Currency = 'DOP' | 'USD' | 'EUR';
export type CountryCode = 'DO' | 'US' | 'ES' | 'IT';

export type UserRole = 
  | 'Owner'
  | 'Admin'
  | 'Operations'
  | 'Manager'
  | 'Dispatcher'
  | 'Warehouse'
  | 'Counter'
  | 'Finance'
  | 'Customer Service'
  | 'Viewer'
  | 'Client_Owner'
  | 'Client_Admin'
  | 'Client_Operations'
  | 'Client_Finance'
  | 'Client_Viewer'
  | 'Driver';

export type AppSection = 'super-admin' | 'portal' | 'sucursal' | 'driver' | 'docs';

export type ServiceType = 
  | 'local' 
  | 'nacional' 
  | 'internacional' 
  | 'mudanza' 
  | 'carga_pesada' 
  | 'express' 
  | 'programado';

export type ShipmentStatus = 
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'pickup_pending'
  | 'driver_en_route'
  | 'picked_up'
  | 'at_branch'
  | 'at_warehouse'
  | 'in_transit'
  | 'customs'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export interface Address {
  name: string;
  phone?: string;
  street?: string;
  address?: string;
  sector?: string;
  city: string;
  provinceState?: string;
  country: CountryCode;
  postalCode?: string;
  lat?: number;
  lng?: number;
  reference?: string;
  isFavorite?: boolean;
}

export interface PackageDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  volumetricWeightKg?: number;
  category: string;
  detectedType?: 'caja' | 'sobre' | 'maleta' | 'mueble' | 'electrodomestico' | 'pallet';
  confidence?: number;
  declaredValueUsd?: number;
  isFragile?: boolean;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  externalTracking?: string;
  serviceType: ServiceType;
  status: ShipmentStatus;
  createdAt: string;
  estimatedDelivery?: string;
  origin: Address;
  destination: Address;
  package: PackageDimensions;
  
  // Commercial & COD
  codAmount?: number;
  codCurrency?: Currency;
  codCollected?: boolean;
  shippingCost: number;
  currency: Currency;
  
  // Options
  isFragile?: boolean;
  isInsured?: boolean;
  insuranceValue?: number;
  requiresSignature?: boolean;
  photoDelivery?: boolean;
  documentReturn?: boolean;
  isExpress?: boolean;
  
  // Assignment
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  vehiclePlate?: string;
  branchId?: string;
  branchName?: string;
  warehouseSlot?: string;
  
  // International courier specific
  originCountry?: CountryCode;
  destinationCountry?: CountryCode;
  lockerId?: string;
  customsTax?: number;
  manifestId?: string;
  flightVoyageNumber?: string;
  
  // Timeline events
  events?: ShipmentEvent[];
  timeline?: ShipmentEvent[];
  
  // Proof of delivery
  pod?: ProofOfDelivery;
  failureReason?: string;
  failureNote?: string;
}

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  actor?: string;
  completed?: boolean;
}

export interface ProofOfDelivery {
  recipientName: string;
  recipientIdNumber?: string;
  recipientDni?: string;
  signatureImage?: string;
  signatureUrl?: string;
  photoUrl?: string;
  deliveredAt?: string;
  timestamp?: string;
  lat?: number;
  lng?: number;
  gpsCoordinates?: { lat: number; lng: number };
  codAmountCollected?: number;
  otpVerified?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  status: 'available' | 'busy' | 'offline';
  assignedVehicleId: string;
  vehicleName: string;
  vehicleType: 'moto' | 'van' | 'camion' | 'camioneta' | 'pesado';
  licensePlate: string;
  currentLat: number;
  currentLng: number;
  currentRouteId?: string;
  pendingDeliveriesCount: number;
  completedDeliveriesToday: number;
  codCollectedToday: number;
  codPendingSettlement: number;
  batteryLevel: number;
  isOnline: boolean;
  branchId: string;
  dniOrCedula?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  contractType?: 'empleado' | 'tercero_courier' | 'express_motorizado';
  emergencyContact?: string;
  joinedDate?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  type: 'moto' | 'van' | 'camion' | 'camioneta' | 'pesado';
  capacityKg: number;
  capacityM3: number;
  fuelType: 'diesel' | 'gasolina' | 'electrico' | 'gas';
  status: 'active' | 'maintenance' | 'inactive';
  currentDriverId?: string;
  currentDriverName?: string;
  mileageKm: number;
  lastMaintenanceDate: string;
  year?: number;
  vin?: string;
  branchId?: string;
  branchName?: string;
  insuranceCompany?: string;
  insuranceExpiry?: string;
  nextMaintenanceKm?: number;
  fuelLevelPercent?: number;
}

export type RouteType = 
  | 'last_mile' 
  | 'troncal_hub' 
  | 'express_moto' 
  | 'recoleccion_b2b' 
  | 'interprovincial' 
  | 'carga_pesada_nocturna';

export type DispatchWave = 
  | 'wave_morning_0800' 
  | 'wave_midday_1200' 
  | 'wave_afternoon_1500' 
  | 'wave_night_2100';

export interface RouteStop {
  id: string;
  sequenceOrder: number;
  shipmentId: string;
  trackingNumber: string;
  type: 'pickup' | 'delivery';
  recipientName: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  estimatedArrival: string;
  status: 'pending' | 'arrived' | 'completed' | 'failed' | 'skipped';
  codAmount?: number;
  packageSummary: string;
  instructions?: string;
  completedAt?: string;
  weightKg?: number;
  contactRole?: 'remitente' | 'destinatario';
}

export interface DeliveryRoute {
  id: string;
  routeCode: string;
  name?: string;
  routeType?: RouteType;
  dispatchWave?: DispatchWave;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  driverAvatar?: string;
  vehiclePlate: string;
  vehicleType?: 'moto' | 'van' | 'camion' | 'camioneta' | 'pesado';
  maxWeightKg?: number;
  currentWeightKg?: number;
  maxStopsCapacity?: number;
  branchId: string;
  branchName: string;
  originHub?: string;
  destinationZone?: string;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  totalStops: number;
  completedStops: number;
  totalDistanceKm: number;
  estimatedDurationHours: number;
  totalCodAmount: number;
  collectedCodAmount: number;
  startedAt?: string;
  completedAt?: string;
  stops: RouteStop[];
  manifestNumber?: string;
  color?: string;
  notes?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  type: 'hub' | 'sucursal' | 'warehouse_intl';
  country: CountryCode;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  capacityMaxPackages: number;
  currentPackagesCount: number;
  activeDriversCount: number;
  cashInDrawer: number;
  currency: Currency;
  zones: WarehouseZone[];
}

export interface WarehouseZone {
  id: string;
  code: string;
  name: string;
  totalSlots: number;
  occupiedSlots: number;
  type: 'local' | 'nacional' | 'internacional' | 'fragil' | 'refrigerado';
}

export interface InternationalLocker {
  id: string;
  city: string;
  country: CountryCode;
  lockerCode: string;
  addressLine1: string;
  addressLine2: string;
  cityStateZip: string;
  countryFullName: string;
  flag: string;
  phone: string;
}

export interface InternationalPackage {
  id: string;
  lockerId: string;
  originCountry: CountryCode;
  storeName: string;
  externalTracking: string;
  internalTracking: string;
  receivedDate: string;
  weightLbs: number;
  weightKg: number;
  dimensionsCm: { l: number; w: number; h: number };
  declaredValueUsd: number;
  description: string;
  photoUrl: string;
  status: 
    | 'waiting_arrival' 
    | 'received' 
    | 'processing' 
    | 'ready_to_consolidate' 
    | 'consolidated' 
    | 'international_transit' 
    | 'customs_rd' 
    | 'at_rd_branch' 
    | 'out_for_delivery' 
    | 'delivered';
  isConsolidated?: boolean;
  consolidationId?: string;
}

export interface ClientBranchAddress {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  sector: string;
  city: string;
  isPrimary?: boolean;
}

export interface ClientInvoice {
  id: string;
  ncf: string;
  issueDate: string;
  dueDate: string;
  amountDop: number;
  paidDop: number;
  status: 'paid' | 'pending' | 'overdue';
  shipmentsCount: number;
  pdfUrl?: string;
}

export interface ClientCodPayout {
  id: string;
  date: string;
  amountDop: number;
  referenceNumber: string;
  bankName: string;
  status: 'processed' | 'in_transit' | 'scheduled';
  shipmentsCount: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  companyName?: string;
  rncOrDni?: string;
  clientType: 'individual' | 'ecommerce' | 'corporate' | 'enterprise';
  status?: 'active' | 'suspended' | 'pending_approval' | 'overdue';
  email: string;
  phone: string;
  lockerCode: string;
  accountExecutive?: string;
  activeShipments: number;
  balanceDop: number;
  creditLimitDop: number;
  creditUsedDop?: number;
  creditDays?: number;
  ncfType?: 'B01' | 'B02' | 'B14' | 'B15';
  codPendingPayoutDop: number;
  discountRatePercent: number;
  addressesCount: number;
  registeredDate: string;
  bankInfo?: {
    bankName: string;
    accountType: 'corriente' | 'ahorros';
    accountNumber: string;
    holderName: string;
    rnc: string;
  };
  apiKey?: {
    liveKey: string;
    testKey: string;
    createdAt: string;
    lastUsed?: string;
    isRevoked?: boolean;
  };
  webhookUrl?: string;
  customRates?: {
    baseUrbanDiscount: number;
    baseInterprovincialDiscount: number;
    freePickups: boolean;
    customPerKgDop?: number;
  };
  billingAddress?: {
    street: string;
    sector: string;
    city: string;
    province: string;
  };
  branchesList?: ClientBranchAddress[];
  invoices?: ClientInvoice[];
  codPayoutsHistory?: ClientCodPayout[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  branchName?: string;
  branchId?: string;
  status: 'active' | 'invited' | 'suspended';
  lastActive: string;
  phone?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'operations' | 'cod' | 'shipment' | 'system' | 'international';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  entityId?: string;
}

export interface CodTransaction {
  id: string;
  shipmentTracking: string;
  clientName: string;
  driverName: string;
  branchName: string;
  amount: number;
  currency: Currency;
  collectedAt: string;
  settledWithDriver: boolean;
  settledWithClient: boolean;
  status: 'collected_by_driver' | 'deposited_in_branch' | 'reconciled' | 'transferred_to_client' | 'disputed';
}

export interface MovingItem {
  id: string;
  name: string;
  category: 'muebles' | 'electrodomesticos' | 'cajas' | 'fragil' | 'otros';
  quantity: number;
  approxVolumeM3: number;
  weightKg: number;
  icon: string;
}

export interface HeavyCargoRequest {
  id: string;
  cargoType: 'pallets' | 'maquinaria' | 'materiales' | 'equipos_industriales' | 'vehiculos';
  description: string;
  weightTons: number;
  palletsCount?: number;
  dimensionsM: { l: number; w: number; h: number };
  requiresCrane: boolean;
  requiresFlatbed: boolean;
  origin: string;
  destination: string;
  scheduledDate: string;
  status: 'quote_requested' | 'approved' | 'in_transit' | 'delivered';
  estimatedCost: number;
}

export interface DangerousZone {
  id: string;
  name: string;
  sector: string;
  city: string;
  province: string;
  country: CountryCode;
  riskLevel: 'medio' | 'alto' | 'critico';
  isSuspended: boolean;
  blockCod: boolean;
  forceBranchPickup: boolean;
  timeRestrictionStart?: string;
  timeRestrictionEnd?: string;
  assignedNearestBranchId: string;
  assignedNearestBranchName: string;
  notes: string;
  center: { lat: number; lng: number };
  affectedShipmentsCount: number;
  lastIncidentReport?: string;
}

export interface CoverageZoneRate {
  id: string;
  code: string;
  name: string;
  country: CountryCode;
  provinces: string[];
  type: 'urbana' | 'suburbana' | 'interprovincial' | 'remota' | 'internacional';
  baseRateDop: number;
  perKgRateDop: number;
  baseRateUsd?: number;
  perLbRateUsd?: number;
  fuelSurchargePercent: number;
  volumetricDivisor: number;
  estimatedDeliveryTime: string;
  requiresSpecialTransport?: boolean;
  isActive: boolean;
}

export interface BulkScanItem {
  id: string;
  trackingNumber: string;
  recipientName: string;
  destinationCity: string;
  weightKg: number;
  serviceType: ServiceType;
  status: ShipmentStatus;
  scannedAt: string;
  scanOperation: 'inbound_branch' | 'outbound_driver' | 'rack_placement' | 'manifest_check' | 'direct_delivery';
  driverId?: string;
  rackLocation?: string;
  codAmount?: number;
  isDangerousZone?: boolean;
  isFragile?: boolean;
}

// GoPaq Omnichannel & Messaging AI Integration Types
export type MessagingChannelType = 'whatsapp' | 'instagram' | 'facebook' | 'whatsapp_call' | 'web_chat' | 'sms';

export interface SocialOAuthConnection {
  id: string;
  provider: 'whatsapp' | 'instagram' | 'facebook' | 'zernio' | 'pusher';
  name: string;
  connected: boolean;
  status: 'active' | 'disconnected' | 'token_expired' | 'error';
  accountIdentifier: string;
  connectedAt: string;
  tokenExpiresIn?: string;
  scopes: string[];
  webhookStatus: 'verified' | 'listening' | 'pending';
  credentials: {
    appId?: string;
    accountId?: string;
    accessToken?: string;
    secretKey?: string;
    cluster?: string;
    proxyNumber?: string;
    callbackUrl?: string;
  };
}

export interface ZernioMessage {
  id: string;
  channel: MessagingChannelType;
  senderRole: 'customer' | 'driver' | 'ai_agent' | 'human_agent' | 'system';
  senderName: string;
  senderMaskedId: string; // e.g. "Cliente (Destinatario • NX-8924-DO)" or "Driver Carlos (GoPaq Relay)"
  recipientMaskedId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  trackingNumber?: string;
  shipmentId?: string;
  audioDurationSeconds?: number;
  audioTranscript?: string;
  isAiGenerated?: boolean;
  sentiment?: 'positive' | 'neutral' | 'urgent' | 'frustrated';
}

export interface ZernioCallLog {
  id: string;
  channel: 'whatsapp_call';
  callType: 'ai_delivery_confirmation' | 'driver_customer_proxy' | 'customer_support';
  status: 'completed' | 'in_progress' | 'missed' | 'failed' | 'scheduled';
  callerMasked: string;
  calleeMasked: string;
  trackingNumber: string;
  durationSeconds: number;
  timestamp: string;
  aiSummary: string;
  transcript: string;
  recordingUrl?: string;
  customerConfirmedDelivery?: boolean;
}

export interface ZernioWebhookConfig {
  webhookUrl: string;
  secretToken: string;
  cliConnected: boolean;
  cliVersion: string;
  activeEvents: string[];
  lastPingTimestamp: string;
  whatsappCloudConfig: {
    phoneNumberId: string;
    businessAccountId: string;
    businessProxyNumber: string;
    verifiedStatus: 'verified' | 'pending';
  };
  metaFacebookConfig: {
    pageId: string;
    pageName: string;
    appSecretSet: boolean;
  };
  instagramConfig?: {
    accountId: string;
    username: string;
    verifiedStatus: 'verified' | 'pending';
  };
  aiEngineConfig: {
    model: string;
    autoReplyEnabled: boolean;
    voiceAgentEnabled: boolean;
    confidenceThreshold: number;
    escalateToHumanOnUrgent: boolean;
    businessKnowledgePrompt: string;
  };
}

export interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  encrypted: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastPingMs: number;
  activeSocketsCount: number;
  channelsSubscribed: string[];
}

export interface PusherRealtimeEvent {
  id: string;
  channel: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface MaskedContactInfo {
  customerRole: 'remitente' | 'destinatario';
  customerDisplayName: string;
  maskedPhone: string;
  businessProxyWhatsapp: string;
  trackingNumber: string;
  shipmentTitle: string;
  destinationAddress: string;
  deliveryInstructions?: string;
}

