import { 
  Shipment, 
  Driver, 
  Vehicle, 
  Branch, 
  InternationalLocker, 
  InternationalPackage, 
  ClientProfile, 
  DeliveryRoute, 
  TeamMember, 
  NotificationItem, 
  CodTransaction,
  MovingItem,
  HeavyCargoRequest,
  DangerousZone,
  CoverageZoneRate,
  ZernioWebhookConfig,
  PusherConfig,
  ZernioMessage,
  ZernioCallLog,
  SocialOAuthConnection
} from '../types';

export const MOCK_BRANCHES: Branch[] = [
  {
    id: 'br-hq-sd',
    name: 'Hub Central Santo Domingo',
    code: 'HUB-SDQ-01',
    type: 'hub',
    country: 'DO',
    city: 'Santo Domingo',
    address: 'Av. John F. Kennedy #45, Ensanche La Fe',
    phone: '+1 (809) 555-0100',
    managerName: 'Ing. Alejandro Tavares',
    capacityMaxPackages: 5000,
    currentPackagesCount: 3840,
    activeDriversCount: 28,
    cashInDrawer: 485900,
    currency: 'DOP',
    zones: [
      { id: 'z-a', code: 'A', name: 'Zona A - Metropolitano Rápido', totalSlots: 1200, occupiedSlots: 980, type: 'local' },
      { id: 'z-b', code: 'B', name: 'Zona B - Despacho Cibao & Sur', totalSlots: 1500, occupiedSlots: 1120, type: 'nacional' },
      { id: 'z-int', code: 'INT-01', name: 'Zona Internacional Aduanas', totalSlots: 2000, occupiedSlots: 1580, type: 'internacional' },
      { id: 'z-frg', code: 'FRG', name: 'Jaula de Alta Seguridad / Frágil', totalSlots: 300, occupiedSlots: 160, type: 'fragil' }
    ]
  },
  {
    id: 'br-piantini',
    name: 'Sucursal Piantini & Naco',
    code: 'SUC-SDQ-02',
    type: 'sucursal',
    country: 'DO',
    city: 'Santo Domingo',
    address: 'Av. Winston Churchill esq. Gustavo Mejía Ricart',
    phone: '+1 (809) 555-0102',
    managerName: 'Lic. Laura Benítez',
    capacityMaxPackages: 1200,
    currentPackagesCount: 780,
    activeDriversCount: 8,
    cashInDrawer: 142000,
    currency: 'DOP',
    zones: [
      { id: 'z-p1', code: 'P-01', name: 'Mostrador Express Pickup', totalSlots: 500, occupiedSlots: 320, type: 'local' },
      { id: 'z-p2', code: 'P-02', name: 'Casilleros & Retail', totalSlots: 700, occupiedSlots: 460, type: 'internacional' }
    ]
  },
  {
    id: 'br-sti',
    name: 'Hub Cibao Santiago',
    code: 'HUB-STI-01',
    type: 'hub',
    country: 'DO',
    city: 'Santiago de los Caballeros',
    address: 'Autopista Duarte Km 2.5, Los Cerros de Gurabo',
    phone: '+1 (809) 555-0105',
    managerName: 'Marcos Peralta',
    capacityMaxPackages: 3500,
    currentPackagesCount: 2240,
    activeDriversCount: 16,
    cashInDrawer: 295000,
    currency: 'DOP',
    zones: [
      { id: 'z-sti-1', code: 'C-01', name: 'Cibao Central & Costa Norte', totalSlots: 2000, occupiedSlots: 1420, type: 'nacional' },
      { id: 'z-sti-2', code: 'C-02', name: 'Última Milla Santiago Metropolitano', totalSlots: 1500, occupiedSlots: 820, type: 'local' }
    ]
  },
  {
    id: 'br-puj',
    name: 'Sucursal Bávaro - Punta Cana',
    code: 'SUC-PUJ-01',
    type: 'sucursal',
    country: 'DO',
    city: 'Punta Cana',
    address: 'Blvd. Turístico del Este, Plaza San Juan Shopping Center',
    phone: '+1 (809) 555-0108',
    managerName: 'Daniela Santana',
    capacityMaxPackages: 900,
    currentPackagesCount: 510,
    activeDriversCount: 6,
    cashInDrawer: 88400,
    currency: 'DOP',
    zones: [
      { id: 'z-puj-1', code: 'E-01', name: 'Zona Este Hotelera & Residencial', totalSlots: 900, occupiedSlots: 510, type: 'local' }
    ]
  },
  {
    id: 'br-wh-mia',
    name: 'Warehouse Miami Logistics Hub',
    code: 'WH-MIA-01',
    type: 'warehouse_intl',
    country: 'US',
    city: 'Miami, FL',
    address: '8400 NW 25th St, Suite 100, Doral, FL 33198',
    phone: '+1 (305) 555-0199',
    managerName: 'David Miller',
    capacityMaxPackages: 25000,
    currentPackagesCount: 14200,
    activeDriversCount: 4,
    cashInDrawer: 12500,
    currency: 'USD',
    zones: [
      { id: 'z-mia-in', code: 'MIA-IN', name: 'Receiving Dock A & B', totalSlots: 10000, occupiedSlots: 6400, type: 'internacional' },
      { id: 'z-mia-c', code: 'MIA-CON', name: 'Consolidation & Repack Staging', totalSlots: 8000, occupiedSlots: 4900, type: 'internacional' },
      { id: 'z-mia-out', code: 'MIA-AIR', name: 'Air Freight Palletizing Area', totalSlots: 7000, occupiedSlots: 2900, type: 'internacional' }
    ]
  },
  {
    id: 'br-wh-mad',
    name: 'Hub Madrid Barajas Cargo',
    code: 'WH-MAD-01',
    type: 'warehouse_intl',
    country: 'ES',
    city: 'Madrid',
    address: 'Calle Campezo 1, Polígono Las Mercedes, 28022 Madrid',
    phone: '+34 91 555 0144',
    managerName: 'Javier Rodrigo',
    capacityMaxPackages: 12000,
    currentPackagesCount: 6800,
    activeDriversCount: 2,
    cashInDrawer: 8400,
    currency: 'EUR',
    zones: [
      { id: 'z-mad-1', code: 'MAD-01', name: 'Almacén Europa Consolidado', totalSlots: 12000, occupiedSlots: 6800, type: 'internacional' }
    ]
  }
];

