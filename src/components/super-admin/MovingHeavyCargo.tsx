import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Building2, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  MapPin, 
  Sparkles, 
  Package, 
  Plus, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Button, Card, MetricCard, StatusBadge } from '../ui/DesignSystem';
import { MOCK_MOVING_ITEMS, MOCK_HEAVY_CARGO } from '../../data/mockData';

export const MovingHeavyCargo: React.FC = () => {
  const { formatMoney, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'mudanzas' | 'carga_pesada'>('mudanzas');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-600" />
            <span>Mudanzas Residenciales/Oficina & Carga Pesada Industrial</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cotizaciones por cubicaje de habitaciones, inventario de mobiliario, fletes de maquinaria pesada y grúas
          </p>
        </div>

        <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
          Nueva Solicitud Especial
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('mudanzas')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'mudanzas'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Mudanzas Programadas & Inventario Visual
        </button>
        <button
          onClick={() => setActiveTab('carga_pesada')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'carga_pesada'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Carga Pesada, Pallets & Maquinaria
        </button>
      </div>

      {activeTab === 'mudanzas' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Solicitud MUD-2026-881
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mudanza Residencial 3 Habitaciones • Lic. Fernando Gómez
                </h3>
                <p className="text-xs text-slate-500">
                  Bella Vista (Santo Domingo) → Punta Cana Village
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Cotización Final</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {formatMoney(38500)}
                </span>
              </div>
            </div>

            {/* Inventory Visual Items */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                Inventario Verificado por Escaneo de Habitación
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOCK_MOVING_ITEMS.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Cant: <strong>{item.quantity}</strong></span>
                      <span>{item.approxVolumeM3} m³</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'carga_pesada' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MOCK_HEAVY_CARGO.map((cargo) => (
            <Card key={cargo.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    {cargo.cargoType.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {cargo.description}
                  </h4>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800">
                  {cargo.weightTons} TONELADAS
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Origen:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cargo.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destino:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cargo.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requiere Grúa / Plataforma:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {cargo.requiresCrane ? 'Grúa Sí' : 'No'} • {cargo.requiresFlatbed ? 'Cama Baja Sí' : 'Plataforma Estándar'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Costo Flete:</span>
                  <strong className="text-base text-slate-900 dark:text-white font-mono">
                    {formatMoney(cargo.estimatedCost)}
                  </strong>
                </div>
                <Button size="sm" variant="primary">
                  Asignar Cabezal Mack
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
