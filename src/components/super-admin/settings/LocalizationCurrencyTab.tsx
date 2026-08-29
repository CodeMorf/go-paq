import React from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  Globe, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Scale, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['localization'];
  onChange: (updates: Partial<GlobalSystemConfig['localization']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const LocalizationCurrencyTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const handleSyncExchangeRates = () => {
    // Simulate live update from Dominican Central Bank (BCRD)
    onChange({
      usdExchangeRate: 60.10,
      eurExchangeRate: 64.85,
    });
    onToast('success', 'Tasas Actualizadas', 'Tasas sincronizadas con la API del Banco Central de la República Dominicana (BCRD).');
  };

  const toggleCurrency = (currency: 'DOP' | 'USD' | 'EUR') => {
    if (config.baseCurrency === currency) {
      onToast('warning', 'Moneda Base Protegida', 'No puedes deshabilitar la moneda base principal del sistema.');
      return;
    }
    const currentList = config.enabledCurrencies;
    if (currentList.includes(currency)) {
      onChange({ enabledCurrencies: currentList.filter(c => c !== currency) });
    } else {
      onChange({ enabledCurrencies: [...currentList, currency] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Exchange Rates Header Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border-emerald-500/20 text-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Tasa Oficial USD a DOP</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">BCRD Activo</span>
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-1">
            RD$ {config.usdExchangeRate.toFixed(2)}
            <span className="text-xs text-slate-400 font-normal">por 1.00 USD</span>
          </div>
          <p className="text-[11px] text-slate-400">Utilizada para cobro de fletes aéreos de casillero y compras en Miami</p>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 border-indigo-500/20 text-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Tasa Oficial EUR a DOP</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Mercado Spot</span>
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-1">
            RD$ {config.eurExchangeRate.toFixed(2)}
            <span className="text-xs text-slate-400 font-normal">por 1.00 EUR</span>
          </div>
          <p className="text-[11px] text-slate-400">Aplicable a compras y fletes internacionales de origen Europa (España / Italia)</p>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300">Modo de Actualización de Tasas</div>
            <div className="text-[11px] text-slate-400 mt-1">Frecuencia automática con validación de fluctuación diaria</div>
          </div>
          <Button 
            size="sm" 
            variant="primary" 
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleSyncExchangeRates}
            className="w-full mt-3"
          >
            Sincronizar Tasas Ahora
          </Button>
        </Card>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Localization & Countries */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">País Sede & Monedas Habilitadas</h4>
              <p className="text-[11px] text-slate-500">Parámetros regionales para cálculos automáticos de divisas</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">País Sede Operativo</label>
              <select
                value={config.primaryCountry}
                onChange={(e) => onChange({ primaryCountry: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="DO">República Dominicana (DO) - Santo Domingo / Santiago</option>
                <option value="US">Estados Unidos (US) - Miami Hub / Orlando</option>
                <option value="ES">España (ES) - Madrid Barajas</option>
                <option value="MX">México (MX) - Ciudad de México</option>
                <option value="CO">Colombia (CO) - Bogotá El Dorado</option>
                <option value="PA">Panamá (PA) - Tocumen Hub</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Moneda Base Contable</label>
              <select
                value={config.baseCurrency}
                onChange={(e) => onChange({ baseCurrency: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="DOP">DOP - Peso Dominicano (RD$)</option>
                <option value="USD">USD - Dólar Estadounidense ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-2">Monedas Habilitadas en Checkout & Facturación</label>
              <div className="grid grid-cols-3 gap-2">
                {(['DOP', 'USD', 'EUR'] as const).map((curr) => {
                  const isActive = config.enabledCurrencies.includes(curr);
                  const isBase = config.baseCurrency === curr;
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => toggleCurrency(curr)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isActive 
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="text-sm font-black">{curr}</div>
                      <div className="text-[10px] mt-0.5">
                        {isBase ? 'Base del Sistema' : isActive ? 'Habilitada' : 'Deshabilitada'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Modo de Tasa de Cambio</label>
              <select
                value={config.rateMode}
                onChange={(e) => onChange({ rateMode: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="bancentral_auto">Automático (API Banco Central de la República Dominicana)</option>
                <option value="fixer_api">Fixer.io / OpenExchangeRates en Vivo</option>
                <option value="manual">Manual Fijada por Gerencia Financiera</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Units & Formats */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unidades de Peso, Medida & Horarios</h4>
              <p className="text-[11px] text-slate-500">Configuración para el motor de cubicaje y cálculo de fletes</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Unidad de Peso Predeterminada</label>
                <select
                  value={config.weightUnit}
                  onChange={(e) => onChange({ weightUnit: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="lbs">Libras (lbs) - Estándar Courier Caribe</option>
                  <option value="kg">Kilogramos (kg) - Estándar Internacional</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Unidad de Medida / Dimensiones</label>
                <select
                  value={config.dimensionUnit}
                  onChange={(e) => onChange({ dimensionUnit: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="in">Pulgadas (in)</option>
                  <option value="cm">Centímetros (cm)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Formato de Fecha</label>
                <select
                  value={config.dateFormat}
                  onChange={(e) => onChange({ dateFormat: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 28/08/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Ej: 08/28/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Zona Horaria Principal</label>
                <input
                  type="text"
                  value={config.timeZone}
                  onChange={(e) => onChange({ timeZone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <strong>Nota sobre peso volumétrico:</strong> La fórmula aérea aplica el divisor internacional de <strong>166</strong> para pulgadas/lbs y <strong>5000</strong> para cm/kg de acuerdo a regulaciones IATA.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