export const MOCK_LOCKERS: InternationalLocker[] = [
  {
    id: 'lkr-us',
    city: 'Miami, Florida',
    country: 'US',
    lockerCode: 'GP-10482',
    addressLine1: '8400 NW 25th St, Ste 100',
    addressLine2: 'Suite GP-10482 (GoPaq Cargo)',
    cityStateZip: 'Doral, FL 33198',
    countryFullName: 'Estados Unidos',
    flag: '🇺🇸',
    phone: '+1 (305) 555-0199'
  },
  {
    id: 'lkr-es',
    city: 'Madrid, España',
    country: 'ES',
    lockerCode: 'GP-10482',
    addressLine1: 'Calle Campezo 1, Nave 4',
    addressLine2: 'Cod: GP-10482 / GoPaq',
    cityStateZip: '28022 Madrid',
    countryFullName: 'España',
    flag: '🇪🇸',
    phone: '+34 91 555 0144'
  },
  {
    id: 'lkr-it',
    city: 'Milano, Italia',
    country: 'IT',
    lockerCode: 'GP-10482',
    addressLine1: 'Via dell’Artigianato 12',
    addressLine2: 'Box GP-10482 (GoPaq Cargo)',
    cityStateZip: '20090 Segrate (MI)',
    countryFullName: 'Italia',
    flag: '🇮🇹',
    phone: '+39 02 555 0188'
  }
];

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'drv-01',
    name: 'Carlos Méndez',
    phone: '+1 (829) 555-0121',
    email: 'carlos.mendez@gopaq.com.do',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.95,
    status: 'busy',
    assignedVehicleId: 'veh-01',
    vehicleName: 'Toyota HiAce Cargo Extended 2024',
    vehicleType: 'van',
    licensePlate: 'L482910',
    currentLat: 18.4725,
    currentLng: -69.9385,
    currentRouteId: 'rt-8831',
    pendingDeliveriesCount: 7,
    completedDeliveriesToday: 11,
    codCollectedToday: 18450,
    codPendingSettlement: 18450,
    batteryLevel: 88,
    isOnline: true,
    branchId: 'br-hq-sd',
    dniOrCedula: '001-1829401-2',
    licenseNumber: 'LIC-RD-882190',
    licenseCategory: 'Categoría 3 (Vehículos Livianos y Vans Comerciales)',
    licenseExpiry: '2028-11-20',
    contractType: 'empleado',
    emergencyContact: 'María Méndez (Esposa) - +1 (829) 555-9011',
    joinedDate: '2023-04-12'
  },
  {
    id: 'drv-02',
    name: 'Rafael Almonte',
    phone: '+1 (829) 555-0122',
    email: 'rafael.almonte@gopaq.com.do',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.88,
    status: 'busy',
    assignedVehicleId: 'veh-02',
    vehicleName: 'Honda CB190R Express Delivery',
    vehicleType: 'moto',
    licensePlate: 'K981245',
    currentLat: 18.4862,
    currentLng: -69.9412,
    currentRouteId: 'rt-8834',
    pendingDeliveriesCount: 4,
    completedDeliveriesToday: 19,
    codCollectedToday: 9800,
    codPendingSettlement: 9800,
    batteryLevel: 72,
    isOnline: true,
    branchId: 'br-piantini',
    dniOrCedula: '402-9981204-5',
    licenseNumber: 'LIC-RD-440192',
    licenseCategory: 'Categoría 2 (Motocicletas & Express)',
    licenseExpiry: '2027-06-15',
    contractType: 'express_motorizado',
    emergencyContact: 'Carmen Almonte (Madre) - +1 (809) 555-3312',
    joinedDate: '2024-01-08'
  },
  {
    id: 'drv-03',
    name: 'Esteban Rosario',
    phone: '+1 (809) 555-0123',
    email: 'esteban.rosario@gopaq.com.do',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.92,
    status: 'available',
    assignedVehicleId: 'veh-03',
    vehicleName: 'Isuzu NPR 4.5 Ton Cab-Over',
    vehicleType: 'camion',
    licensePlate: 'L339102',
    currentLat: 19.4517,
    currentLng: -70.6970,
    pendingDeliveriesCount: 0,
    completedDeliveriesToday: 8,
    codCollectedToday: 34200,
    codPendingSettlement: 0,
    batteryLevel: 95,
    isOnline: true,
    branchId: 'br-sti',
    dniOrCedula: '031-0491823-1',
    licenseNumber: 'LIC-RD-910245',
    licenseCategory: 'Categoría 4 (Camiones Medios y Carga Pesada)',
    licenseExpiry: '2029-03-30',
    contractType: 'empleado',
    emergencyContact: 'Yomaira Rosario - +1 (809) 555-7821',
    joinedDate: '2022-09-15'
  },
  {
    id: 'drv-04',
    name: 'Miguel Ángel Cruz',
    phone: '+1 (849) 555-0124',
    email: 'miguel.cruz@gopaq.com.do',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 4.91,
    status: 'busy',
    assignedVehicleId: 'veh-04',
    vehicleName: 'Nissan Frontier PRO-4X Heavy Pick-up',
    vehicleType: 'camioneta',
    licensePlate: 'L198234',
    currentLat: 18.5601,
    currentLng: -68.3725,
    currentRouteId: 'rt-8839',
    pendingDeliveriesCount: 3,
    completedDeliveriesToday: 14,
    codCollectedToday: 15600,
    codPendingSettlement: 15600,
    batteryLevel: 64,
    isOnline: true,
    branchId: 'br-puj',
    dniOrCedula: '023-0091823-7',
    licenseNumber: 'LIC-RD-112049',
    licenseCategory: 'Categoría 3 (Pickups & Vehículos Todo Terreno)',
    licenseExpiry: '2028-09-10',
    contractType: 'tercero_courier',
    emergencyContact: 'Luis Cruz (Hermano) - +1 (849) 555-4920',
    joinedDate: '2024-06-01'
  },
  {
    id: 'drv-05',
    name: 'Kelvin De los Santos',
    phone: '+1 (829) 555-0125',
    email: 'kelvin.delossantos@gopaq.com.do',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    rating: 4.97,
    status: 'available',
    assignedVehicleId: 'veh-05',
    vehicleName: 'Freightliner M2 106 Heavy Truck 24ft',
    vehicleType: 'pesado',
    licensePlate: 'C-99238',
    currentLat: 18.5120,
    currentLng: -69.9800,
    pendingDeliveriesCount: 0,
    completedDeliveriesToday: 4,
    codCollectedToday: 0,
    codPendingSettlement: 0,
    batteryLevel: 100,
    isOnline: true,
    branchId: 'br-hq-sd',
    dniOrCedula: '001-0849201-9',
    licenseNumber: 'LIC-RD-771920',
    licenseCategory: 'Categoría 4 Especial (Articulados y Carga Pesada)',
    licenseExpiry: '2029-12-05',
    contractType: 'empleado',
    emergencyContact: 'Juana De los Santos - +1 (829) 555-1100',
    joinedDate: '2021-11-20'
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'veh-01',
    plate: 'L482910',
    model: 'HiAce Cargo Extended',
    brand: 'Toyota',
    type: 'van',
    capacityKg: 1450,
    capacityM3: 9.8,
    fuelType: 'diesel',
    status: 'active',
    currentDriverId: 'drv-01',
    currentDriverName: 'Carlos Méndez',
    mileageKm: 42300,
    lastMaintenanceDate: '2026-08-10',
    year: 2024,
    vin: 'JT3HN82P9R0194821',
    branchId: 'br-hq-sd',
    branchName: 'Hub Central Santo Domingo',
    insuranceCompany: 'Seguros Universal',
    insuranceExpiry: '2027-04-30',
    nextMaintenanceKm: 47000,
    fuelLevelPercent: 78
  },
  {
    id: 'veh-02',
    plate: 'K981245',
    model: 'CB190R Cargo Box 150L',
    brand: 'Honda',
    type: 'moto',
    capacityKg: 45,
    capacityM3: 0.25,
    fuelType: 'gasolina',
    status: 'active',
    currentDriverId: 'drv-02',
    currentDriverName: 'Rafael Almonte',
    mileageKm: 18450,
    lastMaintenanceDate: '2026-08-18',
    year: 2025,
    vin: '1HD1498102948190',
    branchId: 'br-piantini',
    branchName: 'Sucursal Piantini & Naco',
    insuranceCompany: 'Seguros Reservas',
    insuranceExpiry: '2027-02-15',
    nextMaintenanceKm: 21000,
    fuelLevelPercent: 65
  },
  {
    id: 'veh-03',
    plate: 'L339102',
    model: 'NPR HD 4.5 Ton Furgón Cerrado',
    brand: 'Isuzu',
    type: 'camion',
    capacityKg: 4500,
    capacityM3: 28.5,
    fuelType: 'diesel',
    status: 'active',
    currentDriverId: 'drv-03',
    currentDriverName: 'Esteban Rosario',
    mileageKm: 89100,
    lastMaintenanceDate: '2026-07-28',
    year: 2023,
    vin: '4UZAA2FC8PC192841',
    branchId: 'br-sti',
    branchName: 'Hub Cibao Santiago',
    insuranceCompany: 'Mapfre BHD Seguros',
    insuranceExpiry: '2027-08-20',
    nextMaintenanceKm: 95000,
    fuelLevelPercent: 88
  },
  {
    id: 'veh-04',
    plate: 'L198234',
    model: 'Frontier PRO-4X 4WD',
    brand: 'Nissan',
    type: 'camioneta',
    capacityKg: 1100,
    capacityM3: 3.2,
    fuelType: 'diesel',
    status: 'active',
    currentDriverId: 'drv-04',
    currentDriverName: 'Miguel Ángel Cruz',
    mileageKm: 51200,
    lastMaintenanceDate: '2026-08-04',
    year: 2024,
    vin: '1N6AD0EV9RN091823',
    branchId: 'br-puj',
    branchName: 'Sucursal Bávaro - Punta Cana',
    insuranceCompany: 'Seguros Sura',
    insuranceExpiry: '2027-05-10',
    nextMaintenanceKm: 56000,
    fuelLevelPercent: 52
  },
  {
    id: 'veh-05',
    plate: 'C-99238',
    model: 'M2 106 Heavy Cargo 24ft',
    brand: 'Freightliner',
    type: 'pesado',
    capacityKg: 12000,
    capacityM3: 46.0,
    fuelType: 'diesel',
    status: 'active',
    currentDriverId: 'drv-05',
    currentDriverName: 'Kelvin De los Santos',
    mileageKm: 134000,
    lastMaintenanceDate: '2026-08-01',
    year: 2022,
    vin: '1FVACWDT8NH109284',
    branchId: 'br-hq-sd',
    branchName: 'Hub Central Santo Domingo',
    insuranceCompany: 'Seguros Universal Carga',
    insuranceExpiry: '2027-11-30',
    nextMaintenanceKm: 140000,
    fuelLevelPercent: 92
  },
  {
    id: 'veh-06',
    plate: 'L990182',
    model: 'E-Transit Custom Eléctrica 100%',
    brand: 'Ford',
    type: 'van',
    capacityKg: 1250,
    capacityM3: 8.5,
    fuelType: 'electrico',
    status: 'active',
    mileageKm: 12400,
    lastMaintenanceDate: '2026-08-20',
    year: 2025,
    vin: '1FTBR1Y89PK091824',
    branchId: 'br-hq-sd',
    branchName: 'Hub Central Santo Domingo',
    insuranceCompany: 'Seguros Reservas',
    insuranceExpiry: '2027-09-15',
    nextMaintenanceKm: 25000,
    fuelLevelPercent: 96
  }
];

