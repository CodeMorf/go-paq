import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  MapPin, 
  Layers, 
  DollarSign, 
  Truck, 
  Boxes, 
  Package, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

export const BranchesWarehouses: React.FC = () => {
  const { branches, formatMoney } = useApp();
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Sucursales, Hubs & Red de Almacenes</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Infraestructura de almacenamiento, jaulas de seguridad, capacidad instalada y arqueo de caja
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Nueva Sucursal / Hub
        </Button>
      </div>

      {/* Grid of Branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((branch) => {
          const occupancyPercent = Math.round((branch.currentPackagesCount / branch.capacityMaxPackages) * 100);
          const isSelected = selectedBranch?.id === branch.id;

          return (
            <Card
              key={branch.id}
              onClick={() => setSelectedBranch(branch)}
              className={`space-y-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {branch.name}
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold block">
                      {branch.code} • {branch.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <span className="text-xl">
                  {branch.country === 'DO' ? '🇩🇴' : branch.country === 'US' ? '🇺🇸' : branch.country === 'ES' ? '🇪🇸' : '🇮🇹'}
                </span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{branch.address}</span>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Capacidad Almacén:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {occupancyPercent}% ({branch.currentPackagesCount} / {branch.capacityMaxPackages})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      occupancyPercent > 85 ? 'bg-rose-500' : occupancyPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Efectivo en Caja</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatMoney(branch.cashInDrawer, branch.currency)}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Drivers Asignados</span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {branch.activeDriversCount} Drivers
                  </strong>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Branch Zones Detail */}
      {selectedBranch && selectedBranch.zones && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Distribución de Racks & Zonas • {selectedBranch.name}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubicación de jaulas de clasificación y estanterías para última milla
              </p>
            </div>
            <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg font-bold">
              Encargado: {selectedBranch.managerName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedBranch.zones.map((zone) => (
              <div key={zone.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                    Rack {zone.code}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {zone.occupiedSlots} / {zone.totalSlots}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                  {zone.name}
                </h5>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.round((zone.occupiedSlots / zone.totalSlots) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
