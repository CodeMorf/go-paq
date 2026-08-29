import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Package, MapPin, Truck, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';
import { TrackingTimeline } from '../ui/TrackingTimeline';

export const TrackingSearch: React.FC = () => {
  const { shipments, selectedTracking, setSelectedTracking } = useApp();
  const [query, setQuery] = useState(selectedTracking || '');

  const foundShipment = shipments.find(
    (s) => s.trackingNumber.toLowerCase() === query.trim().toLowerCase() ||
           (s.externalTracking && s.externalTracking.toLowerCase() === query.trim().toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedTracking(query.trim());
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Rastreo de Guías en Tiempo Real
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Ingresa el número de guía asignado por GoPaq o el tracking del courier internacional
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ej: GP-99238411, NX-8924-DO o 1Z99999999..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
          <Button variant="primary" size="md" type="submit">
            Rastrear
          </Button>
        </form>
      </div>

      {/* Result Timeline */}
      {foundShipment ? (
        <Card className="p-6">
          <TrackingTimeline shipment={foundShipment} />
        </Card>
      ) : query ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Guía no encontrada</h4>
          <p className="text-xs text-slate-400">Verifica el número ingresado ({query}) e intenta nuevamente.</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Package className="w-10 h-10 text-indigo-400 mx-auto" />
          <p className="text-xs text-slate-400">
            Ingresa una guía como <span className="font-mono text-indigo-500 font-bold">NX-8924-DO</span> o <span className="font-mono text-indigo-500 font-bold">GP-99238411</span> para consultar.
          </p>
        </div>
      )}
    </div>
  );
};
