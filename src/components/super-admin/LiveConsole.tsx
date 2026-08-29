import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Radio, 
  Truck, 
  Package, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Navigation,
  Database,
  RefreshCw,
  Clock,
  Zap,
  Activity,
  ArrowUpRight,
  Wifi,
  WifiOff,
  DollarSign,
  Layers,
  Send,
  Sparkles,
  PhoneCall,
  RotateCcw
} from 'lucide-react';
import { InteractiveMap } from '../ui/InteractiveMap';
import { MetricCard, Button, Card, StatusBadge, Modal } from '../ui/DesignSystem';

export const LiveConsole: React.FC = () => {
  const { 
    drivers, 
    shipments, 
    formatMoney, 
    syncTransactions, 
    syncHealthMetrics, 
    retrySingleTransaction, 
    retryAllFailedTransactions, 
    forceSyncAllTransactions,
    isRetryingSync,
    driverOfflineMode,
    currentRoute,
    triggerEventDrivenAiRule,
    addToast
  } = useApp();

  const [selectedTxFilter, setSelectedTxFilter] = useState<'all' | 'synced' | 'failed' | 'pending'>('all');
  const [selectedTxDetails, setSelectedTxDetails] = useState<any | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('⚠️ Precaución en zona metropolitana: Lluvia moderada y pavimento resbaladizo. Mantener distancia segura.');

  const totalCodFleet = drivers.reduce((sum, d) => sum + (d.codCollectedToday || 0), 0);
  const activeDriversCount = drivers.filter((d) => d.status === 'on_route' || d.status === 'active').length;

  const filteredTransactions = syncTransactions.filter((tx) => {
    if (selectedTxFilter === 'all') return true;
    return tx.status === selectedTxFilter;
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsBroadcastModalOpen(false);
    addToast('success', 'Alerta Transmitida a Flota', `Mensaje enviado en tiempo real a los ${drivers.length} conductores activos vía push y radio.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-emerald-500 animate-pulse" />
              <span>Centro de Control Satelital & Sincronización en Vivo</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 animate-pulse">
              STREAMING GPS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitoreo en tiempo real de telemetría GPS, libro mayor de sincronización outbox, cobros COD y eventos de IA
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Send className="w-4 h-4 text-amber-500" />}
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            Alerta a la Flota
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${isRetryingSync ? 'animate-spin' : ''}`} />}
            onClick={forceSyncAllTransactions}
            disabled={isRetryingSync}
          >
            {isRetryingSync ? 'Sincronizando...' : 'Forzar Sincronización Outbox'}
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Conductores en Ruta"
          value={`${activeDriversCount} / ${drivers.length}`}
          subtitle="Monitoreo GPS activo"
          icon={<Truck className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="COD Recaudado Hoy"
          value={formatMoney(totalCodFleet)}
          subtitle="Cobros en efectivo liquidados"
          icon={<DollarSign className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Salud de Sincronización"
          value={`${syncHealthMetrics.syncedPercentage}%`}
          subtitle={`${syncHealthMetrics.syncedCount} de ${syncHealthMetrics.totalTransactions} transacciones OK`}
          icon={<Database className="w-5 h-5" />}
          accent={syncHealthMetrics.syncedPercentage >= 95 ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="Cola Outbox Pendiente"
          value={`${syncHealthMetrics.pendingCount + syncHealthMetrics.failedCount} paradas`}
          subtitle={`Latencia promedio: ${syncHealthMetrics.avgLatencyMs}ms`}
          icon={<Activity className="w-5 h-5" />}
          accent={syncHealthMetrics.failedCount > 0 ? 'rose' : 'blue'}
        />
      </div>

      {/* Map & Live Stream Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Radar Satelital & Geocercas de Flota
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Pings recibidos cada 5 seg
              </span>
            </div>
            <InteractiveMap height="h-110" showAllHubs={true} />
          </div>

          {/* Active Drivers Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {drivers.map((drv) => (
              <div
                key={drv.id}
                className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={drv.avatar} alt={drv.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {drv.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {drv.licensePlate}
                      </span>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    drv.status === 'on_route' ? 'bg-emerald-500 animate-ping' : 'bg-slate-300 dark:bg-slate-700'
                  }`} />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">COD Hoy:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatMoney(drv.codCollectedToday)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Sync & Event Stream Sidebar */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>Libro Mayor de Sincronización</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Eventos de entrega, POD, firmas y cobros
                </p>
              </div>

              {syncHealthMetrics.failedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={retryAllFailedTransactions}
                >
                  Reintentar ({syncHealthMetrics.failedCount})
                </Button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setSelectedTxFilter('all')}
                className={`flex-1 py-1 rounded-md transition-all ${
                  selectedTxFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({syncTransactions.length})
              </button>
              <button
                onClick={() => setSelectedTxFilter('synced')}
                className={`flex-1 py-1 rounded-md transition-all ${
                  selectedTxFilter === 'synced'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sincronizados ({syncHealthMetrics.syncedCount})
              </button>
              <button
                onClick={() => setSelectedTxFilter('failed')}
                className={`flex-1 py-1 rounded-md transition-all ${
                  selectedTxFilter === 'failed'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fallidos ({syncHealthMetrics.failedCount})
              </button>
            </div>

            {/* Transactions List */}
            <div className="space-y-2 max-h-130 overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay transacciones en este filtro
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxDetails(tx)}
                    className="p-3 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {tx.trackingNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {tx.type === 'pod_submission' ? 'POD' : tx.type === 'incident_report' ? 'INCIDENCIA' : 'GPS'}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        tx.status === 'synced'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : tx.status === 'retrying'
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                          : tx.status === 'failed'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      }`}>
                        {tx.status === 'synced' ? 'Sincronizado' : tx.status === 'failed' ? 'Error' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{tx.recipientName}</span>
                      <span className="font-mono text-[10px]">{tx.timestamp}</span>
                    </div>

                    {tx.payload?.codAmountCollected ? (
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        COD: {formatMoney(tx.payload.codAmountCollected)}
                      </div>
                    ) : null}

                    {tx.status === 'failed' && (
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-rose-500 font-medium truncate max-w-[170px]">
                          {tx.errorMessage || 'Error de conexión'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            retrySingleTransaction(tx.id);
                          }}
                          className="px-2 py-0.5 bg-rose-500 text-white rounded font-bold hover:bg-rose-600 transition-colors"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <Modal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          title="Transmitir Alerta a Flota en Tiempo Real"
        >
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mensaje de Difusión Satelital
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="Escribe el mensaje para los conductores..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setIsBroadcastModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={<Send className="w-4 h-4" />}>
                Transmitir a Todos
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transaction Details Modal */}
      {selectedTxDetails && (
        <Modal
          isOpen={Boolean(selectedTxDetails)}
          onClose={() => setSelectedTxDetails(null)}
          title={`Detalle de Transacción: ${selectedTxDetails.trackingNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado</span>
                <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedTxDetails.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase font-mono">{selectedTxDetails.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hora</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTxDetails.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Latencia</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedTxDetails.networkLatencyMs || 75} ms</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Payload JSON</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(selectedTxDetails.payload, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedTxDetails(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
