import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Code2,
  Coins,
  Database,
  Globe2,
  HardDrive,
  LockKeyhole,
  MapPinned,
  PackageCheck,
  Palette,
  RefreshCw,
  ReceiptText,
  Route,
  Save,
  ServerCog,
  ShieldCheck,
  Trash2,
  Truck,
  WalletCards,
  Wrench,
  XCircle
} from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card } from '../ui/DesignSystem';

type Category = 'organization' | 'localization' | 'services' | 'operations' | 'international' | 'finance' | 'billing' | 'notifications' | 'automation' | 'security' | 'driver' | 'storage' | 'integrations' | 'developer';
type SettingsMap = Record<string, Record<string, any>>;
type Field = { key: string; label: string; type: 'text' | 'email' | 'number' | 'time' | 'color' | 'boolean' | 'select' | 'csv'; help?: string; options?: Array<{ label: string; value: string }> };

const categoryMeta: Array<{ key: Category; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'organization', label: 'Organización e identidad', description: 'Datos comerciales, fiscales y visuales del tenant.', icon: <Palette className="h-4 w-4" /> },
  { key: 'localization', label: 'Localización y divisas', description: 'Moneda, impuestos, unidades y formatos regionales.', icon: <Coins className="h-4 w-4" /> },
  { key: 'services', label: 'Servicios', description: 'Capacidades que la organización ofrece y permite cotizar.', icon: <PackageCheck className="h-4 w-4" /> },
  { key: 'operations', label: 'Operaciones y despacho', description: 'SLA, horarios, cobertura y límites de ruta.', icon: <Route className="h-4 w-4" /> },
  { key: 'international', label: 'Internacional y casilleros', description: 'Aduanas, consolidación, países y límites.', icon: <Globe2 className="h-4 w-4" /> },
  { key: 'finance', label: 'Finanzas y COD', description: 'Reglas para recaudo, comisiones y liquidaciones.', icon: <WalletCards className="h-4 w-4" /> },
  { key: 'billing', label: 'Facturación fiscal', description: 'Parámetros fiscales y secuencias; el proveedor fiscal se configura aparte.', icon: <ReceiptText className="h-4 w-4" /> },
  { key: 'notifications', label: 'Notificaciones', description: 'Canales permitidos y eventos internos.', icon: <Bell className="h-4 w-4" /> },
  { key: 'automation', label: 'Automatización e IA', description: 'Políticas de automatización; no habilita un proveedor sin credenciales reales.', icon: <BrainCircuit className="h-4 w-4" /> },
  { key: 'security', label: 'Seguridad y sesiones', description: 'Políticas de acceso configurables por tenant.', icon: <LockKeyhole className="h-4 w-4" /> },
  { key: 'driver', label: 'Driver y sincronización', description: 'GPS, offline y requisitos de entrega.', icon: <Truck className="h-4 w-4" /> },
  { key: 'storage', label: 'Almacenamiento', description: 'Política de archivos, POD y documentos.', icon: <HardDrive className="h-4 w-4" /> },
  { key: 'integrations', label: 'Integraciones', description: 'Proveedores seleccionados; los secretos viven fuera de la UI.', icon: <Wrench className="h-4 w-4" /> },
  { key: 'developer', label: 'Desarrolladores y webhooks', description: 'Reintentos, expiración y comportamiento de API.', icon: <Code2 className="h-4 w-4" /> }
];

