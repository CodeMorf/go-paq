import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Driver, DangerousZone } from '../../types';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Battery, 
  Gauge, 
  ShieldAlert, 
  Phone, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Filter, 
  RefreshCw, 
  AlertTriangle,
  User,
  Zap
} from 'lucide-react';
import { Button, Card, StatusBadge } from '../ui/DesignSystem';

export const LiveFleetMap: React.FC = () => {
  const { drivers, dangerousZones, currentRoute, branches, addToast } = useApp();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(drivers[0] || null);
  const [showDangerousZones, setShowDangerousZones] = useState(true);
  const [showBranches, setShowBranches] = useState(true);
  const [filterVehicleType, setFilterVehicleType] = useState<string>('all');
  const [simulatedTick, setSimulatedTick] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);

  // Live simulation jitter to simulate real-time GPS telemetry
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimulatedTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const filteredDrivers = drivers.filter((d) => {
    if (filterVehicleType === 'all') return true;
    return d.vehicleType === filterVehicleType;
  });

  const getVehicleIcon = (type: Driver['vehicleType']) => {
    switch (type) {
      case 'moto':
        return '🛵';
      case 'van':
        return '🚐';
      case 'camion':
        return '🚛';
      case 'camioneta':
        return '🛻';
      case 'pesado':
        return '🚚';
      default:
        return '🚗';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-500 animate-pulse" />
            <span>Centro de Control GPS & Telemetría de Choferes en Vivo</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoreo en tiempo real de flotas, velocidad, batería, paradas completadas y detección de proximidad a zonas de riesgo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              isSimulating
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{isSimulating ? 'Telemetría GPS: EN VIVO' : 'GPS en Pausa'}</span>
          </button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              setSimulatedTick((t) => t + 1);
              addToast('info', 'Ping GPS Forzado', 'Posiciones de choferes actualizadas vía satélite.');
            }}
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Main Grid: Live Visual Map & Driver Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Viewport */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative w-full h-[540px] bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between p-4 select-none">
            {/* Simulated Cartography Map Background (Vector Road Grid & Coastline) */}
            <div className="absolute inset-0 opacity-40">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                {/* Coastal silhouette / Caribbean Sea lines */}
                <path
                  d="M 0 320 Q 150 300, 300 340 T 600 310 T 900 360 L 900 600 L 0 600 Z"
                  fill="#0f172a"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                {/* Main Express Highways */}
                <line x1="50" y1="120" x2="800" y2="400" stroke="#475569" strokeWidth="3" strokeDasharray="6,3" />
                <line x1="300" y1="50" x2="450" y2="500" stroke="#475569" strokeWidth="2.5" />
                <line x1="100" y1="450" x2="850" y2="420" stroke="#3b82f6" strokeWidth="3" opacity="0.6" />
              </svg>
            </div>

            {/* Map Top Bar Controls */}
            <div className="relative z-10 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Filtrar:</span>
                <select
                  value={filterVehicleType}
                  onChange={(e) => setFilterVehicleType(e.target.value)}
                  className="bg-slate-800 text-white rounded-lg px-2 py-1 border border-slate-700 text-xs focus:outline-none"
                >
                  <option value="all">Todos los vehículos ({drivers.length})</option>
                  <option value="motorcycle">🛵 Moto Mensajería</option>
                  <option value="van">🚐 Vans & Furgonetas</option>
                  <option value="truck">🚛 Camiones de Carga</option>
                </select>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDangerousZones}
                    onChange={(e) => setShowDangerousZones(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-rose-400 font-semibold">Zonas Rojas ({dangerousZones.length})</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBranches}
                    onChange={(e) => setShowBranches(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-indigo-300 font-semibold">Hubs ({branches.length})</span>
                </label>
              </div>
            </div>

            {/* Simulated Live Map Elements */}
            <div className="relative w-full h-full my-2">
              {/* Dangerous Zones Polygons / Radars */}
              {showDangerousZones &&
                dangerousZones.map((zone, idx) => {
                  const xPositions = [220, 310, 520, 680];
                  const yPositions = [180, 240, 150, 290];
                  const left = xPositions[idx % xPositions.length];
                  const top = yPositions[idx % yPositions.length];

                  return (
                    <div
                      key={zone.id}
                      style={{ left: `${left}px`, top: `${top}px` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-rose-500/15 border-2 border-rose-500/50 animate-pulse flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-rose-500/25 border border-rose-500" />
                        </div>
                        <ShieldAlert className="w-5 h-5 text-rose-400 absolute" />
                      </div>

                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 text-white rounded-xl text-[10px] w-48 border border-rose-500/50 shadow-xl z-30 pointer-events-none">
                        <div className="font-bold text-rose-400 uppercase">{zone.name}</div>
                        <div className="text-slate-300 mt-0.5">{zone.sector}</div>
                        <div className="text-rose-300 font-mono text-[9px] mt-1 font-bold">
                          {zone.isSuspended ? '🚫 REPARTO SUSPENDIDO' : '⚠️ RESTRICCIÓN DE COD'}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Network Branches Hub Markers */}
              {showBranches &&
                branches.map((branch, idx) => {
                  const bPositions = [
                    { left: 160, top: 220 },
                    { left: 280, top: 270 },
                    { left: 460, top: 120 },
                    { left: 740, top: 260 },
                    { left: 820, top: 80 }
                  ];
                  const pos = bPositions[idx % bPositions.length];

                  return (
                    <div
                      key={branch.id}
                      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                    >
                      <div className="p-1.5 bg-indigo-600 border-2 border-white rounded-xl shadow-lg text-white">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 bg-slate-900/90 text-indigo-200 text-[9px] font-bold rounded border border-indigo-500/40 text-center truncate max-w-28">
                        {branch.name.split(' ')[0]} {branch.city}
                      </div>
                    </div>
                  );
                })}

              {/* Drivers Live Markers */}
              {filteredDrivers.map((driver, idx) => {
                // Compute dynamic jittered position
                const baseX = [190, 260, 360, 490, 640][idx % 5];
                const baseY = [240, 210, 320, 160, 230][idx % 5];
                const offsetX = Math.sin((simulatedTick + idx) * 0.8) * 20;
                const offsetY = Math.cos((simulatedTick + idx) * 0.8) * 16;
                const isSelected = selectedDriver?.id === driver.id;

                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver)}
                    style={{
                      left: `${baseX + offsetX}px`,
                      top: `${baseY + offsetY}px`,
                      transition: 'all 3s ease-in-out'
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group ${
                      isSelected ? 'scale-125' : 'hover:scale-110'
                    }`}
                  >
                    {/* Pulsing ring for active driver */}
                    <div className="relative">
                      {driver.status === 'on_route' && (
                        <div className="absolute -inset-2 bg-emerald-500/40 rounded-full animate-ping" />
                      )}

                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base border-2 shadow-lg ${
                          isSelected
                            ? 'bg-amber-500 border-white text-white ring-4 ring-amber-400/40'
                            : driver.status === 'on_route'
                            ? 'bg-emerald-600 border-white text-white'
                            : 'bg-slate-700 border-slate-400 text-white'
                        }`}
                      >
                        {getVehicleIcon(driver.vehicleType)}
                      </div>

                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-slate-950/90 text-white text-[8px] font-mono font-bold rounded border border-slate-700 whitespace-nowrap">
                        {driver.name.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Legend Footer */}
            <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>En Ruta Activa</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Zona de Riesgo</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Hub / Sucursal</span>
                </div>
              </div>

              <div>
                Simulación: {drivers.length} Choferes transmitiendo telemetría cada 4 seg
              </div>
            </div>
          </div>
        </div>

        {/* Selected Driver Telematics Telemetry Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedDriver ? (
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              {/* Driver Profile */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-2xl flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    {getVehicleIcon(selectedDriver.vehicleType)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {selectedDriver.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedDriver.vehicleName} • Placa: {selectedDriver.licensePlate || 'L-8823'}
                    </p>
                  </div>
                </div>

                <StatusBadge status={selectedDriver.status === 'on_route' ? 'out_for_delivery' : 'ready_for_pickup'} size="sm" />
              </div>

              {/* Real-time Telemetry Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 uppercase">
                    <Gauge className="w-3 h-3 text-indigo-500" />
                    <span>Velocidad</span>
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDriver.status === 'on_route' ? `${Math.floor(32 + Math.random() * 18)} km/h` : '0 km/h'}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 uppercase">
                    <Battery className="w-3 h-3 text-emerald-500" />
                    <span>Batería</span>
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedDriver.batteryLevel || 84}%
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 uppercase">
                    <CheckCircle2 className="w-3 h-3 text-purple-500" />
                    <span>Progreso</span>
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    8/12 St.
                  </div>
                </div>
              </div>

              {/* Proximity Risk Check */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-indigo-500" />
                    <span>Ubicación Actual</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">GPS Preciso 3m</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                  Av. Winston Churchill esquina 27 de Febrero, Piantini, Santo Domingo
                </p>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fuera de perímetro de zonas de riesgo (Zona Segura)</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${selectedDriver.phone}`}
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar Chofer</span>
                </a>
                <button
                  onClick={() => addToast('info', 'Mensaje Enviado', `Instrucción push enviada al terminal de ${selectedDriver.name}`)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Enviar Alerta</span>
                </button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400 text-xs">
              Selecciona un chofer en el mapa para ver su telemetría.
            </Card>
          )}

          {/* Quick List of Active Fleet */}
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Choferes en Ruta ({drivers.length})
            </h4>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDriver(d)}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                    selectedDriver?.id === d.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-400 font-bold text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{getVehicleIcon(d.vehicleType)}</span>
                    <div>
                      <div className="font-semibold text-xs">{d.name}</div>
                      <div className="text-[10px] text-slate-400">{d.vehicleName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Activo
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
