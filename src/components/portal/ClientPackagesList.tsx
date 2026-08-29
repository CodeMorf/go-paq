import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, Box, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';

export const ClientPackagesList: React.FC = () => {
  const { internationalPackages, consolidatePackages, addToast } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConsolidate = () => {
    if (selectedIds.length < 2) return;
    consolidatePackages(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Mis Paquetes en Miami & Consolidación</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selecciona 2 o más cajas para unirlas en un solo paquete y ahorrar hasta un 40% en flete internacional
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Layers className="w-4 h-4" />}
          disabled={selectedIds.length < 2}
          onClick={handleConsolidate}
        >
          Solicitar Consolidación ({selectedIds.length})
        </Button>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {internationalPackages.map((pkg) => {
          const isSelected = selectedIds.includes(pkg.id);

          return (
            <Card
              key={pkg.id}
              className={`space-y-3 transition-all ${
                isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(pkg.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {pkg.storeName}
                  </span>
                </label>

                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {pkg.originCountry === 'US' ? '🇺🇸 MIA' : '🇪🇸 MAD'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={pkg.photoUrl}
                  alt={pkg.description}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="text-xs">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {pkg.description}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-1">
                    Tracking: {pkg.internalTracking}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Peso</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{pkg.weightLbs} lbs</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Valor Declarado</span>
                  <strong className="text-slate-900 dark:text-white font-mono">${pkg.declaredValueUsd} USD</strong>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
