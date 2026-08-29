import React from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  CreditCard, 
  Percent,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['fiscal'];
  onChange: (updates: Partial<GlobalSystemConfig['fiscal']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const FiscalInvoicingTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const handleSequenceChange = (
    key: keyof GlobalSystemConfig['fiscal']['sequences'],
    field: 'current' | 'max' | 'prefix' | 'expiryDate',
    val: any
  ) => {
    onChange({
      sequences: {
        ...config.sequences,
        [key]: {
          ...config.sequences[key],
          [field]: val,
        },
      },
    });
  };

  const getSequencePercentage = (current: number, max: number) => {
    return Math.min(100, Math.round((current / max) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Fiscal Header Status */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
              DGII República Dominicana
            </span>
            <span className="text-xs text-blue-300 font-mono">RNC: {config.rncEmisor}</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Comprobantes Fiscales NCF & Facturación Electrónica (e-CF)
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Administración de rangos de secuencias autorizadas por la DGII para facturación B2B, consumidor final y regímenes especiales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer bg-white/10 p-2.5 rounded-xl border border-white/20">
            <input
              type="checkbox"
              checked={config.eInvoicingEnabled}
              onChange={(e) => onChange({ eInvoicingEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[12px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs font-semibold text-white">
              {config.eInvoicingEnabled ? 'e-CF Electrónico Activo' : 'NCF Tradicional'}
            </span>
          </label>
        </div>
      </div>

      {/* DGII Sequences Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* B01 - Crédito Fiscal */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                B01 / E31
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Crédito Fiscal (B2B)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Vence: {config.sequences.b01CreditFiscal.expiryDate}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Secuencia Actual: {config.sequences.b01CreditFiscal.current.toLocaleString()}</span>
              <span className="text-slate-900 dark:text-white">Máx: {config.sequences.b01CreditFiscal.max.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${getSequencePercentage(config.sequences.b01CreditFiscal.current, config.sequences.b01CreditFiscal.max)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              {config.sequences.b01CreditFiscal.max - config.sequences.b01CreditFiscal.current} comprobantes disponibles
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="text-slate-400 block mb-0.5">Siguiente Número</label>
              <input
                type="number"
                value={config.sequences.b01CreditFiscal.current}
                onChange={(e) => handleSequenceChange('b01CreditFiscal', 'current', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Límite Aprobado</label>
              <input
                type="number"
                value={config.sequences.b01CreditFiscal.max}
                onChange={(e) => handleSequenceChange('b01CreditFiscal', 'max', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* B02 - Consumidor Final */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                B02 / E32
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Consumidor Final</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Vence: {config.sequences.b02FinalConsumer.expiryDate}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Secuencia Actual: {config.sequences.b02FinalConsumer.current.toLocaleString()}</span>
              <span className="text-slate-900 dark:text-white">Máx: {config.sequences.b02FinalConsumer.max.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${getSequencePercentage(config.sequences.b02FinalConsumer.current, config.sequences.b02FinalConsumer.max)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              {config.sequences.b02FinalConsumer.max - config.sequences.b02FinalConsumer.current} comprobantes disponibles
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="text-slate-400 block mb-0.5">Siguiente Número</label>
              <input
                type="number"
                value={config.sequences.b02FinalConsumer.current}
                onChange={(e) => handleSequenceChange('b02FinalConsumer', 'current', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Límite Aprobado</label>
              <input
                type="number"
                value={config.sequences.b02FinalConsumer.max}
                onChange={(e) => handleSequenceChange('b02FinalConsumer', 'max', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* B14 - Regímenes Especiales */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs">
                B14 / E44
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Regímenes Especiales (Zonas Francas)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Vence: {config.sequences.b14SpecialRegime.expiryDate}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Secuencia Actual: {config.sequences.b14SpecialRegime.current.toLocaleString()}</span>
              <span className="text-slate-900 dark:text-white">Máx: {config.sequences.b14SpecialRegime.max.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{ width: `${getSequencePercentage(config.sequences.b14SpecialRegime.current, config.sequences.b14SpecialRegime.max)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="text-slate-400 block mb-0.5">Siguiente Número</label>
              <input
                type="number"
                value={config.sequences.b14SpecialRegime.current}
                onChange={(e) => handleSequenceChange('b14SpecialRegime', 'current', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Límite Aprobado</label>
              <input
                type="number"
                value={config.sequences.b14SpecialRegime.max}
                onChange={(e) => handleSequenceChange('b14SpecialRegime', 'max', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* B15 - Gubernamental */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs">
                B15 / E45
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Gubernamental / Instituciones</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Vence: {config.sequences.b15Government.expiryDate}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Secuencia Actual: {config.sequences.b15Government.current.toLocaleString()}</span>
              <span className="text-slate-900 dark:text-white">Máx: {config.sequences.b15Government.max.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{ width: `${getSequencePercentage(config.sequences.b15Government.current, config.sequences.b15Government.max)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="text-slate-400 block mb-0.5">Siguiente Número</label>
              <input
                type="number"
                value={config.sequences.b15Government.current}
                onChange={(e) => handleSequenceChange('b15Government', 'current', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Límite Aprobado</label>
              <input
                type="number"
                value={config.sequences.b15Government.max}
                onChange={(e) => handleSequenceChange('b15Government', 'max', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Credit terms & automation */}
      <Card className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Políticas Comerciales & Crédito</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Días de Crédito Predeterminados para Nuevas Cuentas</label>
            <select
              value={config.defaultCreditTermsDays}
              onChange={(e) => onChange({ defaultCreditTermsDays: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            >
              <option value={0}>Contado / Pago Inmediato (0 días)</option>
              <option value={15}>15 Días Netos</option>
              <option value={30}>30 Días Netos (Estándar Corporativo)</option>
              <option value={45}>45 Días Netos</option>
              <option value={60}>60 Días Netos</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Umbral de Alerta de Agotamiento de Secuencias</label>
            <input
              type="number"
              value={config.warningSequenceThreshold}
              onChange={(e) => onChange({ warningSequenceThreshold: Number(e.target.value) })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Notifica al departamento financiero cuando queden menos comprobantes</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
