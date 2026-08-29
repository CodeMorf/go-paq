import React from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  Package, 
  Plane, 
  Ship, 
  ShieldAlert, 
  MapPin, 
  DollarSign, 
  FileText, 
  CheckCircle2,
  Copy,
  Info
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['lockerCustoms'];
  onChange: (updates: Partial<GlobalSystemConfig['lockerCustoms']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const LockerCustomsTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const handleAddressChange = (field: keyof GlobalSystemConfig['lockerCustoms']['miamiWarehouseAddress'], value: string) => {
    onChange({
      miamiWarehouseAddress: {
        ...config.miamiWarehouseAddress,
        [field]: value,
      },
    });
  };

  const copyFullAddress = () => {
    const full = `${config.miamiWarehouseAddress.line1}, ${config.miamiWarehouseAddress.line2}, ${config.miamiWarehouseAddress.city}, ${config.miamiWarehouseAddress.state} ${config.miamiWarehouseAddress.zipCode}, Tel: ${config.miamiWarehouseAddress.contactPhone}`;
    navigator.clipboard.writeText(full);
    onToast('success', 'Dirección Copiada', 'Dirección del Warehouse de Miami copiada al portapapeles.');
  };

  return (
    <div className="space-y-6">
      {/* Miami Warehouse Location Card */}
      <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-indigo-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Warehouse Receptor en Miami, Florida (Hub Principal)</h4>
              <p className="text-xs text-slate-500">Dirección postal oficial para compras en línea en USA de todos los clientes</p>
            </div>
          </div>

          <Button size="sm" variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={copyFullAddress}>
            Copiar Dirección Estándar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Dirección Línea 1 (Street Address)</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.line1}
              onChange={(e) => handleAddressChange('line1', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Línea 2 / Suite & Casillero</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.line2}
              onChange={(e) => handleAddressChange('line2', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Ciudad (City)</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Estado (State)</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Código Postal (Zip Code)</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.zipCode}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
            />
          </div>

          <div>
            <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Teléfono de Recepción Miami</label>
            <input
              type="text"
              value={config.miamiWarehouseAddress.contactPhone}
              onChange={(e) => handleAddressChange('contactPhone', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
            />
          </div>
        </div>
      </Card>

      {/* Grid: Box Numbering & Customs / DGA Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nomenclatura & Casilleros */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Numeración de Casilleros & Tarifas Base</h4>
              <p className="text-[11px] text-slate-500">Formato y precios estándar para usuarios personales y B2B</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Prefijo de Casillero</label>
                <input
                  type="text"
                  value={config.boxPrefix}
                  onChange={(e) => onChange({ boxPrefix: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Dígitos de Relleno</label>
                <select
                  value={config.boxNumberPadding}
                  onChange={(e) => onChange({ boxNumberPadding: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value={4}>4 dígitos (ej: GP-0123)</option>
                  <option value={5}>5 dígitos (ej: GP-00123)</option>
                  <option value={6}>6 dígitos (ej: GP-000123)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tarifa Libra Aérea (RD$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">RD$</span>
                  <input
                    type="number"
                    value={config.airRatePerPoundDop}
                    onChange={(e) => onChange({ airRatePerPoundDop: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tarifa Libra Aérea (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={config.airRatePerPoundUsd}
                    onChange={(e) => onChange({ airRatePerPoundUsd: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Marítimo por Pie Cúbico ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    value={config.seaRatePerCubicFootUsd}
                    onChange={(e) => onChange({ seaRatePerCubicFootUsd: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Recargo Combustible (% Fuel)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={config.fuelSurchargePercent}
                    onChange={(e) => onChange({ fuelSurchargePercent: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Aduanas DGA & De Minimis */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aduanas DGA & Regulaciones De Minimis</h4>
              <p className="text-[11px] text-slate-500">Parámetros arancelarios de la Dirección General de Aduanas</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tope De Minimis (USD FOB)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={config.deMinimisThresholdUsd}
                    onChange={(e) => onChange({ deMinimisThresholdUsd: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Categoría B DGA (Exento de arancel)</span>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tasa ITBIS Aduanal (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.itbisTaxRate}
                    onChange={(e) => onChange({ itbisTaxRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Impuesto a las transferencias</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoHoldRestrictedItems}
                  onChange={(e) => onChange({ autoHoldRestrictedItems: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Retención Automática de Artículos Restringidos</div>
                  <div className="text-[11px] text-slate-500">Pone en cuarentena perfumes con alcohol, baterías sueltas y armas sin permiso</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireInvoiceForDeMinimis}
                  onChange={(e) => onChange({ requireInvoiceForDeMinimis: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Exigir Factura Comercial Obligatoria para Liberación</div>
                  <div className="text-[11px] text-slate-500">Bloquea el despacho hasta que el cliente cargue la factura en el portal</div>
                </div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
