import { SyncTransaction, SyncHealthMetrics, SyncStatus } from '../types/syncHealthTypes';
import { pushAudioEngine } from './driverPushNotificationService';

export function calculateSyncHealthMetrics(
  transactions: SyncTransaction[],
  isOnline: boolean
): SyncHealthMetrics {
  const total = transactions.length;
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const failed = transactions.filter((t) => t.status === 'failed').length;
  const synced = transactions.filter((t) => t.status === 'synced').length;

  if (total === 0) {
    return {
      healthScore: 100,
      totalTransactions: 0,
      pendingCount: 0,
      failedCount: 0,
      syncedCount: 0,
      isOnline,
      lastSyncTime: 'En tiempo real',
      statusLevel: isOnline ? 'healthy' : 'offline'
    };
  }

  // Health calculation: 100 - (failed * 30 + pending * 10) capped between 0 and 100
  let score = Math.round(100 - (failed * 30 + pending * 10) / Math.max(1, total) * 100);
  if (failed > 0 && score > 65) score = 65;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  if (failed === 0 && pending === 0) score = 100;

  let statusLevel: SyncHealthMetrics['statusLevel'] = 'healthy';
  if (!isOnline) {
    statusLevel = 'offline';
  } else if (failed > 0) {
    statusLevel = failed >= 2 ? 'critical' : 'warning';
  } else if (pending > 0) {
    statusLevel = 'warning';
  }

  const lastAttemptTx = transactions.find((t) => t.status === 'synced' && t.lastAttempt);
  const lastSyncTime = lastAttemptTx?.lastAttempt || 'Hace unos momentos';

  return {
    healthScore: score,
    totalTransactions: total,
    pendingCount: pending,
    failedCount: failed,
    syncedCount: synced,
    isOnline,
    lastSyncTime,
    statusLevel
  };
}

// Initial realistic seed transactions for GoPaq driver outbox ledger
export const initialSyncTransactions: SyncTransaction[] = [
  {
    id: 'tx-sync-101',
    type: 'pod_submission',
    trackingNumber: 'GP-7721',
    recipientName: 'Carlos Mendoza',
    stopId: 'stp-01',
    routeId: 'rt-today-01',
    timestamp: '08:45 AM',
    status: 'synced',
    retryCount: 0,
    lastAttempt: '08:45:12 AM',
    responseCode: 200,
    networkLatencyMs: 140,
    payload: {
      recipientName: 'Carlos Mendoza',
      recipientDni: '402-1928374-1',
      signatureUrl: 'data:image/svg+xml;utf8,<svg>...</svg>',
      codAmountCollected: 0
    }
  },
  {
    id: 'tx-sync-102',
    type: 'cod_collection',
    trackingNumber: 'GP-7721',
    recipientName: 'Carlos Mendoza',
    stopId: 'stp-01',
    routeId: 'rt-today-01',
    timestamp: '08:45 AM',
    status: 'synced',
    retryCount: 0,
    lastAttempt: '08:45:14 AM',
    responseCode: 200,
    networkLatencyMs: 95,
    payload: {
      codAmountCollected: 1250
    }
  },
  {
    id: 'tx-sync-103',
    type: 'pod_submission',
    trackingNumber: 'GP-8924',
    recipientName: 'Farmacia Bella Vista',
    stopId: 'stp-03',
    routeId: 'rt-today-01',
    timestamp: '09:20 AM',
    status: 'failed',
    retryCount: 2,
    lastAttempt: '09:22:04 AM',
    errorMessage: 'HTTP 504 Gateway Timeout: Carga de firma digital no respondió en torre Bella Vista.',
    responseCode: 504,
    networkLatencyMs: 4200,
    payload: {
      recipientName: 'Dra. Altagracia Peña (Regente)',
      recipientDni: '001-0873641-9',
      signatureUrl: 'data:image/svg+xml;utf8,<svg>...</svg>',
      codAmountCollected: 3800
    }
  }
];