export const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-01',
    trackingNumber: 'NX-8924-DO',
    serviceType: 'local',
    status: 'out_for_delivery',
    createdAt: '2026-08-28T08:15:00Z',
    estimatedDelivery: '2026-08-28T17:30:00Z',
    origin: {
      name: 'Farmacia Los Hidalgos - Distribución',
      phone: '+1 (809) 541-2020',
      street: 'Av. Abraham Lincoln #1009',
      sector: 'Piantini',
      city: 'Santo Domingo',
      provinceState: 'Distrito Nacional',
      country: 'DO',
      lat: 18.4715,
      lng: -69.9372
    },
    destination: {
      name: 'Dra. María Elena Rodríguez',
      phone: '+1 (829) 555-0819',
      street: 'Av. Winston Churchill #1099, Torre Empresarial Acrópolis, Piso 14',
      sector: 'Piantini',
      city: 'Santo Domingo',
      provinceState: 'Distrito Nacional',
      country: 'DO',
      lat: 18.4735,
      lng: -69.9405,
      reference: 'Frente al ascensor principal'
    },
    package: {
      lengthCm: 32,
      widthCm: 24,
      heightCm: 18,
      weightKg: 2.4,
      volumetricWeightKg: 2.76,
      category: 'Medicamentos y Equipos Médicos',
      detectedType: 'caja',
      confidence: 0.98
    },
    shippingCost: 350,
    currency: 'DOP',
    codAmount: 2850,
    codCurrency: 'DOP',
    codCollected: false,
    isFragile: true,
    isInsured: true,
    insuranceValue: 12000,
    requiresSignature: true,
    photoDelivery: true,
    isExpress: true,
    driverId: 'drv-01',
    driverName: 'Carlos Méndez',
    driverPhone: '+1 (829) 555-0121',
    driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'L482910',
    branchId: 'br-hq-sd',
    branchName: 'Hub Central Santo Domingo',
    warehouseSlot: 'A-04-12',
    events: [
      { id: 'ev-1', status: 'confirmed', title: 'Solicitud Creada', description: 'Envío registrado por cliente API e-commerce', timestamp: '08:15 AM', location: 'Santo Domingo', completed: true },
      { id: 'ev-2', status: 'assigned', title: 'Pickup Asignado', description: 'Asignado a conductor Carlos Méndez en Van L482910', timestamp: '08:45 AM', location: 'Hub Central', completed: true },
      { id: 'ev-3', status: 'picked_up', title: 'Paquete Recogido', description: 'Paquete recibido en Farmacia Los Hidalgos', timestamp: '09:30 AM', location: 'Piantini', completed: true },
      { id: 'ev-4', status: 'at_branch', title: 'Llegó a Sucursal', description: 'Ingreso al HUB Central para clasificación y pesaje óptico', timestamp: '10:15 AM', location: 'Hub Central Santo Domingo', completed: true },
      { id: 'ev-5', status: 'out_for_delivery', title: 'En Ruta de Entrega', description: 'Driver Carlos Méndez está a 8 minutos de su destino', timestamp: '02:30 PM', location: 'Av. Winston Churchill', completed: true },
      { id: 'ev-6', status: 'delivered', title: 'Entregado & Cobrado', description: 'Entrega final y cobro COD contra entrega', timestamp: 'Estimado 05:30 PM', location: 'Destino', completed: false }
    ]
  },
  {
    id: 'shp-02',
    trackingNumber: 'MIA-RD-10492',
    externalTracking: 'TBA3091823901',
    serviceType: 'internacional',
    status: 'in_transit',
    createdAt: '2026-08-25T14:20:00Z',
    estimatedDelivery: '2026-08-29T12:00:00Z',
    originCountry: 'US',
    destinationCountry: 'DO',
    lockerId: 'JM-10482',
    manifestId: 'MNF-AA-9921',
    flightVoyageNumber: 'AA 1039 MIA->SDQ',
    origin: {
      name: 'Amazon Fulfillment Center Doral',
      phone: '+1 (305) 555-0199',
      street: '8400 NW 25th St',
      city: 'Doral',
      provinceState: 'FL',
      country: 'US',
      lat: 25.7959,
      lng: -80.3344
    },
    destination: {
      name: 'Ing. José Martínez (JM-10482)',
      phone: '+1 (809) 555-4433',
      street: 'Calle Francisco Prats Ramírez #402, Apt 5B',
      sector: 'Evaristo Morales',
      city: 'Santo Domingo',
      provinceState: 'Distrito Nacional',
      country: 'DO',
      lat: 18.4760,
      lng: -69.9480
    },
    package: {
      lengthCm: 45,
      widthCm: 35,
      heightCm: 22,
      weightKg: 4.8,
      volumetricWeightKg: 6.93,
      category: 'Electrónica - Apple MacBook Air M3 & Accesorios',
      detectedType: 'caja',
      confidence: 0.99
    },
    shippingCost: 1420,
    currency: 'DOP',
    customsTax: 0,
    isFragile: true,
    isInsured: true,
    insuranceValue: 65000,
    branchId: 'br-wh-mia',
    branchName: 'Warehouse Miami Logistics Hub',
    events: [
      { id: 'ev-m1', status: 'confirmed', title: 'Paquete Recibido en Miami', description: 'Entregado por Amazon Logistics en Suite JM-10482', timestamp: '25 Ago 02:20 PM', location: 'Miami Warehouse (Doral, FL)', completed: true },
      { id: 'ev-m2', status: 'at_warehouse', title: 'Pesaje e Inspección TSA', description: 'Peso verificado: 4.8 KG (10.5 lbs). Sin retención aduanal', timestamp: '26 Ago 09:10 AM', location: 'Miami Warehouse', completed: true },
      { id: 'ev-m3', status: 'in_transit', title: 'Despacho Aéreo Internacional', description: 'Embarcado en Vuelo AA 1039 con destino a SDQ Las Américas', timestamp: '27 Ago 06:40 PM', location: 'MIA Int. Airport', completed: true },
      { id: 'ev-m4', status: 'customs', title: 'Recepción Aduanas RD (DGA)', description: 'Liberación expedita Courier DGA Aeropuerto AILA', timestamp: '28 Ago 11:30 AM', location: 'AILA Santo Domingo', completed: true },
      { id: 'ev-m5', status: 'out_for_delivery', title: 'En Tránsito a Sucursal Piantini', description: 'Traslado en camión blindado a sucursal local', timestamp: 'Estimado Mañana 09:00 AM', location: 'Santo Domingo', completed: false }
    ]
  },
  {
    id: 'shp-03',
    trackingNumber: 'NX-9102-STI',
    serviceType: 'nacional',
    status: 'picked_up',
    createdAt: '2026-08-28T11:00:00Z',
    estimatedDelivery: '2026-08-29T14:00:00Z',
    origin: {
      name: 'Distribuidora Textil del Caribe SRL',
      phone: '+1 (809) 582-9090',
      street: 'Calle Del Sol #142',
      sector: 'Centro Histórico',
      city: 'Santiago de los Caballeros',
      provinceState: 'Santiago',
      country: 'DO',
      lat: 19.4510,
      lng: -70.6980
    },
    destination: {
      name: 'Boutique Bella Moda',
      phone: '+1 (809) 556-3322',
      street: 'Calle Castillo Márquez #88',
      sector: 'Centro de la Ciudad',
      city: 'La Romana',
      provinceState: 'La Romana',
      country: 'DO',
      lat: 18.4273,
      lng: -68.9728
    },
    package: {
      lengthCm: 80,
      widthCm: 50,
      heightCm: 45,
      weightKg: 18.5,
      volumetricWeightKg: 36.0,
      category: 'Textiles y Confecciones',
      detectedType: 'caja',
      confidence: 0.95
    },
    shippingCost: 1250,
    currency: 'DOP',
    codAmount: 14800,
    codCurrency: 'DOP',
    codCollected: false,
    driverId: 'drv-03',
    driverName: 'Esteban Rosario',
    vehiclePlate: 'L339102',
    branchId: 'br-sti',
    branchName: 'Hub Cibao Santiago',
    events: [
      { id: 'ev-s1', status: 'confirmed', title: 'Orden Registrada', description: 'Solicitud interurbana Santiago -> La Romana', timestamp: '11:00 AM', location: 'Santiago', completed: true },
      { id: 'ev-s2', status: 'picked_up', title: 'Recolectado por Camión Isuzu', description: 'Carga pesada verificada por Esteban Rosario', timestamp: '01:15 PM', location: 'Santiago Calle Del Sol', completed: true },
      { id: 'ev-s3', status: 'in_transit', title: 'En Ruta Expresa Autopista Duarte', description: 'Tránsito nocturno al HUB Central para transbordo Este', timestamp: 'En progreso', location: 'Autopista Duarte Km 45', completed: false }
    ]
  },
  {
    id: 'shp-04',
    trackingNumber: 'MUD-2026-881',
    serviceType: 'mudanza',
    status: 'confirmed',
    createdAt: '2026-08-28T09:00:00Z',
    estimatedDelivery: '2026-08-30T16:00:00Z',
    origin: {
      name: 'Lic. Fernando Gómez',
      phone: '+1 (809) 555-7788',
      street: 'Av. Sarasota #45, Residencial Bella Vista Tower, Piso 8',
      sector: 'Bella Vista',
      city: 'Santo Domingo',
      provinceState: 'Distrito Nacional',
      country: 'DO',
      lat: 18.4550,
      lng: -69.9540,
      reference: 'Edificio cuenta con ascensor de carga'
    },
    destination: {
      name: 'Lic. Fernando Gómez',
      phone: '+1 (809) 555-7788',
      street: 'Calle Los Samanes #12, Villa Real',
      sector: 'Punta Cana Village',
      city: 'Punta Cana',
      provinceState: 'La Altagracia',
      country: 'DO',
      lat: 18.5200,
      lng: -68.3800
    },
    package: {
      lengthCm: 350,
      widthCm: 220,
      heightCm: 210,
      weightKg: 1200,
      volumetricWeightKg: 3234,
      category: 'Mudanza Residencial 3 Habitaciones + Muebles + Electrodomésticos',
      detectedType: 'mueble'
    },
    shippingCost: 38500,
    currency: 'DOP',
    isInsured: true,
    insuranceValue: 450000,
    branchId: 'br-hq-sd',
    events: [
      { id: 'ev-mu1', status: 'confirmed', title: 'Cotización Aprobada con Escaneo IA', description: 'Inventario de 24 ítems verificado digitalmente', timestamp: '09:00 AM', location: 'Santo Domingo', completed: true },
      { id: 'ev-mu2', status: 'assigned', title: 'Equipo y Camión Asignados', description: 'Camión Freightliner 24ft + 4 operarios de embalaje pro', timestamp: '11:30 AM', location: 'Hub Central', completed: true }
    ]
  },
  {
    id: 'shp-05',
    trackingNumber: 'CRG-7740-IND',
    serviceType: 'carga_pesada',
    status: 'assigned',
    createdAt: '2026-08-28T07:30:00Z',
    estimatedDelivery: '2026-08-29T18:00:00Z',
    origin: {
      name: 'Aceros & Metales del Caribe',
      phone: '+1 (809) 560-1122',
      street: 'Zona Industrial Haina Oriental, Nave 8',
      city: 'Bajos de Haina',
      provinceState: 'San Cristóbal',
      country: 'DO',
      lat: 18.4200,
      lng: -70.0100
    },
    destination: {
      name: 'Complejo Minero & Constructora Quisqueya',
      phone: '+1 (809) 555-8901',
      street: 'Carretera Sánchez Km 14',
      city: 'Baní',
      provinceState: 'Peravia',
      country: 'DO',
      lat: 18.2800,
      lng: -70.3300
    },
    package: {
      lengthCm: 480,
      widthCm: 240,
      heightCm: 180,
      weightKg: 8500,
      volumetricWeightKg: 4147,
      category: '4 Pallets Industriales + Generador Eléctrico 150kVA',
      detectedType: 'pallet'
    },
    shippingCost: 52000,
    currency: 'DOP',
    isInsured: true,
    insuranceValue: 1200000,
    requiresSignature: true,
    branchId: 'br-hq-sd',
    events: [
      { id: 'ev-c1', status: 'confirmed', title: 'Solicitud Carga Pesada Aprobada', description: 'Autorización de pesaje y ruta especial MOPC', timestamp: '07:30 AM', location: 'San Cristóbal', completed: true },
      { id: 'ev-c2', status: 'assigned', title: 'Cabezal Mack & Plataforma Asignada', description: 'Conductor certificado de carga pesada', timestamp: '10:00 AM', location: 'Hub Central', completed: true }
    ]
  }
];

export const MOCK_INTERNATIONAL_PACKAGES: InternationalPackage[] = [
  {
    id: 'pkg-01',
    lockerId: 'JM-10482',
    originCountry: 'US',
    storeName: 'Amazon.com',
    externalTracking: 'TBA893012903',
    internalTracking: 'NX-MIA-0912',
    receivedDate: '2026-08-27',
    weightLbs: 3.4,
    weightKg: 1.54,
    dimensionsCm: { l: 30, w: 20, h: 15 },
    declaredValueUsd: 129.99,
    description: 'Sony WH-1000XM5 Wireless Headphones (Midnight Blue)',
    photoUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80',
    status: 'ready_to_consolidate'
  },
  {
    id: 'pkg-02',
    lockerId: 'JM-10482',
    originCountry: 'US',
    storeName: 'Zara USA',
    externalTracking: '1Z9999999999999999',
    internalTracking: 'NX-MIA-0915',
    receivedDate: '2026-08-27',
    weightLbs: 2.1,
    weightKg: 0.95,
    dimensionsCm: { l: 35, w: 28, h: 8 },
    declaredValueUsd: 89.50,
    description: 'Chaqueta de Lino Casual + 2 Camisas Slim Fit',
    photoUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&auto=format&fit=crop&q=80',
    status: 'ready_to_consolidate'
  },
  {
    id: 'pkg-03',
    lockerId: 'JM-10482',
    originCountry: 'US',
    storeName: 'Apple Store Online',
    externalTracking: '9400100000000000000000',
    internalTracking: 'NX-MIA-0918',
    receivedDate: '2026-08-28',
    weightLbs: 1.8,
    weightKg: 0.82,
    dimensionsCm: { l: 22, w: 18, h: 10 },
    declaredValueUsd: 199.00,
    description: 'Apple Watch Series 10 Sport Band 46mm',
    photoUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&auto=format&fit=crop&q=80',
    status: 'ready_to_consolidate'
  },
  {
    id: 'pkg-04',
    lockerId: 'JM-10482',
    originCountry: 'ES',
    storeName: 'El Corte Inglés Madrid',
    externalTracking: 'ES092831092',
    internalTracking: 'NX-MAD-0044',
    receivedDate: '2026-08-26',
    weightLbs: 4.2,
    weightKg: 1.9,
    dimensionsCm: { l: 40, w: 30, h: 12 },
    declaredValueUsd: 145.00,
    description: 'Calzado Piel Artesanal Hecho en España',
    photoUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
    status: 'international_transit'
  }
];

