import React from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  Truck, 
  Navigation, 
  Camera, 
  PenTool, 
  KeyRound, 
  AlertTriangle, 
  Clock, 
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['dispatch'];
  onChange: (updates: Partial<GlobalSystemConfig['dispatch']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const DispatchOperationsTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  return (
    <div className="space-y-6">
      {/* Dispatch Engine & Algorithm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Algoritmo de Despacho & Geocercas</h4>
              <p className="text-[11px] text-slate-500">Asignación automática y tolerancia de ubicación GPS del conductor</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Modo de Auto-Despacho de Envíos</label>
              <select
                value={config.autoDispatchMode}
                onChange={(e) => onChange({ autoDispatchMode: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="intelligent_proximity">Proximidad Inteligente & Agrupación de Cuadrante (Recomendado)</option>
                <option value="balanced_load">Balance Equitativo de Carga y Peso por Driver</option>
                <option value="branch_zone">Asignación Estricta por Sucursal Asignada</option>
                <option value="manual">Manual (Solo el despachador asigna)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Radio Geocerca GPS (Metros)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.geofenceRadiusMeters}
                    onChange={(e) => onChange({ geofenceRadiusMeters: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-medium">m</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Distancia máxima al cliente para validar POD</span>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Máx. Paradas por Ruta</label>
                <input
                  type="number"
                  value={config.maxStopsPerRoute}
                  onChange={(e) => onChange({ maxStopsPerRoute: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Límite por turno de mensajero</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Hora Límite Same-Day (Cutoff)</label>
                <div className="relative">
                  <input
                    type="time"
                    value={config.sameDayCutoffTime}
                    onChange={(e) => onChange({ sameDayCutoffTime: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Pedidos posteriores pasan al día siguiente</span>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Reintentos de Entrega</label>
                <input
                  type="number"
                  value={config.maxFailedAttempts}
                  onChange={(e) => onChange({ maxFailedAttempts: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Luego de esto se programa devolución</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Proof of Delivery Requirements */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Requisitos de Prueba de Entrega (POD)</h4>
              <p className="text-[11px] text-slate-500">Evidencias obligatorias que el conductor debe capturar</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.mandatoryPodPhoto}
                onChange={(e) => onChange({ mandatoryPodPhoto: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Foto del Paquete en Destino Obligatoria</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  La app móvil del conductor no permite finalizar la entrega sin capturar una fotografía clara del paquete con el destinatario o en la puerta.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.mandatoryPodSignature}
                onChange={(e) => onChange({ mandatoryPodSignature: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Firma Táctil Digital del Receptor Obligatoria</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Registra la firma manuscrita digital y el nombre de quien recibe el envío.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.mandatoryPodOtp}
                onChange={(e) => onChange({ mandatoryPodOtp: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Validación mediante Código OTP (SMS / WhatsApp)</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Envía un código de 4 dígitos al cliente para validar entregas de alto valor o paquetería crítica.
                </div>
              </div>
            </label>

            <div className="pt-2">
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tarifa de Retorno por Intento Fallido (RD$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">RD$</span>
                <input
                  type="number"
                  value={config.returnToWarehouseFeeDop}
                  onChange={(e) => onChange({ returnToWarehouseFeeDop: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 font-bold"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
