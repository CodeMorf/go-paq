import { SyncTransaction, SyncHealthMetrics } from '../types/syncHealthTypes';

export function calculateSyncHealthMetrics(transactions: SyncTransaction[], isOnline: boolean): SyncHealthMetrics {
  const total = transactions.length;
  const pending = transactions.filter((transaction) => transaction.status === 'pending').length;
  const failed = transactions.filter((transaction) => transaction.status === 'failed').length;
  const synced = transactions.filter((transaction) => transaction.status === 'synced').length;
  if (total === 0) return { healthScore: 100, totalTransactions: 0, pendingCount: 0, failedCount: 0, syncedCount: 0, isOnline, lastSyncTime: 'Sin operaciones locales pendientes', statusLevel: isOnline ? 'healthy' : 'offline' };
  let score = Math.round(100 - ((failed * 30 + pending * 10) / Math.max(1, total)) * 100);
  if (failed > 0 && score > 65) score = 65;
  if (score < 0) score = 0;
  if (failed === 0 && pending === 0) score = 100;
  const statusLevel: SyncHealthMetrics['statusLevel'] = !isOnline ? 'offline' : failed > 0 ? (failed >= 2 ? 'critical' : 'warning') : pending > 0 ? 'warning' : 'healthy';
  const lastAttempt = transactions.find((transaction) => transaction.status === 'synced' && transaction.lastAttempt)?.lastAttempt || 'Sin confirmación reciente';
  return { healthScore: score, totalTransactions: total, pendingCount: pending, failedCount: failed, syncedCount: synced, isOnline, lastSyncTime: lastAttempt, statusLevel };
}