export const MOCK_CLIENT_PROFILES: ClientProfile[] = [
  {
    id: 'cli-01',
    name: 'José Martínez',
    companyName: 'Martínez Tech Solutions SRL',
    rncOrDni: '131-89201-4',
    clientType: 'corporate',
    status: 'active',
    email: 'jose@martineztech.do',
    phone: '+1 (809) 555-4433',
    lockerCode: 'JM-10482',
    accountExecutive: 'Lic. Laura Benítez',
    activeShipments: 8,
    balanceDop: 24500,
    creditLimitDop: 100000,
    creditUsedDop: 24500,
    creditDays: 30,
    ncfType: 'B01',
    codPendingPayoutDop: 48200,
    discountRatePercent: 12,
    addressesCount: 6,
    registeredDate: '2024-03-15',
    bankInfo: {
      bankName: 'Banco Popular Dominicano',
      accountType: 'corriente',
      accountNumber: '7920194821',
      holderName: 'Martínez Tech Solutions SRL',
      rnc: '131-89201-4'
    },
    apiKey: {
      liveKey: 'gpq_live_9a8f1029c782019b88210',
      testKey: 'gpq_test_881bca001298471bcca11',
      createdAt: '2024-04-01',
      lastUsed: 'Hace 12 minutos',
      isRevoked: false
    },
    webhookUrl: 'https://api.martineztech.do/v1/logistics/gopaq-events',
    customRates: {
      baseUrbanDiscount: 12,
      baseInterprovincialDiscount: 10,
      freePickups: true,
      customPerKgDop: 22
    },
    billingAddress: {
      street: 'Av. Winston Churchill #1099, Torre Acrópolis Piso 14',
      sector: 'Piantini',
      city: 'Santo Domingo',
      province: 'Distrito Nacional'
    },
    branchesList: [
      {
        id: 'br-cli-1',
        name: 'Sede Principal Acrópolis',
        contactPerson: 'José Martínez',
        phone: '+1 (809) 555-4433',
        address: 'Av. Winston Churchill #1099, Piso 14',
        sector: 'Piantini',
        city: 'Santo Domingo',
        isPrimary: true
      },
      {
        id: 'br-cli-2',
        name: 'Centro de Distribución Herrera',
        contactPerson: 'Marcos Peña (Almacén)',
        phone: '+1 (809) 555-8812',
        address: 'Calle Isabel Aguiar #42, Nave 3',
        sector: 'Zona Industrial de Herrera',
        city: 'Santo Domingo Oeste',
        isPrimary: false
      }
    ],
    invoices: [
      {
        id: 'inv-101',
        ncf: 'E310000004921',
        issueDate: '2026-08-01',
        dueDate: '2026-08-31',
        amountDop: 32400,
        paidDop: 32400,
        status: 'paid',
        shipmentsCount: 26,
        pdfUrl: '#'
      },
      {
        id: 'inv-102',
        ncf: 'E310000005102',
        issueDate: '2026-08-15',
        dueDate: '2026-09-15',
        amountDop: 24500,
        paidDop: 0,
        status: 'pending',
        shipmentsCount: 19,
        pdfUrl: '#'
      }
    ],
    codPayoutsHistory: [
      {
        id: 'payout-1',
        date: '2026-08-22',
        amountDop: 36800,
        referenceNumber: 'TRF-BPD-992014',
        bankName: 'Banco Popular Dominicano',
        status: 'processed',
        shipmentsCount: 14
      },
      {
        id: 'payout-2',
        date: '2026-08-15',
        amountDop: 28400,
        referenceNumber: 'TRF-BPD-881204',
        bankName: 'Banco Popular Dominicano',
        status: 'processed',
        shipmentsCount: 9
      }
    ]
  },
  {
    id: 'cli-02',
    name: 'Farmacia Los Hidalgos',
    companyName: 'Farmacias Los Hidalgos SA',
    rncOrDni: '101-04921-2',
    clientType: 'enterprise',
    status: 'active',
    email: 'logistica@hidalgos.com.do',
    phone: '+1 (809) 541-2020',
    lockerCode: 'FH-99012',
    accountExecutive: 'Ing. Alejandro Tavares',
    activeShipments: 142,
    balanceDop: 185000,
    creditLimitDop: 500000,
    creditUsedDop: 185000,
    creditDays: 45,
    ncfType: 'B01',
    codPendingPayoutDop: 320000,
    discountRatePercent: 20,
    addressesCount: 28,
    registeredDate: '2023-01-10',
    bankInfo: {
      bankName: 'Banco BHD',
      accountType: 'corriente',
      accountNumber: '0928410291',
      holderName: 'Farmacias Los Hidalgos SA',
      rnc: '101-04921-2'
    },
    apiKey: {
      liveKey: 'gpq_live_enterprise_hidalgos_9921',
      testKey: 'gpq_test_enterprise_hidalgos_0012',
      createdAt: '2023-02-15',
      lastUsed: 'Hace 3 minutos',
      isRevoked: false
    },
    webhookUrl: 'https://gateway.hidalgos.com.do/api/logistics/webhook',
    customRates: {
      baseUrbanDiscount: 20,
      baseInterprovincialDiscount: 18,
      freePickups: true,
      customPerKgDop: 18
    },
    billingAddress: {
      street: 'Av. 27 de Febrero esq. Abraham Lincoln',
      sector: 'Piantini',
      city: 'Santo Domingo',
      province: 'Distrito Nacional'
    },
    branchesList: [
      {
        id: 'br-h-1',
        name: 'Hub Farmacéutico Central (Despacho)',
        contactPerson: 'Lic. Ernesto Báez',
        phone: '+1 (809) 541-2020',
        address: 'Av. San Martín #188',
        sector: 'Ensanche La Fe',
        city: 'Santo Domingo',
        isPrimary: true
      },
      {
        id: 'br-h-2',
        name: 'Sucursal Santiago Los Jardines',
        contactPerson: 'Dra. Carmen Rosario',
        phone: '+1 (809) 582-1100',
        address: 'Av. 27 de Febrero #45',
        sector: 'Los Jardines',
        city: 'Santiago de los Caballeros',
        isPrimary: false
      }
    ],
    invoices: [
      {
        id: 'inv-201',
        ncf: 'E310000008819',
        issueDate: '2026-07-31',
        dueDate: '2026-09-14',
        amountDop: 145000,
        paidDop: 145000,
        status: 'paid',
        shipmentsCount: 310,
        pdfUrl: '#'
      },
      {
        id: 'inv-202',
        ncf: 'E310000009120',
        issueDate: '2026-08-15',
        dueDate: '2026-09-29',
        amountDop: 185000,
        paidDop: 0,
        status: 'pending',
        shipmentsCount: 380,
        pdfUrl: '#'
      }
    ],
    codPayoutsHistory: [
      {
        id: 'payout-h1',
        date: '2026-08-26',
        amountDop: 240000,
        referenceNumber: 'TRF-BHD-0019284',
        bankName: 'Banco BHD',
        status: 'processed',
        shipmentsCount: 94
      }
    ]
  },
  {
    id: 'cli-03',
    name: 'Moda Caribe E-commerce',
    companyName: 'Moda Caribe RD SRL',
    rncOrDni: '132-09411-9',
    clientType: 'ecommerce',
    status: 'active',
    email: 'envios@modacaribe.do',
    phone: '+1 (829) 555-9011',
    lockerCode: 'MC-33100',
    accountExecutive: 'Lic. Laura Benítez',
    activeShipments: 38,
    balanceDop: 42000,
    creditLimitDop: 150000,
    creditUsedDop: 42000,
    creditDays: 15,
    ncfType: 'B01',
    codPendingPayoutDop: 89400,
    discountRatePercent: 15,
    addressesCount: 12,
    registeredDate: '2024-06-20',
    bankInfo: {
      bankName: 'Banreservas',
      accountType: 'ahorros',
      accountNumber: '24091820491',
      holderName: 'Moda Caribe RD SRL',
      rnc: '132-09411-9'
    },
    apiKey: {
      liveKey: 'gpq_live_ecom_modacaribe_8819b',
      testKey: 'gpq_test_ecom_modacaribe_1102a',
      createdAt: '2024-06-25',
      lastUsed: 'Hace 1 hora',
      isRevoked: false
    },
    webhookUrl: 'https://shop.modacaribe.do/api/gopaq/order-update',
    customRates: {
      baseUrbanDiscount: 15,
      baseInterprovincialDiscount: 12,
      freePickups: true,
      customPerKgDop: 20
    },
    billingAddress: {
      street: 'Calle Francisco Prats Ramírez #402',
      sector: 'Evaristo Morales',
      city: 'Santo Domingo',
      province: 'Distrito Nacional'
    },
    branchesList: [
      {
        id: 'br-mc-1',
        name: 'Showroom & Taller Central Evaristo',
        contactPerson: 'Camila Peña',
        phone: '+1 (829) 555-9011',
        address: 'Calle Francisco Prats Ramírez #402',
        sector: 'Evaristo Morales',
        city: 'Santo Domingo',
        isPrimary: true
      }
    ],
    invoices: [
      {
        id: 'inv-301',
        ncf: 'E310000004102',
        issueDate: '2026-08-10',
        dueDate: '2026-08-25',
        amountDop: 42000,
        paidDop: 0,
        status: 'pending',
        shipmentsCount: 52,
        pdfUrl: '#'
      }
    ],
    codPayoutsHistory: [
      {
        id: 'payout-mc1',
        date: '2026-08-20',
        amountDop: 64200,
        referenceNumber: 'TRF-BR-449102',
        bankName: 'Banreservas',
        status: 'processed',
        shipmentsCount: 28
      }
    ]
  },
  {
    id: 'cli-04',
    name: 'Distribuidora Corripio Industrial',
    companyName: 'Distribuidora Corripio SAS',
    rncOrDni: '101-00234-8',
    clientType: 'enterprise',
    status: 'active',
    email: 'despacho@corripio.com.do',
    phone: '+1 (809) 565-1111',
    lockerCode: 'DC-88001',
    accountExecutive: 'Ing. Alejandro Tavares',
    activeShipments: 84,
    balanceDop: 320000,
    creditLimitDop: 1200000,
    creditUsedDop: 320000,
    creditDays: 60,
    ncfType: 'B01',
    codPendingPayoutDop: 0,
    discountRatePercent: 25,
    addressesCount: 45,
    registeredDate: '2022-11-05',
    bankInfo: {
      bankName: 'Banco Popular Dominicano',
      accountType: 'corriente',
      accountNumber: '00192840192',
      holderName: 'Distribuidora Corripio SAS',
      rnc: '101-00234-8'
    },
    apiKey: {
      liveKey: 'gpq_live_enterprise_corripio_09182',
      testKey: 'gpq_test_enterprise_corripio_77192',
      createdAt: '2022-12-01',
      lastUsed: 'Hace 45 minutos',
      isRevoked: false
    },
    customRates: {
      baseUrbanDiscount: 25,
      baseInterprovincialDiscount: 22,
      freePickups: true,
      customPerKgDop: 16
    },
    billingAddress: {
      street: 'Av. John F. Kennedy Km 6 1/2',
      sector: 'Los Jardines del Norte',
      city: 'Santo Domingo',
      province: 'Distrito Nacional'
    },
    branchesList: [
      {
        id: 'br-dc-1',
        name: 'Centro Logístico Principal Duarte',
        contactPerson: 'Ing. Ramón Valerio',
        phone: '+1 (809) 565-1111',
        address: 'Autopista Duarte Km 13, Parque Industrial',
        sector: 'Zona Industrial Duarte',
        city: 'Santo Domingo Oeste',
        isPrimary: true
      }
    ],
    invoices: [
      {
        id: 'inv-401',
        ncf: 'E310000010921',
        issueDate: '2026-07-15',
        dueDate: '2026-09-15',
        amountDop: 480000,
        paidDop: 480000,
        status: 'paid',
        shipmentsCount: 620,
        pdfUrl: '#'
      },
      {
        id: 'inv-402',
        ncf: 'E310000011400',
        issueDate: '2026-08-15',
        dueDate: '2026-10-15',
        amountDop: 320000,
        paidDop: 0,
        status: 'pending',
        shipmentsCount: 450,
        pdfUrl: '#'
      }
    ]
  },
  {
    id: 'cli-05',
    name: 'Boutique Bella Moda Santiago',
    companyName: 'Bella Moda SRL',
    rncOrDni: '131-09482-1',
    clientType: 'ecommerce',
    status: 'active',
    email: 'contacto@bellamoda.do',
    phone: '+1 (809) 556-3322',
    lockerCode: 'BM-22910',
    accountExecutive: 'Lic. Laura Benítez',
    activeShipments: 16,
    balanceDop: 18500,
    creditLimitDop: 80000,
    creditUsedDop: 18500,
    creditDays: 15,
    ncfType: 'B01',
    codPendingPayoutDop: 42300,
    discountRatePercent: 10,
    addressesCount: 4,
    registeredDate: '2025-01-18',
    bankInfo: {
      bankName: 'Banco BHD',
      accountType: 'corriente',
      accountNumber: '1192840192',
      holderName: 'Bella Moda SRL',
      rnc: '131-09482-1'
    },
    customRates: {
      baseUrbanDiscount: 10,
      baseInterprovincialDiscount: 10,
      freePickups: true
    },
    billingAddress: {
      street: 'Calle Del Sol #142',
      sector: 'Centro Histórico',
      city: 'Santiago de los Caballeros',
      province: 'Santiago'
    }
  },
  {
    id: 'cli-06',
    name: 'Lic. Fernando Gómez',
    clientType: 'individual',
    status: 'active',
    email: 'fgomez@gmail.com',
    phone: '+1 (809) 555-7788',
    lockerCode: 'FG-0912',
    activeShipments: 1,
    balanceDop: 0,
    creditLimitDop: 20000,
    creditUsedDop: 0,
    creditDays: 0,
    ncfType: 'B02',
    codPendingPayoutDop: 0,
    discountRatePercent: 0,
    addressesCount: 2,
    registeredDate: '2025-08-01'
  }
];

