import React, { useState } from 'react';
import { DriverPushNotification } from '../../types/driverNotificationTypes';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  Clock, 
  Wifi, 
  WifiOff, 
  RotateCw,
  SlidersHorizontal,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Modal, Button } from '../ui/DesignSystem';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: DriverPushNotification[];
  pendingOfflineQueue: DriverPushNotification[];
  isOnline: boolean;
  onToggleOnline: () => void;
  onSyncOfflineQueue: () => void;
  onMarkAllAsRead: () => void;
  onClearHistory: () => void;
  onAcceptNotification: (notification: DriverPushNotification) => void;
  onViewStop?: (trackingNumber: string) => void;
}

export const DriverNotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  pendingOfflineQueue,
  isOnline,
  onToggleOnline,
  onSyncOfflineQueue,
  onMarkAllAsRead,
  onClearHistory,
  onAcceptNotification,
  onViewStop
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'route_changes' | 'broadcasts'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'route_changes') {
      return ['stop_added', 'stop_cancelled', 'route_reordered', 'priority_changed'].includes(n.type);
    }
    if (filterTab === 'broadcasts') {
      return ['dispatcher_broadcast', 'traffic_alert', 'route_published'].includes(n.type);
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Centro de Alertas & Notificaciones Push"
      subtitle={`Itinerario en tiempo real • ${isOnline ? 'Conectado a Central' : 'Modo Fuera de Línea'}`}
    >
      <div className="space-y-3.5 text-xs">
        {/* Connection Status Banner inside Modal */}
        <div className={`p-3 rounded-2xl flex items-center justify-between border ${
          isOnline 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-bold text-xs">
                {isOnline ? 'Canal Push Activo (En Línea)' : 'Modo Fuera de Línea (Pausado)'}
              </p>
              <p className="text-[11px] opacity-80">
                {isOnline 
                  ? 'Recibiendo cambios de ruta y despachos en tiempo real.'
                  : `${pendingOfflineQueue.length} cambios en cola pendientes de sincronizar.`}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleOnline}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
              isOnline 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isOnline ? 'Pausar' : 'Conectar'}
          </button>
        </div>

        {/* Pending Queue sync callout if offline queue has items */}
        {pendingOfflineQueue.length > 0 && (
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                {pendingOfflineQueue.length} Actualizaciones en Cola
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<RotateCw className="w-3.5 h-3.5" />}
              onClick={onSyncOfflineQueue}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px]"
            >
              Sincronizar Ahora
            </Button>
          </div>
        )}

        {/* Filter Tabs & Quick Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('route_changes')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'route_changes'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ruta
            </button>
            <button
              onClick={() => setFilterTab('broadcasts')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'broadcasts'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Base / Avisos
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 text-slate-400 hover:text-rose-500"
                title="Limpiar historial"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-xs">Sin notificaciones en esta categoría</p>
              <p className="text-[11px] opacity-70">Los cambios en tu ruta aparecerán aquí al instante.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUrgent = notif.severity === 'urgent';
              const isDone = notif.actionTaken === 'accepted' || notif.actionTaken === 'auto_applied';

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    !notif.read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${!notif.read ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {notif.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="mt-1.5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Stop Metadata if available */}
                  {notif.stopData && (
                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{notif.stopData.recipientName}</span>
                      </div>
                      {notif.stopData.codAmount ? (
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          COD: RD$ {notif.stopData.codAmount.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Actions & Status */}
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-400">
                      {notif.meta?.dispatcherName || 'Central GoPaq'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {notif.meta?.trackingNumber && onViewStop && (
                        <button
                          onClick={() => {
                            if (notif.meta?.trackingNumber) onViewStop(notif.meta.trackingNumber);
                            onClose();
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-[11px]"
                        >
                          Ver en Itinerario
                        </button>
                      )}

                      {notif.actionRequired && !isDone && (
                        <button
                          onClick={() => onAcceptNotification(notif)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Check className="w-3 h-3" />
                          Aceptar Cambio
                        </button>
                      )}

                      {isDone && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                          <Check className="w-3 h-3" /> Aplicado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
