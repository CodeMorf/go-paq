import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Building2, 
  ArrowRight, 
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { StatusBadge, ServiceBadge } from './DesignSystem';

export const CommandPalette: React.FC = () => {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    shipments, 
    drivers, 
    branches, 
    setSelectedTracking,
    currentSection,
    setActiveSubView
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const results = useMemo(() => {
    if (!search.trim()) {
      return [
        { type: 'action', title: 'Crear Nuevo Envío', subtitle: 'Cotizar y registrar mediante la API', section: 'portal', view: 'crear-envio', icon: <Sparkles className="w-4 h-4 text-indigo-500" /> },
        { type: 'action', title: 'Operación en Vivo', subtitle: 'Ver mapa de flota en tiempo real', section: 'super-admin', view: 'operaciones-vivo', icon: <Truck className="w-4 h-4 text-emerald-500" /> },
        { type: 'action', title: 'Recepción Mostrador', subtitle: 'Ingreso persistido de paquetes', section: 'sucursal', view: 'mostrador-pos', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
        { type: 'action', title: 'Casillero Internacional', subtitle: 'Consultar paquetes registrados', section: 'portal', view: 'casilleros', icon: <Layers className="w-4 h-4 text-purple-500" /> }
      ].filter((item) => item.section === currentSection);
    }

    const q = search.toLowerCase();
    const list: Array<{
      type: string;
      title: string;
      subtitle: string;
      entityId?: string;
      section?: any;
      view?: string;
      icon: React.ReactNode;
      badge?: React.ReactNode;
    }> = [];

    // Shipments
    shipments.forEach((s) => {
      const trackingNumber = String(s.tracking_number || s.trackingNumber || '');
      const destination = s.destination || {};
      const origin = s.origin || {};
      const destinationName = String(destination.name || s.recipient_name || '');
      const originName = String(origin.name || s.sender_name || '');
      const destinationCity = String(destination.city || s.destination_city || '');
      if ([trackingNumber, destinationName, originName, destinationCity].some(value => value.toLowerCase().includes(q))) {
        list.push({
          type: 'shipment',
          title: trackingNumber,
          subtitle: `${destinationName || 'Destinatario no indicado'} • ${destinationCity || 'Ciudad no indicada'}`,
          entityId: trackingNumber,
          icon: <Package className="w-4 h-4 text-indigo-600" />,
          badge: <StatusBadge status={s.status || 'pending'} size="sm" />
        });
      }
    });

    // Drivers
    drivers.forEach((d) => {
      const name = String(d.name || '');
      const licensePlate = String(d.license_plate || d.licensePlate || d.vehicle_plate || '');
      const phone = String(d.phone || '');
      if ([name, licensePlate, phone].some(value => value.toLowerCase().includes(q))) {
        list.push({
          type: 'driver',
          title: name,
          subtitle: `${d.vehicle_name || d.vehicleName || 'Vehículo no indicado'} (${licensePlate || 'placa no indicada'}) • ${d.status || 'estado no indicado'}`,
          section: 'super-admin',
          view: 'drivers',
          icon: <User className="w-4 h-4 text-emerald-600" />
        });
      }
    });

    // Branches
    branches.forEach((b) => {
      const name = String(b.name || '');
      const city = String(b.city || '');
      const code = String(b.code || '');
      if ([name, city, code].some(value => value.toLowerCase().includes(q))) {
        list.push({
          type: 'branch',
          title: name,
          subtitle: `${city} • Código ${code}`,
          section: 'super-admin',
          view: 'sucursales',
          icon: <Building2 className="w-4 h-4 text-amber-600" />
        });
      }
    });

    return list.filter((item) => !item.section || item.section === currentSection);
  }, [search, shipments, drivers, branches, currentSection]);

  const handleSelect = (item: any) => {
    if (item.entityId) {
      setSelectedTracking(item.entityId);
      if (currentSection === 'portal') setActiveSubView('tracking');
      if (currentSection === 'super-admin') setActiveSubView('rastreo');
      if (currentSection === 'sucursal') setActiveSubView('inventario');
    } else if (item.section) {
      if (item.section === currentSection && item.view) setActiveSubView(item.view);
    }
    setCommandPaletteOpen(false);
    setSearch('');
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por tracking, cliente, teléfono, driver, sucursal o acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No se encontraron resultados para "{search}"
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-colors ${
                    selectedIndex === idx 
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navegar con teclado</span>
          <div className="flex items-center gap-2 font-mono">
            <span>↑↓ Seleccionar</span>
            <span>↵ Abrir</span>
          </div>
        </div>
      </div>
    </div>
  );
};