export const MOCK_ROUTE: DeliveryRoute = {
  id: 'rt-8831',
  routeCode: 'RT-8831-SD',
  name: 'Ruta Last-Mile Piantini / Naco / Bella Vista',
  routeType: 'last_mile',
  dispatchWave: 'wave_morning_0800',
  driverId: 'drv-01',
  driverName: 'Carlos Méndez',
  driverPhone: '+1 (829) 555-0121',
  driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  vehiclePlate: 'L482910',
  vehicleType: 'camioneta',
  maxWeightKg: 850,
  currentWeightKg: 420,
  maxStopsCapacity: 30,
  branchId: 'br-hq-sd',
  branchName: 'Hub Central Santo Domingo',
  originHub: 'Hub Central SDQ',
  destinationZone: 'Polígono Central & Bella Vista',
  status: 'in_progress',
  totalStops: 18,
  completedStops: 11,
  totalDistanceKm: 142,
  estimatedDurationHours: 6.5,
  totalCodAmount: 12400,
  collectedCodAmount: 7600,
  startedAt: '08:30 AM',
  manifestNumber: 'MNF-2026-08831',
  color: '#4F46E5',
  notes: 'Prioridad alta en paquetes farmacéuticos y COD de Acrópolis.',
  stops: [
    {
      id: 'stp-1',
      sequenceOrder: 1,
      shipmentId: 'shp-01',
      trackingNumber: 'NX-8924-DO',
      type: 'delivery',
      recipientName: 'Dra. María Elena Rodríguez',
      phone: '+1 (829) 555-0819',
      address: 'Av. Winston Churchill #1099, Torre Acrópolis, Piso 14',
      lat: 18.4735,
      lng: -69.9405,
      estimatedArrival: '02:40 PM',
      status: 'pending',
      codAmount: 2850,
      weightKg: 2.4,
      packageSummary: 'Caja Mediana 2.4 KG (Medicamentos)',
      instructions: 'Subir al piso 14, recepción de consultorio',
      contactRole: 'destinatario'
    },
    {
      id: 'stp-2',
      sequenceOrder: 2,
      shipmentId: 'shp-06',
      trackingNumber: 'NX-8930-DO',
      type: 'delivery',
      recipientName: 'Lic. Andrés Brea',
      phone: '+1 (809) 555-3311',
      address: 'Calle Max Henríquez Ureña #84, Naco',
      lat: 18.4750,
      lng: -69.9320,
      estimatedArrival: '03:10 PM',
      status: 'pending',
      codAmount: 1950,
      weightKg: 0.8,
      packageSummary: 'Sobre A4 Documentos Legales + Seguro',
      contactRole: 'destinatario'
    },
    {
      id: 'stp-3',
      sequenceOrder: 3,
      shipmentId: 'shp-07',
      trackingNumber: 'NX-8941-DO',
      type: 'pickup',
      recipientName: 'Boutique Naco Style (Recogida B2B)',
      phone: '+1 (829) 555-7722',
      address: 'Av. Tiradentes esq. Roberto Pastoriza',
      lat: 18.4780,
      lng: -69.9340,
      estimatedArrival: '03:45 PM',
      status: 'pending',
      weightKg: 14.5,
      packageSummary: '3 Paquetes E-commerce para envío nacional',
      contactRole: 'remitente'
    },
    {
      id: 'stp-4',
      sequenceOrder: 4,
      shipmentId: 'shp-08',
      trackingNumber: 'NX-8955-DO',
      type: 'delivery',
      recipientName: 'Karla Morales',
      phone: '+1 (809) 555-9080',
      address: 'Av. Sarasota #78, Bella Vista',
      lat: 18.4570,
      lng: -69.9510,
      estimatedArrival: '04:15 PM',
      status: 'pending',
      codAmount: 0,
      weightKg: 3.2,
      packageSummary: 'Paquete Courier Miami (Electrónica)',
      contactRole: 'destinatario'
    }
  ]
};

