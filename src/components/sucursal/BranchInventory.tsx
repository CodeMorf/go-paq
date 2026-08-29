import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, Barcode, Search, CheckCircle2, Box, Sparkles, Filter } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';

export const BranchInventory: React.FC = () => {
  const { selectedBranch, shipments, addToast } = useApp();
  const [scanCode, setScanCode] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');

  const handleScanBin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode) return;
    addToast('success', 'Ubicación Asignada', `Paquete ${scanCode} asignado a Rack A-1 (Estante 3).`);
    setScanCode('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Almacén de Tránsito & Racks • {selectedBranch.name}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ubicación precisa de paquetes en estanterías, jaulas de seguridad y escaneo de entrada/salida
          </p>
        </div>

        {/* Scan input */}
        <form onSubmit={handleScanBin} className="flex gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Escanear Guía para Ubicar..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
            />
          </div>
          <Button variant="primary" size="sm" type="submit">
            Ubicar
          </Button>
        </form>
      </div>

      {/* Racks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedBranch.zones?.map((zone) => (
          <Card key={zone.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md">
                Rack {zone.code}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {zone.occupiedSlots} / {zone.totalSlots}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{zone.name}</h4>
              <span className="text-[11px] text-slate-400 block uppercase font-mono">{zone.type}</span>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.round((zone.occupiedSlots / zone.totalSlots) * 100)}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Packages inside Branch Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Paquetes en Custodia en Sucursal ({shipments.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Guía Tracking</th>
                <th className="py-3 px-4">Destinatario</th>
                <th className="py-3 px-4">Ubicación / Rack</th>
                <th className="py-3 px-4">Peso</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {shipments.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {s.trackingNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                    {s.destination.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    Rack {idx % 2 === 0 ? 'A-1 (Nivel 2)' : 'B-2 (Nivel 1)'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {s.package.weightKg} KG
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      En Almacén
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
