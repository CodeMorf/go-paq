import React, { useState } from 'react';
import { SyncTransaction, SyncHealthMetrics, SyncStatus } from '../../types/syncHealthTypes';
import { 
  Activity, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wifi, 
  WifiOff, 
  Send, 
  Check, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Zap, 
  Radio,
  RefreshCw,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { Modal, Button } from '../ui/DesignSystem';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metrics: SyncHealthMetrics;
  transactions: SyncTransaction[];
  onRetrySingleTransaction: (transactionId: string) => void;
  onRetryAllFailed: () => void;
  onForceSyncAll: () => void;
  onSimulateNewOfflineTransaction: () => void;
  isRetryingAll: boolean;
  retryingId: string | null;
}

export const DriverSyncHealthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  metrics,
  transactions,
  onRetrySingleTransaction,
  onRetryAllFailed,
  onForceSyncAll,
  onSimulateNewOfflineTransaction,
  isRetryingAll,
  retryingId
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'failed' | 'synced'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterTab === 'pending' && tx.status !== 'pending') return false;
    if (filterTab === 'failed' && tx.status !== 'failed') return false;
    if (filterTab === 'synced' && tx.status !== 'synced') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.trackingNumber.toLowerCase().includes(q) ||
        tx.recipientName.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            200 Sincronizado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            En Cola (Offline)
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Error de Envío
          </span>
        );
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 animate-pulse">
            <RotateCw className="w-3 h-3 text-indigo-600 animate-spin" />
            Reintentando...
          </span>
        );
    }
  };

  const getTypeLabel = (type: SyncTransaction['type']) => {
    switch (type) {
      case 'pod_submission':
        return { label: 'POD / Entrega Exitosa', icon: FileText, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' };
      case 'cod_collection':
        return { label: 'Cobro COD Efectivo', icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' };
      case 'incident_report':
        return { label: 'Reporte de Incidencia', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' };
      case 'signature_upload':
        return { label: 'Firma Digital', icon: Check, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' };
      case 'driver_location_ping':
        return { label: 'Telemetría GPS', icon: Radio, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
      default:
        return { label: 'Actualización Parada', icon: FileText, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Salud de Sincronización & Registro Outbox"
      subtitle={`Cola de transacciones locales • ${metrics.isOnline ? 'En Línea' : 'Modo Fuera de Línea'}`}
    >
      <div className="space-y-4 text-xs">
        {/* Top Health Score Metric Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          metrics.statusLevel === 'healthy'
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
            : metrics.statusLevel === 'warning'
            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            : metrics.statusLevel === 'critical'
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-3.5">
            {/* Circular Gauge Representation */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    metrics.healthScore >= 90
                      ? 'text-emerald-500'
                      : metrics.healthScore >= 60
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  } transition-all duration-500`}
                  strokeDasharray={`${metrics.healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {metrics.healthScore}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {metrics.statusLevel === 'healthy'
                    ? 'Transacciones Al Día'
                    : metrics.statusLevel === 'warning'
                    ? 'Sincronización Pendiente'
                    : metrics.statusLevel === 'critical'
                    ? 'Fallos Detectados en Central'
                    : 'Modo Offline (Transacciones Locales)'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {metrics.failedCount > 0
                  ? `${metrics.failedCount} transacción(es) fallaron y requieren reintento.`
                  : metrics.pendingCount > 0
                  ? `${metrics.pendingCount} transacción(es) esperando conexión activa.`
                  : 'Todos los PODs y cobros fueron confirmados por Central GoPaq.'}
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                Última sincronización exitosa: {metrics.lastSyncTime}
              </span>
            </div>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {metrics.failedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={<RotateCw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />}
                onClick={onRetryAllFailed}
                disabled={isRetryingAll}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
              >
                Reintentar Fallidos ({metrics.failedCount})
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />}
              onClick={onForceSyncAll}
              disabled={isRetryingAll}
              className="text-[11px] font-semibold"
            >
              Forzar Envío Total
            </Button>
          </div>
        </div>

        {/* Counter Summary Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total</span>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
              {metrics.totalTransactions}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Sincronizados</span>
            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.syncedCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
            <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">En Cola</span>
            <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400 font-mono">
              {metrics.pendingCount}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block">Fallidos</span>
            <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 font-mono">
              {metrics.failedCount}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por guía GP-XXXX o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={onSimulateNewOfflineTransaction}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 text-[11px] flex items-center gap-1 shrink-0"
              title="Simular fallo para probar reintento individual"
            >
              <Zap className="w-3 h-3 text-indigo-500" />
              <span>Simular Fallo</span>
            </button>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              onClick={() => setFilterTab('failed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'failed'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Fallidos ({metrics.failedCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              En Cola ({metrics.pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('synced')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterTab === 'synced'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Sincronizados ({metrics.syncedCount})
            </button>
          </div>
        </div>

        {/* Transactions Visual Log Feed */}
        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-xs">No hay transacciones en este filtro</p>
              <p className="text-[11px] opacity-70">
                Las transacciones registradas localmente aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const typeInfo = getTypeLabel(tx.type);
              const TypeIcon = typeInfo.icon;
              const isExpanded = expandedTxId === tx.id;
              const isRetrying = retryingId === tx.id || tx.status === 'retrying';

              return (
                <div
                  key={tx.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    tx.status === 'failed'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/80 shadow-xs ring-1 ring-rose-400/20'
                      : tx.status === 'pending'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {tx.trackingNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          {tx.recipientName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(tx.status)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tx.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Failure Error Callout */}
                  {tx.status === 'failed' && (
                    <div className="mt-2 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-300 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Fallo de Envío ({tx.retryCount} reintentos):</span>
                      </div>
                      <p className="text-[10px] opacity-90 pl-5 font-mono leading-tight">
                        {tx.errorMessage || 'Error de conexión con el servidor de despacho.'}
                      </p>
                    </div>
                  )}

                  {/* Expandable Payload Inspection Drawer */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Transacción ID:</span>
                          <span className="font-mono font-bold text-[10px]">{tx.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Reintentos acumulados:</span>
                          <span className="font-mono font-bold text-[10px]">{tx.retryCount}</span>
                        </div>
                        {tx.payload.recipientDni && (
                          <div>
                            <span className="text-slate-400 text-[10px] block">Cédula / DNI:</span>
                            <span className="font-mono font-bold text-[10px]">{tx.payload.recipientDni}</span>
                          </div>
                        )}
                        {tx.payload.codAmountCollected !== undefined && (
                          <div>
                            <span className="text-slate-400 text-[10px] block">Cobro COD recaudado:</span>
                            <span className="font-mono font-bold text-amber-600 text-[10px]">
                              RD$ {tx.payload.codAmountCollected.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {tx.payload.incidentReason && (
                          <div className="col-span-2">
                            <span className="text-slate-400 text-[10px] block">Motivo Incidencia:</span>
                            <span className="font-bold text-rose-600 text-[10px]">{tx.payload.incidentReason}</span>
                          </div>
                        )}
                        {tx.networkLatencyMs && (
                          <div>
                            <span className="text-slate-400 text-[10px] block">Latencia de Red:</span>
                            <span className="font-mono text-[10px]">{tx.networkLatencyMs} ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar for each transaction */}
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <button
                      onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 text-[10px] font-semibold"
                    >
                      {isExpanded ? (
                        <>
                          <span>Ocultar Datos</span>
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span>Ver Payload</span>
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Individual Retry Button for Failed or Pending Transactions */}
                      {(tx.status === 'failed' || tx.status === 'pending') && (
                        <button
                          onClick={() => onRetrySingleTransaction(tx.id)}
                          disabled={isRetrying}
                          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all text-xs ${
                            tx.status === 'failed'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          } ${isRetrying ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>{isRetrying ? 'Enviando a Central...' : 'Reintentar Esta Parada'}</span>
                        </button>
                      )}

                      {tx.status === 'synced' && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <Check className="w-3 h-3" /> Confirmado en Central
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span>GoPaq Outbox Engine v2.4</span>
          </span>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