export const MOCK_ROUTES: DeliveryRoute[] = [
  MOCK_ROUTE,
  {
    id: 'rt-9102',
    routeCode: 'RT-9102-STI',
    name: 'Troncal Expreso Cibao / Santiago & Moca',
    routeType: 'interprovincial',
    dispatchWave: 'wave_morning_0800',
    driverId: 'drv-02',
    driverName: 'Rafael Almonte',
    driverPhone: '+1 (829) 555-0122',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'EA-8819',
    vehicleType: 'van',
    maxWeightKg: 1600,
    currentWeightKg: 1140,
    maxStopsCapacity: 35,
    branchId: 'br-cibao-sti',
    branchName: 'Hub Cibao Santiago',
    originHub: 'Hub Central SDQ',
    destinationZone: 'Santiago Centro, Los Jardines & Moca',
    status: 'in_progress',
    totalStops: 24,
    completedStops: 16,
    totalDistanceKm: 188,
    estimatedDurationHours: 7.2,
    totalCodAmount: 28900,
    collectedCodAmount: 19400,
    startedAt: '07:45 AM',
    manifestNumber: 'MNF-2026-09102',
    color: '#059669',
    notes: 'Entregas corporativas zona franca Gurabo y COD ferretero.',
    stops: [
      {
        id: 'stp-sti-1',
        sequenceOrder: 1,
        shipmentId: 'shp-02',
        trackingNumber: 'NX-9102-STI',
        type: 'delivery',
        recipientName: 'Carlos Gómez (AgroInsumos)',
        phone: '+1 (809) 555-8819',
        address: 'Av. 27 de Febrero #204, Los Jardines, Santiago',
        lat: 19.4517,
        lng: -70.6970,
        estimatedArrival: '11:30 AM',
        status: 'completed',
        codAmount: 8500,
        weightKg: 18.5,
        packageSummary: 'Repuestos Maquinaria Hidráulica',
        completedAt: '11:42 AM',
        contactRole: 'destinatario'
      },
      {
        id: 'stp-sti-2',
        sequenceOrder: 2,
        shipmentId: 'shp-09',
        trackingNumber: 'GP-4421-MOC',
        type: 'delivery',
        recipientName: 'Farmacia San Rafael Moca',
        phone: '+1 (829) 555-2244',
        address: 'Calle Independencia #45, Moca',
        lat: 19.3935,
        lng: -70.5255,
        estimatedArrival: '01:15 PM',
        status: 'pending',
        codAmount: 4200,
        weightKg: 5.0,
        packageSummary: 'Lote Suplementos & Vacunas Termo-selladas',
        contactRole: 'destinatario'
      }
    ]
  },
  {
    id: 'rt-4020',
    routeCode: 'RT-4020-BVR',
    name: 'Corredor Turístico Bávaro - Punta Cana Express',
    routeType: 'express_moto',
    dispatchWave: 'wave_midday_1200',
    driverId: 'drv-03',
    driverName: 'Esteban Rosario',
    driverPhone: '+1 (809) 555-0123',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'M-9912',
    vehicleType: 'moto',
    maxWeightKg: 80,
    currentWeightKg: 42,
    maxStopsCapacity: 20,
    branchId: 'br-este-bav',
    branchName: 'Sucursal Bávaro - Punta Cana',
    originHub: 'Sucursal Bávaro',
    destinationZone: 'BlueMall, Cap Cana & Hoteles Bávaro',
    status: 'published',
    totalStops: 14,
    completedStops: 0,
    totalDistanceKm: 76,
    estimatedDurationHours: 4.0,
    totalCodAmount: 8300,
    collectedCodAmount: 0,
    startedAt: '12:15 PM',
    manifestNumber: 'MNF-2026-04020',
    color: '#D97706',
    notes: 'Acceso exclusivo con carnet de proveedor a complejos hoteleros.',
    stops: [
      {
        id: 'stp-bav-1',
        sequenceOrder: 1,
        shipmentId: 'shp-10',
        trackingNumber: 'GP-9011-CAP',
        type: 'delivery',
        recipientName: 'Villa Marina Cap Cana #44',
        phone: '+1 (849) 555-6677',
        address: 'Marina Boulevard, Cap Cana',
        lat: 18.5080,
        lng: -68.3750,
        estimatedArrival: '01:30 PM',
        status: 'pending',
        codAmount: 0,
        weightKg: 2.1,
        packageSummary: 'Caja Amazon Miami (Ropa & Accesorios)',
        contactRole: 'destinatario'
      }
    ]
  },
  {
    id: 'rt-5510',
    routeCode: 'RT-5510-NOC',
    name: 'Troncal Nocturno Inter-Hubs SDQ ⇄ Santiago ⇄ Puerto Plata',
    routeType: 'troncal_hub',
    dispatchWave: 'wave_night_2100',
    driverId: 'drv-04',
    driverName: 'Miguel Ángel Cruz',
    driverPhone: '+1 (849) 555-0124',
    driverAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    vehiclePlate: 'C-99238',
    vehicleType: 'camion',
    maxWeightKg: 8500,
    currentWeightKg: 6200,
    maxStopsCapacity: 12,
    branchId: 'br-hq-sd',
    branchName: 'Hub Central Santo Domingo',
    originHub: 'Hub Central SDQ',
    destinationZone: 'Hub Santiago & Sucursal Puerto Plata',
    status: 'draft',
    totalStops: 4,
    completedStops: 0,
    totalDistanceKm: 380,
    estimatedDurationHours: 5.5,
    totalCodAmount: 0,
    collectedCodAmount: 0,
    manifestNumber: 'MNF-2026-05510',
    color: '#8B5CF6',
    notes: 'Transferencia masiva de contenedores aéreos y paquetería B2B nocturna.',
    stops: [
      {
        id: 'stp-noc-1',
        sequenceOrder: 1,
        shipmentId: 'shp-11',
        trackingNumber: 'TRK-HUB-STI-01',
        type: 'pickup',
        recipientName: 'Hub Central SDQ (Carga Pallets)',
        phone: '+1 (809) 555-0100',
        address: 'Autopista Duarte Km 13, SDQ',
        lat: 18.5120,
        lng: -69.9800,
        estimatedArrival: '09:00 PM',
        status: 'pending',
        weightKg: 3200,
        packageSummary: '12 Jaulas de Paquetería Consolidada Cibao',
        contactRole: 'remitente'
      },
      {
        id: 'stp-noc-2',
        sequenceOrder: 2,
        shipmentId: 'shp-12',
        trackingNumber: 'TRK-HUB-STI-02',
        type: 'delivery',
        recipientName: 'Hub Cibao Santiago (Descarga)',
        phone: '+1 (809) 555-0200',
        address: 'Autopista Duarte Km 4.5, Santiago',
        lat: 19.4320,
        lng: -70.6700,
        estimatedArrival: '11:45 PM',
        status: 'pending',
        weightKg: 3200,
        packageSummary: 'Descarga de línea troncal Santiago',
        contactRole: 'destinatario'
      }
    ]
  }
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Ing. Alejandro Tavares',
    email: 'alejandro.tavares@gopaq.com.do',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    branchName: 'Hub Central Santo Domingo',
    branchId: 'br-hq-sd',
    status: 'active',
    lastActive: 'Hace 2 minutos',
    phone: '+1 (809) 555-0100'
  },
  {
    id: 'tm-2',
    name: 'Lic. Laura Benítez',
    email: 'laura.benitez@gopaq.com.do',
    role: 'Manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    branchName: 'Sucursal Piantini & Naco',
    branchId: 'br-piantini',
    status: 'active',
    lastActive: 'Hace 5 minutos',
    phone: '+1 (809) 555-0102'
  },
  {
    id: 'tm-3',
    name: 'Roberto Gómez',
    email: 'roberto.gomez@gopaq.com.do',
    role: 'Dispatcher',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    branchName: 'Hub Central Santo Domingo',
    branchId: 'br-hq-sd',
    status: 'active',
    lastActive: 'Hace 1 minuto',
    phone: '+1 (809) 555-0103'
  },
  {
    id: 'tm-4',
    name: 'Daniela Santana',
    email: 'daniela.santana@gopaq.com.do',
    role: 'Counter',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    branchName: 'Sucursal Bávaro - Punta Cana',
    branchId: 'br-puj',
    status: 'active',
    lastActive: 'Hace 12 minutos',
    phone: '+1 (809) 555-0108'
  },
  {
    id: 'tm-5',
    name: 'Marcos Peralta',
    email: 'marcos.peralta@gopaq.com.do',
    role: 'Operations',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    branchName: 'Hub Cibao Santiago',
    branchId: 'br-sti',
    status: 'active',
    lastActive: 'Hace 25 minutos',
    phone: '+1 (809) 555-0105'
  },
  {
    id: 'tm-6',
    name: 'Patricia Domínguez',
    email: 'patricia.dominguez@gopaq.com.do',
    role: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    branchName: 'Hub Central Santo Domingo',
    branchId: 'br-hq-sd',
    status: 'active',
    lastActive: 'Hace 40 minutos',
    phone: '+1 (809) 555-0111'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '🚚 Nueva ruta asignada',
    message: 'Ruta RT-8831 iniciada por Carlos Méndez con 18 paradas en Distrito Nacional',
    type: 'info',
    category: 'operations',
    timestamp: 'Hace 2 min',
    read: false
  },
  {
    id: 'notif-2',
    title: '🟢 Envío NX-8924-DO en reparto',
    message: 'Carlos Méndez está a 2.4 KM de entregar en Torre Acrópolis',
    type: 'success',
    category: 'shipment',
    timestamp: 'Hace 8 min',
    read: false
  },
  {
    id: 'notif-3',
    title: '💵 Cobro COD Recibido',
    message: 'Driver Rafael Almonte confirmó cobro en efectivo de RD$ 3,400',
    type: 'success',
    category: 'cod',
    timestamp: 'Hace 15 min',
    read: false
  },
  {
    id: 'notif-4',
    title: '✈️ Llegada Vuelo AA 1039',
    message: 'Manifiesto Miami MNF-AA-9921 con 340 paquetes en aduanas AILA',
    type: 'info',
    category: 'international',
    timestamp: 'Hace 35 min',
    read: true
  },
  {
    id: 'notif-5',
    title: '⚠️ Incidencia en Ruta RT-8820',
    message: 'Dirección inaccesible en Santo Domingo Este por obras viales. Paquete reprogramado.',
    type: 'warning',
    category: 'operations',
    timestamp: 'Hace 1 hora',
    read: true
  }
];

export const MOCK_COD_TRANSACTIONS: CodTransaction[] = [
  {
    id: 'cod-101',
    shipmentTracking: 'NX-8924-DO',
    clientName: 'Farmacia Los Hidalgos',
    driverName: 'Carlos Méndez',
    branchName: 'Hub Central Santo Domingo',
    amount: 2850,
    currency: 'DOP',
    collectedAt: 'Hoy 02:15 PM',
    settledWithDriver: true,
    settledWithClient: false,
    status: 'deposited_in_branch'
  },
  {
    id: 'cod-102',
    shipmentTracking: 'NX-8819-DO',
    clientName: 'Moda Caribe E-commerce',
    driverName: 'Rafael Almonte',
    branchName: 'Sucursal Piantini',
    amount: 3400,
    currency: 'DOP',
    collectedAt: 'Hoy 01:20 PM',
    settledWithDriver: true,
    settledWithClient: true,
    status: 'transferred_to_client'
  },
  {
    id: 'cod-103',
    shipmentTracking: 'NX-8790-STI',
    clientName: 'Distribuidora Textil',
    driverName: 'Esteban Rosario',
    branchName: 'Hub Cibao Santiago',
    amount: 14800,
    currency: 'DOP',
    collectedAt: 'Ayer 04:45 PM',
    settledWithDriver: true,
    settledWithClient: true,
    status: 'reconciled'
  },
  {
    id: 'cod-104',
    shipmentTracking: 'NX-8930-DO',
    clientName: 'Tech Store RD',
    driverName: 'Carlos Méndez',
    branchName: 'Hub Central Santo Domingo',
    amount: 5200,
    currency: 'DOP',
    collectedAt: 'Hoy 11:30 AM',
    settledWithDriver: false,
    settledWithClient: false,
    status: 'collected_by_driver'
  }
];

export const MOCK_MOVING_ITEMS: MovingItem[] = [
  { id: 'mv-1', name: 'Sofá Seccional 3 Cuerpos', category: 'muebles', quantity: 1, approxVolumeM3: 2.2, weightKg: 85, icon: 'Sofa' },
  { id: 'mv-2', name: 'Cama King Size + Colchón', category: 'muebles', quantity: 1, approxVolumeM3: 2.8, weightKg: 95, icon: 'Bed' },
  { id: 'mv-3', name: 'Refrigerador Side-by-Side', category: 'electrodomesticos', quantity: 1, approxVolumeM3: 1.5, weightKg: 110, icon: 'Refrigerator' },
  { id: 'mv-4', name: 'Lavadora / Secadora Torre', category: 'electrodomesticos', quantity: 1, approxVolumeM3: 1.2, weightKg: 80, icon: 'WashingMachine' },
  { id: 'mv-5', name: 'Smart TV 65 pulgadas (En Caja)', category: 'fragil', quantity: 2, approxVolumeM3: 0.6, weightKg: 35, icon: 'Tv' },
  { id: 'mv-6', name: 'Mesa de Comedor 6 Puestos + Sillas', category: 'muebles', quantity: 1, approxVolumeM3: 1.8, weightKg: 70, icon: 'Table' },
  { id: 'mv-7', name: 'Cajas Grandes de Ropa y Enseres', category: 'cajas', quantity: 12, approxVolumeM3: 2.4, weightKg: 180, icon: 'Package' },
  { id: 'mv-8', name: 'Escritorio Ejecutivo de Madera', category: 'muebles', quantity: 1, approxVolumeM3: 0.9, weightKg: 45, icon: 'Briefcase' }
];

export const MOCK_HEAVY_CARGO: HeavyCargoRequest[] = [
  {
    id: 'hc-01',
    cargoType: 'pallets',
    description: '4 Pallets de Cemento & Mortero Especializado para Construcción',
    weightTons: 4.8,
    palletsCount: 4,
    dimensionsM: { l: 1.2, w: 1.0, h: 1.4 },
    requiresCrane: true,
    requiresFlatbed: false,
    origin: 'Haina Oriental, San Cristóbal',
    destination: 'Bávaro, Punta Cana',
    scheduledDate: '2026-08-30',
    status: 'approved',
    estimatedCost: 34500
  },
  {
    id: 'hc-02',
    cargoType: 'maquinaria',
    description: 'Generador Diésel Cummins 250kVA Insonorizado Industrial',
    weightTons: 3.2,
    dimensionsM: { l: 3.2, w: 1.4, h: 1.8 },
    requiresCrane: true,
    requiresFlatbed: true,
    origin: 'Zona Franca Las Américas, SDQ',
    destination: 'Parque Industrial Santiago',
    scheduledDate: '2026-09-02',
    status: 'quote_requested',
    estimatedCost: 58000
  }
];

export function calculateShippingRate(
  serviceType: string,
  weightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  distanceKm: number = 15
) {
  const volWeight = (lengthCm * widthCm * heightCm) / 5000;
  const billableWeight = Math.max(weightKg, volWeight);

  let baseRate = 180;
  let perKgRate = 35;
  let distanceCost = Math.round(distanceKm * 2.5);

  if (serviceType === 'nacional') {
    baseRate = 320;
    perKgRate = 45;
  } else if (serviceType === 'internacional') {
    baseRate = 450;
    perKgRate = 185;
  } else if (serviceType === 'mudanza') {
    baseRate = 4500;
    perKgRate = 60;
  } else if (serviceType === 'carga_pesada') {
    baseRate = 8500;
    perKgRate = 80;
  }

  const weightCost = Math.round(Math.max(0, billableWeight - 1) * perKgRate);
  const fuelSurcharge = Math.round((baseRate + distanceCost + weightCost) * 0.085);
  const totalCost = baseRate + distanceCost + weightCost + fuelSurcharge;

  return {
    baseRate,
    distanceCost,
    weightCost,
    fuelSurcharge,
    billableWeight,
    totalCost
  };
}