const fieldDefinitions: Record<Category, Field[]> = {
  organization: [
    { key: 'displayName', label: 'Nombre comercial', type: 'text' }, { key: 'legalName', label: 'Nombre legal', type: 'text' },
    { key: 'taxId', label: 'RNC / identificación fiscal', type: 'text' }, { key: 'supportEmail', label: 'Correo de soporte', type: 'email' },
    { key: 'supportPhone', label: 'Teléfono de soporte', type: 'text' }, { key: 'address', label: 'Dirección principal', type: 'text' },
    { key: 'country', label: 'País ISO', type: 'text', help: 'Código ISO de dos letras, por ejemplo DO.' }, { key: 'timezone', label: 'Zona horaria', type: 'text' },
    { key: 'primaryColor', label: 'Color primario', type: 'color' }, { key: 'secondaryColor', label: 'Color secundario', type: 'color' }
  ],
  localization: [
    { key: 'baseCurrency', label: 'Moneda base', type: 'select', options: [{ label: 'DOP — Peso dominicano', value: 'DOP' }, { label: 'USD — Dólar', value: 'USD' }, { label: 'EUR — Euro', value: 'EUR' }] },
    { key: 'enabledCurrencies', label: 'Monedas habilitadas', type: 'csv', help: 'Separadas por coma: DOP, USD, EUR.' }, { key: 'locale', label: 'Idioma y región', type: 'text' },
    { key: 'timezone', label: 'Zona horaria operativa', type: 'text' }, { key: 'weightUnit', label: 'Unidad de peso', type: 'select', options: [{ label: 'Kilogramos', value: 'kg' }, { label: 'Libras', value: 'lb' }] },
    { key: 'dimensionUnit', label: 'Unidad de dimensión', type: 'select', options: [{ label: 'Centímetros', value: 'cm' }, { label: 'Metros', value: 'm' }, { label: 'Pulgadas', value: 'in' }] },
    { key: 'taxRate', label: 'Impuesto general (%)', type: 'number' }
  ],
  services: [
    { key: 'local', label: 'Envíos locales', type: 'boolean' }, { key: 'national', label: 'Envíos nacionales', type: 'boolean' },
    { key: 'international', label: 'Courier internacional', type: 'boolean' }, { key: 'lockers', label: 'Casilleros', type: 'boolean' },
    { key: 'lastMile', label: 'Última milla', type: 'boolean' }, { key: 'pickups', label: 'Recogidas', type: 'boolean' },
    { key: 'returns', label: 'Devoluciones', type: 'boolean' }, { key: 'transfers', label: 'Transferencias entre sucursales', type: 'boolean' },
    { key: 'moving', label: 'Mudanzas', type: 'boolean' }, { key: 'heavyCargo', label: 'Carga pesada', type: 'boolean' },
    { key: 'cod', label: 'Pago contra entrega (COD)', type: 'boolean' }
  ],
  operations: [
    { key: 'pickupSlaHours', label: 'SLA de recogida (horas)', type: 'number' }, { key: 'deliverySlaHours', label: 'SLA de entrega (horas)', type: 'number' },
    { key: 'branchHoldingHours', label: 'Retención en sucursal (horas)', type: 'number' }, { key: 'operatingStart', label: 'Inicio de operaciones', type: 'time' },
    { key: 'operatingEnd', label: 'Fin de operaciones', type: 'time' }, { key: 'cutoffTime', label: 'Hora de corte', type: 'time' },
    { key: 'maxRouteStops', label: 'Máximo de paradas por ruta', type: 'number' }, { key: 'coverageRadiusKm', label: 'Radio de cobertura (km)', type: 'number' },
    { key: 'maxDeliveryAttempts', label: 'Máximo de intentos de entrega', type: 'number' }
  ],
  international: [
    { key: 'defaultOriginCountry', label: 'País de origen predeterminado', type: 'text' }, { key: 'lockerCountries', label: 'Países de casillero', type: 'csv', help: 'Códigos ISO separados por coma.' },
    { key: 'customsEnabled', label: 'Control aduanal habilitado', type: 'boolean' }, { key: 'maxDeclaredValueUsd', label: 'Valor declarado máximo (USD)', type: 'number' },
    { key: 'maxWeightKg', label: 'Peso máximo internacional (kg)', type: 'number' }, { key: 'consolidationEnabled', label: 'Consolidación habilitada', type: 'boolean' }
  ],
  finance: [
    { key: 'codEnabled', label: 'COD habilitado', type: 'boolean' }, { key: 'codCommissionRate', label: 'Comisión COD (%)', type: 'number' },
    { key: 'codSettlementDays', label: 'Días para liquidación COD', type: 'number' }, { key: 'allowedPaymentMethods', label: 'Métodos de pago', type: 'csv', help: 'cash, bank_transfer, card o mobile_wallet.' },
    { key: 'maxCodAmount', label: 'Monto máximo COD', type: 'number' }, { key: 'invoiceEnabled', label: 'Facturación habilitada', type: 'boolean' }
  ],
  billing: [
    { key: 'fiscalEnabled', label: 'Facturación fiscal habilitada', type: 'boolean' }, { key: 'invoicePrefix', label: 'Prefijo de factura', type: 'text' },
    { key: 'ncfSeries', label: 'Serie NCF', type: 'text' }, { key: 'nextInvoiceNumber', label: 'Próximo número fiscal', type: 'number' },
    { key: 'invoiceDueDays', label: 'Vencimiento de factura (días)', type: 'number' }
  ],
  notifications: [
    { key: 'internalEnabled', label: 'Notificaciones internas', type: 'boolean' }, { key: 'emailEnabled', label: 'Correo transaccional', type: 'boolean' },
    { key: 'smsEnabled', label: 'SMS', type: 'boolean' }, { key: 'whatsappEnabled', label: 'WhatsApp', type: 'boolean' }, { key: 'pushEnabled', label: 'Push', type: 'boolean' }
  ],
  automation: [
    { key: 'enabled', label: 'Automatizaciones habilitadas', type: 'boolean' }, { key: 'aiProvider', label: 'Proveedor de IA', type: 'select', options: [{ label: 'Ninguno', value: 'none' }, { label: 'Gemini', value: 'gemini' }] },
    { key: 'ocrEnabled', label: 'OCR', type: 'boolean' }, { key: 'voiceEnabled', label: 'Voz', type: 'boolean' },
    { key: 'requireHumanApproval', label: 'Exigir aprobación humana', type: 'boolean' }, { key: 'maxDailyTasks', label: 'Máximo de tareas por día', type: 'number' }
  ],
  security: [
    { key: 'passwordMinLength', label: 'Longitud mínima de contraseña', type: 'number' }, { key: 'maxLoginAttempts', label: 'Intentos máximos de acceso', type: 'number' },
    { key: 'lockoutMinutes', label: 'Bloqueo progresivo (minutos)', type: 'number' }, { key: 'requireTwoFactor', label: 'Requerir 2FA', type: 'boolean' },
    { key: 'ipAllowlist', label: 'IPs permitidas', type: 'csv', help: 'Déjalo vacío para no imponer una allowlist del tenant.' }
  ],
  driver: [
    { key: 'gpsIntervalSeconds', label: 'Intervalo GPS (segundos)', type: 'number' }, { key: 'offlineSyncBatchSize', label: 'Lote de sincronización offline', type: 'number' },
    { key: 'maxOfflineQueue', label: 'Máximo de elementos offline', type: 'number' }, { key: 'requirePodPhoto', label: 'Exigir foto en POD', type: 'boolean' },
    { key: 'requireSignature', label: 'Exigir firma en POD', type: 'boolean' }, { key: 'requireCodEvidence', label: 'Exigir evidencia para COD', type: 'boolean' }
  ],
  storage: [
    { key: 'provider', label: 'Proveedor de archivos', type: 'select', options: [{ label: 'Almacenamiento local', value: 'local' }, { label: 'S3', value: 's3' }, { label: 'Cloudflare R2', value: 'r2' }, { label: 'MinIO', value: 'minio' }] },
    { key: 'maxUploadMb', label: 'Tamaño máximo de archivo (MB)', type: 'number' }, { key: 'signedUrlTtlSeconds', label: 'Vigencia de URL firmada (segundos)', type: 'number' },
    { key: 'retentionDays', label: 'Retención de archivos (días)', type: 'number' }
  ],
  integrations: [
    { key: 'carrierProvider', label: 'Proveedor de carriers', type: 'select', options: [{ label: 'Ninguno', value: 'none' }, { label: 'Karrio', value: 'karrio' }] },
    { key: 'routingProvider', label: 'Proveedor de rutas', type: 'select', options: [{ label: 'Ninguno', value: 'none' }, { label: 'Valhalla', value: 'valhalla' }, { label: 'Witylogix', value: 'witylogix' }] },
    { key: 'geocodingProvider', label: 'Proveedor de geocoding', type: 'select', options: [{ label: 'Ninguno', value: 'none' }, { label: 'Photon', value: 'photon' }] },
    { key: 'externalTrackingEnabled', label: 'Tracking externo', type: 'boolean' }, { key: 'webhooksEnabled', label: 'Webhooks', type: 'boolean' }
  ],
  developer: [
    { key: 'webhookRetryAttempts', label: 'Intentos de webhook', type: 'number' }, { key: 'webhookBackoffSeconds', label: 'Backoff inicial (segundos)', type: 'number' },
    { key: 'apiKeyExpiryDays', label: 'Expiración de API Keys (días)', type: 'number', help: '0 significa que no expiran automáticamente.' }
  ]
};

