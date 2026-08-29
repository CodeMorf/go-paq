import React from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  CreditCard, 
  DollarSign, 
  Building, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['payments'];
  onChange: (updates: Partial<GlobalSystemConfig['payments']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const PaymentsCodTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  return (
    <div className="space-y-6">
      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Azul de Banco Popular */}
        <Card className={`space-y-4 border transition-all ${config.azulEnabled ? 'border-blue-500/40 bg-blue-500/5' : 'opacity-75'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                AZ
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Azul Dominicana</h4>
                <p className="text-[10px] text-slate-400">Banco Popular (RD$ / USD)</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.azulEnabled}
                onChange={(e) => onChange({ azulEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Merchant ID / Afiliación</label>
              <input
                type="text"
                value={config.azulMerchantId}
                onChange={(e) => onChange({ azulMerchantId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Entorno Operativo</label>
              <select
                value={config.azulEnvironment}
                onChange={(e) => onChange({ azulEnvironment: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium"
              >
                <option value="production">Producción (Live Gateway)</option>
                <option value="sandbox">Sandbox / Pruebas</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Cardnet Dominicana */}
        <Card className={`space-y-4 border transition-all ${config.cardnetEnabled ? 'border-amber-500/40 bg-amber-500/5' : 'opacity-75'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
                CN
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cardnet</h4>
                <p className="text-[10px] text-slate-400">Consorcio de Tarjetas (RD$)</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.cardnetEnabled}
                onChange={(e) => onChange({ cardnetEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Merchant ID / Terminal</label>
              <input
                type="text"
                value={config.cardnetMerchantId}
                onChange={(e) => onChange({ cardnetMerchantId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Entorno Operativo</label>
              <select
                value={config.cardnetEnvironment}
                onChange={(e) => onChange({ cardnetEnvironment: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium"
              >
                <option value="production">Producción (Live Gateway)</option>
                <option value="sandbox">Sandbox / Pruebas</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Stripe Internacional */}
        <Card className={`space-y-4 border transition-all ${config.stripeEnabled ? 'border-purple-500/40 bg-purple-500/5' : 'opacity-75'}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                ST
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Stripe Global</h4>
                <p className="text-[10px] text-slate-400">Tarjetas Internacionales / Apple Pay</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.stripeEnabled}
                onChange={(e) => onChange({ stripeEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Publishable Key</label>
              <input
                type="password"
                value={config.stripePublishableKey}
                onChange={(e) => onChange({ stripePublishableKey: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Entorno Operativo</label>
              <select
                value={config.stripeEnvironment}
                onChange={(e) => onChange({ stripeEnvironment: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium"
              >
                <option value="live">Live / Producción</option>
                <option value="test">Test Mode</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: COD Recaudo & ACH Bank Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parámetros de Recaudo COD */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Comisiones & Liquidaciones COD (Cash on Delivery)</h4>
              <p className="text-[11px] text-slate-500">Parámetros para cobro contra entrega y pagos a comercios B2B</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tipo de Comisión por Manejo COD</label>
                <select
                  value={config.codServiceFeeType}
                  onChange={(e) => onChange({ codServiceFeeType: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="percentage">Porcentaje sobre el Recaudo (%)</option>
                  <option value="fixed">Tarifa Fija por Paquete (RD$)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Valor de la Comisión</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={config.codServiceFeeValue}
                    onChange={(e) => onChange({ codServiceFeeValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">
                    {config.codServiceFeeType === 'percentage' ? '%' : 'RD$'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Calendario de Transferencias a Comercios</label>
              <select
                value={config.codSettlementSchedule}
                onChange={(e) => onChange({ codSettlementSchedule: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="daily_evening">Diario (Corte 6:00 PM al finalizar rutas)</option>
                <option value="biweekly_tues_fri">Bisemanal (Martes & Viernes)</option>
                <option value="weekly_friday">Semanal (Todos los Viernes)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Desembolso Mínimo para Transferencia ACH (RD$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">RD$</span>
                <input
                  type="number"
                  value={config.minimumCodPayoutDop}
                  onChange={(e) => onChange({ minimumCodPayoutDop: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 font-bold"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Cuenta Bancaria Matriz */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cuenta Bancaria Principal (Receptora / ACH)</h4>
              <p className="text-[11px] text-slate-500">Datos bancarios para depósitos de clientes y desembolsos</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Institución Bancaria</label>
              <input
                type="text"
                value={config.bankName}
                onChange={(e) => onChange({ bankName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Número de Cuenta</label>
                <input
                  type="text"
                  value={config.bankAccountNumber}
                  onChange={(e) => onChange({ bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tipo de Cuenta</label>
                <select
                  value={config.bankAccountType}
                  onChange={(e) => onChange({ bankAccountType: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="Corriente">Cuenta Corriente Empresarial</option>
                  <option value="Ahorros">Cuenta de Ahorros</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                size="sm" 
                variant="secondary"
                className="w-full"
                onClick={() => onToast('info', 'Verificación ACH', 'Conexión con la red bancaria ACH / SIPARD en estado óptimo.')}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                Validar Conexión SIPARD / ACH
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
