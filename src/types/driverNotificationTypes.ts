import { RouteStop } from './index';

export type DriverPushNotificationType = 
  | 'stop_added' 
  | 'stop_cancelled' 
  | 'route_reordered' 
  | 'priority_changed' 
  | 'dispatcher_broadcast' 
  | 'traffic_alert' 
  | 'route_published';

export type DriverNotificationSeverity = 'urgent' | 'high' | 'info' | 'success';

export interface DriverPushNotification {
  id: string;
  type: DriverPushNotificationType;
  title: string;
  message: string;
  severity: DriverNotificationSeverity;
  timestamp: string;
  routeId: string;
  stopId?: string;
  stopData?: RouteStop;
  read: boolean;
  actionRequired?: boolean;
  actionTaken?: 'accepted' | 'declined' | 'viewed' | 'auto_applied';
  meta?: {
    oldEta?: string;
    newEta?: string;
    reason?: string;
    dispatcherName?: string;
    zoneName?: string;
    codAmount?: number;
    trackingNumber?: string;
    affectedStopsCount?: number;
  };
}

export interface DriverPushState {
  isOnline: boolean;
  soundEnabled: boolean;
  notifications: DriverPushNotification[];
  pendingOfflineQueue: DriverPushNotification[];
  activePushBanner: DriverPushNotification | null;
}
