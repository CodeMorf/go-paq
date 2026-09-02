import crypto from 'crypto';
import { z } from 'zod';
import { isPostgres, queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';

export const CONFIGURATION_CATEGORIES = [
  'organization',
  'localization',
  'services',
  'operations',
  'international',
  'finance',
  'billing',
  'notifications',
  'automation',
  'security',
  'driver',
  'storage',
  'integrations',
  'developer'
] as const;

export type ConfigurationCategory = typeof CONFIGURATION_CATEGORIES[number];

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hexadecimal válido.');

export const DEFAULT_CONFIGURATION: Record<ConfigurationCategory, Record<string, unknown>> = {
  organization: {
    displayName: 'GoPaq',
    legalName: '',
    taxId: '',
    supportEmail: '',
    supportPhone: '',
    address: '',
    country: 'DO',
    timezone: 'America/Santo_Domingo',
    primaryColor: '#4f46e5',
    secondaryColor: '#0f172a'
  },
  localization: {
    baseCurrency: 'DOP',
    enabledCurrencies: ['DOP', 'USD', 'EUR'],
    locale: 'es-DO',
    timezone: 'America/Santo_Domingo',
    weightUnit: 'kg',
    dimensionUnit: 'cm',
    taxRate: 18
  },
  services: {
    local: true,
    national: true,
    international: true,
    lockers: true,
    lastMile: true,
    pickups: true,
    returns: true,
    transfers: true,
    moving: true,
    heavyCargo: true,
    cod: true
  },
  operations: {
    pickupSlaHours: 24,
    deliverySlaHours: 48,
    branchHoldingHours: 72,
    operatingStart: '08:00',
    operatingEnd: '18:00',
    cutoffTime: '15:00',
    maxRouteStops: 50,
    coverageRadiusKm: 50,
    maxDeliveryAttempts: 2
  },
  international: {
    defaultOriginCountry: 'US',
    lockerCountries: ['US'],
    customsEnabled: true,
    maxDeclaredValueUsd: 2500,
    maxWeightKg: 100,
    consolidationEnabled: true
  },
  finance: {
    codEnabled: true,
    codCommissionRate: 2,
    codSettlementDays: 3,
    allowedPaymentMethods: ['cash', 'bank_transfer'],
    maxCodAmount: 100000,
    invoiceEnabled: false
  },
  billing: {
    fiscalEnabled: false,
    invoicePrefix: '',
    ncfSeries: '',
    nextInvoiceNumber: 1,
    invoiceDueDays: 30
  },
  notifications: {
    internalEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    whatsappEnabled: false,
    pushEnabled: false
  },
  automation: {
    enabled: false,
    aiProvider: 'none',
    ocrEnabled: false,
    voiceEnabled: false,
    requireHumanApproval: true,
    maxDailyTasks: 100
  },
  security: {
    passwordMinLength: 12,
    maxLoginAttempts: 12,
    lockoutMinutes: 15,
    requireTwoFactor: false,
    ipAllowlist: []
  },
  driver: {
    gpsIntervalSeconds: 30,
    offlineSyncBatchSize: 25,
    maxOfflineQueue: 500,
    requirePodPhoto: false,
    requireSignature: false,
    requireCodEvidence: true
  },
  storage: {
    provider: 'local',
    maxUploadMb: 10,
    signedUrlTtlSeconds: 900,
    retentionDays: 365
  },
  integrations: {
    carrierProvider: 'none',
    routingProvider: 'none',
    geocodingProvider: 'none',
    externalTrackingEnabled: false,
    webhooksEnabled: true
  },
  developer: {
    webhookRetryAttempts: 5,
    webhookBackoffSeconds: 2,
    apiKeyExpiryDays: 0
  }
};

const categorySchemas: Record<ConfigurationCategory, z.ZodTypeAny> = {
  organization: z.object({
    displayName: z.string().trim().min(2).max(120),
    legalName: z.string().trim().max(160),
    taxId: z.string().trim().max(80),
    supportEmail: z.string().trim().email().max(160).or(z.literal('')),
    supportPhone: z.string().trim().max(40),
    address: z.string().trim().max(300),
    country: z.string().trim().length(2).toUpperCase(),
    timezone: z.string().trim().min(3).max(80),
    primaryColor: colorSchema,
    secondaryColor: colorSchema
  }).partial().strict(),
  localization: z.object({
    baseCurrency: z.enum(['DOP', 'USD', 'EUR']),
    enabledCurrencies: z.array(z.enum(['DOP', 'USD', 'EUR'])).min(1).max(3),
    locale: z.string().trim().min(2).max(20),
    timezone: z.string().trim().min(3).max(80),
    weightUnit: z.enum(['kg', 'lb']),
    dimensionUnit: z.enum(['cm', 'm', 'in']),
    taxRate: z.number().finite().min(0).max(100)
  }).partial().strict(),
  services: z.object({
    local: z.boolean(), national: z.boolean(), international: z.boolean(), lockers: z.boolean(),
    lastMile: z.boolean(), pickups: z.boolean(), returns: z.boolean(), transfers: z.boolean(),
    moving: z.boolean(), heavyCargo: z.boolean(), cod: z.boolean()
  }).partial().strict(),
  operations: z.object({
    pickupSlaHours: z.number().finite().min(1).max(720),
    deliverySlaHours: z.number().finite().min(1).max(720),
    branchHoldingHours: z.number().finite().min(1).max(8760),
    operatingStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    operatingEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    cutoffTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    maxRouteStops: z.number().int().min(1).max(500),
    coverageRadiusKm: z.number().finite().min(1).max(1000),
    maxDeliveryAttempts: z.number().int().min(1).max(10)
  }).partial().strict(),
  international: z.object({
    defaultOriginCountry: z.string().trim().length(2).toUpperCase(),
    lockerCountries: z.array(z.string().trim().length(2).toUpperCase()).max(100),
    customsEnabled: z.boolean(),
    maxDeclaredValueUsd: z.number().finite().min(0).max(100000000),
    maxWeightKg: z.number().finite().positive().max(100000),
    consolidationEnabled: z.boolean()
  }).partial().strict(),
  finance: z.object({
    codEnabled: z.boolean(),
    codCommissionRate: z.number().finite().min(0).max(100),
    codSettlementDays: z.number().int().min(0).max(365),
    allowedPaymentMethods: z.array(z.enum(['cash', 'bank_transfer', 'card', 'mobile_wallet'])).min(1).max(10),
    maxCodAmount: z.number().finite().min(0).max(1000000000),
    invoiceEnabled: z.boolean()
  }).partial().strict(),
  billing: z.object({
    fiscalEnabled: z.boolean(),
    invoicePrefix: z.string().trim().max(30),
    ncfSeries: z.string().trim().max(30),
    nextInvoiceNumber: z.number().int().min(1).max(1000000000),
    invoiceDueDays: z.number().int().min(0).max(3650)
  }).partial().strict(),
  notifications: z.object({
    internalEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    whatsappEnabled: z.boolean(),
    pushEnabled: z.boolean()
  }).partial().strict(),
  automation: z.object({
    enabled: z.boolean(),
    aiProvider: z.enum(['none', 'gemini']),
    ocrEnabled: z.boolean(),
    voiceEnabled: z.boolean(),
    requireHumanApproval: z.boolean(),
    maxDailyTasks: z.number().int().min(1).max(100000)
  }).partial().strict(),
  security: z.object({
    passwordMinLength: z.number().int().min(8).max(128),
    maxLoginAttempts: z.number().int().min(3).max(100),
    lockoutMinutes: z.number().int().min(1).max(1440),
    requireTwoFactor: z.boolean(),
    ipAllowlist: z.array(z.string().trim().min(1).max(100)).max(500)
  }).partial().strict(),
  driver: z.object({
    gpsIntervalSeconds: z.number().int().min(5).max(3600),
    offlineSyncBatchSize: z.number().int().min(1).max(500),
    maxOfflineQueue: z.number().int().min(1).max(10000),
    requirePodPhoto: z.boolean(),
    requireSignature: z.boolean(),
    requireCodEvidence: z.boolean()
  }).partial().strict(),
  storage: z.object({
    provider: z.enum(['local', 's3', 'r2', 'minio']),
    maxUploadMb: z.number().finite().positive().max(1024),
    signedUrlTtlSeconds: z.number().int().min(60).max(86400),
    retentionDays: z.number().int().min(1).max(3650)
  }).partial().strict(),
  integrations: z.object({
    carrierProvider: z.enum(['none', 'karrio']),
    routingProvider: z.enum(['none', 'valhalla', 'witylogix']),
    geocodingProvider: z.enum(['none', 'photon']),
    externalTrackingEnabled: z.boolean(),
    webhooksEnabled: z.boolean()
  }).partial().strict(),
  developer: z.object({
    webhookRetryAttempts: z.number().int().min(1).max(20),
    webhookBackoffSeconds: z.number().int().min(1).max(3600),
    apiKeyExpiryDays: z.number().int().min(0).max(3650)
  }).partial().strict()
};

function parseSettings(value: unknown): Record<string, Record<string, unknown>> {
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeWithDefaults(saved: Record<string, Record<string, unknown>>): Record<ConfigurationCategory, Record<string, unknown>> {
  return Object.fromEntries(CONFIGURATION_CATEGORIES.map((category) => [
    category,
    { ...DEFAULT_CONFIGURATION[category], ...(saved[category] || {}) }
  ])) as Record<ConfigurationCategory, Record<string, unknown>>;
}

const serviceConfigurationKey: Record<string, string> = {
  local: 'local',
  express: 'local',
  nacional: 'national',
  internacional: 'international',
  mudanza: 'moving',
  carga_pesada: 'heavyCargo'
};

export async function assertServiceEnabled(organizationId: string, serviceType: string) {
  const key = serviceConfigurationKey[serviceType];
  if (!key) return;
  const configuration = await getOrganizationConfiguration(organizationId);
  if (configuration.settings.services[key] === false) {
    throw Object.assign(new Error('Este servicio está deshabilitado en la configuración de la organización.'), { statusCode: 409 });
  }
}

export async function getOrganizationConfiguration(organizationId: string) {
  const row = await queryOneAsync<{ settings_json: string; version: number; updated_by: string | null; updated_at: string | null }>(
    'SELECT settings_json, version, updated_by, updated_at FROM organization_settings WHERE organization_id = ?',
    [organizationId]
  );
  return {
    settings: mergeWithDefaults(parseSettings(row?.settings_json)),
    version: row ? Number(row.version) : 0,
    configured: !!row,
    updatedBy: row?.updated_by || null,
    updatedAt: row?.updated_at || null
  };
}

export async function updateOrganizationConfiguration(input: {
  organizationId: string;
  userId: string;
  category: ConfigurationCategory;
  patch: unknown;
  expectedVersion: number;
  reason?: string;
  ipAddress?: string;
}) {
  const parsed = categorySchemas[input.category].safeParse(input.patch);
  if (!parsed.success) {
    throw Object.assign(new Error('La configuración contiene valores inválidos.'), { statusCode: 422 });
  }
  const validatedPatch = parsed.data as Record<string, unknown>;

  const result = await transactionAsync(async (tx) => {
    const existing = await tx.queryOne<{ settings_json: string; version: number }>(
      `SELECT settings_json, version FROM organization_settings WHERE organization_id = ?${isPostgres ? ' FOR UPDATE' : ''}`,
      [input.organizationId]
    );
    const currentVersion = existing ? Number(existing.version) : 0;
    if (currentVersion !== input.expectedVersion) {
      throw Object.assign(new Error('La configuración cambió mientras editabas. Actualiza la vista y vuelve a intentar.'), { statusCode: 409 });
    }

    const current = mergeWithDefaults(parseSettings(existing?.settings_json));
    const nextSettings = {
      ...current,
      [input.category]: { ...current[input.category], ...validatedPatch }
    };
    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();
    const settingsJson = JSON.stringify(nextSettings);

    if (existing) {
      await tx.execute(
        'UPDATE organization_settings SET settings_json = ?, version = ?, updated_by = ?, updated_at = ? WHERE organization_id = ? AND version = ?',
        [settingsJson, nextVersion, input.userId, now, input.organizationId, currentVersion]
      );
    } else {
      await tx.execute(
        'INSERT INTO organization_settings (organization_id, settings_json, version, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [input.organizationId, settingsJson, nextVersion, input.userId, now, now]
      );
    }

    await tx.execute(
      'INSERT INTO organization_setting_revisions (id, organization_id, version, settings_json, changed_by, change_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`cfg-rev-${crypto.randomUUID()}`, input.organizationId, nextVersion, settingsJson, input.userId, input.reason || `Actualización de ${input.category}`, now]
    );
    await tx.execute(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at)
       VALUES (?, ?, ?, 'configuration.updated', 'organization_settings', ?, 'success', ?, ?, ?)`,
      [`aud-${crypto.randomUUID()}`, input.organizationId, input.userId, input.organizationId, input.ipAddress || null, JSON.stringify({ category: input.category, version: nextVersion }), now]
    );
    await tx.execute(
      `INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at)
       VALUES (?, ?, 'configuration.updated', 'organization_settings', ?, ?, 'pending', 0, ?)`,
      [`out-${crypto.randomUUID()}`, input.organizationId, input.organizationId, JSON.stringify({ organizationId: input.organizationId, category: input.category, version: nextVersion }), now]
    );

    return { settings: nextSettings, version: nextVersion, updatedBy: input.userId, updatedAt: now };
  });

  return { ...result, configured: true };
}

export async function getConfigurationRevisions(organizationId: string, limit = 50) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  return queryAllAsync(
    `SELECT id, version, changed_by, change_reason, created_at
     FROM organization_setting_revisions
     WHERE organization_id = ?
     ORDER BY version DESC
     LIMIT ?`,
    [organizationId, safeLimit]
  );
}
