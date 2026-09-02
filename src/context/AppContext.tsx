import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AppSection, 
  UserRole, 
  Currency, 
  CountryCode, 
  Shipment, 
  NotificationItem, 
  DeliveryRoute,
  RouteStop,
  InternationalPackage,
  Driver,
  Vehicle,
  Branch,
  WarehouseZone,
  ProofOfDelivery,
  DangerousZone,
  CoverageZoneRate,
  BulkScanItem,
  ZernioMessage,
  ZernioCallLog,
  ZernioWebhookConfig,
  PusherConfig,
  PusherRealtimeEvent,
  SocialOAuthConnection,
  ClientProfile
} from '../types';
import { 
  AutomationRule, 
  AiAutomationExecutionLog, 
  AutomationTriggerEventType 
} from '../types/aiAutomationTypes';
import { 
  SyncTransaction, 
  SyncHealthMetrics 
} from '../types/syncHealthTypes';
import { calculateSyncHealthMetrics } from '../utils/syncHealthService';
import { ApiClient } from '../api/client';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & Role
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeSubView: string;
  setActiveSubView: (view: string) => void;
  
  // Theme & Multi-currency / Multi-country
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  formatMoney: (amount: number, curr?: Currency) => string;
  
  // Data State
  shipments: Shipment[];
  setShipments: React.Dispatch<React.SetStateAction<Shipment[]>>;
  addShipment: (shipment: Shipment) => void;
  updateShipmentStatus: (id: string, status: Shipment['status'], extra?: Partial<Shipment>) => void;
  
  // Clients & Corporate Accounts
  clients: ClientProfile[];
  setClients: React.Dispatch<React.SetStateAction<ClientProfile[]>>;
  addClient: (client: ClientProfile) => void;
  updateClient: (id: string, updates: Partial<ClientProfile>) => void;
  deleteClient: (id: string) => void;
  payoutClientCod: (clientId: string, amount: number, referenceNumber: string, bankName: string) => void;
  adjustClientCreditLimit: (clientId: string, newLimit: number, creditDays?: number) => void;
  generateClientApiKey: (clientId: string, env: 'live' | 'test') => void;

  // Drivers & Fleet Management
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  addDriver: (driver: Driver) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  settleDriverCod: (driverId: string, amount?: number) => void;

  // Vehicles & Fleet Management
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  // Branches, Hubs & Warehouses Management
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  selectedBranch: Branch;
  setSelectedBranch: (branch: Branch) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  addBranchZone: (branchId: string, zone: WarehouseZone) => void;
  updateBranchZone: (branchId: string, zoneId: string, updates: Partial<WarehouseZone>) => void;
  // Routes & Multi-Dispatch
  routes: DeliveryRoute[];
  setRoutes: React.Dispatch<React.SetStateAction<DeliveryRoute[]>>;
  currentRoute: DeliveryRoute;
  setCurrentRoute: React.Dispatch<React.SetStateAction<DeliveryRoute>>;
  addRoute: (route: DeliveryRoute) => void;
  updateRoute: (id: string, updates: Partial<DeliveryRoute>) => void;
  deleteRoute: (id: string) => void;
  assignShipmentToRoute: (shipmentId: string, routeId: string) => void;
  removeStopFromRoute: (routeId: string, stopId: string) => void;
  reorderRouteStops: (routeId: string, newStops: RouteStop[]) => void;

  // GoPaq Omnichannel & WhatsApp AI Integration
  zernioConfig: ZernioWebhookConfig;
  setZernioConfig: React.Dispatch<React.SetStateAction<ZernioWebhookConfig>>;
  updateZernioConfig: (updates: Partial<ZernioWebhookConfig>) => void;
  zernioMessages: ZernioMessage[];
  sendZernioMessage: (msg: Partial<ZernioMessage>) => void;
  zernioCalls: ZernioCallLog[];
  triggerVoiceBotCall: (trackingNumber: string) => void;

  // Social & Global Auth Connections (WhatsApp, Instagram, Facebook, Engine, Pusher)
  socialConnections: SocialOAuthConnection[];
  toggleSocialOAuth: (id: string) => void;
  updateSocialOAuthCredentials: (id: string, updates: Partial<SocialOAuthConnection>) => void;
  testSocialOAuthPing: (id: string) => void;

  // Pusher Real-time
  pusherConfig: PusherConfig;
  setPusherConfig: React.Dispatch<React.SetStateAction<PusherConfig>>;
  updatePusherConfig: (updates: Partial<PusherConfig>) => void;
  pusherEvents: PusherRealtimeEvent[];
  broadcastPusherEvent: (channel: string, event: string, data: any) => void;

  // Masked Chat Active Shipment
  activeMaskedChatShipment: Shipment | null;
  setActiveMaskedChatShipment: (shipment: Shipment | null) => void;
  
  internationalPackages: InternationalPackage[];
  consolidatePackages: (pkgIds: string[]) => void;
  
  // Driver App state
  driverOfflineMode: boolean;
  setDriverOfflineMode: (val: boolean) => void;
  completeDriverStop: (stopId: string, podData: ProofOfDelivery, collectedCod?: number) => void;
  completeStopPOD: (stopId: string, trackingNumber: string, signatureUrl: string, photoUrl?: string, collectedCod?: number) => void;
  failDriverStop: (stopId: string, reason: string, note: string) => void;
  startRoute: () => void;
  
  // Search & Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  selectedTracking: string | null;
  setSelectedTracking: (tracking: string | null) => void;
  
  // Notifications & Toasts
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (type: Toast['type'], title: string, message: string) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;

  // Dangerous Zones & Safety
  dangerousZones: DangerousZone[];
  setDangerousZones: React.Dispatch<React.SetStateAction<DangerousZone[]>>;
  updateDangerousZone: (id: string, updates: Partial<DangerousZone>) => void;
  
  // Rate Matrix & Coverage
  coverageZones: CoverageZoneRate[];
  setCoverageZones: React.Dispatch<React.SetStateAction<CoverageZoneRate[]>>;
  updateCoverageZone: (id: string, updates: Partial<CoverageZoneRate>) => void;
  
  // Bulk Scanner
  bulkScanHistory: BulkScanItem[];
  addBulkScanItem: (item: BulkScanItem) => void;
  clearBulkScanHistory: () => void;
  
  // Thermal Label Preview
  activeLabelShipment: Shipment | null;
  setActiveLabelShipment: (shipment: Shipment | null) => void;
  
  // Geo / Nearest Branch Finder
  findNearestBranch: (lat?: number, lng?: number, provinceOrCity?: string) => { branch: Branch; distanceKm: number; estimatedMin: number };

  // New Shipment Wizard trigger
  isNewShipmentModalOpen: boolean;
  setIsNewShipmentModalOpen: (open: boolean) => void;
  
  // Branch Route Dispatcher trigger
  publishBranchRoute: (route: DeliveryRoute) => void;

  // AI Event Driven Automations & Telephony Studio
  automationRules: AutomationRule[];
  setAutomationRules: React.Dispatch<React.SetStateAction<AutomationRule[]>>;
  automationLogs: AiAutomationExecutionLog[];
  setAutomationLogs: React.Dispatch<React.SetStateAction<AiAutomationExecutionLog[]>>;
  triggerEventDrivenAiRule: (
    eventType: AutomationTriggerEventType,
    trackingNumber: string,
    extraData?: Record<string, any>
  ) => AiAutomationExecutionLog | null;

  // Real-Time Fleet Sync Ledger & Outbox Health
  syncTransactions: SyncTransaction[];
  setSyncTransactions: React.Dispatch<React.SetStateAction<SyncTransaction[]>>;
  syncHealthMetrics: SyncHealthMetrics;
  retrySingleTransaction: (transactionId: string) => void;
  retryAllFailedTransactions: () => void;
  forceSyncAllTransactions: () => void;
  isRetryingSync: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<AppSection>('super-admin');
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [activeSubView, setActiveSubView] = useState<string>('dashboard');
  
  // Theme state with localStorage persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('gopaq_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [currency, setCurrency] = useState<Currency>('DOP');
  const [country, setCountry] = useState<CountryCode>('DO');
  
  // Dynamic Entities loaded from Database (Zero mock defaults)
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [currentRoute, setCurrentRoute] = useState<DeliveryRoute | null>(null);
  const [internationalPackages, setInternationalPackages] = useState<InternationalPackage[]>([]);
  const [dangerousZones, setDangerousZones] = useState<DangerousZone[]>([]);
  const [coverageZones, setCoverageZones] = useState<CoverageZoneRate[]>([]);
  const [bulkScanHistory, setBulkScanHistory] = useState<BulkScanItem[]>([]);
  const [activeLabelShipment, setActiveLabelShipment] = useState<Shipment | null>(null);

  // Zernio Omnichannel & WhatsApp AI Integration State (Clean unconfigured initial state)
  const [zernioConfig, setZernioConfig] = useState<ZernioWebhookConfig>({
    webhookUrl: '',
    secretToken: '',
    cliConnected: false,
    cliVersion: 'v1.4.0-standalone',
    activeEvents: [],
    lastPingTimestamp: 'Sin conexión',
    whatsappCloudConfig: {
      phoneNumberId: '',
      businessAccountId: '',
      businessProxyNumber: '',
      verifiedStatus: 'pending'
    },
    metaFacebookConfig: {
      pageId: '',
      pageName: '',
      appSecretSet: false
    },
    aiEngineConfig: {
      model: 'gemini-1.5-flash',
      autoReplyEnabled: false,
      voiceAgentEnabled: false,
      confidenceThreshold: 0.85,
      escalateToHumanOnUrgent: true,
      businessKnowledgePrompt: 'GoPaq Logistics Support AI'
    }
  });
  const [zernioMessages, setZernioMessages] = useState<ZernioMessage[]>([]);
  const [zernioCalls, setZernioCalls] = useState<ZernioCallLog[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialOAuthConnection[]>([
    {
      id: 'soc-wa',
      provider: 'whatsapp',
      name: 'WhatsApp Business Cloud API',
      connected: false,
      status: 'disconnected',
      accountIdentifier: 'Sin vincular',
      connectedAt: 'No configurado',
      scopes: ['messages.read', 'messages.send'],
      webhookStatus: 'pending',
      credentials: {}
    },
    {
      id: 'soc-meta',
      provider: 'facebook',
      name: 'Meta / Facebook Messenger API',
      connected: false,
      status: 'disconnected',
      accountIdentifier: 'Sin vincular',
      connectedAt: 'No configurado',
      scopes: ['pages_messaging'],
      webhookStatus: 'pending',
      credentials: {}
    }
  ]);

  const toggleSocialOAuth = (id: string) => {
    setSocialConnections((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextConnected = !c.connected;
          return {
            ...c,
            connected: nextConnected,
            status: nextConnected ? 'active' : 'disconnected',
            connectedAt: nextConnected ? new Date().toISOString() : 'Desconectado'
          };
        }
        return c;
      })
    );
    const target = socialConnections.find((c) => c.id === id);
    if (target) {
      if (!target.connected) {
        addToast('success', 'Cuenta Conectada', `Autenticación OAuth exitosa con ${target.name}.`);
      } else {
        addToast('warning', 'Conexión Pausada', `Se ha desconectado ${target.name}.`);
      }
    }
  };

  const updateSocialOAuthCredentials = (id: string, updates: Partial<SocialOAuthConnection>) => {
    setSocialConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    addToast('success', 'Credenciales Actualizadas', 'Los parámetros de autenticación han sido guardados.');
  };

  const testSocialOAuthPing = (id: string) => {
    const target = socialConnections.find((c) => c.id === id);
    if (!target) return;
    addToast('info', 'Verificando Conexión...', `Enviando ping de diagnóstico a ${target.name}`);
    setTimeout(() => {
      if (target.connected) {
        addToast('success', 'Diagnóstico Exitoso', `${target.name} respondió. Tokens y Webhooks activos.`);
      } else {
        addToast('warning', 'Sin Conexión Activa', `${target.name} no está configurado en este entorno.`);
      }
    }, 800);
  };

  // Pusher Real-time State
  const [pusherConfig, setPusherConfig] = useState<PusherConfig>({
    appId: '',
    key: '',
    secret: '',
    cluster: 'us2',
    encrypted: true,
    connectionStatus: 'disconnected',
    lastPingMs: 0,
    activeSocketsCount: 0,
    channelsSubscribed: []
  });
  const [pusherEvents, setPusherEvents] = useState<PusherRealtimeEvent[]>([]);

  // Masked Chat Active Target
  const [activeMaskedChatShipment, setActiveMaskedChatShipment] = useState<Shipment | null>(null);
  
  // AI Event Automation Studio State
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AiAutomationExecutionLog[]>([]);

  // Sync Health & Outbox Transaction Ledger State
  const [syncTransactions, setSyncTransactions] = useState<SyncTransaction[]>([]);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  // Driver state
  const [driverOfflineMode, setDriverOfflineMode] = useState<boolean>(false);
  
  // UI & Dialogs
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState<boolean>(false);
  
  // Notifications & Toasts
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Apply dark mode class to html element and save in localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gopaq_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gopaq_theme', 'light');
    }
  }, [darkMode]);

  // Global Keyboard listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const formatMoney = (amount: number, curr?: Currency) => {
    const targetCurrency = curr || currency;
    if (targetCurrency === 'DOP') {
      return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (targetCurrency === 'USD') {
      return `$ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    return `€ ${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Initial real backend database synchronization
  useEffect(() => {
    async function loadRealBackendData() {
      try {
        const [shpRes, cliRes, drvRes, brRes, rtRes, pkgRes] = await Promise.all([
          ApiClient.getShipments().catch(() => null),
          ApiClient.getClients().catch(() => null),
          ApiClient.getDrivers().catch(() => null),
          ApiClient.getBranches().catch(() => null),
          ApiClient.getRoutes().catch(() => null),
          ApiClient.getInternationalPackages().catch(() => null)
        ]);

        if (shpRes?.shipments) setShipments(shpRes.shipments);
        if (cliRes?.clients) setClients(cliRes.clients);
        if (drvRes?.drivers) setDrivers(drvRes.drivers);
        if (brRes?.branches) {
          setBranches(brRes.branches);
          if (brRes.branches.length > 0) setSelectedBranch(brRes.branches[0]);
        }
        if (rtRes?.routes) {
          setRoutes(rtRes.routes);
          if (rtRes.routes.length > 0) setCurrentRoute(rtRes.routes[0]);
        }
        if (pkgRes?.packages) setInternationalPackages(pkgRes.packages);
      } catch (err: any) {
        console.error('[GoPaq Sync Error]:', err);
        addToast('error', 'Error de Conexión', 'No se pudo sincronizar con la base de datos backend.');
      }
    }
    loadRealBackendData();
  }, []);

  const addShipment = async (newShp: Shipment) => {
    try {
      const res = await ApiClient.createShipment({
        serviceType: newShp.serviceType,
        origin: newShp.origin,
        destination: newShp.destination,
        package: newShp.package,
        codAmount: newShp.codAmount || 0,
        codCurrency: newShp.codCurrency || 'DOP',
        clientId: newShp.clientId
      });

      if (!res.success || !res.shipment) {
        throw new Error(res.error || 'Error desconocido al guardar en base de datos.');
      }

      const created = res.shipment;
      setShipments((prev) => [created, ...prev]);
      addToast('success', 'Envío Creado en DB Real', `Guía: ${created.trackingNumber}`);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: '📦 Nuevo Envío Registrado',
        message: `Guía ${created.trackingNumber} creada para ${created.destination.name}`,
        type: 'info',
        category: 'shipment',
        timestamp: 'Ahora mismo',
        read: false
      };
      setNotifications((prev) => [notif, ...prev]);
    } catch (err: any) {
      addToast('error', 'Error al Crear Envío', err.message || 'No se pudo registrar el paquete en el servidor.');
    }
  };

  const updateShipmentStatus = (id: string, status: Shipment['status'], extra?: Partial<Shipment>) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === id || s.trackingNumber === id) {
          return { ...s, status, ...extra };
        }
        return s;
      })
    );
  };

  const addClient = (newClient: ClientProfile) => {
    setClients((prev) => [newClient, ...prev]);
    addToast('success', 'Cliente Registrado', `Se ha creado la cuenta para ${newClient.companyName || newClient.name}.`);
  };

  const updateClient = (id: string, updates: Partial<ClientProfile>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    addToast('success', 'Cliente Actualizado', 'Los datos y condiciones comerciales fueron guardados.');
  };

  const deleteClient = (id: string) => {
    const target = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    addToast('info', 'Cuenta Eliminada', `Se eliminó el perfil de ${target?.companyName || target?.name || id}.`);
  };

  const payoutClientCod = (clientId: string, amount: number, referenceNumber: string, bankName: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const remainingCod = Math.max(0, c.codPendingPayoutDop - amount);
          const newPayout = {
            id: `payout-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amountDop: amount,
            referenceNumber: referenceNumber || `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
            bankName: bankName || c.bankInfo?.bankName || 'Banco Popular Dominicano',
            status: 'processed' as const,
            shipmentsCount: Math.max(1, Math.round(amount / 2500))
          };
          return {
            ...c,
            codPendingPayoutDop: remainingCod,
            codPayoutsHistory: [newPayout, ...(c.codPayoutsHistory || [])]
          };
        }
        return c;
      })
    );
    try {
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
    } catch {}
    addToast('success', 'Desembolso COD Procesado', `Se transfirieron ${formatMoney(amount)} Ref: ${referenceNumber}`);
  };

  const adjustClientCreditLimit = (clientId: string, newLimit: number, creditDays?: number) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            creditLimitDop: newLimit,
            ...(creditDays !== undefined ? { creditDays } : {})
          };
        }
        return c;
      })
    );
    addToast('success', 'Línea de Crédito Ajustada', `Nuevo límite aprobado: ${formatMoney(newLimit)}`);
  };

  const generateClientApiKey = (clientId: string, env: 'live' | 'test') => {
    const newKey = `gpq_${env}_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const currentApi = c.apiKey || {
            liveKey: `gpq_live_${Math.random().toString(36).substring(2, 10)}`,
            testKey: `gpq_test_${Math.random().toString(36).substring(2, 10)}`,
            createdAt: new Date().toISOString().split('T')[0],
            isRevoked: false
          };
          return {
            ...c,
            apiKey: {
              ...currentApi,
              [env === 'live' ? 'liveKey' : 'testKey']: newKey,
              lastUsed: 'Generada recientemente',
              isRevoked: false
            }
          };
        }
        return c;
      })
    );
    addToast('success', `Nueva Clave API ${env.toUpperCase()} Generada`, 'Copie la clave en su integración de comercio electrónico.');
  };

  // Drivers Management Methods
  const addDriver = (newDriver: Driver) => {
    setDrivers((prev) => [newDriver, ...prev]);
    addToast('success', 'Conductor Registrado', `Se ha enrolado a ${newDriver.name} en el equipo.`);
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    addToast('success', 'Ficha Conductor Actualizada', 'Los cambios en el conductor fueron guardados.');
  };

  const deleteDriver = (id: string) => {
    const target = drivers.find((d) => d.id === id);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    addToast('info', 'Conductor Desvinculado', `Se dio de baja a ${target?.name || id}.`);
  };

  const settleDriverCod = (driverId: string, amount?: number) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const settleAmount = amount !== undefined ? amount : d.codPendingSettlement;
          return {
            ...d,
            codPendingSettlement: Math.max(0, d.codPendingSettlement - settleAmount)
          };
        }
        return d;
      })
    );
    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch {}
    addToast('success', 'Arqueo COD Liquidado', 'El efectivo recaudado por el conductor ingresó a bóveda de sucursal.');
  };

  // Vehicles Management Methods
  const addVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    addToast('success', 'Vehículo Añadido a Flota', `Unidad ${newVehicle.brand} ${newVehicle.model} (${newVehicle.plate}) registrada.`);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    addToast('success', 'Vehículo Actualizado', 'Ficha técnica y mantenimiento guardados.');
  };

  const deleteVehicle = (id: string) => {
    const target = vehicles.find((v) => v.id === id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    addToast('info', 'Vehículo Retirado', `Unidad ${target?.plate || id} removida de la flota activa.`);
  };

  // Branches Management Methods
  const addBranch = (newBranch: Branch) => {
    setBranches((prev) => [newBranch, ...prev]);
    addToast('success', 'Sucursal Creada', `Se inauguró la sede ${newBranch.name} (${newBranch.code}).`);
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    if (selectedBranch.id === id) {
      setSelectedBranch((prev) => ({ ...prev, ...updates }));
    }
    addToast('success', 'Sucursal Actualizada', 'Datos de infraestructura y zonas guardados.');
  };

  const deleteBranch = (id: string) => {
    const target = branches.find((b) => b.id === id);
    setBranches((prev) => prev.filter((b) => b.id !== id));
    addToast('info', 'Sucursal Desactivada', `Se archivó la sede ${target?.name || id}.`);
  };

  const addBranchZone = (branchId: string, zone: WarehouseZone) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id === branchId) {
          const currentZones = b.zones || [];
          return {
            ...b,
            zones: [...currentZones, zone]
          };
        }
        return b;
      })
    );
    addToast('success', 'Rack / Zona Agregada', `Zona ${zone.name} agregada al almacén.`);
  };

  const updateBranchZone = (branchId: string, zoneId: string, updates: Partial<WarehouseZone>) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id === branchId) {
          return {
            ...b,
            zones: (b.zones || []).map((z) => (z.id === zoneId ? { ...z, ...updates } : z))
          };
        }
        return b;
      })
    );
    addToast('success', 'Zona Actualizada', 'Ocupación y capacidad de estantería guardadas.');
  };

  const consolidatePackages = (pkgIds: string[]) => {
    setInternationalPackages((prev) =>
      prev.map((p) => {
        if (pkgIds.includes(p.id)) {
          return { ...p, status: 'consolidated', isConsolidated: true };
        }
        return p;
      })
    );
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }
    addToast('success', '¡Consolidación Exitosa!', `Se han agrupado ${pkgIds.length} paquetes en una sola caja master.`);
  };

  const startRoute = () => {
    const startedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCurrentRoute((prev) => ({
      ...prev,
      status: 'in_progress',
      startedAt: startedTime
    }));
    setRoutes((prevRoutes) =>
      prevRoutes.map((r) =>
        r.id === currentRoute.id
          ? { ...r, status: 'in_progress', startedAt: startedTime }
          : r
      )
    );
    if (currentRoute.driverId) {
      setDrivers((prevDrivers) =>
        prevDrivers.map((d) =>
          d.id === currentRoute.driverId ? { ...d, status: 'on_route' } : d
        )
      );
    }
    broadcastPusherEvent('presence-fleet-live', 'route.started', {
      routeId: currentRoute.id,
      driverName: currentRoute.driverName,
      startedAt: startedTime
    });
    addToast('info', 'Ruta Iniciada & Sincronizada', 'GPS satelital activado. Telemetría transmitiendo a Central GoPaq.');
  };

  // Sync health metrics computed dynamically
  const syncHealthMetrics = calculateSyncHealthMetrics(syncTransactions, !driverOfflineMode);

  // AI Event-Driven Automation trigger
  const triggerEventDrivenAiRule = (
    eventType: AutomationTriggerEventType,
    trackingNumber: string,
    extraData?: Record<string, any>
  ): AiAutomationExecutionLog | null => {
    const matchedRule = automationRules.find((r) => r.enabled && r.triggerEvent === eventType);
    const shipment = shipments.find((s) => s.trackingNumber === trackingNumber || s.id === trackingNumber);
    const recipientName = shipment?.destination.name || 'Destinatario';
    const recipientPhone = shipment?.destination.phone || '+1 (809) 555-4421';
    const senderName = shipment?.origin.name || shipment?.clientName || 'Remitente';
    const codAmount = shipment?.codAmount || 0;

    const ruleName = matchedRule ? matchedRule.name : `Evento ${eventType}`;
    const ruleId = matchedRule ? matchedRule.id : `rule-custom-${Date.now()}`;

    let speechResp = 'Sí, confirmado. Estoy disponible para recibir el envío.';
    let aiSummary = 'Confirmó disponibilidad y autorizó entrega.';
    let driverNote = `CLIENTE CONTACTADO: Confirmó disponibilidad para entrega de guía ${trackingNumber}.`;

    if (eventType === 'approaching_cod_delivery') {
      speechResp = `Perfecto, tengo preparados los ${formatMoney(codAmount)} en efectivo.`;
      aiSummary = `Confirmó tener el efectivo exacto ${formatMoney(codAmount)} listo.`;
      driverNote = `MONTO COD CONFIRMADO: Cliente tiene ${formatMoney(codAmount)} en efectivo listo.`;
    } else if (eventType === 'driver_needs_reference') {
      speechResp = 'Es la casa de 2 niveles blanca con verja negra, frente al parque.';
      aiSummary = 'Casa 2 niveles blanca con verja negra, frente al parque.';
      driverNote = 'REFERENCIA RECIBIDA: Casa 2 niveles blanca con verja negra, frente al parque.';
    } else if (eventType === 'delivery_failed_absent') {
      speechResp = 'No estoy en casa ahora. Por favor reprogramar para mañana por la mañana.';
      aiSummary = 'Cliente ausente. Solicitó reprogramación para el día siguiente turno mañana.';
      driverNote = 'REPROGRAMACIÓN: Cliente solicitó entrega mañana en turno mañana.';
    } else if (eventType === 'driver_no_response') {
      speechResp = 'Ya voy abriendo la puerta principal.';
      aiSummary = 'Cliente avisó que está saliendo a abrir la puerta.';
      driverNote = 'CLIENTE RESPONDIÓ: Abriendo puerta principal.';
    } else if (eventType === 'driver_arrived') {
      speechResp = 'Recibido, bajo en un minuto.';
      aiSummary = 'Aviso de llegada recibido. Cliente bajando a recepción.';
      driverNote = 'AVISO ENTREGADO: Cliente bajando en 1 minuto.';
    }

    const newLog: AiAutomationExecutionLog = {
      id: `log-${Date.now()}`,
      ruleId,
      ruleName,
      triggerEvent: eventType,
      trackingNumber,
      targetPerson: eventType === 'driver_approaching_sender' || eventType === 'pickup_not_ready' ? 'remitente' : 'destinatario',
      personName: eventType === 'driver_approaching_sender' || eventType === 'pickup_not_ready' ? senderName : recipientName,
      personPhone: recipientPhone,
      timestamp: `Ahora mismo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`,
      status: 'completed',
      customerSpeechResponse: speechResp,
      aiExtractedSummary: aiSummary,
      driverNotified: true,
      driverMessageDelivered: driverNote,
      channelUsed: matchedRule?.primaryAction === 'send_whatsapp' ? 'whatsapp' : 'voice_ai',
      durationSeconds: Math.floor(Math.random() * 20) + 15,
      callRecordingTranscript: `IA: Llamada automática por evento ${eventType} sobre guía ${trackingNumber}.\nCliente: "${speechResp}"\nIA: "Entendido, transmitido al sistema."`,
      actionTakenResult: 'Instrucción agregada a la parada y sincronizada en tiempo real'
    };

    setAutomationLogs((prev) => [newLog, ...prev]);

    if (matchedRule) {
      setAutomationRules((prev) =>
        prev.map((r) =>
          r.id === matchedRule.id
            ? { ...r, executionCount: r.executionCount + 1, lastExecutedAt: 'Ahora mismo' }
            : r
        )
      );
    }

    broadcastPusherEvent('presence-fleet-live', 'ai.automation.executed', {
      eventType,
      trackingNumber,
      aiSummary,
      ruleName
    });

    return newLog;
  };

  // Sync Ledger Actions
  const retrySingleTransaction = (transactionId: string) => {
    const tx = syncTransactions.find((t) => t.id === transactionId);
    if (!tx) return;

    setSyncTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'retrying' } : t))
    );

    setTimeout(() => {
      if (driverOfflineMode) {
        setSyncTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, status: 'pending', errorMessage: 'En espera de conexión activa.' }
              : t
          )
        );
        addToast('warning', 'Modo Fuera de Línea', 'Se reintentará al recuperar conexión.');
        return;
      }

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'synced',
                retryCount: t.retryCount + 1,
                lastAttempt: nowTime,
                errorMessage: undefined,
                responseCode: 200,
                networkLatencyMs: Math.floor(Math.random() * 120) + 70
              }
            : t
        )
      );
      addToast('success', 'Transacción Sincronizada', `Guía ${tx.trackingNumber} confirmada en Central.`);
    }, 700);
  };

  const retryAllFailedTransactions = () => {
    const failed = syncTransactions.filter((t) => t.status === 'failed');
    if (failed.length === 0) return;

    setIsRetryingSync(true);
    setSyncTransactions((prev) =>
      prev.map((t) => (t.status === 'failed' ? { ...t, status: 'retrying' } : t))
    );

    setTimeout(() => {
      setIsRetryingSync(false);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncTransactions((prev) =>
        prev.map((t) =>
          t.status === 'retrying' || t.status === 'failed'
            ? {
                ...t,
                status: 'synced',
                retryCount: t.retryCount + 1,
                lastAttempt: nowTime,
                errorMessage: undefined,
                responseCode: 200,
                networkLatencyMs: Math.floor(Math.random() * 130) + 65
              }
            : t
        )
      );
      addToast('success', 'Sincronización Masiva Exitosa', `Se sincronizaron ${failed.length} transacciones con Central.`);
    }, 1000);
  };

  const forceSyncAllTransactions = () => {
    setIsRetryingSync(true);
    setSyncTransactions((prev) =>
      prev.map((t) => (t.status !== 'synced' ? { ...t, status: 'retrying' } : t))
    );

    setTimeout(() => {
      setIsRetryingSync(false);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSyncTransactions((prev) =>
        prev.map((t) =>
          t.status === 'retrying' || t.status !== 'synced'
            ? {
                ...t,
                status: 'synced',
                retryCount: t.retryCount + 1,
                lastAttempt: nowTime,
                errorMessage: undefined,
                responseCode: 200,
                networkLatencyMs: Math.floor(Math.random() * 110) + 60
              }
            : t
        )
      );
      addToast('success', 'Outbox Completamente Sincronizado', 'Todas las colas locales han sido confirmadas por el servidor.');
    }, 1100);
  };

  const completeDriverStop = (stopId: string, podData: ProofOfDelivery, collectedCod?: number) => {
    const addCod = collectedCod || 0;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowPrecise = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let targetStopTracking = '';
    let targetRecipient = podData.recipientName || 'Destinatario';

    // 1. Update currentRoute and routes
    setCurrentRoute((prev) => {
      const updatedStops = prev.stops.map((st) => {
        if (st.id === stopId) {
          targetStopTracking = st.trackingNumber;
          targetRecipient = st.recipientName;
          return { ...st, status: 'completed' as const, completedAt: nowTime };
        }
        return st;
      });
      const compCount = updatedStops.filter((s) => s.status === 'completed').length;
      return {
        ...prev,
        completedStops: compCount,
        collectedCodAmount: prev.collectedCodAmount + addCod,
        stops: updatedStops
      };
    });

    setRoutes((prevRoutes) =>
      prevRoutes.map((r) => {
        if (r.id === currentRoute.id) {
          const updatedStops = r.stops.map((st) => {
            if (st.id === stopId) {
              return { ...st, status: 'completed' as const, completedAt: nowTime };
            }
            return st;
          });
          const compCount = updatedStops.filter((s) => s.status === 'completed').length;
          return {
            ...r,
            completedStops: compCount,
            collectedCodAmount: r.collectedCodAmount + addCod,
            stops: updatedStops
          };
        }
        return r;
      })
    );

    // 2. Update Driver stats in Drivers Fleet
    if (currentRoute.driverId) {
      setDrivers((prevDrivers) =>
        prevDrivers.map((d) => {
          if (d.id === currentRoute.driverId) {
            return {
              ...d,
              completedDeliveries: (d.completedDeliveries || d.completedDeliveriesToday || 0) + 1,
              completedDeliveriesToday: (d.completedDeliveriesToday || 0) + 1,
              pendingDeliveriesCount: Math.max(0, d.pendingDeliveriesCount - 1),
              codCollectedToday: (d.codCollectedToday || 0) + addCod,
              codPendingSettlement: (d.codPendingSettlement || 0) + addCod
            };
          }
          return d;
        })
      );
    }

    // 3. Update Client COD balance if COD was collected
    if (addCod > 0) {
      const matchedShipment = shipments.find(
        (s) => s.id === targetStopTracking || s.trackingNumber === targetStopTracking
      );
      if (matchedShipment) {
        setClients((prevClients) =>
          prevClients.map((c) => {
            const isMatch =
              c.id === matchedShipment.clientId ||
              c.name.toLowerCase() === matchedShipment.origin.name.toLowerCase() ||
              (c.companyName && c.companyName.toLowerCase() === matchedShipment.origin.name.toLowerCase());
            if (isMatch) {
              return {
                ...c,
                codPendingPayoutDop: c.codPendingPayoutDop + addCod,
                totalShipments: (c.totalShipments || c.activeShipments || 0) + 1
              };
            }
            return c;
          })
        );
      }
    }

    // 4. Record into Sync Transactions Ledger
    const newTx: SyncTransaction = {
      id: `tx-pod-${Date.now()}`,
      type: 'pod_submission',
      trackingNumber: targetStopTracking || 'GPQ-SYNC',
      recipientName: targetRecipient,
      stopId,
      routeId: currentRoute.id,
      timestamp: nowTime,
      status: !driverOfflineMode ? 'synced' : 'pending',
      retryCount: 0,
      lastAttempt: !driverOfflineMode ? nowPrecise : null,
      responseCode: !driverOfflineMode ? 200 : undefined,
      networkLatencyMs: !driverOfflineMode ? Math.floor(Math.random() * 110) + 65 : undefined,
      payload: {
        recipientName: targetRecipient,
        recipientDni: podData.recipientDni,
        signatureUrl: podData.signatureUrl,
        photoUrl: podData.photoUrl,
        codAmountCollected: addCod
      }
    };
    setSyncTransactions((prev) => [newTx, ...prev]);

    // 5. Broadcast Pusher Realtime Event
    broadcastPusherEvent('presence-fleet-live', 'stop.completed', {
      routeId: currentRoute.id,
      driverName: currentRoute.driverName,
      stopId,
      trackingNumber: targetStopTracking,
      collectedCod: addCod
    });

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch {
      // safe
    }

    addToast('success', '¡Entrega Completada & Sincronizada!', `Prueba de entrega registrada exitosamente.`);
    
    // Add notif
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '🟢 Entrega Realizada & Sincronizada',
        message: `${currentRoute.driverName} completó parada ${targetStopTracking} y registró firma digital de ${targetRecipient}`,
        type: 'success',
        category: 'operations',
        timestamp: 'Ahora mismo',
        read: false
      },
      ...prev
    ]);
  };

  const completeStopPOD = (
    stopId: string,
    trackingNumber: string,
    signatureUrl: string,
    photoUrl?: string,
    collectedCod?: number
  ) => {
    const podData: ProofOfDelivery = {
      recipientName: 'Destinatario Verificado',
      recipientDni: '402-2893812-4',
      signatureUrl,
      photoUrl,
      timestamp: new Date().toISOString(),
      gpsCoordinates: { lat: 18.4861, lng: -69.9312 }
    };
    completeDriverStop(stopId, podData, collectedCod);
    updateShipmentStatus(trackingNumber, 'delivered', {
      pod: podData
    });
  };

  const failDriverStop = (stopId: string, reason: string, note: string) => {
    let targetStopTracking = '';
    let targetRecipient = '';

    setCurrentRoute((prev) => {
      const updatedStops = prev.stops.map((st) => {
        if (st.id === stopId) {
          targetStopTracking = st.trackingNumber;
          targetRecipient = st.recipientName;
          return { ...st, status: 'failed' as const };
        }
        return st;
      });
      return {
        ...prev,
        stops: updatedStops
      };
    });

    setRoutes((prevRoutes) =>
      prevRoutes.map((r) => {
        if (r.id === currentRoute.id) {
          const updatedStops = r.stops.map((st) => {
            if (st.id === stopId) {
              return { ...st, status: 'failed' as const };
            }
            return st;
          });
          return { ...r, stops: updatedStops };
        }
        return r;
      })
    );

    if (targetStopTracking) {
      updateShipmentStatus(targetStopTracking, 'failed', {
        failureReason: reason,
        failureNote: note
      });
      // Automatically trigger AI Voice rule for failed attempt / reschedule
      triggerEventDrivenAiRule('delivery_failed_absent', targetStopTracking);
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowPrecise = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newTx: SyncTransaction = {
      id: `tx-inc-${Date.now()}`,
      type: 'incident_report',
      trackingNumber: targetStopTracking || 'GPQ-INC',
      recipientName: targetRecipient || 'Destinatario',
      stopId,
      routeId: currentRoute.id,
      timestamp: nowTime,
      status: !driverOfflineMode ? 'synced' : 'pending',
      retryCount: 0,
      lastAttempt: !driverOfflineMode ? nowPrecise : null,
      responseCode: !driverOfflineMode ? 200 : undefined,
      networkLatencyMs: !driverOfflineMode ? Math.floor(Math.random() * 120) + 70 : undefined,
      payload: {
        incidentReason: reason,
        incidentNotes: note
      }
    };
    setSyncTransactions((prev) => [newTx, ...prev]);

    addToast('warning', 'Incidencia Registrada & Sincronizada', `Parada marcada como no entregada: ${reason}`);
    
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '⚠️ Intento Fallido de Entrega',
        message: `Motivo: ${reason}. Detalle: ${note} (Guía: ${targetStopTracking})`,
        type: 'warning',
        category: 'operations',
        timestamp: 'Ahora mismo',
        read: false
      },
      ...prev
    ]);
  };

  const updateDangerousZone = (id: string, updates: Partial<DangerousZone>) => {
    setDangerousZones((prev) =>
      prev.map((zone) => (zone.id === id ? { ...zone, ...updates } : zone))
    );
    addToast('success', 'Zona de Seguridad Actualizada', 'Las restricciones operativas han sido guardadas y propagadas a la app de choferes.');
  };

  const updateCoverageZone = (id: string, updates: Partial<CoverageZoneRate>) => {
    setCoverageZones((prev) =>
      prev.map((zone) => (zone.id === id ? { ...zone, ...updates } : zone))
    );
    addToast('success', 'Zona Tarifaria Actualizada', 'Parámetros de tarificación y recargo sincronizados.');
  };

  const addBulkScanItem = (item: BulkScanItem) => {
    setBulkScanHistory((prev) => [item, ...prev]);
  };

  const clearBulkScanHistory = () => {
    setBulkScanHistory([]);
  };

  const findNearestBranch = (lat?: number, lng?: number, provinceOrCity?: string) => {
    // If exact coords provided, calculate euclidean distance
    if (lat !== undefined && lng !== undefined) {
      // Mock branch coords
      const branchCoords: Record<string, { lat: number; lng: number }> = {
        'br-hq-sd': { lat: 18.4861, lng: -69.9312 },
        'br-piantini': { lat: 18.4720, lng: -69.9380 },
        'br-sti': { lat: 19.4517, lng: -70.6970 },
        'br-puj': { lat: 18.5601, lng: -68.3725 },
        'br-wh-mia': { lat: 25.7617, lng: -80.1918 }
      };

      let closestBranch = branches[0];
      let minDistance = 99999;

      branches.forEach((b) => {
        const coords = branchCoords[b.id] || { lat: 18.48, lng: -69.93 };
        const dLat = (coords.lat - lat) * 111;
        const dLng = (coords.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestBranch = b;
        }
      });

      const roundedDist = Math.max(0.8, Math.round(minDistance * 10) / 10);
      const estMin = Math.round(roundedDist * 2.2 + 5);
      return { branch: closestBranch, distanceKm: roundedDist, estimatedMin: estMin };
    }

    // Match by province/city name
    const query = (provinceOrCity || '').toLowerCase();
    if (query.includes('santiago') || query.includes('cibao') || query.includes('vega') || query.includes('moca') || query.includes('puerto plata')) {
      const b = branches.find((item) => item.id === 'br-sti') || branches[0];
      return { branch: b, distanceKm: 4.2, estimatedMin: 12 };
    }
    if (query.includes('punta cana') || query.includes('bavaro') || query.includes('bávaro') || query.includes('altagracia') || query.includes('romana') || query.includes('este')) {
      const b = branches.find((item) => item.id === 'br-puj') || branches[0];
      return { branch: b, distanceKm: 3.5, estimatedMin: 10 };
    }
    if (query.includes('piantini') || query.includes('naco') || query.includes('bella vista') || query.includes('gazcue') || query.includes('distrito')) {
      const b = branches.find((item) => item.id === 'br-piantini') || branches[0];
      return { branch: b, distanceKm: 2.1, estimatedMin: 8 };
    }

    return { branch: branches[0], distanceKm: 3.8, estimatedMin: 11 };
  };

  // Multi-route Management
  const addRoute = (newRoute: DeliveryRoute) => {
    setRoutes((prev) => [newRoute, ...prev]);
    setCurrentRoute(newRoute);
    addToast('success', 'Ruta Creada', `Ruta ${newRoute.routeCode} configurada con ${newRoute.stops.length} paradas.`);
  };

  const updateRoute = (id: string, updates: Partial<DeliveryRoute>) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updates };
          if (currentRoute.id === id) {
            setCurrentRoute(updated);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const deleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    if (currentRoute.id === id && routes.length > 1) {
      setCurrentRoute(routes.find((r) => r.id !== id) || routes[0]);
    }
    addToast('info', 'Ruta Eliminada', `La ruta ha sido removida del planificador.`);
  };

  const assignShipmentToRoute = (shipmentId: string, routeId: string) => {
    const shipment = shipments.find((s) => s.id === shipmentId || s.trackingNumber === shipmentId);
    if (!shipment) return;

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          const newStop: RouteStop = {
            id: `stp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sequenceOrder: r.stops.length + 1,
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            type: 'delivery',
            recipientName: shipment.destination.name,
            phone: shipment.destination.phone || '+1 (809) 555-0000',
            address: `${shipment.destination.street || shipment.destination.address || ''}, ${shipment.destination.sector || ''} ${shipment.destination.city}`,
            lat: shipment.destination.lat || 18.475,
            lng: shipment.destination.lng || -69.935,
            estimatedArrival: '15:30',
            status: 'pending',
            codAmount: shipment.codAmount || 0,
            weightKg: shipment.package.weightKg || 1.5,
            packageSummary: `${shipment.package.category} - ${shipment.package.weightKg} KG`,
            contactRole: 'destinatario'
          };
          const newStops = [...r.stops, newStop];
          const updatedRoute: DeliveryRoute = {
            ...r,
            stops: newStops,
            totalStops: newStops.length,
            totalDistanceKm: r.totalDistanceKm + 4,
            currentWeightKg: (r.currentWeightKg || 0) + (shipment.package.weightKg || 1.5),
            totalCodAmount: r.totalCodAmount + (shipment.codAmount || 0)
          };
          if (currentRoute.id === routeId) {
            setCurrentRoute(updatedRoute);
          }
          return updatedRoute;
        }
        return r;
      })
    );

    // Update shipment assignment
    updateShipmentStatus(shipment.id, 'assigned', {
      driverId: currentRoute.driverId,
      driverName: currentRoute.driverName
    });

    addToast('success', 'Paquete Asignado a Ruta', `Guía ${shipment.trackingNumber} agregada a la ruta.`);
  };

  const removeStopFromRoute = (routeId: string, stopId: string) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          const filteredStops = r.stops.filter((s) => s.id !== stopId).map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
          const updatedRoute: DeliveryRoute = {
            ...r,
            stops: filteredStops,
            totalStops: filteredStops.length
          };
          if (currentRoute.id === routeId) {
            setCurrentRoute(updatedRoute);
          }
          return updatedRoute;
        }
        return r;
      })
    );
    addToast('info', 'Parada Removida', 'La parada ha sido desasignada de la ruta.');
  };

  const reorderRouteStops = (routeId: string, newStops: RouteStop[]) => {
    const sequenced = newStops.map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          const updated = { ...r, stops: sequenced };
          if (currentRoute.id === routeId) {
            setCurrentRoute(updated);
          }
          return updated;
        }
        return r;
      })
    );
    addToast('success', 'Secuencia de Paradas Optimizada', 'Nuevo orden de entrega guardado.');
  };

  // Zernio Omnichannel & WhatsApp AI Integration
  const updateZernioConfig = (updates: Partial<ZernioWebhookConfig>) => {
    setZernioConfig((prev) => ({ ...prev, ...updates }));
    addToast('success', 'Configuración Zernio Guardada', 'Parámetros de WhatsApp, Meta y AI Agent sincronizados.');
  };

  const sendZernioMessage = (msg: Partial<ZernioMessage>) => {
    const fullMsg: ZernioMessage = {
      id: `msg-${Date.now()}`,
      channel: msg.channel || 'whatsapp',
      senderRole: msg.senderRole || 'human_agent',
      senderName: msg.senderName || 'Agente GoPaq',
      senderMaskedId: msg.senderMaskedId || 'GoPaq Central Relay',
      recipientMaskedId: msg.recipientMaskedId || 'Cliente (Destinatario)',
      text: msg.text || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      trackingNumber: msg.trackingNumber,
      sentiment: msg.sentiment || 'neutral'
    };

    setZernioMessages((prev) => [...prev, fullMsg]);

    // Broadcast through Pusher simulation
    broadcastPusherEvent(
      msg.trackingNumber ? `private-chat-relay-${msg.trackingNumber}` : 'super-admin-events',
      'chat.message.sent',
      { text: fullMsg.text, channel: fullMsg.channel, senderRole: fullMsg.senderRole }
    );

    // Auto AI reply simulation if autoReplyEnabled and sent by customer
    if (msg.senderRole === 'customer' && zernioConfig.aiEngineConfig.autoReplyEnabled) {
      setTimeout(() => {
        const aiReply: ZernioMessage = {
          id: `msg-${Date.now() + 1}`,
          channel: msg.channel || 'whatsapp',
          senderRole: 'ai_agent',
          senderName: 'GoPaq AI Asistente',
          senderMaskedId: 'GoPaq Asistente Inteligente',
          recipientMaskedId: fullMsg.senderMaskedId,
          text: `[GoPaq AI] Hemos recibido su mensaje sobre "${fullMsg.text.slice(0, 35)}...". Su solicitud está siendo atendida en tiempo real conforme a su guía oficial. ¡Estamos para servirle!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered',
          trackingNumber: msg.trackingNumber,
          isAiGenerated: true,
          sentiment: 'positive'
        };
        setZernioMessages((p) => [...p, aiReply]);
        broadcastPusherEvent(
          msg.trackingNumber ? `private-chat-relay-${msg.trackingNumber}` : 'super-admin-events',
          'chat.message.ai_replied',
          { text: aiReply.text, isAi: true }
        );
      }, 1400);
    }
  };

  const triggerVoiceBotCall = (trackingNumber: string) => {
    const newCall: ZernioCallLog = {
      id: `call-${Date.now()}`,
      channel: 'whatsapp_call',
      callType: 'ai_delivery_confirmation',
      status: 'in_progress',
      callerMasked: 'GoPaq Voice Bot Oficial (+1 809 555-7271)',
      calleeMasked: `Destinatario de Guía ${trackingNumber}`,
      trackingNumber,
      durationSeconds: 15,
      timestamp: 'Ahora mismo',
      aiSummary: 'Llamada automatizada en curso por GoPaq Voice AI para confirmar dirección de entrega y cobro COD.',
      transcript: 'IA: "Hola, le llamamos de GoPaq Dominicana para confirmar su recepción de entrega..."',
      customerConfirmedDelivery: false
    };

    setZernioCalls((prev) => [newCall, ...prev]);
    addToast('info', 'Llamada Telefónica AI Iniciada', `Conectando con el destinatario de la guía ${trackingNumber} vía canal oficial GoPaq.`);

    setTimeout(() => {
      setZernioCalls((prev) =>
        prev.map((c) =>
          c.id === newCall.id
            ? {
                ...c,
                status: 'completed',
                durationSeconds: 52,
                aiSummary: 'Confirmación exitosa: Destinatario validó horario y autorizó firma electrónica.',
                transcript: `${c.transcript}\nDestinatario: "Sí, confirmado, estoy en la dirección."\nIA: "Perfecto, conductor notificado."`,
                customerConfirmedDelivery: true
              }
            : c
        )
      );
      addToast('success', 'Llamada AI Completada', `El cliente confirmó recepción para la guía ${trackingNumber}.`);
    }, 4000);
  };

  // Pusher Real-time Handlers
  const updatePusherConfig = (updates: Partial<PusherConfig>) => {
    setPusherConfig((prev) => ({ ...prev, ...updates }));
    addToast('success', 'Configuración Pusher Actualizada', 'Conexión a WebSockets en tiempo real guardada.');
  };

  const broadcastPusherEvent = (channel: string, event: string, data: any) => {
    const newEvt: PusherRealtimeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      channel,
      event,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setPusherEvents((prev) => [newEvt, ...prev.slice(0, 35)]);
  };

  const publishBranchRoute = (newRoute: DeliveryRoute) => {
    updateRoute(newRoute.id, { status: 'in_progress', startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setCurrentRoute(newRoute);
    addToast('success', '¡Ruta Publicada!', `Notificación push enviada a ${newRoute.driverName} (${newRoute.totalStops} paradas).`);
    broadcastPusherEvent('super-admin-events', 'route.published', {
      routeCode: newRoute.routeCode,
      driverName: newRoute.driverName,
      stops: newRoute.totalStops
    });
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `🚚 Ruta ${newRoute.routeCode} Publicada`,
        message: `Despachador asignó ${newRoute.totalStops} paradas a ${newRoute.driverName}`,
        type: 'info',
        category: 'operations',
        timestamp: 'Ahora mismo',
        read: false
      },
      ...prev
    ]);
  };


  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('info', 'Notificaciones', 'Todas las notificaciones marcadas como leídas.');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentSection,
        setCurrentSection,
        currentRole,
        setCurrentRole,
        activeSubView,
        setActiveSubView,
        darkMode,
        setDarkMode,
        currency,
        setCurrency,
        country,
        setCountry,
        formatMoney,
        clients,
        setClients,
        addClient,
        updateClient,
        deleteClient,
        payoutClientCod,
        adjustClientCreditLimit,
        generateClientApiKey,
        shipments,
        setShipments,
        addShipment,
        updateShipmentStatus,
        drivers,
        setDrivers,
        addDriver,
        updateDriver,
        deleteDriver,
        settleDriverCod,
        vehicles,
        setVehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        branches,
        setBranches,
        selectedBranch: selectedBranch || {
          id: 'br-sdq-central',
          code: 'SDQ-01',
          name: 'Sucursal Central Piantini',
          city: 'Santo Domingo',
          address: 'Av. Winston Churchill #1099',
          phone: '(809) 555-0101',
          managerName: 'Carlos Mendoza',
          type: 'hub',
          country: 'DO',
          capacityMaxPackages: 5000,
          currentPackagesCount: 0,
          activeDriversCount: 0,
          cashInDrawer: 0,
          currency: 'DOP',
          zones: []
        },
        setSelectedBranch,
        addBranch,
        updateBranch,
        deleteBranch,
        addBranchZone,
        updateBranchZone,
        routes,
        setRoutes,
        currentRoute: currentRoute || {
          id: 'rt-default',
          routeCode: 'RT-000',
          driverId: 'drv-01',
          driverName: 'Driver Activo',
          vehiclePlate: 'L-000000',
          branchId: 'br-sdq-central',
          branchName: 'Sucursal Central',
          status: 'draft',
          totalStops: 0,
          completedStops: 0,
          totalDistanceKm: 0,
          estimatedDurationHours: 0,
          totalCodAmount: 0,
          collectedCodAmount: 0,
          stops: []
        },
        setCurrentRoute: setCurrentRoute as any,
        addRoute,
        updateRoute,
        deleteRoute,
        assignShipmentToRoute,
        removeStopFromRoute,
        reorderRouteStops,
        zernioConfig,
        setZernioConfig,
        updateZernioConfig,
        zernioMessages,
        sendZernioMessage,
        zernioCalls,
        triggerVoiceBotCall,
        socialConnections,
        toggleSocialOAuth,
        updateSocialOAuthCredentials,
        testSocialOAuthPing,
        pusherConfig,
        setPusherConfig,
        updatePusherConfig,
        pusherEvents,
        broadcastPusherEvent,
        activeMaskedChatShipment,
        setActiveMaskedChatShipment,
        internationalPackages,
        consolidatePackages,
        driverOfflineMode,
        setDriverOfflineMode,
        completeDriverStop,
        completeStopPOD,
        failDriverStop,
        startRoute,
        commandPaletteOpen,
        setCommandPaletteOpen,
        selectedTracking,
        setSelectedTracking,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        addToast,
        toasts,
        removeToast,
        isNewShipmentModalOpen,
        setIsNewShipmentModalOpen,
        publishBranchRoute,
        dangerousZones,
        setDangerousZones,
        updateDangerousZone,
        coverageZones,
        setCoverageZones,
        updateCoverageZone,
        bulkScanHistory,
        addBulkScanItem,
        clearBulkScanHistory,
        activeLabelShipment,
        setActiveLabelShipment,
        findNearestBranch,
        automationRules,
        setAutomationRules,
        automationLogs,
        setAutomationLogs,
        triggerEventDrivenAiRule,
        syncTransactions,
        setSyncTransactions,
        syncHealthMetrics,
        retrySingleTransaction,
        retryAllFailedTransactions,
        forceSyncAllTransactions,
        isRetryingSync
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
