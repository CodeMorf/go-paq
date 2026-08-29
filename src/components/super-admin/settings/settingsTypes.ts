export type VoiceTelephonyProvider = 
  | 'twilio_voice' 
  | 'vapi' 
  | 'retell' 
  | 'bland_ai' 
  | 'elevenlabs' 
  | 'asterisk_sip' 
  | 'gemini_live';

export type CronSchedulerProvider = 
  | 'native_internal' 
  | 'upstash_qstash' 
  | 'google_cloud_tasks' 
  | 'aws_eventbridge' 
  | 'custom_webhook_cron';

export interface CronJobDefinition {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  enabled: boolean;
  category: 'operations' | 'finance' | 'customs' | 'sync' | 'notifications' | 'system';
  lastRun: string;
  nextRun: string;
  lastStatus: 'success' | 'failed' | 'running' | 'idle';
  executionCount: number;
  durationAvgMs: number;
}

export type MysqlSslMode = 'disabled' | 'preferred' | 'required' | 'verify_ca' | 'verify_identity';
export type RedisClusterTopology = 'standalone' | 'sentinel' | 'cluster' | 'upstash_serverless';
export type SyncStrategyMode = 'write_through' | 'cache_aside' | 'write_behind_queue';

export interface DatabaseRedisSyncConfig {
  // MySQL 8.0 Engine
  mysqlEnabled: boolean;
  mysqlHost: string;
  mysqlPort: number;
  mysqlDatabase: string;
  mysqlUser: string;
  mysqlPasswordMasked: string;
  mysqlPoolMin: number;
  mysqlPoolMax: number;
  mysqlCharset: string;
  mysqlSslMode: MysqlSslMode;
  mysqlIsolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  mysqlSlowQueryThresholdMs: number;
  mysqlReadReplicaHost: string;

  // Redis 7.x In-Memory & Pub/Sub
  redisEnabled: boolean;
  redisHost: string;
  redisPort: number;
  redisPasswordMasked: string;
  redisDbIndex: number;
  redisTlsEnabled: boolean;
  redisTopology: RedisClusterTopology;
  redisKeyPrefix: string;
  redisMaxMemoryPolicy: 'allkeys-lru' | 'volatile-lru' | 'noeviction';
  
  // TTL Caching Rules (Seconds)
  ttlDriverGpsLocationSeconds: number;
  ttlExchangeRatesSeconds: number;
  ttlActiveShipmentTrackSeconds: number;
  ttlUserSessionsSeconds: number;
  ttlBranchInventorySeconds: number;

  // Full Synchronization Engine
  syncStrategy: SyncStrategyMode;
  autoInvalidateCacheOnWrite: boolean;
  enableRedisPubSubBroadcasting: boolean;
  enableBinlogCdcStreamer: boolean;
  lastFullSyncTimestamp: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  totalSyncedKeys: number;
  totalMysqlRecords: number;
  cacheHitRatioPercent: number;
  latencyMysqlMs: number;
  latencyRedisMs: number;
}

export interface GlobalSystemConfig {
  // 1. General & Branding
  general: {
    companyName: string;
    legalName: string;
    rncTaxId: string;
    slogan: string;
    customDomain: string;
    supportEmail: string;
    billingEmail: string;
    supportPhone: string;
    supportWhatsApp: string;
    headquartersAddress: string;
    primaryColor: string;
    accentColor: string;
    themeStyle: 'modern' | 'compact' | 'classic';
    enableWhiteLabel: boolean;
    logoUrlLight: string;
    logoUrlDark: string;
    faviconUrl: string;
  };

  // 2. Localization & Currency
  localization: {
    primaryCountry: 'DO' | 'US' | 'ES' | 'MX' | 'CO' | 'PA';
    baseCurrency: 'DOP' | 'USD' | 'EUR';
    enabledCurrencies: ('DOP' | 'USD' | 'EUR')[];
    usdExchangeRate: number; // e.g. 59.85
    eurExchangeRate: number; // e.g. 64.50
    rateMode: 'manual' | 'bancentral_auto' | 'fixer_api';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeZone: string;
    weightUnit: 'lbs' | 'kg';
    dimensionUnit: 'in' | 'cm';
    decimalSeparator: '.' | ',';
  };

