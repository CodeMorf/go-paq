import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Truck, MapPin, CheckCircle2, Printer, ArrowRight, User } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';

export const DriversDispatch: React.FC = () => {
  const { drivers, currentRoute, formatMoney, addToast } = useApp();
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');

  const handlePrintManifest = () => {
    addToast('info', 'Manifiesto Impreso', 'Manifiesto de entrega de ruta despachado para el chofer.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            <span>Despacho & Salida de Conductores (Última Milla)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Asigna paquetes en lote al conductor y genera la hoja de ruta con verificación de carga
          </p>
        </div>

        <Button variant="primary" size="md" icon={<Printer className="w-4 h-4" />} onClick={handlePrintManifest}>
          Imprimir Manifiesto de Salida
        </Button>
      </div>

      {/* Driver Dispatch Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Seleccionar Conductor</h4>
          <div className="space-y-2">
            {drivers.map((drv) => (
              <button
                key={drv.id}
                onClick={() => setSelectedDriverId(drv.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedDriverId === drv.id
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={drv.avatar} alt={drv.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{drv.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{drv.licensePlate}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600">{drv.pendingDeliveriesCount} paradas</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Assigned Stops for this Driver */}
        <div className="md:col-span-2 space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hoja de Ruta: {currentRoute.routeCode}
                </h4>
                <p className="text-xs text-slate-500">
                  {currentRoute.totalStops} Paradas • COD Total a Cobrar: <strong>{formatMoney(currentRoute.totalCodAmount)}</strong>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Lista para Salir
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {currentRoute.stops.slice(0, 5).map((stop, i) => (
                <div key={stop.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px]">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {stop.recipientName}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">{stop.trackingNumber}</span>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500">{stop.address}</span>
                  {stop.codAmount ? (
                    <span className="font-bold text-amber-600 font-mono">COD {formatMoney(stop.codAmount)}</span>
                  ) : (
                    <span className="text-slate-400">Pre-pagado</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
