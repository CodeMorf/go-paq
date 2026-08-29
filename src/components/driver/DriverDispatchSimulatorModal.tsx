import React, { useState } from 'react';
import { 
  Radio, 
  Play, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  Clock, 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Modal, Button } from '../ui/DesignSystem';
import { DriverPushNotificationType } from '../../types/driverNotificationTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  onTriggerPushEvent: (type: DriverPushNotificationType, customData?: Record<string, any>) => void;
}

export const DriverDispatchSimulatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isOnline,
  onToggleOnline,
  onTriggerPushEvent
}) => {
  const [selectedEventType, setSelectedEventType] = useState<DriverPushNotificationType>('stop_added');
  const [customRecipient, setCustomRecipient] = useState('Lic. Patricia Holguín');
  const [customAddress, setCustomAddress] = useState('Av. Roberto Pastoriza #312, Ens. Naco');
  const [customCod, setCustomCod] = useState<number>(3450);
  const [customReason, setCustomReason] = useState('Cliente solicitó reprogramación por viaje.');

  const handleSimulate = () => {
    onTriggerPushEvent(selectedEventType, {
      recipientName: customRecipient,
      address: customAddress,
      codAmount: customCod,
      reason: customReason
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulador de Despacho & Notificaciones Push"
      subtitle="Generador de eventos en tiempo real para validar filtrado de 'isOnline'"
    >
      <div className="space-y-4 text-xs">
        {/* Status Mode Indicator */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${
          isOnline 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            )}
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">
                Estado Actual del Chofer: {isOnline ? 'En Línea (Online)' : 'Fuera de Línea (Offline)'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isOnline 
                  ? 'Las alertas se mostrarán como banners emergentes con sonido.' 
                  : 'Las alertas serán interceptadas y puestas en cola hasta volver En Línea.'}
              </p>
            </div>
          </div>

          <Button
            variant={isOnline ? 'secondary' : 'primary'}
            size="sm"
            onClick={onToggleOnline}
            className="text-[11px] font-bold"
          >
            {isOnline ? 'Poner Offline' : 'Poner Online'}
          </Button>
        </div>

        {/* Event Type Selection */}
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
            Seleccionar Tipo de Cambio de Ruta:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'stop_added',
                label: 'Agregar Parada Express',
                desc: 'Nueva parada urgente en la ruta con cobro COD.',
                icon: Plus,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
              },
              {
                id: 'stop_cancelled',
                label: 'Cancelar Parada Activa',
                desc: 'Cliente o central canceló una entrega asignada.',
                icon: Trash2,
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950'
              },
              {
                id: 'route_reordered',
                label: 'Reordenar por Tráfico AI',
                desc: 'Optimización de secuencia por congestión vial.',
                icon: ArrowUpDown,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
              },
              {
                id: 'priority_changed',
                label: 'Cambio de Prioridad VIP',
                desc: 'Parada elevada a entrega urgente antes de hora.',
                icon: Clock,
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950'
              },
              {
                id: 'dispatcher_broadcast',
                label: 'Aviso de Despachador',
                desc: 'Comunicado general a la flota en campo.',
                icon: MessageSquare,
                color: 'text-violet-600 bg-violet-50 dark:bg-violet-950'
              }
            ].map((evt) => {
              const Icon = evt.icon;
              const isSelected = selectedEventType === evt.id;
              return (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventType(evt.id as DriverPushNotificationType)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <div className={`p-1 rounded-lg ${evt.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{evt.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    {evt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inputs based on type */}
        {selectedEventType === 'stop_added' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre de Destinatario
              </label>
              <input
                type="text"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dirección en Santo Domingo
              </label>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                Cobro COD (RD$)
              </label>
              <input
                type="number"
                value={customCod}
                onChange={(e) => setCustomCod(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}

        {(selectedEventType === 'stop_cancelled' || selectedEventType === 'route_reordered') && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Motivo / Detalle Operativo
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={handleSimulate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            Disparar Notificación Push
          </Button>
        </div>
      </div>
    </Modal>
  );
};