  // 3. Locker & Customs (Miami & DGA)
  lockerCustoms: {
    miamiWarehouseAddress: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      contactPhone: string;
    };
    boxPrefix: string; // e.g. 'GP'
    boxNumberPadding: number; // e.g. 5 (GP-00123)
    deMinimisThresholdUsd: number; // e.g. 200.00
    itbisTaxRate: number; // e.g. 18%
    fuelSurchargePercent: number; // e.g. 4.5%
    airRatePerPoundDop: number; // e.g. 240
    airRatePerPoundUsd: number; // e.g. 4.00
    seaRatePerCubicFootUsd: number; // e.g. 16.50
    autoHoldRestrictedItems: boolean;
    requireInvoiceForDeMinimis: boolean;
    customsNotificationPhone: string;
  };

  // 4. Dispatch & Fleet Operations
  dispatch: {
    autoDispatchMode: 'intelligent_proximity' | 'balanced_load' | 'branch_zone' | 'manual';
    geofenceRadiusMeters: number; // e.g. 100
    maxStopsPerRoute: number; // e.g. 25
    maxWeightPerMotoKg: number; // e.g. 35
    maxWeightPerVanKg: number; // e.g. 800
    sameDayCutoffTime: string; // e.g. '14:00'
    maxFailedAttempts: number; // e.g. 3
    mandatoryPodPhoto: boolean;
    mandatoryPodSignature: boolean;
    mandatoryPodOtp: boolean;
    allowDriverCashCollect: boolean;
    returnToWarehouseFeeDop: number;
    highRiskZoneWarning: boolean;
  };

  // 5. Fiscal & DGII NCF
  fiscal: {
    eInvoicingEnabled: boolean; // Facturación Electrónica e-CF
    rncEmisor: string;
    nombreComercialEmisor: string;
    securityTokenExpiryDays: number;
    warningSequenceThreshold: number; // e.g. 100 remaining
    defaultCreditTermsDays: number; // e.g. 30
    autoGenerateNcfOnDelivery: boolean;
    sequences: {
      b01CreditFiscal: { current: number; max: number; prefix: string; expiryDate: string };
      b02FinalConsumer: { current: number; max: number; prefix: string; expiryDate: string };
      b14SpecialRegime: { current: number; max: number; prefix: string; expiryDate: string };
      b15Government: { current: number; max: number; prefix: string; expiryDate: string };
    };
  };

  // 6. Payments & COD Financials
  payments: {
    azulEnabled: boolean;
    azulMerchantId: string;
    azulEnvironment: 'sandbox' | 'production';
    cardnetEnabled: boolean;
    cardnetMerchantId: string;
    cardnetEnvironment: 'sandbox' | 'production';
    stripeEnabled: boolean;
    stripePublishableKey: string;
    stripeEnvironment: 'test' | 'live';
    bankTransferAchEnabled: boolean;
    bankName: string;
    bankAccountNumber: string;
    bankAccountType: 'Corriente' | 'Ahorros';
    codServiceFeeType: 'percentage' | 'fixed';
    codServiceFeeValue: number; // e.g. 2.5% or 50 DOP
    codSettlementSchedule: 'daily_evening' | 'biweekly_tues_fri' | 'weekly_friday';
    minimumCodPayoutDop: number; // e.g. 1000 DOP
  };

  // 7. Communications & Notifications
  communications: {
    whatsappCloudApiEnabled: boolean;
    whatsappPhoneNumberId: string;
    whatsappBusinessAccountId: string;
    whatsappAccessTokenMasked: string;
    smsProvider: 'twilio' | 'infobip' | 'messagebird';
    twilioAccountSid: string;
    twilioSenderName: string;
    emailProvider: 'sendgrid' | 'resend' | 'postmark' | 'aws_ses';
    emailFromAddress: string;
    emailFromName: string;
    eventTriggers: {
      onMiamiReceived: boolean;
      onInTransitFlight: boolean;
      onCustomsClearance: boolean;
      onBranchReadyPickup: boolean;
      onOutForDeliveryWithGps: boolean;
      onDeliveredWithPod: boolean;
      onCodPaymentReady: boolean;
    };
  };

  // 8. AI & Smart Automation, Voice Telephony & Cron Scheduler
  aiAutomation: {
    enabled: boolean;
    geminiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';
    autoInvoiceOcr: boolean;
    autoTariffClassification: boolean;
    smartAddressParser: boolean;
    aiCustomerSupportChatbot: boolean;
    smartRouteTrafficPredictor: boolean;
    confidenceThresholdPercent: number; // e.g. 85

    // Voice AI & Telephony Provider
    voiceProvider: VoiceTelephonyProvider;
    voiceModelId: string;
    callerPhoneDid: string;
    voiceApiKeyMasked: string;
    voiceApiSecretMasked: string;
    voiceWebhookEndpoint: string;
    enableCallRecording: boolean;
    enableAnsweringMachineDetection: boolean;
    callMaxDurationSeconds: number;
    voiceInterruptionSensitivity: 'low' | 'balanced' | 'high';
    humanEscalationPhone: string;
    callHoursStart: string;
    callHoursEnd: string;
    fallbackToWhatsAppIfUnanswered: boolean;

    // Cron Jobs & Background Scheduler
    cronProvider: CronSchedulerProvider;
    cronSecretToken: string;
    cronWebhookDispatcherUrl: string;
    cronRetryAttempts: number;
    cronJobs: CronJobDefinition[];
  };

  // 9. Security, RBAC & Maintenance
  security: {
    sessionTimeoutMinutes: number; // e.g. 60
    enforce2faAdmins: boolean;
    enforce2faBranches: boolean;
    passwordMinLength: number; // e.g. 10
    maintenanceMode: boolean;
    maintenanceMessage: string;
    ipWhitelist: string[];
    allowDriverOfflineSync: boolean;
    autoBackupFrequency: 'daily' | 'weekly' | 'hourly';
    lastBackupTimestamp: string;
  };

  // 10. Developer API & Webhooks
  developer: {
    liveApiKey: string;
    testApiKey: string;
    webhookUrl: string;
    webhookSecret: string;
    webhookEvents: string[];
    rateLimitPerMinute: number;
    sandboxSimulatedLatencyMs: number;
  };

  // 11. Database & Cache Engine (MySQL 8.0 + Redis 7.x Full Sync)
  databaseRedis: DatabaseRedisSyncConfig;
}