export const MOCK_DANGEROUS_ZONES: DangerousZone[] = [
  {
    id: 'dz-01',
    name: 'Sector Capotillo / La Ciénaga',
    sector: 'Capotillo & Ribera del Ozama',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    country: 'DO',
    riskLevel: 'critico',
    isSuspended: true,
    blockCod: true,
    forceBranchPickup: true,
    timeRestrictionStart: '09:00',
    timeRestrictionEnd: '13:00',
    assignedNearestBranchId: 'br-hq-sd',
    assignedNearestBranchName: 'Hub Central Santo Domingo (Av. Kennedy)',
    notes: 'Zona de alto riesgo por asaltos a repartidores en motocicleta. Despacho a domicilio suspendido temporalmente; clientes deben retirar en Hub Central.',
    center: { lat: 18.5020, lng: -69.8980 },
    affectedShipmentsCount: 14,
    lastIncidentReport: '2026-08-25: Intento de asalto a chofer motorizado con paquete de alto valor.'
  },
  {
    id: 'dz-02',
    name: 'Gualey & Los Guandules',
    sector: 'Los Guandules Periferia',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    country: 'DO',
    riskLevel: 'alto',
    isSuspended: false,
    blockCod: true,
    forceBranchPickup: false,
    timeRestrictionStart: '08:30',
    timeRestrictionEnd: '14:00',
    assignedNearestBranchId: 'br-hq-sd',
    assignedNearestBranchName: 'Hub Central Santo Domingo',
    notes: 'Prohibido el cobro de efectivo COD en esta zona. Solo envíos prepagados en furgón cerrado con candado de seguridad.',
    center: { lat: 18.4960, lng: -69.8780 },
    affectedShipmentsCount: 8,
    lastIncidentReport: '2026-08-18: Alerta preventiva de seguridad vecinal.'
  },
  {
    id: 'dz-03',
    name: 'Cienfuegos / Santa Lucía',
    sector: 'Cienfuegos Oeste',
    city: 'Santiago de los Caballeros',
    province: 'Santiago',
    country: 'DO',
    riskLevel: 'alto',
    isSuspended: false,
    blockCod: true,
    forceBranchPickup: false,
    timeRestrictionStart: '09:00',
    timeRestrictionEnd: '15:00',
    assignedNearestBranchId: 'br-sti',
    assignedNearestBranchName: 'Hub Cibao Santiago',
    notes: 'Requiere confirmación telefónica obligatoria previa y validación de DNI antes del ingreso del chofer.',
    center: { lat: 19.4650, lng: -70.7350 },
    affectedShipmentsCount: 6,
    lastIncidentReport: '2026-08-10: Reporte de incidente menor en callejón no asfaltado.'
  },
  {
    id: 'dz-04',
    name: 'Boca Chica Periferia Playa Este',
    sector: 'Los Tanquecitos / Altos de Andrés',
    city: 'Boca Chica',
    province: 'Santo Domingo Este',
    country: 'DO',
    riskLevel: 'medio',
    isSuspended: false,
    blockCod: false,
    forceBranchPickup: false,
    timeRestrictionStart: '09:00',
    timeRestrictionEnd: '17:00',
    assignedNearestBranchId: 'br-hq-sd',
    assignedNearestBranchName: 'Hub Central Santo Domingo',
    notes: 'Horario regular pero con monitoreo GPS estricto cada 3 minutos.',
    center: { lat: 18.4550, lng: -69.6100 },
    affectedShipmentsCount: 3
  }
];

export const MOCK_COVERAGE_ZONES: CoverageZoneRate[] = [
  {
    id: 'cz-metro-sdq',
    code: 'Z-METRO-01',
    name: 'Zona 1: Gran Santo Domingo & Distrito Nacional',
    country: 'DO',
    provinces: ['Distrito Nacional', 'Santo Domingo Este', 'Santo Domingo Oeste', 'Santo Domingo Norte'],
    type: 'urbana',
    baseRateDop: 180,
    perKgRateDop: 25,
    fuelSurchargePercent: 6.5,
    volumetricDivisor: 5000,
    estimatedDeliveryTime: 'Same-Day (2 - 4 horas) / 24h regular',
    isActive: true
  },
  {
    id: 'cz-cibao',
    code: 'Z-CIBAO-02',
    name: 'Zona 2: Corredor Cibao Central',
    country: 'DO',
    provinces: ['Santiago', 'La Vega', 'Espaillat (Moca)', 'Duarte (San Fco)', 'Puerto Plata'],
    type: 'interprovincial',
    baseRateDop: 320,
    perKgRateDop: 35,
    fuelSurchargePercent: 8.5,
    volumetricDivisor: 5000,
    estimatedDeliveryTime: '24 horas hábiles (Next-Day)',
    isActive: true
  },
  {
    id: 'cz-este',
    code: 'Z-ESTE-03',
    name: 'Zona 3: Polo Turístico Este & Hoteles',
    country: 'DO',
    provinces: ['La Altagracia (Punta Cana/Bávaro)', 'La Romana', 'San Pedro de Macorís', 'El Seibo'],
    type: 'interprovincial',
    baseRateDop: 360,
    perKgRateDop: 40,
    fuelSurchargePercent: 9.0,
    volumetricDivisor: 5000,
    estimatedDeliveryTime: '24 a 48 horas hábiles',
    isActive: true
  },
  {
    id: 'cz-sur-remoto',
    code: 'Z-SUR-04',
    name: 'Zona 4: Sur Profundo & Frontera (Difícil Acceso)',
    country: 'DO',
    provinces: ['Barahona', 'Pedernales', 'San Juan de la Maguana', 'Bahoruco', 'Elías Piña', 'Dajabón'],
    type: 'remota',
    baseRateDop: 480,
    perKgRateDop: 55,
    fuelSurchargePercent: 12.0,
    volumetricDivisor: 5000,
    estimatedDeliveryTime: '48 a 72 horas (Frecuencia Semanal)',
    requiresSpecialTransport: true,
    isActive: true
  },
  {
    id: 'cz-intl-usa',
    code: 'Z-INTL-USA',
    name: 'Zona Internacional Aérea Express (Miami Casillero)',
    country: 'US',
    provinces: ['Florida (Miami Hub)', 'New York', 'Texas'],
    type: 'internacional',
    baseRateDop: 450,
    perKgRateDop: 195,
    baseRateUsd: 7.50,
    perLbRateUsd: 3.25,
    fuelSurchargePercent: 14.5,
    volumetricDivisor: 6000,
    estimatedDeliveryTime: '48 a 72 horas vía Vuelo Diario MIA-SDQ',
    isActive: true
  },
  {
    id: 'cz-intl-es',
    code: 'Z-INTL-ESP',
    name: 'Zona Internacional Aérea Europa (Madrid Barajas)',
    country: 'ES',
    provinces: ['Madrid', 'Barcelona', 'Valencia'],
    type: 'internacional',
    baseRateDop: 620,
    perKgRateDop: 320,
    baseRateUsd: 12.00,
    perLbRateUsd: 5.50,
    fuelSurchargePercent: 16.0,
    volumetricDivisor: 6000,
    estimatedDeliveryTime: '3 a 5 días hábiles vía Vuelo MAD-SDQ',
    isActive: true
  }
];

export const MOCK_ZERNIO_CONFIG: ZernioWebhookConfig = {
  webhookUrl: 'https://api.gopaq.com.do/api/v1/zernio/webhooks',
  secretToken: 'zrn_sec_live_994a88f01b9201948',
  cliConnected: true,
  cliVersion: 'v2.8.4-cli',
  activeEvents: [
    'messages.incoming',
    'messages.status',
    'calls.voice_started',
    'calls.transcription_ready',
    'ai.sentiment_escalated',
    'driver.masked_relay'
  ],
  lastPingTimestamp: 'Hace 4 segundos',
  whatsappCloudConfig: {
    phoneNumberId: 'phone_waba_881920491029',
    businessAccountId: 'waba_acc_gopaq_rd',
    businessProxyNumber: '+1 (809) 555-7271',
    verifiedStatus: 'verified'
  },
  metaFacebookConfig: {
    pageId: 'fb_page_gopaq_logistics',
    pageName: 'GoPaq Dominicana - Mensajería & Courier',
    appSecretSet: true
  },
  instagramConfig: {
    accountId: 'ig_acc_gopaq_rd_official',
    username: '@gopaq.rd',
    verifiedStatus: 'verified'
  },
  aiEngineConfig: {
    model: 'gemini-3.7-flash',
    autoReplyEnabled: true,
    voiceAgentEnabled: true,
    confidenceThreshold: 0.88,
    escalateToHumanOnUrgent: true,
    businessKnowledgePrompt: 'Eres el Asistente Oficial con IA de GoPaq Dominicana. Brindas información en tiempo real de rastreo, tarifas de paquetería, tiempos de entrega y gestionas confirmación de entregas para conductores sin revelar teléfonos privados.'
  }
};

