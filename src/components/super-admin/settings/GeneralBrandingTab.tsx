import React, { useState } from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  Palette, 
  Upload, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['general'];
  onChange: (updates: Partial<GlobalSystemConfig['general']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const GeneralBrandingTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
              Marca Blanca & Identidad
            </span>
            <span className="text-xs text-indigo-200">Dominio: {config.customDomain}</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            {config.companyName}
          </h3>
          <p className="text-xs text-indigo-200/90 max-w-2xl mt-0.5">
            Configuración global de la identidad corporativa visible en facturas NCF, guías térmicas, portal de clientes y notificaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer bg-white/10 p-2 rounded-xl border border-white/20">
            <input
              type="checkbox"
              checked={config.enableWhiteLabel}
              onChange={(e) => onChange({ enableWhiteLabel: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[10px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs font-semibold text-white">
              {config.enableWhiteLabel ? 'Marca Blanca Activa' : 'Marca Genérica'}
            </span>
          </label>
        </div>
      </div>

      {/* Grid: Legal Info & Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legal & Company Entity */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Datos Jurídicos & Fiscales</h4>
              <p className="text-[11px] text-slate-500">Aparecen en encabezados de facturas fiscales y contratos</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Nombre Comercial de la Marca</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Razón Social Legal</label>
                <input
                  type="text"
                  value={config.legalName}
                  onChange={(e) => onChange({ legalName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">RNC / Identificación Fiscal</label>
                <input
                  type="text"
                  value={config.rncTaxId}
                  onChange={(e) => onChange({ rncTaxId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Slogan Comercial Oficial</label>
              <input
                type="text"
                value={config.slogan}
                onChange={(e) => onChange({ slogan: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Dirección Sede Principal / Casa Matriz</label>
              <textarea
                rows={2}
                value={config.headquartersAddress}
                onChange={(e) => onChange({ headquartersAddress: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </Card>

        {/* Contact & Custom Domain */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dominio & Canales de Contacto</h4>
              <p className="text-[11px] text-slate-500">Puntos de atención y enlaces automáticos para clientes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Dominio Personalizado (CNAME / SSL)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.customDomain}
                  onChange={(e) => onChange({ customDomain: e.target.value })}
                  className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium text-slate-800 dark:text-slate-100"
                />
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => onToast('info', 'Verificando DNS', `Certificado SSL activo para ${config.customDomain}`)}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  SSL Válido
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Correo Soporte al Cliente</label>
                <input
                  type="email"
                  value={config.supportEmail}
                  onChange={(e) => onChange({ supportEmail: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Correo Facturación & Cobros</label>
                <input
                  type="email"
                  value={config.billingEmail}
                  onChange={(e) => onChange({ billingEmail: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Teléfono PBX Principal</label>
                <input
                  type="text"
                  value={config.supportPhone}
                  onChange={(e) => onChange({ supportPhone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">WhatsApp Corporativo</label>
                <input
                  type="text"
                  value={config.supportWhatsApp}
                  onChange={(e) => onChange({ supportWhatsApp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Identity & Colors */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Paleta de Colores & Recursos Visuales</h4>
              <p className="text-[11px] text-slate-500">Personaliza la interfaz de usuario en todos los paneles</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPreviewMode('light')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${previewMode === 'light' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              Modo Claro
            </button>
            <button
              onClick={() => setPreviewMode('dark')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${previewMode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              Modo Oscuro
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Color Primario del Sistema</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Color de Acento & Alertas</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Estilo de Componentes</label>
            <select
              value={config.themeStyle}
              onChange={(e) => onChange({ themeStyle: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            >
              <option value="modern">Moderno (Bordes redondeados & Sombras suaves)</option>
              <option value="compact">Compacto (Alta densidad de datos)</option>
              <option value="classic">Clásico Corporativo</option>
            </select>
          </div>
        </div>

        {/* Live Preview Strip */}
        <div className={`p-4 rounded-xl border ${previewMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'} flex items-center justify-between gap-4 mt-2`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
              style={{ backgroundColor: config.primaryColor }}
            >
              GP
            </div>
            <div>
              <div className="text-xs font-bold">{config.companyName}</div>
              <div className="text-[11px] opacity-75">{config.slogan}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: config.accentColor }}
            >
              Envíos en Vivo
            </span>
            <Button size="sm" variant="secondary">
              <Eye className="w-3.5 h-3.5 mr-1" />
              Vista Previa
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
