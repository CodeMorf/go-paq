import React, { useEffect } from 'react';
import { DriverPushNotification } from '../../types/driverNotificationTypes';
import { 
  BellRing, 
  MapPin, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/DesignSystem';

interface Props {
  notification: DriverPushNotification | null;
  onClose: () => void;
  onAccept: (notification: DriverPushNotification) => void;
  onViewDetails?: (notification: DriverPushNotification) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const DriverPushBanner: React.FC<Props> = ({
  notification,
  onClose,
  onAccept,
  onViewDetails,
  soundEnabled,
  onToggleSound
}) => {
  useEffect(() => {
    if (!notification) return;
    // Auto dismiss after 8 seconds if not requiring action
    if (!notification.actionRequired) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isUrgent = notification.severity === 'urgent';
  const isCancelled = notification.type === 'stop_cancelled';
  const isReordered = notification.type === 'route_reordered';

  return (
    <div className="fixed top-3 inset-x-3 z-50 max-w-md mx-auto animate-in slide-in-from-top-4 fade-in duration-300">
      <div 
        className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
          isUrgent 
            ? 'bg-rose-900/95 text-white border-rose-500 ring-2 ring-rose-400/40' 
            : isCancelled
            ? 'bg-amber-900/95 text-white border-amber-500 ring-2 ring-amber-400/30'
            : isReordered
            ? 'bg-indigo-900/95 text-white border-indigo-500 ring-2 ring-indigo-400/30'
            : 'bg-slate-900/95 text-white border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl shrink-0 ${
              isUrgent 
                ? 'bg-rose-500/30 text-rose-200 animate-bounce' 
                : isCancelled
                ? 'bg-amber-500/30 text-amber-200'
                : 'bg-indigo-500/30 text-indigo-200'
            }`}>
              {isUrgent ? (
                <BellRing className="w-5 h-5" />
              ) : isCancelled ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                  isUrgent 
                    ? 'bg-rose-500 text-white' 
                    : isCancelled
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-indigo-500 text-white'
                }`}>
                  {notification.type === 'stop_added' ? 'Nueva Parada' :
                   notification.type === 'stop_cancelled' ? 'Cancelación' :
                   notification.type === 'route_reordered' ? 'Reordenamiento' :
                   notification.type === 'priority_changed' ? 'Prioridad VIP' : 'Despacho Central'}
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {notification.timestamp}
                </span>
              </div>
              <h4 className="font-bold text-xs mt-0.5 text-white leading-tight">
                {notification.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/10"
              title={soundEnabled ? 'Silenciar Alertas' : 'Activar Sonido'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message body */}
        <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">
          {notification.message}
        </p>

        {/* Stop Extra Info Badge if present */}
        {notification.stopData && (
          <div className="mt-2.5 p-2 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{notification.stopData.recipientName}</span>
            </div>
            {notification.stopData.codAmount ? (
              <span className="font-mono font-bold text-amber-300">
                COD: RD$ {notification.stopData.codAmount.toLocaleString()}
              </span>
            ) : (
              <span className="text-slate-300 font-mono text-[10px]">
                {notification.stopData.trackingNumber}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-white/15">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(notification)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Ver Detalles
            </button>
          )}

          {notification.actionRequired ? (
            <button
              onClick={() => onAccept(notification)}
              className={`px-3 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1 shadow-md ${
                isUrgent ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Aceptar & Actualizar Ruta
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
