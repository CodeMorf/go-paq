import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RouteStop } from '../../types';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Camera, 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Sun, 
  Moon, 
  LogOut, 
  Wifi, 
  WifiOff, 
  RotateCcw,
  Sparkles, 
  Check, 
  MessageSquare, 
  ShieldCheck, 
  Send, 
  Bot, 
  PhoneCall, 
  Radio, 
  HelpCircle, 
  Clock,
  Bell,
  Volume2,
  VolumeX,
  RotateCw,
  Zap,
  Layers,
  ChevronRight,
  Flame,
  Activity,
  Database,
  RefreshCw,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { Button, Modal, Card } from '../ui/DesignSystem';
import { SignaturePad } from '../ui/SignaturePad';
import { GoPaqLogo } from '../ui/GoPaqLogo';
import { AutomationTriggerEventType } from '../../types/aiAutomationTypes';
import { DriverPushNotification, DriverPushNotificationType } from '../../types/driverNotificationTypes';
import { pushAudioEngine, createSampleRouteChange } from '../../utils/driverPushNotificationService';
import { DriverPushBanner } from './DriverPushBanner';
import { DriverNotificationCenterModal } from './DriverNotificationCenterModal';
import { DriverDispatchSimulatorModal } from './DriverDispatchSimulatorModal';
import { SyncTransaction, SyncHealthMetrics } from '../../types/syncHealthTypes';
import { calculateSyncHealthMetrics, initialSyncTransactions } from '../../utils/syncHealthService';
import { DriverSyncHealthModal } from './DriverSyncHealthModal';
import { DriverPodCameraScanner } from './DriverPodCameraScanner';
import { OcrExtractedData } from '../../types/ocrTypes';

