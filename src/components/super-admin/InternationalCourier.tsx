import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Globe, 
  Plane, 
  Ship, 
  Layers, 
  ShieldCheck, 
  Box, 
  FileText, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import { Button, Card, MetricCard, StatusBadge } from '../ui/DesignSystem';
import { MOCK_LOCKERS } from '../../data/mockData';

export const InternationalCourier: React.FC = () => {
  const { internationalPackages, consolidatePackages, formatMoney } = useApp();
  const [activeTab, setActiveTab] = useState<'paquetes' | 'manifiestos' | 'aduanas' | 'casilleros'>('paquetes');
  const [selectedToConsolidate, setSelectedToConsolidate] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const readyPackages = internationalPackages.filter((p) => p.status === 'ready_to_consolidate');

  const toggleSelectPackage = (id: string) => {
    setSelectedToConsolidate((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkConsolidate = () => {
    if (selectedToConsolidate.length < 2) return;
    consolidatePackages(selectedToConsolidate);
    setSelectedToConsolidate([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            <span>Courier Internacional & Hubs Aduanales</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión de casilleros Miami/Madrid/Milán, consolidación de carga, manifiestos y despacho aduanal DGA en RD
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setActiveTab('manifiestos')}
          >
            Nuevo Manifiesto Aéreo
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Layers className="w-4 h-4" />}
            disabled={selectedToConsolidate.length < 2}
            onClick={handleBulkConsolidate}
          >
            Consolidar ({selectedToConsolidate.length})
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Paquetes en Miami"
          value="1,420"
          subtitle="Doral Logistics Warehouse"
          icon={<Box className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Carga Aérea en Tránsito"
          value="4 Manifiestos"
          subtitle="AA 1039 & IB 6501"
          icon={<Plane className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          title="En Aduanas RD (DGA)"
          value="340 pkgs"
          subtitle="Liberación Express AILA"
          icon={<ShieldCheck className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="Consolidaciones Hoy"
          value="48 cajas"
          subtitle="Ahorro cliente prom: 35%"
          icon={<Layers className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('paquetes')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'paquetes'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Paquetes Recibidos & Consolidación ({internationalPackages.length})
        </button>
        <button
          onClick={() => setActiveTab('manifiestos')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'manifiestos'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Manifiestos & Vuelos (Aéreo / Marítimo)
        </button>
        <button
          onClick={() => setActiveTab('aduanas')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'aduanas'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Aduanas RD (DGA AILA & Caucedo)
        </button>
        <button
          onClick={() => setActiveTab('casilleros')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'casilleros'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Casilleros Internacionales
        </button>
      </div>

      {/* Tab: Paquetes & Consolidación */}
      {activeTab === 'paquetes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">Filtro de Almacén:</span>
              <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium">
                <option>🇺🇸 Miami Warehouse (Doral, FL)</option>
                <option>🇪🇸 Madrid Barajas Cargo</option>
                <option>🇮🇹 Milano Segrate Logistics</option>
              </select>
            </div>

            {selectedToConsolidate.length >= 2 && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <Layers className="w-4 h-4" />
                <span>{selectedToConsolidate.length} paquetes seleccionados para consolidar</span>
                <Button size="sm" variant="primary" onClick={handleBulkConsolidate} className="ml-2">
                  Unir en 1 Caja Master
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internationalPackages.map((pkg) => {
              const isSelected = selectedToConsolidate.includes(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-all shadow-xs ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPackage(pkg.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {pkg.storeName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 rounded">
                      {pkg.originCountry === 'US' ? '🇺🇸 MIA' : pkg.originCountry === 'ES' ? '🇪🇸 MAD' : '🇮🇹 MIL'}
                    </span>
                  </div>

                  <div className="my-3 flex items-center gap-3">
                    <img
                      src={pkg.photoUrl}
                      alt={pkg.description}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-2">
                        {pkg.description}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Tracking: {pkg.internalTracking}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Peso</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{pkg.weightLbs} lbs</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Valor</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">${pkg.declaredValueUsd}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Casillero</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{pkg.lockerId}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Manifiestos */}
      {activeTab === 'manifiestos' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Manifiestos de Vuelo & Embarque Marítimo
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">MNF-AA-9921 • Vuelo American Airlines 1039</h5>
                  <p className="text-slate-500">MIA (Miami Doral) → SDQ (Las Américas) • 340 Paquetes • 840 KG</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-md font-bold text-xs">
                  Arribado a SDQ
                </span>
                <Button size="sm" variant="outline">Ver Detalle</Button>
              </div>
            </div>

            <div className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">MNF-IB-6501 • Vuelo Iberia 6501</h5>
                  <p className="text-slate-500">MAD (Madrid Barajas) → SDQ (Las Américas) • 185 Paquetes • 420 KG</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md font-bold text-xs">
                  En Vuelo Transatlántico
                </span>
                <Button size="sm" variant="outline">Ver Detalle</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Aduanas */}
      {activeTab === 'aduanas' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Despacho Aduanal DGA (Dirección General de Aduanas RD)</span>
            </h4>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-bold">
              Canal Verde Expedito 98.4%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Categoría B (Menores de US$200 exentos de aranceles e ITBIS según Decreto 402-05).
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 block">Declaraciones Transmitidas Hoy:</span>
              <strong className="text-base text-slate-900 dark:text-white font-mono">525 Declaraciones DGA</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Tiempo Promedio de Liberación:</span>
              <strong className="text-base text-emerald-600 font-mono">1.8 Horas en AILA</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Paquetes Retenidos para Aforo:</span>
              <strong className="text-base text-amber-500 font-mono">3 Paquetes</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Casilleros */}
      {activeTab === 'casilleros' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOCK_LOCKERS.map((lkr) => (
            <Card key={lkr.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{lkr.flag}</span>
                <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md">
                  {lkr.lockerCode}
                </span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{lkr.city}</h4>
                <p className="text-xs text-slate-500">{lkr.countryFullName}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Nombre: Cliente / JM-10482</p>
                <p>{lkr.addressLine1}</p>
                <p>{lkr.addressLine2}</p>
                <p>{lkr.cityStateZip}</p>
                <p className="text-slate-500 text-[11px]">Tel: {lkr.phone}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
