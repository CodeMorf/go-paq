import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Building2, 
  Globe, 
  Package, 
  Truck, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  BrainCircuit, 
  ShieldCheck, 
  Key, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Search, 
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Zap,
  Check,
  Database
} from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';
import { GlobalSystemConfig, INITIAL_GLOBAL_CONFIG } from './settings/settingsTypes';
import { GeneralBrandingTab } from './settings/GeneralBrandingTab';
import { LocalizationCurrencyTab } from './settings/LocalizationCurrencyTab';
import { LockerCustomsTab } from './settings/LockerCustomsTab';
import { DispatchOperationsTab } from './settings/DispatchOperationsTab';
import { FiscalInvoicingTab } from './settings/FiscalInvoicingTab';
import { PaymentsCodTab } from './settings/PaymentsCodTab';
import { CommunicationsNotificationsTab } from './settings/CommunicationsNotificationsTab';
import { AiAutomationTab } from './settings/AiAutomationTab';
import { DatabaseRedisSyncTab } from './settings/DatabaseRedisSyncTab';
import { SecurityAccessTab } from './settings/SecurityAccessTab';
import { ApiWebhooksTab } from './settings/ApiWebhooksTab';

type SettingsTabId = 
  | 'general' 
  | 'localization' 
  | 'lockerCustoms' 
  | 'dispatch' 
  | 'fiscal' 
  | 'payments' 
  | 'communications' 
  | 'aiAutomation' 
  | 'databaseRedis'
  | 'security' 
  | 'developer';