function StatusCard({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"><span className="text-slate-600 dark:text-slate-300">{label}</span><span className={`flex items-center gap-1 font-bold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}{value}</span></div>;
}

export const GlobalConfiguration: React.FC = () => {
  const { addToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category>('organization');
  const [settings, setSettings] = useState<SettingsMap>({});
  const [savedSettings, setSavedSettings] = useState<SettingsMap>({});
  const [version, setVersion] = useState(0);
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [ready, setReady] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any>(null);
  const [googleMaps, setGoogleMaps] = useState<{ configured: boolean; keyHint: string | null; updatedAt: string | null }>({ configured: false, keyHint: null, updatedAt: null });
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [googleMapsSaving, setGoogleMapsSaving] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const [configuration, readiness, integrationHealth, revisionResult] = await Promise.all([
      ApiClient.getConfiguration(),
      ApiClient.getReadiness(),
      ApiClient.getIntegrationsHealth(),
      ApiClient.getConfigurationRevisions(10)
    ]);
    if (!configuration.success) setError(configuration.error);
    else {
      setSettings(configuration.settings);
      setSavedSettings(configuration.settings);
      setVersion(configuration.version);
      setConfigured(configuration.configured);
      setUpdatedAt(configuration.updatedAt);
      setGoogleMaps(configuration.googleMaps);
      setGoogleMapsKey('');
      setGoogleMapsError('');
    }
    if (readiness.success) setReady(readiness);
    if (integrationHealth.success) setIntegrations(integrationHealth);
    if (revisionResult.success) setRevisions(revisionResult.revisions || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const activeMeta = useMemo(() => categoryMeta.find((category) => category.key === activeCategory) || categoryMeta[0], [activeCategory]);
  const activeFields = fieldDefinitions[activeCategory];
  const activeValues = settings[activeCategory] || {};
  const dirty = JSON.stringify(activeValues) !== JSON.stringify(savedSettings[activeCategory] || {});

  const updateField = (field: Field, rawValue: string | boolean) => {
    let value: unknown = rawValue;
    if (field.type === 'number') value = rawValue === '' ? '' : Number(rawValue);
    if (field.type === 'csv') value = String(rawValue).split(',').map((item) => item.trim()).filter(Boolean);
    setSettings((current) => ({ ...current, [activeCategory]: { ...(current[activeCategory] || {}), [field.key]: value } }));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const result = await ApiClient.updateConfiguration(activeCategory, activeValues, version, `Actualización desde Configuración Global: ${activeMeta.label}`);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    setSettings(result.settings);
    setSavedSettings(result.settings);
    setVersion(result.version);
    setConfigured(true);
    setUpdatedAt(result.updatedAt);
    addToast('success', 'Configuración guardada', `${activeMeta.label} quedó persistida en PostgreSQL, versión ${result.version}.`);
    const revisionResult = await ApiClient.getConfigurationRevisions(10);
    if (revisionResult.success) setRevisions(revisionResult.revisions || []);
  };

  const saveGoogleMaps = async (apiKey: string | null) => {
    setGoogleMapsSaving(true);
    setGoogleMapsError('');
    const result = await ApiClient.updateGoogleMapsConfiguration(apiKey, version, apiKey === null ? 'Retiro de credencial Google Maps' : 'Configuración de credencial Google Maps');
    setGoogleMapsSaving(false);
    if (!result.success) { setGoogleMapsError(result.error); return; }
    setVersion(result.version);
    setConfigured(true);
    setUpdatedAt(result.updatedAt);
    setGoogleMaps(result.googleMaps);
    setGoogleMapsKey('');
    addToast('success', apiKey === null ? 'Google Maps retirado' : 'Google Maps configurado', apiKey === null ? 'La credencial fue retirada del tenant.' : 'La credencial quedó guardada cifrada y versionada en PostgreSQL.');
    const revisionResult = await ApiClient.getConfigurationRevisions(10);
    if (revisionResult.success) setRevisions(revisionResult.revisions || []);
  };

  const displayValue = (field: Field) => {
    const value = activeValues[field.key];
    if (field.type === 'csv') return Array.isArray(value) ? value.join(', ') : String(value || '');
    return value ?? '';
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white"><ServerCog className="h-6 w-6 text-indigo-600" />Configuración Global</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Centro maestro del tenant actual. Los valores de negocio se guardan por organización; los secretos de infraestructura y proveedores del servidor permanecen fuera del navegador. Las credenciales restringidas para el navegador, como Google Maps, tienen un control separado y nunca se vuelven a mostrar completas.</p></div>
      <Button variant="secondary" size="sm" icon={<RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />} onClick={() => void load()} disabled={loading}>Actualizar</Button>
    </div>
    {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard label="Versión de configuración" ok={configured || version === 0} value={configured ? `v${version}` : 'Predeterminada'} />
      <StatusCard label="PostgreSQL / PostGIS" ok={!!ready?.database?.ok} value={ready?.database?.postgisVersion ? 'Conectado' : 'Sin respuesta'} />
      <StatusCard label="Redis y workers" ok={!!ready?.redis?.ok} value={ready?.redis?.ok ? 'Disponible' : 'Sin respuesta'} />
      <StatusCard label="Último cambio" ok={!!updatedAt || version === 0} value={updatedAt ? new Date(updatedAt).toLocaleString('es-DO') : 'Aún no guardado'} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <Card className="h-fit p-2">
        <div className="px-3 pb-2 pt-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Configuración del tenant</p></div>
        <div className="space-y-1">{categoryMeta.map((category) => <button key={category.key} type="button" onClick={() => setActiveCategory(category.key)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${activeCategory === category.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><span className={`mt-0.5 ${activeCategory === category.key ? 'text-indigo-100' : 'text-indigo-600'}`}>{category.icon}</span><span className="min-w-0"><span className="block text-xs font-bold">{category.label}</span><span className={`mt-0.5 block text-[10px] leading-4 ${activeCategory === category.key ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{category.description}</span></span></button>)}</div>
      </Card>

      <div className="space-y-6">
        <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" /><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">{activeMeta.label}</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{activeMeta.description} Los cambios se validan en el backend, se guardan con control de versión y generan auditoría/outbox.</p></div></div></Card>

        <Card>
          {loading ? <p className="text-sm text-slate-500">Cargando configuración desde GoPaq…</p> : <div className="grid gap-4 md:grid-cols-2">{activeFields.map((field) => <label key={field.key} className={`block text-xs font-bold ${field.type === 'boolean' ? 'flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800' : ''}`}><span>{field.label}{field.help && <span className="mt-1 block text-[10px] font-normal leading-4 text-slate-500">{field.help}</span>}</span>{field.type === 'boolean' ? <input type="checkbox" checked={Boolean(activeValues[field.key])} onChange={(event) => updateField(field, event.target.checked)} className="h-4 w-4 accent-indigo-600" /> : field.type === 'select' ? <select value={String(displayValue(field))} onChange={(event) => updateField(field, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <div className="mt-1 flex items-center gap-2">{field.type === 'color' && <input type="color" value={String(displayValue(field) || '#000000')} onChange={(event) => updateField(field, event.target.value)} className="h-11 w-12 rounded-lg border border-slate-200 bg-white p-1" />}{<input type={field.type === 'color' ? 'text' : field.type} value={String(displayValue(field))} onChange={(event) => updateField(field, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900" />}</div>}</label>)}</div>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800"><p className="text-[11px] text-slate-500">{dirty ? 'Hay cambios sin guardar en esta sección.' : configured ? `Versión ${version} sincronizada con el backend.` : 'Valores predeterminados; todavía no existe una configuración personalizada para este tenant.'}</p><Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={() => void save()} disabled={saving || loading || !dirty}>{saving ? 'Guardando…' : 'Guardar sección'}</Button></div>
        </Card>

        {activeCategory === 'integrations' && <>
          <Card className="border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-300" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Maps para mapas públicos</h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">Administra aquí la clave de navegador que utilizará el mapa de sucursales. Se guarda cifrada, no se vuelve a mostrar completa y no se comparte con otros tenants.</p>
                </div>
              </div>
              <StatusCard label="Estado" ok={googleMaps.configured} value={googleMaps.configured ? `CONFIGURADO ${googleMaps.keyHint || ''}` : 'NO CONFIGURADO'} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Nueva clave de Google Maps
                <input type="password" value={googleMapsKey} onChange={(event) => setGoogleMapsKey(event.target.value)} placeholder={googleMaps.configured ? 'Escribe una nueva clave para reemplazarla' : 'Pega aquí la clave restringida de Google Cloud'} autoComplete="new-password" spellCheck={false} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              </label>
              <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={() => void saveGoogleMaps(googleMapsKey.trim())} disabled={googleMapsSaving || loading || googleMapsKey.trim().length < 20}>{googleMapsSaving ? 'Guardando…' : 'Guardar clave'}</Button>
              <button type="button" onClick={() => { if (window.confirm('¿Retirar la credencial de Google Maps de este tenant?')) void saveGoogleMaps(null); }} disabled={googleMapsSaving || loading || !googleMaps.configured} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"><Trash2 className="h-4 w-4" />Retirar</button>
            </div>
            {googleMapsError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{googleMapsError}</p>}
            <p className="mt-3 text-[11px] leading-5 text-slate-500">Usa restricciones HTTP referrer para <code className="font-mono">https://gopaq.lat/*</code> y habilita únicamente Maps JavaScript API/Places si realmente los necesitas. Configurado no significa que Google haya validado la facturación o las restricciones.</p>
          </Card>
          <Card><div className="mb-3 flex items-center gap-2"><Wrench className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-bold">Estado real de proveedores</h3></div><div className="grid gap-2 sm:grid-cols-2"><StatusCard label="Karrio" ok={integrations?.karrio?.status === 'ONLINE'} value={integrations?.karrio?.status || 'NO CONFIGURADO'} /><StatusCard label="Witylogix" ok={integrations?.witylogix?.status === 'ONLINE'} value={integrations?.witylogix?.status || 'NO CONFIGURADO'} /></div><p className="mt-3 text-[11px] leading-5 text-slate-500">Seleccionar un proveedor no crea credenciales ni inventa una conexión. El proveedor solo se considera activo cuando el adaptador del backend confirma el servicio.</p></Card>
        </>}
        {activeCategory === 'security' && <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><p className="text-xs leading-5 text-amber-900 dark:text-amber-200">Los cambios de seguridad se aplican a nuevas sesiones y deben probarse con una cuenta distinta. JWT, cookies, secretos, TLS y contraseñas existentes no se muestran en esta pantalla.</p></div></Card>}
      </div>
    </div>

    <Card><div className="mb-4 flex items-center gap-2"><Database className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-bold">Historial de cambios de configuración</h3></div>{!revisions.length ? <p className="text-xs text-slate-500">Aún no existen cambios guardados para esta organización.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{revisions.map((revision) => <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div><p className="font-bold">Versión {revision.version}</p><p className="text-slate-500">{revision.change_reason || 'Cambio de configuración'} · {revision.changed_by || 'Usuario autenticado'}</p></div><time className="text-slate-500">{revision.created_at ? new Date(revision.created_at).toLocaleString('es-DO') : '—'}</time></div>)}</div>}</Card>
  </div>;
};