export const DriverApp: React.FC = () => {
  const { 
    currentRoute, 
    updateRoute,
    completeStopPOD, 
    formatMoney, 
    addToast, 
    setCurrentSection,
    darkMode,
    setDarkMode,
    zernioConfig,
    zernioMessages,
    sendZernioMessage,
    triggerVoiceBotCall,
    triggerEventDrivenAiRule,
    automationLogs,
    pusherEvents,
    syncTransactions,
    setSyncTransactions,
    syncHealthMetrics,
    retrySingleTransaction,
    retryAllFailedTransactions,
    forceSyncAllTransactions,
    isRetryingSync,
    driverOfflineMode,
    setDriverOfflineMode
  } = useApp();

  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isMaskedChatOpen, setIsMaskedChatOpen] = useState(false);
  const [isAiVoiceAssistantModalOpen, setIsAiVoiceAssistantModalOpen] = useState(false);
  const [driverChatMsg, setDriverChatMsg] = useState('');
  const [isCallingAiVoice, setIsCallingAiVoice] = useState(false);

  // POD form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientDni, setRecipientDni] = useState('');
  const [codAmountCollected, setCodAmountCollected] = useState<number>(0);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPodCameraOcrOpen, setIsPodCameraOcrOpen] = useState(false);
  const [ocrVerificationResult, setOcrVerificationResult] = useState<OcrExtractedData | null>(null);

  // Incident form state
  const [incidentReason, setIncidentReason] = useState('Cliente Ausente / No Contesta');
  const [incidentNotes, setIncidentNotes] = useState('');

  // -------------------------------------------------------------
  // Push Notification & Online/Offline Routing Engine State
  // -------------------------------------------------------------
  const isOnline = !driverOfflineMode;
  const setIsOnline = (online: boolean | ((prev: boolean) => boolean)) => {
    if (typeof online === 'function') {
      const nextVal = online(isOnline);
      setDriverOfflineMode(!nextVal);
    } else {
      setDriverOfflineMode(!online);
    }
  };

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activePushBanner, setActivePushBanner] = useState<DriverPushNotification | null>(null);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [highlightedStopTracking, setHighlightedStopTracking] = useState<string | null>(null);

  // Initial seed notifications
  const [driverNotifications, setDriverNotifications] = useState<DriverPushNotification[]>([
    {
      id: 'init-push-1',
      type: 'route_published',
      title: '🚀 Hoja de Ruta Asignada & Despachada',
      message: `Ruta ${currentRoute.routeCode} asignada con ${currentRoute.stops.length} paradas y RD$ ${currentRoute.totalCodAmount.toLocaleString()} en cobros COD.`,
      severity: 'info',
      timestamp: '08:00 AM',
      routeId: currentRoute.id,
      read: true,
      actionTaken: 'auto_applied',
      meta: { dispatcherName: 'Centro de Control SDQ-01' }
    },
    {
      id: 'init-push-2',
      type: 'traffic_alert',
      title: '⚠️ Aviso de Tráfico: Av. 27 de Febrero',
      message: 'Tráfico denso reportado entre Abraham Lincoln y Máximo Gómez. Sugerido desvío por Gustavo Mejía Ricart.',
      severity: 'high',
      timestamp: '08:30 AM',
      routeId: currentRoute.id,
      read: false,
      meta: { dispatcherName: 'Waze Traffic Relay AI' }
    }
  ]);

  // Queue for notifications received while driver was offline
  const [pendingOfflineQueue, setPendingOfflineQueue] = useState<DriverPushNotification[]>([]);

  // -------------------------------------------------------------
  // Sync Health & Outbox Transaction Ledger State
  // -------------------------------------------------------------
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [retryingTxId, setRetryingTxId] = useState<string | null>(null);

  // Retry an individual failed or pending stop transaction
  const handleRetrySingleTransaction = (transactionId: string) => {
    setRetryingTxId(transactionId);
    retrySingleTransaction(transactionId);
    setTimeout(() => {
      setRetryingTxId(null);
      if (soundEnabled && isOnline) {
        pushAudioEngine.playPushChime();
      }
    }, 800);
  };

  // Retry all failed transactions in batch
  const handleRetryAllFailed = () => {
    retryAllFailedTransactions();
    if (soundEnabled && isOnline) {
      setTimeout(() => {
        pushAudioEngine.playPushChime();
      }, 1000);
    }
  };

  // Force sync all outbox items
  const handleForceSyncAll = () => {
    forceSyncAllTransactions();
    if (soundEnabled && isOnline) {
      setTimeout(() => {
        pushAudioEngine.playPushChime();
      }, 1000);
    }
  };

  // Simulate a new offline failure to test single-item retry
  const handleSimulateNewOfflineTransaction = () => {
    const randomNum = Math.floor(Math.random() * 8000) + 1000;
    const randomGuia = `GP-${randomNum}`;
    const newFailedTx: SyncTransaction = {
      id: `tx-sim-${Date.now()}`,
      type: 'pod_submission',
      trackingNumber: randomGuia,
      recipientName: 'Distribuidora Bella Vista',
      stopId: `stp-sim-${Date.now()}`,
      routeId: currentRoute.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'failed',
      retryCount: 1,
      lastAttempt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      errorMessage: 'HTTP 504 Gateway Timeout: Servidor de despacho no respondió a tiempo.',
      responseCode: 504,
      networkLatencyMs: 4100,
      payload: {
        recipientName: 'Distribuidora Bella Vista (Recepción)',
        recipientDni: '001-8833910-2',
        codAmountCollected: 2100
      }
    };

    setSyncTransactions((prev) => [newFailedTx, ...prev]);
    addToast('error', '⚠️ Fallo Simulado Registrado', `Error de sincronización para ${randomGuia}. Puedes reintentarlo en el registro.`);
  };

  // -------------------------------------------------------------
  // Push Notification Dispatcher Handler with isOnline Filter
  // -------------------------------------------------------------
  const receivePushNotification = (
    notif: DriverPushNotification,
    customStopData?: RouteStop
  ) => {
    if (isOnline) {
      // ONLINE: Direct Push Delivery with Audio & Visual Banner
      if (soundEnabled) {
        if (notif.severity === 'urgent') {
          pushAudioEngine.playUrgentAlert();
        } else if (notif.type === 'stop_cancelled') {
          pushAudioEngine.playCancelledTone();
        } else {
          pushAudioEngine.playPushChime();
        }
      }

      setActivePushBanner(notif);
      setDriverNotifications((prev) => [notif, ...prev]);

      addToast(
        notif.severity === 'urgent' ? 'error' : notif.severity === 'high' ? 'warning' : 'info',
        notif.title,
        notif.message
      );

      if (notif.stopData?.trackingNumber) {
        setHighlightedStopTracking(notif.stopData.trackingNumber);
      }
    } else {
      // OFFLINE: Intercept and store in pending queue without interrupting
      setPendingOfflineQueue((prev) => [...prev, notif]);
      addToast(
        'warning',
        '📥 Cambio de Ruta En Cola (Modo Offline)',
        `Se recibió una alerta de central pero tu estado está en pausa. Se aplicará al conectarte.`
      );
    }
  };

  // Listen to external Pusher events
  useEffect(() => {
    if (!pusherEvents || pusherEvents.length === 0) return;
    const latestEvent = pusherEvents[pusherEvents.length - 1];
    
    // Check if event is relevant for this driver route
    if (latestEvent.event.startsWith('route.') || latestEvent.event.startsWith('dispatch.')) {
      const generated = createSampleRouteChange('dispatcher_broadcast', currentRoute.id, {
        reason: `${latestEvent.data?.message || 'Actualización de despacho'} (${latestEvent.event})`
      });
      receivePushNotification(generated.notification);
    }
  }, [pusherEvents]);

  // Toggle Online/Offline State with automatic queue synchronization
  const handleToggleOnline = () => {
    if (!isOnline) {
      // OFFLINE -> ONLINE: Reconnecting and syncing pending queue
      setIsOnline(true);
      if (pendingOfflineQueue.length > 0) {
        if (soundEnabled) pushAudioEngine.playSyncChime();

        // Process and apply queued route changes
        let updatedStops = [...currentRoute.stops];
        let addedCod = 0;

        pendingOfflineQueue.forEach((qNotif) => {
          if (qNotif.type === 'stop_added' && qNotif.stopData) {
            const exists = updatedStops.some((s) => s.trackingNumber === qNotif.stopData!.trackingNumber);
            if (!exists) {
              updatedStops = [qNotif.stopData, ...updatedStops].map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
              addedCod += qNotif.stopData.codAmount || 0;
            }
          } else if (qNotif.type === 'stop_cancelled' && qNotif.meta?.trackingNumber) {
            updatedStops = updatedStops.filter((s) => s.trackingNumber !== qNotif.meta!.trackingNumber);
          } else if (qNotif.type === 'route_reordered') {
            updatedStops = [...updatedStops].reverse().map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
          }
        });

        if (updateRoute) {
          updateRoute(currentRoute.id, {
            stops: updatedStops,
            totalStops: updatedStops.length,
            totalCodAmount: currentRoute.totalCodAmount + addedCod
          });
        }

        setDriverNotifications((prev) => [...pendingOfflineQueue, ...prev]);
        const queuedCount = pendingOfflineQueue.length;
        setPendingOfflineQueue([]);

        addToast(
          'success',
          '🔄 Sincronización Exitosa',
          `Se reconectó a Central GoPaq. Se procesaron ${queuedCount} actualizaciones pendientes en tu ruta.`
        );
      } else {
        if (soundEnabled) pushAudioEngine.playPushChime();
        addToast('success', '🟢 Conectado en Línea', 'Canal push activo. Recibiendo cambios de ruta en tiempo real.');
      }

      // Auto-flush pending outbox transactions upon reconnecting
      const pendingOutbox = syncTransactions.filter((t) => t.status === 'pending');
      if (pendingOutbox.length > 0) {
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setSyncTransactions((prev) =>
          prev.map((t) =>
            t.status === 'pending'
              ? {
                  ...t,
                  status: 'synced',
                  lastAttempt: nowTime,
                  retryCount: t.retryCount + 1,
                  errorMessage: undefined,
                  responseCode: 200,
                  networkLatencyMs: Math.floor(Math.random() * 110) + 75
                }
              : t
          )
        );
        addToast('success', '📤 Outbox Sincronizado', `Se enviaron ${pendingOutbox.length} transacciones locales a Central GoPaq.`);
      }
    } else {
      // ONLINE -> OFFLINE: Pausing live delivery
      setIsOnline(false);
      addToast(
        'warning',
        '⏸️ Modo Fuera de Línea / Pausado',
        'Tu estado está en pausa. Las alertas y cambios de ruta se guardarán en cola.'
      );
    }
  };

  // Sync offline queue manually
  const handleSyncOfflineQueue = () => {
    handleToggleOnline();
  };

  // Accept notification and apply route update
  const handleAcceptPushNotification = (notif: DriverPushNotification) => {
    if (notif.type === 'stop_added' && notif.stopData) {
      const exists = currentRoute.stops.some((s) => s.trackingNumber === notif.stopData!.trackingNumber);
      if (!exists) {
        const newStops = [notif.stopData, ...currentRoute.stops].map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
        if (updateRoute) {
          updateRoute(currentRoute.id, {
            stops: newStops,
            totalStops: newStops.length,
            totalCodAmount: currentRoute.totalCodAmount + (notif.stopData.codAmount || 0)
          });
        }
      }
      setHighlightedStopTracking(notif.stopData.trackingNumber);
      addToast('success', 'Parada Agregada al Itinerario', `${notif.stopData.recipientName} agregada como Parada #1.`);
    } else if (notif.type === 'stop_cancelled' && notif.meta?.trackingNumber) {
      const newStops = currentRoute.stops.filter((s) => s.trackingNumber !== notif.meta!.trackingNumber);
      if (updateRoute) {
        updateRoute(currentRoute.id, {
          stops: newStops,
          totalStops: newStops.length
        });
      }
      addToast('info', 'Parada Removida', `Guía ${notif.meta.trackingNumber} fue cancelada y retirada de tu lista.`);
    } else if (notif.type === 'route_reordered') {
      const reordered = [...currentRoute.stops].reverse().map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
      if (updateRoute) {
        updateRoute(currentRoute.id, {
          stops: reordered
        });
      }
      addToast('success', 'Ruta Optimizada', 'Secuencia de paradas actualizada con éxito.');
    }

    setDriverNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true, actionTaken: 'accepted' } : n))
    );
    setActivePushBanner(null);
  };

  // Trigger test simulation push event
  const handleSimulatePushEvent = (
    type: DriverPushNotificationType,
    customData?: Record<string, any>
  ) => {
    const { notification, updatedStop } = createSampleRouteChange(
      type,
      currentRoute.id,
      customData
    );
    receivePushNotification(notification, updatedStop);
  };

  const handleOpenPOD = (stop: RouteStop, openScannerDirectly: boolean = false) => {
    setActiveStop(stop);
    setRecipientName(stop.recipientName);
    setRecipientDni('402-2893812-4');
    setCodAmountCollected(stop.codAmount || 0);
    setSignatureUrl(null);
    setPhotoUrl('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80');
    setOcrVerificationResult(null);
    setIsPodCameraOcrOpen(openScannerDirectly);
    setIsPodModalOpen(true);
  };

  const handleApplyOcrData = (data: OcrExtractedData) => {
    if (data.recipientName) {
      setRecipientName(data.recipientName);
    }
    if (data.recipientDni) {
      setRecipientDni(data.recipientDni);
    }
    if (data.capturedPhotoUrl) {
      setPhotoUrl(data.capturedPhotoUrl);
    }
    if (data.codAmount !== undefined && activeStop?.codAmount && activeStop.codAmount > 0) {
      setCodAmountCollected(data.codAmount);
    }
    setOcrVerificationResult(data);
    setIsPodCameraOcrOpen(false);
  };

  const handleOpenMaskedChat = (stop: RouteStop) => {
    setActiveStop(stop);
    setIsMaskedChatOpen(true);
  };

  const handleOpenAiVoiceAssistant = (stop: RouteStop) => {
    setActiveStop(stop);
    setIsAiVoiceAssistantModalOpen(true);
  };

  const handleTriggerDriverAiEvent = (eventType: AutomationTriggerEventType) => {
    if (!activeStop) return;
    setIsCallingAiVoice(true);

    setTimeout(() => {
      setIsCallingAiVoice(false);
      const generatedLog = triggerEventDrivenAiRule(eventType, activeStop.trackingNumber);
      if (generatedLog) {
        addToast('success', 'Llamada de Voz AI Disparada', `La IA está comunicándose con ${activeStop.recipientName}. Respuesta: "${generatedLog.aiExtractedSummary}"`);
      } else {
        addToast('info', 'Evento Disparado', `Llamada completada para ${activeStop.trackingNumber}.`);
      }
    }, 1200);
  };

  const handleSendDriverMaskedMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverChatMsg.trim() || !activeStop) return;

    sendZernioMessage({
      channel: 'whatsapp',
      senderRole: 'driver',
      senderName: currentRoute.driverName,
      senderMaskedId: `Driver ${currentRoute.driverName} (GoPaq Relay #8831)`,
      recipientMaskedId: `${activeStop.recipientName} (Destinatario • ${activeStop.trackingNumber})`,
      text: driverChatMsg.trim(),
      trackingNumber: activeStop.trackingNumber,
      sentiment: 'positive'
    });

    setDriverChatMsg('');
    addToast('success', 'Mensaje Enviado por WhatsApp Oficial', 'El cliente recibió tu notificación sin exponer tu teléfono personal.');
  };

  const handleSaveSignature = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    addToast('success', 'Firma Capturada', 'La firma digital del cliente fue registrada.');
  };

  const handleSubmitPOD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStop) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowPrecise = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    completeStopPOD(
      activeStop.id,
      activeStop.trackingNumber,
      signatureUrl || 'https://upload.wikimedia.org/wikipedia/commons/f/fa/John_Hancock_signature.svg',
      photoUrl || undefined,
      codAmountCollected > 0 ? codAmountCollected : undefined
    );

    // Register transaction in sync outbox ledger
    const newTx: SyncTransaction = {
      id: `tx-pod-${Date.now()}`,
      type: 'pod_submission',
      trackingNumber: activeStop.trackingNumber,
      recipientName: recipientName || activeStop.recipientName,
      stopId: activeStop.id,
      routeId: currentRoute.id,
      timestamp: nowTime,
      status: isOnline ? 'synced' : 'pending',
      retryCount: 0,
      lastAttempt: isOnline ? nowPrecise : null,
      responseCode: isOnline ? 200 : undefined,
      networkLatencyMs: isOnline ? Math.floor(Math.random() * 110) + 65 : undefined,
      payload: {
        recipientName: recipientName || activeStop.recipientName,
        recipientDni,
        signatureUrl: signatureUrl || undefined,
        photoUrl: photoUrl || undefined,
        codAmountCollected
      }
    };

    setSyncTransactions((prev) => [newTx, ...prev]);

    if (!isOnline) {
      addToast(
        'warning',
        'POD Guardado en Outbox Local',
        `Sin conexión a internet. La guía ${activeStop.trackingNumber} se enviará automáticamente al reconectarse.`
      );
    } else {
      addToast(
        'success',
        'Entrega Sincronizada con Central',
        `POD y firma de ${activeStop.recipientName} confirmados en servidor GoPaq.`
      );
    }

    setIsPodModalOpen(false);
    setActiveStop(null);
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStop) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nowPrecise = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    triggerEventDrivenAiRule('delivery_failed_absent', activeStop.trackingNumber);

    // Register incident in sync outbox ledger
    const newTx: SyncTransaction = {
      id: `tx-inc-${Date.now()}`,
      type: 'incident_report',
      trackingNumber: activeStop.trackingNumber,
      recipientName: activeStop.recipientName,
      stopId: activeStop.id,
      routeId: currentRoute.id,
      timestamp: nowTime,
      status: isOnline ? 'synced' : 'pending',
      retryCount: 0,
      lastAttempt: isOnline ? nowPrecise : null,
      responseCode: isOnline ? 200 : undefined,
      networkLatencyMs: isOnline ? Math.floor(Math.random() * 120) + 70 : undefined,
      payload: {
        incidentReason,
        incidentNotes
      }
    };

    setSyncTransactions((prev) => [newTx, ...prev]);

    setIsIncidentModalOpen(false);
    addToast(
      'info',
      'Incidencia Reportada',
      `La parada fue marcada como "${incidentReason}" y registrada en el outbox.`
    );
  };

  const openNavigation = (address: string) => {
    addToast('info', 'Abriendo Navegador', `Iniciando ruta GPS hacia ${address}`);
  };

  const stopMessages = zernioMessages.filter(
    (m) => activeStop && m.trackingNumber === activeStop.trackingNumber
  );

  const stopAiLogs = automationLogs.filter(
    (l) => activeStop && l.trackingNumber === activeStop.trackingNumber
  );

  const unreadPushCount = driverNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200 dark:border-slate-800 relative">
      {/* Floating In-App Push Banner */}
      <DriverPushBanner
        notification={activePushBanner}
        onClose={() => setActivePushBanner(null)}
        onAccept={handleAcceptPushNotification}
        onViewDetails={(notif) => {
          setActivePushBanner(null);
          setIsNotifCenterOpen(true);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Mobile Top Header */}
      <header className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoPaqLogo size="sm" showSlogan={false} />
            <div>
              <h1 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>GoPaq Driver</span>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </h1>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentRoute.routeCode} • {currentRoute.driverName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Notification Bell with Badge */}
            <button
              onClick={() => setIsNotifCenterOpen(true)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 relative hover:bg-slate-200"
              title="Centro de Notificaciones Push"
            >
              <Bell className="w-4 h-4" />
              {(unreadPushCount > 0 || pendingOfflineQueue.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadPushCount + pendingOfflineQueue.length}
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                addToast('info', soundEnabled ? 'Sonido Silenciado' : 'Sonido Activado', soundEnabled ? 'Las alertas push no emitirán tono.' : 'Las alertas push emitirán sonido.');
              }}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              title={soundEnabled ? 'Silenciar Alertas' : 'Activar Sonido de Alertas'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Exit to Super Admin */}
            <button
              onClick={() => setCurrentSection('super-admin')}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500"
              title="Salir a Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Driver Connection Bar (isOnline switch, sync health pill & simulator launcher) */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Online / Offline Status Toggle Button */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-xs ${
              isOnline
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-400/30'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/30'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[11px]">En Línea</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px]">Offline</span>
              </>
            )}
          </button>

          {/* Sync Health Indicator Pill */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl font-bold transition-all shadow-xs text-[11px] ${
              syncHealthMetrics.statusLevel === 'healthy'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                : syncHealthMetrics.statusLevel === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 animate-pulse'
                : syncHealthMetrics.statusLevel === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Abrir Registro de Salud de Sincronización"
          >
            <Activity className={`w-3.5 h-3.5 ${syncHealthMetrics.failedCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
            <span>{syncHealthMetrics.healthScore}% Sync</span>
            {syncHealthMetrics.failedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-extrabold ml-0.5 animate-pulse">
                {syncHealthMetrics.failedCount}
              </span>
            )}
          </button>

          {/* Dispatch Push Simulator Launcher */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 text-[11px]"
          >
            <Zap className="w-3 h-3 text-indigo-500" />
            <span>Simulador</span>
          </button>
        </div>
      </header>

      {/* Offline Status Alert Banner (Shown when isOnline === false) */}
      {!isOnline && (
        <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-300 px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-[11px]">Modo Desconectado / En Pausa</p>
              <p className="text-[10px] opacity-85">
                {pendingOfflineQueue.length > 0
                  ? `${pendingOfflineQueue.length} cambios de ruta retenidos en cola.`
                  : 'Las notificaciones se guardarán en cola.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncOfflineQueue}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" />
            Reconectar
          </button>
        </div>
      )}

      {/* Main Delivery Stops Feed */}
      <main className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Route Summary Banner */}
        <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              {currentRoute.name}
            </span>
            <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full">
              {currentRoute.completedStops}/{currentRoute.totalStops} Paradas
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-indigo-100 pt-1 border-t border-indigo-500/50">
            <span>COD Total: <strong>{formatMoney(currentRoute.totalCodAmount)}</strong></span>
            <span>Recolectado: <strong>{formatMoney(currentRoute.collectedCodAmount)}</strong></span>
          </div>
        </div>

        {/* Stops Cards */}
        {currentRoute.stops.map((stop, idx) => {
          const isDone = stop.status === 'completed';
          const hasAiLog = automationLogs.some((l) => l.trackingNumber === stop.trackingNumber);
          const isRecentlyAdded = highlightedStopTracking === stop.trackingNumber;

          const stopSyncFailed = syncTransactions.find(
            (t) => (t.stopId === stop.id || t.trackingNumber === stop.trackingNumber) && t.status === 'failed'
          );
          const stopSyncPending = syncTransactions.find(
            (t) => (t.stopId === stop.id || t.trackingNumber === stop.trackingNumber) && t.status === 'pending'
          );
          const isRetryingThisStop = stopSyncFailed && (retryingTxId === stopSyncFailed.id || stopSyncFailed.status === 'retrying');

          return (
            <div
              key={stop.id}
              className={`p-3.5 rounded-2xl border transition-all relative ${
                stopSyncFailed
                  ? 'ring-2 ring-rose-400 bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  : isRecentlyAdded
                  ? 'ring-2 ring-emerald-500 shadow-lg bg-emerald-50/20 dark:bg-emerald-950/30'
                  : isDone
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {isRecentlyAdded && (
                <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center gap-1 shadow-md animate-bounce">
                  <Flame className="w-2.5 h-2.5" />
                  <span>¡NUEVA PARADA ASIGNADA!</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    stopSyncFailed
                      ? 'bg-rose-600 text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {stop.recipientName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Guía: {stop.trackingNumber} • {stop.contactRole ? stop.contactRole.toUpperCase() : 'DESTINATARIO'}
                    </span>
                  </div>
                </div>

                {isDone ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                    Entregado ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
                    {stop.estimatedArrival}
                  </span>
                )}
              </div>

              <div className="mt-2.5 text-slate-600 dark:text-slate-300 text-xs flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{stop.address}</span>
              </div>

              {/* Stop Sync Failed Callout with direct retry button */}
              {stopSyncFailed && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs space-y-1.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-[11px] text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Fallo de Sincronización en Central
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-bold">
                      {stopSyncFailed.retryCount} reintentos
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono pl-4">
                    {stopSyncFailed.errorMessage || 'HTTP 504 Gateway Timeout'}
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => setIsSyncModalOpen(true)}
                      className="text-[10px] text-rose-700 dark:text-rose-400 underline font-semibold hover:text-rose-900"
                    >
                      Ver en outbox →
                    </button>
                    <button
                      onClick={() => handleRetrySingleTransaction(stopSyncFailed.id)}
                      disabled={isRetryingThisStop}
                      className={`px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all ${
                        isRetryingThisStop ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      <RotateCw className={`w-3 h-3 ${isRetryingThisStop ? 'animate-spin' : ''}`} />
                      <span>{isRetryingThisStop ? 'Reintentando...' : 'Reintentar Parada'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stop Sync Pending Callout */}
              {stopSyncPending && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Guardado localmente (En cola de envío)</span>
                  </div>
                  <button
                    onClick={() => handleRetrySingleTransaction(stopSyncPending.id)}
                    className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                </div>
              )}

              {stop.codAmount && stop.codAmount > 0 && (
                <div className="mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-between border border-amber-200 dark:border-amber-900/40">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Cobro COD:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatMoney(stop.codAmount)}
                  </span>
                </div>
              )}

              {/* Latest AI Event Note if available */}
              {hasAiLog && (
                <div className="mt-2.5 p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-[11px] text-violet-900 dark:text-violet-200 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-semibold truncate max-w-[240px]">
                    <Sparkles className="w-3 h-3 text-violet-600 shrink-0" />
                    {automationLogs.find((l) => l.trackingNumber === stop.trackingNumber)?.aiExtractedSummary}
                  </span>
                  <span className="text-[10px] text-violet-600 font-bold">Voz AI ✓</span>
                </div>
              )}

              {!isDone && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openNavigation(stop.address)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 text-[11px] font-semibold"
                    >
                      <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Waze / GPS</span>
                    </button>

                    <button
                      onClick={() => handleOpenMaskedChat(stop)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1 text-[11px] font-bold"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleOpenPOD(stop, true)}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 text-[11px] font-bold shadow-xs transition-all"
                      title="Escanear etiqueta con cámara y registrar entrega"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Escanear POD</span>
                    </button>
                  </div>

                  {/* AI Quick Actions Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenAiVoiceAssistant(stop)}
                      className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center justify-center gap-1 text-[11px] font-bold"
                    >
                      <Bot className="w-3.5 h-3.5 text-violet-600" />
                      <span>Asistente de Voz AI</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveStop(stop);
                        setIsIncidentModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1 text-[11px] font-semibold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reportar Problema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Driver Notification Center Drawer Modal */}
      <DriverNotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notifications={driverNotifications}
        pendingOfflineQueue={pendingOfflineQueue}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        onSyncOfflineQueue={handleSyncOfflineQueue}
        onMarkAllAsRead={() => {
          setDriverNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          addToast('success', 'Notificaciones Leídas', 'Todas las alertas fueron marcadas como leídas.');
        }}
        onClearHistory={() => {
          setDriverNotifications([]);
          addToast('info', 'Historial Limpio', 'Se borró el historial de notificaciones.');
        }}
        onAcceptNotification={handleAcceptPushNotification}
        onViewStop={(tracking) => {
          setHighlightedStopTracking(tracking);
          addToast('info', 'Parada Enfocada', `Ubicada guía ${tracking} en tu lista.`);
        }}
      />

      {/* Driver Dispatch Simulator Modal */}
      <DriverDispatchSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        onTriggerPushEvent={handleSimulatePushEvent}
      />

      {/* AI Voice Assistant Modal for Driver */}
      <Modal
        isOpen={isAiVoiceAssistantModalOpen}
        onClose={() => setIsAiVoiceAssistantModalOpen(false)}
        title={`Asistente Telefónico de Voz con IA`}
        subtitle={`Destinatario: ${activeStop?.recipientName} (${activeStop?.trackingNumber})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-violet-600" />
              Llamada Telefónica Autónoma desde Línea Oficial GoPaq
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Selecciona una acción y la IA llamará de inmediato al cliente, conversará con él en español dominicano y te mostrará el resultado en tu pantalla.
            </p>
          </div>

          <div className="space-y-2">
            <button
              disabled={isCallingAiVoice}
              onClick={() => handleTriggerDriverAiEvent('driver_arrived')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/40 flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <PhoneCall className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">1. &quot;Ya estoy afuera / Llegué a la dirección&quot;</div>
                  <div className="text-[11px] text-slate-500">Llama al cliente para que salga a recibir o indique recepción.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-600">Llamar →</span>
            </button>

            <button
              disabled={isCallingAiVoice}
              onClick={() => handleTriggerDriverAiEvent('driver_needs_reference')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/40 flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">2. &quot;Necesito referencia de la casa o calle&quot;</div>
                  <div className="text-[11px] text-slate-500">Pide puntos de referencia visuales (color, negocio cercano, timbre).</div>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-600">Llamar →</span>
            </button>

            <button
              disabled={isCallingAiVoice}
              onClick={() => handleTriggerDriverAiEvent('driver_no_response')}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/40 flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">3. &quot;No responde mensajes / Insistir por voz&quot;</div>
                  <div className="text-[11px] text-slate-500">Llamada urgente con fallback automático a WhatsApp y SMS.</div>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-600">Llamar →</span>
            </button>

            {activeStop?.codAmount && activeStop.codAmount > 0 && (
              <button
                disabled={isCallingAiVoice}
                onClick={() => handleTriggerDriverAiEvent('approaching_cod_delivery')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/40 flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">4. Recordar Pago COD ({formatMoney(activeStop.codAmount)})</div>
                    <div className="text-[11px] text-slate-500">Avisa al cliente tener efectivo exacto listo antes de llegar.</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-violet-600">Llamar →</span>
              </button>
            )}
          </div>

          {/* Previous AI logs for this stop */}
          {stopAiLogs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h5 className="font-bold text-slate-900 dark:text-white">Últimas Respuestas del Cliente vía IA:</h5>
              {stopAiLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-violet-600">
                    <span>{log.ruleName}</span>
                    <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Respuesta:</strong> &quot;{log.customerSpeechResponse || log.aiExtractedSummary}&quot;
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setIsAiVoiceAssistantModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Masked WhatsApp Relay Chat Modal */}
      <Modal
        isOpen={isMaskedChatOpen}
        onClose={() => setIsMaskedChatOpen(false)}
        title={`WhatsApp Relay Oficial GoPaq`}
        subtitle={`Canal Seguro: ${activeStop?.recipientName} (${activeStop?.contactRole?.toUpperCase() || 'DESTINATARIO'})`}
      >
        <div className="space-y-3 text-xs">
          {/* Privacy Header */}
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Línea GoPaq +1 (809) 555-7271:</strong> Tu número privado no se muestra al cliente.
            </span>
          </div>

          {/* Quick Audio Call Trigger */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">¿El cliente no responde mensajes?</span>
            <button
              onClick={() => {
                if (activeStop) triggerVoiceBotCall(activeStop.trackingNumber);
                setIsMaskedChatOpen(false);
              }}
              className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Phone className="w-3 h-3" />
              <span>Llamar con Voice Bot AI</span>
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div className="h-64 overflow-y-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            {stopMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                <Bot className="w-8 h-8 text-slate-300 mb-2" />
                <p>No hay mensajes en este hilo aún.</p>
                <p className="text-[10px] mt-1">Escribe abajo para contactar al cliente por WhatsApp oficial.</p>
              </div>
            ) : (
              stopMessages.map((msg) => {
                const isMe = msg.senderRole === 'driver';
                const isAi = msg.senderRole === 'ai_agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl text-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : isAi
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-200 border border-violet-200 dark:border-violet-800 rounded-bl-none'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none'
                      }`}
                    >
                      <div className="text-[10px] font-bold opacity-75 mb-0.5">
                        {isMe ? 'Tú (Conductor)' : msg.senderName}
                      </div>
                      <p>{msg.text}</p>
                      <div className="text-[9px] opacity-60 text-right mt-1">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendDriverMaskedMsg} className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe un mensaje al cliente..."
              value={driverChatMsg}
              onChange={(e) => setDriverChatMsg(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
            />
            <Button variant="primary" size="sm" type="submit">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </Modal>

      {/* Proof of Delivery (POD) Modal */}
      <Modal
        isOpen={isPodModalOpen}
        onClose={() => {
          setIsPodModalOpen(false);
          setIsPodCameraOcrOpen(false);
        }}
        title="Prueba de Entrega (POD) & Escaneo OCR"
        subtitle={`Guía: ${activeStop?.trackingNumber} • ${activeStop?.recipientName}`}
      >
        <div className="space-y-4">
          {/* Camera OCR Scanner Component (Toggleable / Inline) */}
          {isPodCameraOcrOpen ? (
            <div className="space-y-2">
              <DriverPodCameraScanner
                activeStop={activeStop}
                onApplyOcrData={handleApplyOcrData}
                onClose={() => setIsPodCameraOcrOpen(false)}
                isInline={true}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {ocrVerificationResult ? (
                /* OCR Verified Banner */
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Foto de la Etiqueta"
                        className="w-12 h-12 object-cover rounded-xl border-2 border-emerald-400 shadow-xs"
                      />
                    ) : (
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                          Etiqueta Escaneada por Cámara
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold">
                          {ocrVerificationResult.confidence}% Certeza
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono block">
                        Guía: <strong className="text-emerald-700 dark:text-emerald-300">{ocrVerificationResult.trackingNumber}</strong> • DNI: {ocrVerificationResult.recipientDni || 'Registrado'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPodCameraOcrOpen(true)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 shadow-xs transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-escanear</span>
                  </button>
                </div>
              ) : (
                /* OCR Promotion Banner */
                <div className="p-3.5 bg-linear-to-r from-indigo-50 to-indigo-100/70 dark:from-indigo-950/50 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <Camera className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                          Escanear Etiqueta con Cámara (OCR)
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-600 text-white rounded-full font-bold">
                          IA Vision
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Extrae automáticamente Guía, Cédula, Nombre y foto del paquete
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPodCameraOcrOpen(true)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap active:scale-98"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Abrir Cámara</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitPOD} className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Nombre de Quien Recibe
                </label>
                {ocrVerificationResult?.recipientName && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Autocompletado por OCR
                  </span>
                )}
              </div>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Cédula / Documento de Identidad (DNI)
                </label>
                {ocrVerificationResult?.recipientDni && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Autocompletado por OCR
                  </span>
                )}
              </div>
              <input
                type="text"
                value={recipientDni}
                onChange={(e) => setRecipientDni(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                placeholder="001-XXXXXXX-X"
              />
            </div>

            {/* Photo Preview Attachment */}
            {photoUrl && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={photoUrl}
                    alt="Evidencia POD"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      Evidencia Fotográfica de Entrega
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Foto Capturada Lista para el Reporte
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPodCameraOcrOpen(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Cambiar Foto
                </button>
              </div>
            )}

            {activeStop?.codAmount && activeStop.codAmount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span>Monto COD a Cobrar:</span>
                  <span>{formatMoney(activeStop.codAmount)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-0.5">
                    Monto Recolectado en Efectivo:
                  </label>
                  <input
                    type="number"
                    value={codAmountCollected}
                    onChange={(e) => setCodAmountCollected(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold"
                    required
                  />
                </div>
              </div>
            )}

            {/* Signature Pad */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Firma Digital en Pantalla
              </label>
              <SignaturePad onSave={handleSaveSignature} />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Confirmar Entrega y Generar POD
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Incident / Problem Modal */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        title="Reportar Incidencia de Entrega"
        subtitle={`Guía: ${activeStop?.trackingNumber}`}
      >
        <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Motivo del Problema
            </label>
            <select
              value={incidentReason}
              onChange={(e) => setIncidentReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
            >
              <option value="Cliente Ausente / No Contesta">Cliente Ausente / No Contesta</option>
              <option value="Dirección Incompleta o Errónea">Dirección Incompleta o Errónea</option>
              <option value="Cliente Rechazó el Paquete">Cliente Rechazó el Paquete</option>
              <option value="Cliente no tenía el efectivo COD">Cliente no tenía el efectivo COD</option>
              <option value="Zona Inaccesible o de Alto Riesgo">Zona Inaccesible o de Alto Riesgo</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Detalle / Observaciones
            </label>
            <textarea
              rows={3}
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Escribe detalles adicionales..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsIncidentModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
              Guardar Incidencia & Disparar IA
            </Button>
          </div>
        </form>
      </Modal>

      {/* Driver Sync Health & Outbox Transaction Ledger Modal */}
      <DriverSyncHealthModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        metrics={syncHealthMetrics}
        transactions={syncTransactions}
        onRetrySingleTransaction={handleRetrySingleTransaction}
        onRetryAllFailed={handleRetryAllFailed}
        onForceSyncAll={handleForceSyncAll}
        onSimulateNewOfflineTransaction={handleSimulateNewOfflineTransaction}
        isRetryingAll={isRetryingSync}
        retryingId={retryingTxId}
      />
    </div>
  );
};
