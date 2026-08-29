import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Driver, Branch, DeliveryRoute } from '../../types';
import { 
  Truck, 
  MapPin, 
  Layers, 
  Navigation, 
  Maximize2, 
  Radio, 
  Battery, 
  Phone, 
  ShieldCheck, 
  Zap,
  Building2,
  Package
} from 'lucide-react';
import { Button } from './DesignSystem';

interface InteractiveMapProps {
  height?: string;
  selectedDriverId?: string;
  onSelectDriver?: (driver: Driver) => void;
  showAllHubs?: boolean;
  activeRouteOnly?: boolean;
  enableFullscreenToggle?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  height = 'h-96',
  selectedDriverId,
  onSelectDriver,
  showAllHubs = true,
  activeRouteOnly = false,
  enableFullscreenToggle = true
}) => {
  const { drivers, branches, currentRoute, formatMoney, darkMode } = useApp();
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'drivers' | 'hubs' | 'stops'>('all');

  // Realistic map coordinate projection onto SVG canvas (1000 x 600)
  // Centered roughly on Greater Santo Domingo / Dominican Republic
  const projectCoordinates = (lat: number, lng: number) => {
    // DO bounds: Lat 18.0 - 20.0, Lng -72.0 - -68.0
    // Santo Domingo zoom default: Lat 18.40 - 18.60, Lng -70.10 - -69.80
    const minLat = 18.35;
    const maxLat = 18.65;
    const minLng = -70.15;
    const maxLng = -69.80;

    // Normalization
    const x = ((lng - minLng) / (maxLng - minLng)) * 880 + 60;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 480 + 60;
    return { x: Math.max(40, Math.min(940, x)), y: Math.max(40, Math.min(540, y)) };
  };

  const handleEntityClick = (entity: any, type: string) => {
    setSelectedEntity({ ...entity, entityType: type });
    if (type === 'driver' && onSelectDriver) {
      onSelectDriver(entity);
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : height} transition-all`}>
      {/* Map Background Simulation */}
      <div className="absolute inset-0 bg-slate-950">
        <svg className="w-full h-full object-cover" viewBox="0 0 1000 600">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="600" fill="#090d16" />
          <rect width="1000" height="600" fill="url(#grid)" />

          {/* Stylized Coastal Line (Caribbean Sea & Ozama River) */}
          <path
            d="M -50,480 Q 200,450 450,510 T 800,460 T 1050,520 L 1050,650 L -50,650 Z"
            fill="#061226"
            stroke="#1e293b"
            strokeWidth="2"
          />
          {/* Ozama River */}
          <path
            d="M 520,-20 Q 510,180 540,320 T 510,510"
            fill="none"
            stroke="#0b2347"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Main Avenues / Arteries (Av. 27 de Febrero, Churchill, Kennedy, Las Américas) */}
          <path d="M 60,280 Q 480,290 940,300" stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 60,200 Q 480,210 940,220" stroke="#1e293b" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M 60,370 Q 480,380 940,390" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
          
          <path d="M 380,80 L 400,450" stroke="#1e293b" strokeWidth="6" fill="none" />
          <path d="M 460,70 L 470,460" stroke="#1e293b" strokeWidth="6" fill="none" />
          <path d="M 280,100 L 290,440" stroke="#1e293b" strokeWidth="4" fill="none" />
          <path d="M 620,60 L 600,470" stroke="#1e293b" strokeWidth="4" fill="none" />

          {/* Active Delivery Route Polyline */}
          <g className="animate-pulse">
            <path
              d="M 450,210 L 400,280 L 460,290 L 380,370 L 290,380"
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Branches / Hubs Markers */}
          {showAllHubs && (filterType === 'all' || filterType === 'hubs') && branches.map((b) => {
            const pos = projectCoordinates(
              b.id.includes('sti') ? 18.52 : b.id.includes('puj') ? 18.42 : 18.48,
              b.id.includes('sti') ? -70.05 : b.id.includes('puj') ? -69.85 : -69.93
            );
            return (
              <g
                key={b.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => handleEntityClick(b, 'branch')}
              >
                <circle r="18" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
                <rect x="-14" y="-14" width="28" height="28" rx="8" fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  {b.type === 'hub' ? 'H' : 'S'}
                </text>
                <text
                  x="0"
                  y="26"
                  textAnchor="middle"
                  fill="#93c5fd"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow"
                >
                  {b.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Route Stops */}
          {(filterType === 'all' || filterType === 'stops') && currentRoute.stops.map((st, idx) => {
            const pos = projectCoordinates(st.lat, st.lng);
            const isCompleted = st.status === 'completed';
            return (
              <g
                key={st.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => handleEntityClick(st, 'stop')}
              >
                <circle
                  r="10"
                  fill={isCompleted ? '#10b981' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Active Drivers Markers */}
          {(filterType === 'all' || filterType === 'drivers') && drivers.map((d) => {
            const pos = projectCoordinates(d.currentLat, d.currentLng);
            const isSelected = selectedDriverId === d.id || selectedEntity?.id === d.id;
            return (
              <g
                key={d.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => handleEntityClick(d, 'driver')}
              >
                {/* Pulsing beacon */}
                <circle r={isSelected ? "26" : "18"} fill="url(#pulseGlow)" className="animate-pulse" />
                
                {/* Marker body */}
                <circle
                  r="14"
                  fill={d.status === 'busy' ? '#6366f1' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? "3" : "2"}
                  className="transition-all"
                />
                
                {/* Vehicle icon inside */}
                <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10">
                  {d.vehicleType === 'moto' ? '🏍️' : '🚐'}
                </text>

                {/* Driver Tag */}
                <g transform="translate(0, -20)">
                  <rect
                    x="-40"
                    y="-12"
                    width="80"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text x="0" y="-1" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                    {d.name.split(' ')[0]} ({d.licensePlate})
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl p-1.5 shadow-lg text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Todo
        </button>
        <button
          onClick={() => setFilterType('drivers')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            filterType === 'drivers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Drivers ({drivers.length})
        </button>
        <button
          onClick={() => setFilterType('hubs')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            filterType === 'hubs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Hubs ({branches.length})
        </button>
        <button
          onClick={() => setFilterType('stops')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            filterType === 'stops' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Paradas ({currentRoute.stops.length})
        </button>
      </div>

      {/* Live Operations Ticker Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>GPS EN VIVO • 4 DRIVERS ACTIVOS</span>
        </div>
        {enableFullscreenToggle && (
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900/90 text-slate-300 hover:text-white rounded-xl border border-slate-700/70 backdrop-blur-md"
            title="Pantalla Completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Entity Inspector Bottom Card */}
      {selectedEntity && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-20 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                {selectedEntity.entityType === 'driver' ? <Truck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold">{selectedEntity.name || selectedEntity.recipientName}</h4>
                <p className="text-xs text-slate-400">
                  {selectedEntity.entityType === 'driver' 
                    ? `${selectedEntity.vehicleName} • Placa ${selectedEntity.licensePlate}` 
                    : selectedEntity.address || selectedEntity.city}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {selectedEntity.entityType === 'driver' && (
            <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/60 p-2 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block">Completadas</span>
                <span className="font-bold text-emerald-400">{selectedEntity.completedDeliveriesToday}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block">Pendientes</span>
                <span className="font-bold text-amber-400">{selectedEntity.pendingDeliveriesCount}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block">COD Hoy</span>
                <span className="font-bold text-indigo-400">{formatMoney(selectedEntity.codCollectedToday)}</span>
              </div>
            </div>
          )}

          {selectedEntity.entityType === 'stop' && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-1">
              <p className="text-slate-300"><strong className="text-slate-400">Guía:</strong> {selectedEntity.trackingNumber}</p>
              <p className="text-slate-300"><strong className="text-slate-400">Paquete:</strong> {selectedEntity.packageSummary}</p>
              {selectedEntity.codAmount > 0 && (
                <p className="text-emerald-400 font-bold">Cobro COD: {formatMoney(selectedEntity.codAmount)}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
