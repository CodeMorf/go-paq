import { DriverPushNotification, DriverPushNotificationType } from '../types/driverNotificationTypes';
import { RouteStop } from '../types';

// Web Audio API Synthesizer for Push Notifications
class PushAudioEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Pleasant notification chime
  playPushChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch {}
  }

  // High priority / urgent alert
  playUrgentAlert() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [0, 0.14, 0.28].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 1 ? 987.77 : 880, now + offset);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(0.22, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {}
  }

  // Harmonious sync chime
  playSyncChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch {}
  }

  // Cancelled stop tone
  playCancelledTone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.33);
    } catch {}
  }
}

export const pushAudioEngine = new PushAudioEngine();

// Preset generator for realistic route change notifications
export const createSampleRouteChange = (
  type: DriverPushNotificationType,
  routeId: string,
  extraParams?: {
    trackingNumber?: string;
    recipientName?: string;
    address?: string;
    codAmount?: number;
    reason?: string;
  }
): { notification: DriverPushNotification; updatedStop?: RouteStop } => {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = `notif-push-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  switch (type) {
    case 'stop_added': {
      const tracking = extraParams?.trackingNumber || `NX-${Math.floor(1000 + Math.random() * 9000)}-DO`;
      const recipient = extraParams?.recipientName || 'Lic. Patricia Holguín';
      const address = extraParams?.address || 'Av. Roberto Pastoriza #312, Ens. Naco, Santo Domingo';
      const cod = extraParams?.codAmount !== undefined ? extraParams.codAmount : 3450;

      const newStop: RouteStop = {
        id: `stp-live-${Date.now()}`,
        sequenceOrder: 1,
        shipmentId: `shp-${Date.now()}`,
        trackingNumber: tracking,
        type: 'delivery',
        recipientName: recipient,
        phone: '+1 (809) 555-8821',
        address,
        lat: 18.4745,
        lng: -69.9325,
        estimatedArrival: '14:45',
        status: 'pending',
        codAmount: cod,
        packageSummary: 'Electrónica - 1.8 KG (Fragil)',
        contactRole: 'destinatario',
        instructions: 'Entregar en recepción 3er nivel. Confirmar con cédula.'
      };

      const notification: DriverPushNotification = {
        id,
        type: 'stop_added',
        title: '🚨 Nueva Parada Asignada (Express)',
        message: `La central de despacho agregó a ${recipient} (${tracking}) en ${address.slice(0, 32)}...`,
        severity: 'urgent',
        timestamp,
        routeId,
        stopId: newStop.id,
        stopData: newStop,
        read: false,
        actionRequired: true,
        meta: {
          trackingNumber: tracking,
          codAmount: cod,
          dispatcherName: 'Central de Despacho GoPaq (Alejandro T.)'
        }
      };

      return { notification, updatedStop: newStop };
    }

    case 'stop_cancelled': {
      const tracking = extraParams?.trackingNumber || 'GP-8924';
      const reason = extraParams?.reason || 'Cliente reprogramó recepción para mañana por viaje imprevisto.';

      const notification: DriverPushNotification = {
        id,
        type: 'stop_cancelled',
        title: '🚫 Parada Cancelada por Central',
        message: `La entrega ${tracking} fue retirada de tu itinerario. Motivo: ${reason}`,
        severity: 'high',
        timestamp,
        routeId,
        read: false,
        actionRequired: false,
        actionTaken: 'auto_applied',
        meta: {
          trackingNumber: tracking,
          reason,
          dispatcherName: 'Mesa de Tráfico & Monitoreo'
        }
      };

      return { notification };
    }

    case 'route_reordered': {
      const reason = extraParams?.reason || 'Congestión alta en Av. 27 de Febrero. Reordenamiento por Waze Traffic AI.';

      const notification: DriverPushNotification = {
        id,
        type: 'route_reordered',
        title: '🔄 Ruta Reordenada en Tiempo Real',
        message: `El orden de tus paradas ha sido recalculado para evitar tapones. Ahorro estimado: 18 minutos.`,
        severity: 'info',
        timestamp,
        routeId,
        read: false,
        actionRequired: true,
        meta: {
          reason,
          dispatcherName: 'GoPaq Route Optimizer AI'
        }
      };

      return { notification };
    }

    case 'priority_changed': {
      const tracking = extraParams?.trackingNumber || 'GP-7741';
      const newEta = '13:15';

      const notification: DriverPushNotification = {
        id,
        type: 'priority_changed',
        title: '⚡ Cambio de Prioridad VIP',
        message: `Guía ${tracking} elevada a prioridad URGENTE. Ventana requerida antes de las ${newEta}.`,
        severity: 'urgent',
        timestamp,
        routeId,
        read: false,
        actionRequired: true,
        meta: {
          trackingNumber: tracking,
          newEta,
          dispatcherName: 'Supervisor de Operaciones'
        }
      };

      return { notification };
    }

    case 'dispatcher_broadcast': {
      const msg = extraParams?.reason || 'Aviso General: Lluvia intensa en zona Los Prados. Manejar con extrema precaución.';

      const notification: DriverPushNotification = {
        id,
        type: 'dispatcher_broadcast',
        title: '📢 Comunicado Directo de Central',
        message: msg,
        severity: 'info',
        timestamp,
        routeId,
        read: false,
        meta: {
          dispatcherName: 'Central de Operaciones GoPaq'
        }
      };

      return { notification };
    }

    default: {
      const notification: DriverPushNotification = {
        id,
        type: 'traffic_alert',
        title: '⚠️ Alerta de Ruta en Tiempo Real',
        message: 'Cambio operativo registrado en tu itinerario de entrega.',
        severity: 'info',
        timestamp,
        routeId,
        read: false
      };
      return { notification };
    }
  }
};
