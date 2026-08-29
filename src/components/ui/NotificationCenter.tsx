import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bell, 
  CheckCheck, 
  Truck, 
  DollarSign, 
  Package, 
  Globe, 
  AlertTriangle,
  X
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'operations' | 'cod' | 'shipment' | 'international'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'operations':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'cod':
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'international':
        return <Globe className="w-4 h-4 text-indigo-500" />;
      default:
        return <Package className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Centro de notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notificaciones</h4>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full">
                    {unreadNotificationsCount} nuevas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 font-medium p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded"
                    title="Marcar todo leído"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Leído</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto text-[11px]">
              {(['all', 'operations', 'cod', 'shipment', 'international'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap capitalize transition-colors ${
                    filter === tab
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'Todas' : tab === 'operations' ? 'Operación' : tab === 'cod' ? 'COD' : tab === 'shipment' ? 'Envíos' : 'Courier'}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay notificaciones en esta categoría
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markNotificationRead(item.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      !item.read
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0 mt-0.5">
                      {getIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Canales: App Push • WhatsApp • Webhook • SMS
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