export const MOCK_SOCIAL_OAUTH_CONNECTIONS: SocialOAuthConnection[] = [
  {
    id: 'conn-whatsapp',
    provider: 'whatsapp',
    name: 'WhatsApp Business Cloud API',
    connected: true,
    status: 'active',
    accountIdentifier: '+1 (809) 555-7271 (Oficial Verificado)',
    connectedAt: 'Conectado hace 14 días • Meta Cloud API',
    tokenExpiresIn: 'Token Permanente (System User)',
    scopes: [
      'whatsapp_business_messaging',
      'whatsapp_business_management',
      'business_management'
    ],
    webhookStatus: 'verified',
    credentials: {
      appId: '109284910294819',
      accountId: 'waba_acc_gopaq_rd',
      accessToken: 'EAAOx9...[Meta System Token]',
      proxyNumber: '+1 (809) 555-7271',
      callbackUrl: 'https://api.gopaq.com.do/api/v1/webhooks/whatsapp'
    }
  },
  {
    id: 'conn-instagram',
    provider: 'instagram',
    name: 'Instagram Direct Messaging',
    connected: true,
    status: 'active',
    accountIdentifier: '@gopaq.rd (Cuenta Profesional Verificada)',
    connectedAt: 'Conectado hace 8 días • Graph API v20.0',
    tokenExpiresIn: '60 días restantes (Auto-Refresh)',
    scopes: [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list'
    ],
    webhookStatus: 'verified',
    credentials: {
      appId: '109284910294819',
      accountId: 'ig_acc_gopaq_rd_official',
      accessToken: 'EAAYb7...[Instagram User Token]',
      callbackUrl: 'https://api.gopaq.com.do/api/v1/webhooks/instagram'
    }
  },
  {
    id: 'conn-facebook',
    provider: 'facebook',
    name: 'Facebook Messenger Pages API',
    connected: true,
    status: 'active',
    accountIdentifier: 'GoPaq Dominicana (ID: 1048291048)',
    connectedAt: 'Conectado hace 21 días • Meta Pages',
    tokenExpiresIn: 'Token Permanente de Página',
    scopes: [
      'pages_messaging',
      'pages_manage_metadata',
      'pages_read_engagement'
    ],
    webhookStatus: 'verified',
    credentials: {
      appId: '109284910294819',
      accountId: 'fb_page_gopaq_logistics',
      accessToken: 'EAAMk4...[Page Access Token]',
      secretKey: '••••••••••••••••••••••••••••••',
      callbackUrl: 'https://api.gopaq.com.do/api/v1/webhooks/facebook'
    }
  },
  {
    id: 'conn-zernio',
    provider: 'zernio',
    name: 'Motor Cloud AI & Webhook Bridge',
    connected: true,
    status: 'active',
    accountIdentifier: 'Cluster Santo Domingo • gopaq-core-prod',
    connectedAt: 'Conectado hace 30 días • Webhook Relay v2.8',
    tokenExpiresIn: 'Activo / Monitoreo 24/7',
    scopes: [
      'ai.gemini_flash_interactions',
      'telephony.voice_bot_trunk',
      'relay.number_masking'
    ],
    webhookStatus: 'listening',
    credentials: {
      appId: 'gp_engine_994a',
      secretKey: 'zrn_sec_live_994a88f01b9201948',
      cluster: 'us-east1 (Dominican Republic Edge)',
      callbackUrl: 'https://api.gopaq.com.do/api/v1/webhooks/relay'
    }
  },
  {
    id: 'conn-pusher',
    provider: 'pusher',
    name: 'Pusher Channels WebSockets',
    connected: true,
    status: 'active',
    accountIdentifier: 'App ID: 1849201 • Cluster: us2',
    connectedAt: 'Conectado • 142 sockets en vivo',
    tokenExpiresIn: 'Conexión Permanente WSS',
    scopes: [
      'channels.presence_fleet',
      'channels.private_relay',
      'channels.public_tracking'
    ],
    webhookStatus: 'listening',
    credentials: {
      appId: '1849201',
      accessToken: 'gopaq_pusher_key_live',
      secretKey: '••••••••••••••••••••••••••••••',
      cluster: 'us2'
    }
  }
];

export const MOCK_PUSHER_CONFIG: PusherConfig = {
  appId: '1849201',
  key: 'gopaq_pusher_key_live',
  secret: '••••••••••••••••••••••••••••••',
  cluster: 'us2',
  encrypted: true,
  connectionStatus: 'connected',
  lastPingMs: 24,
  activeSocketsCount: 142,
  channelsSubscribed: [
    'presence-fleet-live',
    'private-driver-carlos-mendez',
    'private-driver-rafael-almonte',
    'private-chat-relay-GP-8924',
    'public-tracking-updates',
    'super-admin-events'
  ]
};

export const MOCK_ZERNIO_MESSAGES: ZernioMessage[] = [
  {
    id: 'msg-01',
    channel: 'whatsapp',
    senderRole: 'customer',
    senderName: 'Dra. María Elena Rodríguez',
    senderMaskedId: 'Cliente (Destinatario • NX-8924-DO)',
    recipientMaskedId: 'Driver Carlos (GoPaq Relay #8831)',
    text: 'Hola, buenas tardes. ¿A qué hora aproximada pasarán por la Torre Acrópolis? Tengo consulta médica a las 3:30 PM.',
    timestamp: '02:15 PM',
    status: 'read',
    trackingNumber: 'NX-8924-DO',
    shipmentId: 'shp-01',
    sentiment: 'neutral'
  },
  {
    id: 'msg-02',
    channel: 'whatsapp',
    senderRole: 'ai_agent',
    senderName: 'GoPaq AI Asistente',
    senderMaskedId: 'GoPaq Asistente Inteligente',
    recipientMaskedId: 'Cliente (Destinatario • NX-8924-DO)',
    text: '¡Hola Dra. Rodríguez! Su conductor Carlos Méndez se encuentra a 2 paradas de distancia (~25 min). Su entrega está programada para las 02:40 PM en el Piso 14. ¿Desea que el conductor suba directamente a recepción?',
    timestamp: '02:16 PM',
    status: 'delivered',
    trackingNumber: 'NX-8924-DO',
    isAiGenerated: true,
    sentiment: 'positive'
  },
  {
    id: 'msg-03',
    channel: 'whatsapp',
    senderRole: 'customer',
    senderName: 'Dra. María Elena Rodríguez',
    senderMaskedId: 'Cliente (Destinatario • NX-8924-DO)',
    recipientMaskedId: 'Driver Carlos (GoPaq Relay #8831)',
    text: 'Sí por favor, mi secretaria Maritza tiene el pago COD en efectivo de RD$ 2,850 listo.',
    timestamp: '02:18 PM',
    status: 'read',
    trackingNumber: 'NX-8924-DO',
    sentiment: 'positive'
  },
  {
    id: 'msg-04',
    channel: 'whatsapp',
    senderRole: 'driver',
    senderName: 'Carlos Méndez (Driver)',
    senderMaskedId: 'Driver Carlos (GoPaq Relay #8831)',
    recipientMaskedId: 'Cliente (Destinatario • NX-8924-DO)',
    text: 'Enterado Dra. María Elena, voy en camino con el paquete refrigerado. Llego en breve con recibo térmico.',
    timestamp: '02:20 PM',
    status: 'delivered',
    trackingNumber: 'NX-8924-DO',
    sentiment: 'positive'
  },
  {
    id: 'msg-05',
    channel: 'instagram',
    senderRole: 'customer',
    senderName: 'Laura Castillo (@laurac_boutique)',
    senderMaskedId: 'Cliente IG (@laurac_boutique)',
    recipientMaskedId: 'GoPaq Atención Oficial',
    text: 'Hola! Hice un envío de ropa hoy en la mañana con guía GPQ-4491-DO. ¿Ya salió hacia Santiago?',
    timestamp: '02:05 PM',
    status: 'delivered',
    trackingNumber: 'GPQ-4491-DO',
    sentiment: 'neutral'
  },
  {
    id: 'msg-06',
    channel: 'instagram',
    senderRole: 'ai_agent',
    senderName: 'GoPaq AI Asistente',
    senderMaskedId: 'GoPaq Asistente Inteligente',
    recipientMaskedId: 'Cliente IG (@laurac_boutique)',
    text: '¡Hola Laura! Tu paquete GPQ-4491-DO ya fue procesado en el Hub Central y asignado a la Troncal Regional. Llegará a Santiago mañana a primera hora (09:30 AM). Puedes rastrearlo en tiempo real aquí: gopaq.com.do/track/GPQ-4491-DO',
    timestamp: '02:06 PM',
    status: 'delivered',
    trackingNumber: 'GPQ-4491-DO',
    isAiGenerated: true,
    sentiment: 'positive'
  },
  {
    id: 'msg-07',
    channel: 'facebook',
    senderRole: 'customer',
    senderName: 'Juan Carlos Peña (Facebook Page)',
    senderMaskedId: 'Cliente FB (Remitente • Cotización Carga)',
    recipientMaskedId: 'GoPaq Central Support',
    text: 'Buenas tardes, necesito enviar 4 pallets de materiales desde Santo Domingo a Puerto Plata mañana. ¿Tienen camión cerrado disponible y cuál sería la tarifa?',
    timestamp: '01:50 PM',
    status: 'delivered',
    sentiment: 'neutral'
  },
  {
    id: 'msg-08',
    channel: 'facebook',
    senderRole: 'ai_agent',
    senderName: 'GoPaq AI Asistente',
    senderMaskedId: 'GoPaq Asistente Inteligente',
    recipientMaskedId: 'Cliente FB (Remitente • Cotización Carga)',
    text: '¡Hola Juan Carlos! Con gusto. Para 4 pallets (~2.8 tons) en camión cerrado en ruta troncal SDQ-POP, nuestra tarifa corporativa estimada es de RD$ 18,500 + seguro opcional. Tenemos salida nocturna a las 21:00 hrs. ¿Deseas agendar la recolección hoy mismo?',
    timestamp: '01:51 PM',
    status: 'delivered',
    trackingNumber: 'NX-8930-DO',
    isAiGenerated: true,
    sentiment: 'positive'
  }
];

export const MOCK_ZERNIO_CALLS: ZernioCallLog[] = [
  {
    id: 'call-01',
    channel: 'whatsapp_call',
    callType: 'ai_delivery_confirmation',
    status: 'completed',
    callerMasked: 'GoPaq Voice Bot Oficial (+1 809 555-7271)',
    calleeMasked: 'Destinatario: Lic. Andrés Brea (NX-8930-DO)',
    trackingNumber: 'NX-8930-DO',
    durationSeconds: 48,
    timestamp: 'Hace 12 min',
    aiSummary: 'El cliente confirmó que estará presente en Calle Max Henríquez Ureña #84 a las 3:10 PM y aprobó la entrega con firma digital.',
    transcript: 'IA: "Hola Lic. Andrés, le llamamos de GoPaq Dominicana para confirmar su entrega programada para hoy a las 3:10 PM con valor COD de RD$ 1,950." \nCliente: "Sí, perfecto, aquí estaré en la oficina de abogados en el 2do piso." \nIA: "Excelente, su conductor asignado Rafael ya tiene la instrucción. ¡Muchas gracias por elegir GoPaq!"',
    customerConfirmedDelivery: true
  },
  {
    id: 'call-02',
    channel: 'whatsapp_call',
    callType: 'driver_customer_proxy',
    status: 'completed',
    callerMasked: 'Driver Carlos (Proxy GoPaq #8831)',
    calleeMasked: 'Destinatario: Dra. María Elena (NX-8924-DO)',
    trackingNumber: 'NX-8924-DO',
    durationSeconds: 72,
    timestamp: 'Hace 35 min',
    aiSummary: 'Coordinación de acceso en portería de la Torre Acrópolis. Se autorizó la entrada de la Hilux GoPaq al área de carga.',
    transcript: 'Conductor: "Buenas tardes, hablo con la Dra. María Elena a través de la línea segura de GoPaq. Estoy en la rampa de carga de Acrópolis." \nCliente: "Hola Carlos, ya notifiqué al oficial de seguridad para que le permita el ascensor de servicio."',
    customerConfirmedDelivery: true
  },
  {
    id: 'call-03',
    channel: 'whatsapp_call',
    callType: 'ai_delivery_confirmation',
    status: 'scheduled',
    callerMasked: 'GoPaq Voice Bot Oficial (+1 809 555-7271)',
    calleeMasked: 'Destinatario: Karla Morales (NX-8955-DO)',
    trackingNumber: 'NX-8955-DO',
    durationSeconds: 0,
    timestamp: 'Programada 03:45 PM',
    aiSummary: 'Llamada automática pre-despacho programada 30 minutos antes del arribo en Bella Vista.',
    transcript: 'En cola para ejecución automática vía GoPaq Voice Trunking...',
    customerConfirmedDelivery: false
  }
];


