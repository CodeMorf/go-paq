export type SyncTransactionType = 
  | 'pod_submission' 
  | 'incident_report' 
  | 'cod_collection' 
  | 'signature_upload' 
  | 'stop_status_update' 
  | 'driver_location_ping';

export type SyncStatus = 'synced' | 'pending' | 'failed' | 'retrying';

export interface SyncTransaction {
  id: string;
  type: SyncTransactionType;
  trackingNumber: string;
  recipientName: string;
  stopId: string;
  routeId: string;
  timestamp: string;
  status: SyncStatus;
  retryCount: number;
  lastAttempt: string | null;
  errorMessage?: string;
  payload: {
    recipientName?: string;
    recipientDni?: string;
    signatureUrl?: string;
    photoUrl?: string;
    codAmountCollected?: number;
    incidentReason?: string;
    incidentNotes?: string;
    statusChange?: string;
    lat?: number;
    lng?: number;
  };
  networkLatencyMs?: number;
  responseCode?: number;
}

export interface SyncHealthMetrics {
  healthScore: number; // 0 to 100
  totalTransactions: number;
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
  isOnline: boolean;
  lastSyncTime: string;
  statusLevel: 'healthy' | 'warning' | 'critical' | 'offline';
}