export const INITIAL_GLOBAL_CONFIG: GlobalSystemConfig = {
  general: {
    companyName: 'GoPaq Logistics Dominicana',
    legalName: 'GoPaq Courier & Cargo Dominicana S.R.L.',
    rncTaxId: '1-31-89234-5',
    slogan: 'Logística Inteligente, Envíos Locales & Courier Internacional',
    customDomain: 'app.gopaq.com.do',
    supportEmail: 'soporte@gopaq.com.do',
    billingEmail: 'facturacion@gopaq.com.do',
    supportPhone: '+1 (809) 567-8900',
    supportWhatsApp: '+1 (829) 450-2020',
    headquartersAddress: 'Av. Winston Churchill #1099, Torre Acrópolis, Nivel 14, Santo Domingo, D.N.',
    primaryColor: '#4f46e5',
    accentColor: '#06b6d4',
    themeStyle: 'modern',
    enableWhiteLabel: true,
    logoUrlLight: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=60',
    logoUrlDark: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=60',
    faviconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830312.png',
  },
  localization: {
    primaryCountry: 'DO',
    baseCurrency: 'DOP',
    enabledCurrencies: ['DOP', 'USD', 'EUR'],
    usdExchangeRate: 59.85,
    eurExchangeRate: 64.50,
    rateMode: 'bancentral_auto',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'America/Santo_Domingo (GMT-4)',
    weightUnit: 'lbs',
    dimensionUnit: 'in',
    decimalSeparator: '.',
  },
  lockerCustoms: {
    miamiWarehouseAddress: {
      line1: '8400 NW 25th St',
      line2: 'Suite 100 (Casillero: GP-[NUM])',
      city: 'Doral',
      state: 'FL',
      zipCode: '33198',
      country: 'Estados Unidos',
      contactPhone: '+1 (305) 592-3400',
    },
    boxPrefix: 'GP',
    boxNumberPadding: 5,
    deMinimisThresholdUsd: 200.0,
    itbisTaxRate: 18.0,
    fuelSurchargePercent: 4.5,
    airRatePerPoundDop: 245.0,
    airRatePerPoundUsd: 4.10,
    seaRatePerCubicFootUsd: 16.50,
    autoHoldRestrictedItems: true,
    requireInvoiceForDeMinimis: true,
    customsNotificationPhone: '+1 (809) 567-8900 Ext 204',
  },
  dispatch: {
    autoDispatchMode: 'intelligent_proximity',
    geofenceRadiusMeters: 100,
    maxStopsPerRoute: 24,
    maxWeightPerMotoKg: 30,
    maxWeightPerVanKg: 750,
    sameDayCutoffTime: '14:30',
    maxFailedAttempts: 3,
    mandatoryPodPhoto: true,
    mandatoryPodSignature: true,
    mandatoryPodOtp: false,
    allowDriverCashCollect: true,
    returnToWarehouseFeeDop: 150,
    highRiskZoneWarning: true,
  },
  fiscal: {
    eInvoicingEnabled: true,
    rncEmisor: '1-31-89234-5',
    nombreComercialEmisor: 'GOPAQ COURIER & LOGISTICS DOMINICANA SRL',
    securityTokenExpiryDays: 90,
    warningSequenceThreshold: 120,
    defaultCreditTermsDays: 30,
    autoGenerateNcfOnDelivery: true,
    sequences: {
      b01CreditFiscal: { current: 14820, max: 20000, prefix: 'B01000', expiryDate: '31/12/2026' },
      b02FinalConsumer: { current: 89340, max: 150000, prefix: 'B02000', expiryDate: '31/12/2026' },
      b14SpecialRegime: { current: 1240, max: 5000, prefix: 'B14000', expiryDate: '31/12/2026' },
      b15Government: { current: 630, max: 2000, prefix: 'B15000', expiryDate: '31/12/2026' },
    },
  },
  payments: {
    azulEnabled: true,
    azulMerchantId: '8090014299',
    azulEnvironment: 'production',
    cardnetEnabled: true,
    cardnetMerchantId: '004921008',
    cardnetEnvironment: 'production',
    stripeEnabled: true,
    stripePublishableKey: 'pk_live_51P89xGopaqLogisticsStripeLiveSecure',
    stripeEnvironment: 'live',
    bankTransferAchEnabled: true,
    bankName: 'Banco Popular Dominicano',
    bankAccountNumber: '798-234891-2',
    bankAccountType: 'Corriente',
    codServiceFeeType: 'percentage',
    codServiceFeeValue: 2.5,
    codSettlementSchedule: 'biweekly_tues_fri',
    minimumCodPayoutDop: 1000,
  },
  communications: {
    whatsappCloudApiEnabled: true,
    whatsappPhoneNumberId: '109284729102938',
    whatsappBusinessAccountId: 'waba_902348192847',
    whatsappAccessTokenMasked: 'EAAOxZBV...7192jX89',
    smsProvider: 'twilio',
    twilioAccountSid: 'AC98234891238912389123891238912389',
    twilioSenderName: 'GoPaq',
    emailProvider: 'sendgrid',
    emailFromAddress: 'envios@notificaciones.gopaq.com.do',
    emailFromName: 'GoPaq Notificaciones',
    eventTriggers: {
      onMiamiReceived: true,
      onInTransitFlight: true,
      onCustomsClearance: true,
      onBranchReadyPickup: true,
      onOutForDeliveryWithGps: true,
      onDeliveredWithPod: true,
      onCodPaymentReady: true,
    },
  },
  aiAutomation: {
    enabled: true,
    geminiModel: 'gemini-2.5-flash',
    autoInvoiceOcr: true,
    autoTariffClassification: true,
    smartAddressParser: true,
    aiCustomerSupportChatbot: true,
    smartRouteTrafficPredictor: true,
    confidenceThresholdPercent: 88,

    // Voice AI & Telephony Provider
    voiceProvider: 'vapi',
    voiceModelId: 'es-DO-Emilio-Expressive (Vapi Neural Dominicano)',
    callerPhoneDid: '+1 (809) 567-8900',
    voiceApiKeyMasked: 'vapi_live_89b274fa90123984712093847192834',
    voiceApiSecretMasked: 'vapi_sec_89123891028301928301928301928',
    voiceWebhookEndpoint: 'https://app.gopaq.com.do/api/voice/vapi/inbound',
    enableCallRecording: true,
    enableAnsweringMachineDetection: true,
    callMaxDurationSeconds: 150,
    voiceInterruptionSensitivity: 'balanced',
    humanEscalationPhone: '+1 (809) 567-8900 Ext 101',
    callHoursStart: '08:00',
    callHoursEnd: '20:30',
    fallbackToWhatsAppIfUnanswered: true,

    // Cron Jobs & Background Scheduler
    cronProvider: 'native_internal',
    cronSecretToken: 'gp_cron_sec_8971fbc92308129038471928347192',
    cronWebhookDispatcherUrl: 'https://app.gopaq.com.do/api/cron/dispatch',
    cronRetryAttempts: 3,
    cronJobs: [
      {
        id: 'cron-auto-dispatch-routes',
        name: 'Auto-despacho & Optimización Matutina de Rutas',
        description: 'Agrupa envíos asignados por cuadrantes GPS, calcula balanceo de carga y genera hojas de ruta para conductores.',
        cronExpression: '0 07 * * 1-6',
        enabled: true,
        category: 'operations',
        lastRun: 'Hoy, 07:00 AM',
        nextRun: 'Mañana, 07:00 AM',
        lastStatus: 'success',
        executionCount: 284,
        durationAvgMs: 1420,
      },
      {
        id: 'cron-bancentral-fx-sync',
        name: 'Sincronización de Tasas de Cambio Banco Central RD',
        description: 'Consulta el API oficial del Banco Central de la República Dominicana para actualizar tasas DOP/USD y DOP/EUR.',
        cronExpression: '0 08 * * 1-5',
        enabled: true,
        category: 'finance',
        lastRun: 'Hoy, 08:00 AM',
        nextRun: 'Mañana, 08:00 AM',
        lastStatus: 'success',
        executionCount: 412,
        durationAvgMs: 380,
      },
      {
        id: 'cron-miami-manifest-cut',
        name: 'Corte de Manifiesto & Pre-alertas Miami Doral Hub',
        description: 'Genera el manifiesto aduanal de consolidación aérea Doral-SDQ y pre-registra guías en sistema DGA.',
        cronExpression: '0 17 * * 1-5',
        enabled: true,
        category: 'customs',
        lastRun: 'Ayer, 05:00 PM',
        nextRun: 'Hoy, 05:00 PM',
        lastStatus: 'success',
        executionCount: 195,
        durationAvgMs: 2300,
      },
      {
        id: 'cron-cod-payout-settlement',
        name: 'Liquidación & Corte Automático COD a Comercios',
        description: 'Agrupa cobros contra entrega cobrados por conductores y genera órdenes de transferencia bancaria ACH para clientes comerciales.',
        cronExpression: '0 19 * * 2,5',
        enabled: true,
        category: 'finance',
        lastRun: 'Martes, 07:00 PM',
        nextRun: 'Viernes, 07:00 PM',
        lastStatus: 'success',
        executionCount: 88,
        durationAvgMs: 890,
      },
      {
        id: 'cron-outbox-sync-audit',
        name: 'Auditoría & Sincronización Forzada de Ledger Offline',
        description: 'Revisa transacciones locales outbox de conductores, resuelve colas en reintento y certifica firmas POD pendientes.',
        cronExpression: '*/15 * * * *',
        enabled: true,
        category: 'sync',
        lastRun: 'Hace 4 minutos',
        nextRun: 'En 11 minutos',
        lastStatus: 'success',
        executionCount: 14520,
        durationAvgMs: 120,
      },
      {
        id: 'cron-dgii-ncf-batch-emit',
        name: 'Emisión & Timbrado Fiscal e-CF / NCF DGII en Lote',
        description: 'Valida entregas cerradas del día y timbra automáticamente comprobantes electrónicos B01/B02 ante la DGII.',
        cronExpression: '0 21 * * *',
        enabled: true,
        category: 'finance',
        lastRun: 'Ayer, 09:00 PM',
        nextRun: 'Hoy, 09:00 PM',
        lastStatus: 'success',
        executionCount: 365,
        durationAvgMs: 3100,
      },
      {
        id: 'cron-intl-flight-tracking',
        name: 'Tracking de Vuelos Internacionales & Estado DGA',
        description: 'Consulta estatus de aerolíneas de carga y liquidación aduanal en el AILA (Aeropuerto Las Américas).',
        cronExpression: '*/30 * * * *',
        enabled: true,
        category: 'customs',
        lastRun: 'Hace 12 minutos',
        nextRun: 'En 18 minutos',
        lastStatus: 'success',
        executionCount: 8920,
        durationAvgMs: 640,
      },
      {
        id: 'cron-pickup-reminder-whatsapp',
        name: 'Recordatorio WhatsApp de Paquetes Listos en Sucursal',
        description: 'Envía notificaciones interactivas a destinatarios con paquetes disponibles en mostrador desde hace más de 48 horas.',
        cronExpression: '0 09,15 * * 1-6',
        enabled: true,
        category: 'notifications',
        lastRun: 'Hoy, 03:00 PM',
        nextRun: 'Mañana, 09:00 AM',
        lastStatus: 'success',
        executionCount: 520,
        durationAvgMs: 1850,
      },
      {
        id: 'cron-db-ledger-cloud-backup',
        name: 'Backup Diario de Base de Datos, Ledger & Export S3',
        description: 'Genera snapshot criptográfico de todos los envíos, transacciones COD y bitácoras para almacenamiento en frío redundante.',
        cronExpression: '0 03 * * *',
        enabled: true,
        category: 'system',
        lastRun: 'Hoy, 03:00 AM',
        nextRun: 'Mañana, 03:00 AM',
        lastStatus: 'success',
        executionCount: 420,
        durationAvgMs: 4600,
      },
    ],
  },
  security: {
    sessionTimeoutMinutes: 60,
    enforce2faAdmins: true,
    enforce2faBranches: false,
    passwordMinLength: 10,
    maintenanceMode: false,
    maintenanceMessage: 'Plataforma en mantenimiento programado. Estaremos de vuelta en breves momentos.',
    ipWhitelist: ['190.166.45.12', '200.88.19.4', '186.120.90.11'],
    allowDriverOfflineSync: true,
    autoBackupFrequency: 'daily',
    lastBackupTimestamp: '2026-08-28 04:00 AM (Exitoso - 42.8 MB)',
  },
  developer: {
    liveApiKey: 'gp_live_89a7fbc290d182e4719bb20984cf82901a',
    testApiKey: 'gp_test_4489a290bc8471fa82019cba77189a029c',
    webhookUrl: 'https://api.empresa.com/webhooks/gopaq-events',
    webhookSecret: 'whsec_90823491823901823901823901823901',
    webhookEvents: ['shipment.created', 'shipment.status_updated', 'pod.verified', 'cod.collected', 'ncf.issued'],
    rateLimitPerMinute: 600,
    sandboxSimulatedLatencyMs: 250,
  },
  databaseRedis: {
    mysqlEnabled: true,
    mysqlHost: 'mysql-primary.gopaq.internal',
    mysqlPort: 3306,
    mysqlDatabase: 'gopaq_production_db',
    mysqlUser: 'gopaq_admin',
    mysqlPasswordMasked: 'gopaq_sql_sec_891238910283019283019283',
    mysqlPoolMin: 5,
    mysqlPoolMax: 40,
    mysqlCharset: 'utf8mb4_unicode_ci',
    mysqlSslMode: 'required',
    mysqlIsolationLevel: 'READ COMMITTED',
    mysqlSlowQueryThresholdMs: 150,
    mysqlReadReplicaHost: 'mysql-replica-ro.gopaq.internal',

    redisEnabled: true,
    redisHost: 'redis-cluster.gopaq.internal',
    redisPort: 6379,
    redisPasswordMasked: 'gopaq_redis_token_88921f0092182381',
    redisDbIndex: 0,
    redisTlsEnabled: true,
    redisTopology: 'standalone',
    redisKeyPrefix: 'gopaq:',
    redisMaxMemoryPolicy: 'allkeys-lru',

    ttlDriverGpsLocationSeconds: 10,
    ttlExchangeRatesSeconds: 3600,
    ttlActiveShipmentTrackSeconds: 180,
    ttlUserSessionsSeconds: 86400,
    ttlBranchInventorySeconds: 300,

    syncStrategy: 'write_through',
    autoInvalidateCacheOnWrite: true,
    enableRedisPubSubBroadcasting: true,
    enableBinlogCdcStreamer: true,
    lastFullSyncTimestamp: '2026-08-28 18:30:00 (100% Sincronizado)',
    syncStatus: 'synced',
    totalSyncedKeys: 28450,
    totalMysqlRecords: 148920,
    cacheHitRatioPercent: 94.8,
    latencyMysqlMs: 4.2,
    latencyRedisMs: 0.8,
  },
};
