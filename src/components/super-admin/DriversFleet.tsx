import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  User, 
  Phone, 
  ShieldCheck, 
  Battery, 
  Star, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Wrench,
  FileText
} from 'lucide-react';
import { Button, Card, MetricCard } from '../ui/DesignSystem';
import { MOCK_VEHICLES } from '../../data/mockData';

export const DriversFleet: React.FC = () => {
  const { drivers, formatMoney } = useApp();
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehiculos'>('drivers');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            <span>Conductores & Flota Vehicular</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control de flota propia y conductores terceros, liquidación de efectivo COD y estado telemático
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Nuevo Vehículo
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Registrar Conductor
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'drivers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Conductores Activos ({drivers.length})
        </button>
        <button
          onClick={() => setActiveTab('vehiculos')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'vehiculos'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Flota de Vehículos ({MOCK_VEHICLES.length})
        </button>
      </div>

      {/* Tab: Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {drivers.map((drv) => (
            <Card key={drv.id} className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={drv.avatar}
                      alt={drv.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      drv.status === 'busy' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {drv.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {drv.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{drv.rating}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vehículo:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{drv.vehicleName.split(' ')[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Placa:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{drv.licensePlate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">COD Recaudado:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(drv.codCollectedToday)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-700 dark:text-emerald-300">
                  <span className="text-[10px] block text-emerald-600/80">Entregadas</span>
                  <strong className="text-sm">{drv.completedDeliveriesToday}</strong>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-700 dark:text-amber-300">
                  <span className="text-[10px] block text-amber-600/80">Pendientes</span>
                  <strong className="text-sm">{drv.pendingDeliveriesCount}</strong>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Vehículos */}
      {activeTab === 'vehiculos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_VEHICLES.map((veh) => (
            <Card key={veh.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    {veh.brand}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {veh.model}
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                  {veh.plate}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Capacidad:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{veh.capacityKg} KG / {veh.capacityM3} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Kilometraje:</span>
                  <span className="text-slate-700 dark:text-slate-300">{veh.mileageKm.toLocaleString()} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Conductor:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-sans font-bold">{veh.currentDriverName || 'Disponible'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