export const SystemSettings: React.FC = () => {
  const { addToast, currency, setCurrency, country, setCountry } = useApp();
  const [config, setConfig] = useState<GlobalSystemConfig>(INITIAL_GLOBAL_CONFIG);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync back to context when general localization changes
  const handleUpdateSection = <K extends keyof GlobalSystemConfig>(
    section: K, 
    updates: Partial<GlobalSystemConfig[K]>
  ) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          ...updates,
        },
      };
      return next;
    });
    setHasUnsavedChanges(true);

    // If currency or country were updated in the tab, keep global AppContext in sync
    if (section === 'localization') {
      const locUpdates = updates as Partial<GlobalSystemConfig['localization']>;
      if (locUpdates.baseCurrency && locUpdates.baseCurrency !== currency) {
        setCurrency(locUpdates.baseCurrency);
      }
      if (locUpdates.primaryCountry && locUpdates.primaryCountry !== country) {
        setCountry(locUpdates.primaryCountry as any);
      }
    }
  };

  const handleSaveAll = () => {
    setHasUnsavedChanges(false);
    addToast('success', 'Configuración Guardada', 'Todos los parámetros globales del sistema han sido persistidos y sincronizados en tiempo real.');
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar todos los parámetros de configuración a sus valores originales de fábrica?')) {
      setConfig(INITIAL_GLOBAL_CONFIG);
      setHasUnsavedChanges(false);
      addToast('info', 'Valores Restaurados', 'Se han restablecido todos los ajustes a los valores iniciales predeterminados.');
    }
  };

  const handleDownloadJsonBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gopaq-global-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Backup Exportado', 'Archivo de configuración JSON descargado con éxito.');
  };

  // Quick preset handlers
  const handleApplyPeakSeasonPreset = () => {
    setConfig((prev) => ({
      ...prev,
      dispatch: {
        ...prev.dispatch,
        maxStopsPerRoute: 35,
        sameDayCutoffTime: '16:00',
        autoDispatchMode: 'intelligent_proximity',
      },
      lockerCustoms: {
        ...prev.lockerCustoms,
        fuelSurchargePercent: 5.5,
      },
      security: {
        ...prev.security,
        sessionTimeoutMinutes: 120,
      }
    }));
    setHasUnsavedChanges(true);
    addToast('success', 'Preset de Temporada Alta Aplicado', 'Parámetros optimizados para Black Friday / Temporada Navideña (aforo ampliado y mayor flexibilidad de ruta).');
  };

  const tabsConfig = [
    { id: 'general', label: 'Marca & Identidad', icon: <Building2 className="w-4 h-4" />, desc: 'Nombre, RNC, colores, logo y dominio' },
    { id: 'localization', label: 'Monedas & Tasas', icon: <Globe className="w-4 h-4" />, desc: 'País sede, divisas, tasas de cambio y unidades' },
    { id: 'lockerCustoms', label: 'Casillero & Aduanas', icon: <Package className="w-4 h-4" />, desc: 'Warehouse Miami, DGA De Minimis y fletes' },
    { id: 'dispatch', label: 'Despacho & Rutas', icon: <Truck className="w-4 h-4" />, desc: 'Geocercas, POD foto/firma y límites de flota' },
    { id: 'fiscal', label: 'Fiscal DGII & NCF', icon: <FileText className="w-4 h-4" />, desc: 'Secuencias B01, B02, B14, B15 y e-CF' },
    { id: 'payments', label: 'Pasarelas & COD', icon: <CreditCard className="w-4 h-4" />, desc: 'Azul, Cardnet, Stripe, ACH y liquidación COD' },
    { id: 'communications', label: 'Comunicaciones & WhatsApp', icon: <MessageSquare className="w-4 h-4" />, desc: 'WhatsApp Cloud API, SMS Twilio y disparadores' },
    { id: 'aiAutomation', label: 'IA de Voz, Automatizaciones & Cron', icon: <BrainCircuit className="w-4 h-4" />, desc: 'Telefonía Vapi/Twilio, Cron jobs, eventos y Gemini OCR' },
    { id: 'databaseRedis', label: 'Base de Datos MySQL & Redis', icon: <Database className="w-4 h-4" />, desc: 'MySQL 8.0 ACID, Redis 7.x in-memory, Full Sync y CDC' },
    { id: 'security', label: 'Seguridad & Accesos', icon: <ShieldCheck className="w-4 h-4" />, desc: '2FA, IPs permitidas, sesiones y modo mantenimiento' },
    { id: 'developer', label: 'API Keys & Webhooks', icon: <Key className="w-4 h-4" />, desc: 'Claves Live/Sandbox, endpoints y firmas HMAC' },
  ] as const;

  // Filter tabs when search is applied
  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return tabsConfig;
    const q = searchQuery.toLowerCase();
    return tabsConfig.filter(t => 
      t.label.toLowerCase().includes(q) || 
      t.desc.toLowerCase().includes(q) || 
      t.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Centro de Configuración Global del Sistema</span>
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase animate-pulse border border-amber-300 dark:border-amber-800">
                    Cambios Pendientes
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Panel centralizado para administrar todos los parámetros corporativos, fiscales, logísticos, proveedores de IA de voz, tareas cron y tecnología de GoPaq
              </p>
            </div>
          </div>
        </div>

        {/* Master Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            size="sm"
            variant="secondary"
            icon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
            onClick={handleApplyPeakSeasonPreset}
            title="Optimizar parámetros para temporada navideña / alta demanda"
          >
            Preset Black Friday
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadJsonBackup}
          >
            Exportar JSON
          </Button>

          <Button
            size="sm"
            variant="secondary"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleResetDefaults}
          >
            Restablecer
          </Button>

          <Button
            size="md"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveAll}
            className="shadow-xs font-bold"
          >
            Guardar Configuración
          </Button>
        </div>
      </div>

      {/* Search & Navigation Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cualquier parámetro (ej: MySQL, Redis, Full Sync, CDC, Cron, Vapi, IA de Voz, NCF, WhatsApp, De Minimis, Dólar, Geocerca, Azul, Gemini)..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tab Switcher Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {filteredTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTabId)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                    {tab.icon}
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Panel */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <GeneralBrandingTab
            config={config.general}
            onChange={(u) => handleUpdateSection('general', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'localization' && (
          <LocalizationCurrencyTab
            config={config.localization}
            onChange={(u) => handleUpdateSection('localization', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'lockerCustoms' && (
          <LockerCustomsTab
            config={config.lockerCustoms}
            onChange={(u) => handleUpdateSection('lockerCustoms', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchOperationsTab
            config={config.dispatch}
            onChange={(u) => handleUpdateSection('dispatch', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'fiscal' && (
          <FiscalInvoicingTab
            config={config.fiscal}
            onChange={(u) => handleUpdateSection('fiscal', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsCodTab
            config={config.payments}
            onChange={(u) => handleUpdateSection('payments', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'communications' && (
          <CommunicationsNotificationsTab
            config={config.communications}
            onChange={(u) => handleUpdateSection('communications', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'aiAutomation' && (
          <AiAutomationTab
            config={config.aiAutomation}
            onChange={(u) => handleUpdateSection('aiAutomation', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'databaseRedis' && (
          <DatabaseRedisSyncTab
            config={config.databaseRedis}
            onChange={(u) => handleUpdateSection('databaseRedis', u)}
            onToast={addToast}
          />
        )}

        {activeTab === 'security' && (
          <SecurityAccessTab
            config={config.security}
            onChange={(u) => handleUpdateSection('security', u)}
            onToast={addToast}
            onDownloadBackup={handleDownloadJsonBackup}
          />
        )}

        {activeTab === 'developer' && (
          <ApiWebhooksTab
            config={config.developer}
            onChange={(u) => handleUpdateSection('developer', u)}
            onToast={addToast}
          />
        )}
      </div>

      {/* Floating Bottom Quick Bar if unsaved changes exist */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold">Tienes modificaciones sin guardar en el sistema</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-300 hover:text-white px-3 py-1"
            >
              Descartar
            </button>
            <Button
              size="sm"
              variant="primary"
              icon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveAll}
            >
              Guardar Todo Ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
