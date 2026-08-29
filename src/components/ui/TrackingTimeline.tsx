import React from 'react';
import { Shipment } from '../../types';
import { 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Truck, 
  Clock, 
  User, 
  Phone, 
  FileCheck, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { StatusBadge, ServiceBadge, Button } from './DesignSystem';
import { useApp } from '../../context/AppContext';

export const TrackingTimeline: React.FC<{ shipment: Shipment }> = ({ shipment }) => {
  const { formatMoney } = useApp();

  return (
    <div className="space-y-6">
      {/* Header Summary Box */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {shipment.trackingNumber}
              </h3>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Servicio: <strong className="text-slate-700 dark:text-slate-200 capitalize">{shipment.serviceType.replace('_', ' ')}</strong> • Creado el {new Date(shipment.createdAt).toLocaleDateString('es-DO')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ServiceBadge type={shipment.serviceType} />
            {shipment.isExpress && (
              <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800">
                ⚡ Express
              </span>
            )}
          </div>
        </div>

        {/* Origin & Destination Route Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Origen</span>
              <p className="font-bold text-slate-900 dark:text-white">{shipment.origin.name}</p>
              <p className="text-slate-500 dark:text-slate-400">{shipment.origin.street}, {shipment.origin.city}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Destino</span>
              <p className="font-bold text-slate-900 dark:text-white">{shipment.destination.name}</p>
              <p className="text-slate-500 dark:text-slate-400">{shipment.destination.street}, {shipment.destination.city}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Card if Assigned */}
      {shipment.driverName && (
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={shipment.driverAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={shipment.driverName}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Conductor Asignado en Ruta
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {shipment.driverName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Placa: <span className="font-mono font-semibold">{shipment.vehiclePlate}</span> • {shipment.driverPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${shipment.driverPhone}`}
              className="p-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Interactive Milestone Timeline */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Historial & Timeline del Envío</span>
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {shipment.events.map((event, idx) => (
            <div key={event.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1">
                {event.completed ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center">
                    <Circle className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className={`p-3.5 rounded-xl border transition-colors ${
                event.completed 
                  ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50' 
                  : 'bg-transparent border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h5>
                  <span className="text-[11px] font-mono text-slate-400">
                    {event.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {event.description}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proof of Delivery / COD details */}
      {shipment.codAmount && shipment.codAmount > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-amber-800 dark:text-amber-300 font-bold block">
                Cobro Contra Entrega (COD)
              </span>
              <span className="text-amber-700 dark:text-amber-400">
                Monto a cobrar en destino: <strong>{formatMoney(shipment.codAmount)}</strong>
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
            shipment.codCollected 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
              : 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
          }`}>
            {shipment.codCollected ? 'Cobrado ✓' : 'Pendiente de Cobro'}
          </span>
        </div>
      )}
    </div>
  );
};
