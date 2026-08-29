import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AutomationRule, AiAutomationExecutionLog, AutomationTriggerEventType } from '../../types/aiAutomationTypes';
import { 
  Bot, 
  PhoneCall, 
  PhoneForwarded, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation, 
  MessageSquare, 
  Smartphone, 
  Zap, 
  ChevronRight, 
  Search, 
  Radio, 
  Flame, 
  Mic, 
  Sliders, 
  Check, 
  Plus, 
  Trash2,
  DollarSign,
  MapPin,
  RefreshCw,
  Send
} from 'lucide-react';
import { Card, Button, Modal, StatusBadge } from '../ui/DesignSystem';

interface Props {
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const AiEventAutomationStudio: React.FC<Props> = ({ onToast: customOnToast }) => {
  const { 
    automationRules, 
    setAutomationRules, 
    automationLogs, 
    triggerEventDrivenAiRule,
    shipments,
    formatMoney,
    addToast
  } = useApp();

  const onToast = customOnToast || addToast;

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'simulator' | 'logs'>('rules');
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'proximity' | 'arrival' | 'incident' | 'cod'>('all');

  // Simulator State
  const [simulatedEvent, setSimulatedEvent] = useState<AutomationTriggerEventType>('driver_approaching_recipient');
  const [simulatedTracking, setSimulatedTracking] = useState('NX-8924-DO');
  const [simulatedDistanceKm, setSimulatedDistanceKm] = useState(0.8);
  const [simulatedDriverWaitSec, setSimulatedDriverWaitSec] = useState(35);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResultLog, setSimulationResultLog] = useState<AiAutomationExecutionLog | null>(null);

  // Selected Log for detail modal
  const [selectedLogDetail, setSelectedLogDetail] = useState<AiAutomationExecutionLog | null>(null);

  const toggleRuleEnabled = (id: string) => {
    setAutomationRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.enabled;
          onToast(next ? 'success' : 'info', 'Regla de Automatización', `Regla "${r.name}" ${next ? 'activada' : 'pausada'}.`);
          return { ...r, enabled: next };
        }
        return r;
      })
    );
  };

  const handleSaveRule = (updated: AutomationRule) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setIsEditModalOpen(false);
    onToast('success', 'Regla Guardada', `Script de Voz AI y parámetros de la regla guardados.`);
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationResultLog(null);

    setTimeout(() => {
      const generatedLog = triggerEventDrivenAiRule(simulatedEvent, simulatedTracking, {
        simulatedDistanceKm,
        simulatedWaitSec: simulatedDriverWaitSec
      });

      setIsSimulating(false);
      if (generatedLog) {
        setSimulationResultLog(generatedLog);
        onToast('success', 'Disparo de Evento Exitoso', `La IA ejecutó la regla "${generatedLog.ruleName}". Conexión telefónica de voz y actualización de Driver App completadas.`);
      } else {
        onToast('warning', 'Sin Reglas Activas', `No se encontró una regla habilitada para el evento seleccionado.`);
      }
    }, 1500);
  };

  const filteredRules = automationRules.filter((r) => {
    if (categoryFilter === 'all') return true;
    return r.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-violet-800/40 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30 text-[10px] font-bold uppercase tracking-wider">
                Motor de Eventos en Tiempo Real
              </span>
              <span className="text-xs text-emerald-300 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> {automationRules.filter((r) => r.enabled).length} Reglas Activas
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Event-Driven AI Automation: Conductor & Llamadas Telefónicas de Voz
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl mt-0.5">
              Sistema de eventos que dispara llamadas de voz autónomas mediante IA (y canales fallback WhatsApp/SMS) basadas en la telemetría del driver, proximidad GPS, llegada a sitio, cobro COD y solicitudes de referencia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'rules'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reglas Activas ({automationRules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeSubTab === 'simulator'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3" /> Simulador de Telemetría
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeSubTab === 'logs'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Historial de Disparos ({automationLogs.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RULES MATRIX */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Todas las Reglas
              </button>
              <button
                onClick={() => setCategoryFilter('proximity')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'proximity'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                📍 Proximidad GPS (&lt;1 KM)
              </button>
              <button
                onClick={() => setCategoryFilter('arrival')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'arrival'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🏢 Llegada a Sitio & Espera
              </button>
              <button
                onClick={() => setCategoryFilter('cod')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'cod'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                💵 Cobro COD en Efectivo
              </button>
              <button
                onClick={() => setCategoryFilter('incident')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === 'incident'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚠️ Incidencias & Referencias
              </button>
            </div>

            <span className="text-xs text-slate-500">
              Mostrando {filteredRules.length} de {automationRules.length} reglas configuradas
            </span>
          </div>

          {/* Rules Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRules.map((rule) => (
              <Card 
                key={rule.id}
                className={`relative transition-all border ${
                  rule.enabled 
                    ? 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-violet-500/50' 
                    : 'border-dashed border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                {/* Status Toggle & Category Badge */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${
                      rule.category === 'proximity' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' :
                      rule.category === 'arrival' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' :
                      rule.category === 'cod' ? 'bg-amber-50 dark:bg-amber-950 text-amber-600' :
                      'bg-rose-50 dark:bg-rose-950 text-rose-600'
                    }`}>
                      <PhoneCall className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        {rule.triggerEvent}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRuleEnabled(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                {/* Rule Title & Description */}
                <div className="py-2.5 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {rule.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {rule.description}
                  </p>
                </div>

                {/* Voice Script Preview */}
                <div className="p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/30 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-violet-700 dark:text-violet-300 font-bold text-[10px]">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3 text-violet-600" /> Script de Voz AI
                    </span>
                    <span className="text-[10px] bg-violet-200/60 dark:bg-violet-900/60 px-1.5 py-0.2 rounded font-mono">
                      {rule.primaryAction === 'call_recipient_voice_ai' ? 'Llama a Destinatario' : 'Llama a Remitente'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2 text-[10px]">
                    &quot;{rule.voiceAiScriptPrompt}&quot;
                  </p>
                </div>

                {/* Fallback & Metrics */}
                <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span>Fallback:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {rule.fallbackAction === 'send_whatsapp' ? 'WhatsApp (+30s)' : 'SMS (+60s)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{rule.executionCount} ejecuciones</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full text-xs"
                  >
                    <Sliders className="w-3 h-3 mr-1 text-violet-600" /> Editar Script & Disparador
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TELEMETRY SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-600">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Simulador de Eventos de Driver & Telemetría</h4>
                <p className="text-[11px] text-slate-500">Simula disparos en vivo para verificar el comportamiento de la IA y notificaciones del chofer</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Evento de Telemetría o Acción del Driver</label>
                <select
                  value={simulatedEvent}
                  onChange={(e) => setSimulatedEvent(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="driver_approaching_recipient">📍 Driver Cerca del Destinatario (&lt; 1 KM)</option>
                  <option value="driver_approaching_sender">📦 Driver Cerca del Remitente / Recogida (&lt; 1 KM)</option>
                  <option value="driver_arrived">🏢 Driver Marcó &quot;Llegué a la Dirección&quot;</option>
                  <option value="driver_no_response">⏳ Driver Marcó &quot;Cliente No Responde&quot;</option>
                  <option value="driver_needs_reference">❓ Driver Solicitó &quot;Referencia de Dirección&quot;</option>
                  <option value="approaching_cod_delivery">💵 Entrega COD (&lt; 2 KM con cobro en efectivo)</option>
                  <option value="delivery_failed_absent">⚠️ Driver Marcó &quot;Cliente Ausente&quot; (Reprogramar)</option>
                  <option value="pickup_not_ready">📦 Driver Marcó &quot;Paquete no está listo&quot;</option>
                  <option value="route_delayed">⏰ Retraso de Ruta (&gt; 20 min respecto a ETA)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Guía / Envío de Prueba</label>
                <select
                  value={simulatedTracking}
                  onChange={(e) => setSimulatedTracking(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.trackingNumber}>
                      {s.trackingNumber} - {s.destination.name} ({s.destination.city}) {s.codAmount ? `[COD RD$ ${s.codAmount}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Distancia GPS Simulada (KM)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    value={simulatedDistanceKm}
                    onChange={(e) => setSimulatedDistanceKm(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400 block mb-1">Tiempo de Espera en Sitio (Segundos)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="300"
                    value={simulatedDriverWaitSec}
                    onChange={(e) => setSimulatedDriverWaitSec(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  loading={isSimulating}
                  onClick={runSimulation}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Disparar Evento en Vivo con IA
                </Button>
              </div>
            </div>
          </Card>

          {/* Simulation Output Card */}
          <Card className="space-y-4 bg-slate-900 text-white border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white">Consola de Ejecución & Conversación de Voz</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Pusher Event Stream</span>
            </div>

            {simulationResultLog ? (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-xs">Regla Ejecutada: {simulationResultLog.ruleName}</div>
                    <div className="text-[11px] text-emerald-300">
                      Llamada de voz AI completada con {simulationResultLog.personName} ({simulationResultLog.personPhone}).
                    </div>
                  </div>
                </div>

                {/* Call Transcript Box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1 font-bold text-violet-400">
                      <Mic className="w-3 h-3" /> Transcripción de Audio en Tiempo Real
                    </span>
                    <span>Duración: {simulationResultLog.durationSeconds || 24}s</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-200 text-xs">
                    {simulationResultLog.callRecordingTranscript}
                  </pre>
                </div>

                {/* Extracted Instruction for Driver */}
                <div className="p-3 rounded-xl bg-violet-950/60 border border-violet-800/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-violet-300 font-bold text-[11px]">
                    <Smartphone className="w-3.5 h-3.5" /> Notificación Inmediata en Driver App:
                  </div>
                  <p className="text-white text-xs font-semibold">
                    {simulationResultLog.driverMessageDelivered}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-slate-400 text-xs max-w-sm mx-auto">
                  Selecciona un evento y pulsa <strong>&quot;Disparar Evento en Vivo&quot;</strong> para observar la llamada autónoma, la captura de audio y el mensaje transmitido al chofer.
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: EXECUTION LOGS */}
      {activeSubTab === 'logs' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-600" />
                Historial de Disparos de IA & Interacción con Clientes
              </h4>
              <p className="text-[11px] text-slate-500">Registro auditado de llamadas telefónicas autónomas, transcripciones y confirmaciones</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{automationLogs.length} eventos registrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Hora / Fecha</th>
                  <th className="py-2.5 px-3">Regla / Evento</th>
                  <th className="py-2.5 px-3">Guía / Contacto</th>
                  <th className="py-2.5 px-3">Canal</th>
                  <th className="py-2.5 px-3">Resumen de Respuesta IA</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {automationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {log.ruleName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.triggerEvent}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {log.personName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.trackingNumber} • {log.targetPerson.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                        log.channelUsed === 'voice_ai' ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300' :
                        log.channelUsed === 'whatsapp' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {log.channelUsed === 'voice_ai' && <PhoneCall className="w-3 h-3" />}
                        {log.channelUsed === 'whatsapp' && <MessageSquare className="w-3 h-3" />}
                        {log.channelUsed === 'voice_ai' ? 'Voz AI' : log.channelUsed.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                        {log.aiExtractedSummary}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        log.status === 'fallback_triggered' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700'
                      }`}>
                        {log.status === 'completed' ? 'Completado ✓' : log.status === 'fallback_triggered' ? 'Fallback WhatsApp' : log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedLogDetail(log)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/40 text-violet-600 text-[11px] font-bold"
                      >
                        Ver Audio & Transcripción
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: EDIT AUTOMATION RULE */}
      {selectedRule && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Configurar Script de Voz AI: ${selectedRule.name}`}
          subtitle={`Evento: ${selectedRule.triggerEvent}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-900 dark:text-white block mb-1">Nombre de la Regla</label>
              <input
                type="text"
                value={selectedRule.name}
                onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 dark:text-white block mb-1">Descripción del Comportamiento</label>
              <input
                type="text"
                value={selectedRule.description}
                onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-900 dark:text-white flex items-center justify-between mb-1">
                <span>Script de Voz del Asistente Telefónico (Prompt de Voz)</span>
                <span className="text-[10px] text-violet-600 font-normal">Variables: {"{{NOMBRE_DESTINATARIO}}"}, {"{{NOMBRE_DRIVER}}"}, {"{{TRACKING}}"}, {"{{MONTO_COD}}"}</span>
              </label>
              <textarea
                rows={4}
                value={selectedRule.voiceAiScriptPrompt}
                onChange={(e) => setSelectedRule({ ...selectedRule, voiceAiScriptPrompt: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                La IA vocal de GoPaq sintetizará este mensaje con tono cordial y procesará las respuestas habladas en español dominicano.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">Canal de Fallback (Si no contesta)</label>
                <select
                  value={selectedRule.fallbackAction}
                  onChange={(e) => setSelectedRule({ ...selectedRule, fallbackAction: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <option value="send_whatsapp">Enviar WhatsApp Oficial</option>
                  <option value="send_sms">Enviar Mensaje SMS</option>
                  <option value="notify_driver_app">Solo Avisar a Driver App</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">Tiempo de Espera para Fallback</label>
                <select
                  value={selectedRule.fallbackAfterSeconds}
                  onChange={(e) => setSelectedRule({ ...selectedRule, fallbackAfterSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <option value={30}>30 Segundos</option>
                  <option value={45}>45 Segundos</option>
                  <option value={60}>60 Segundos</option>
                  <option value={90}>90 Segundos</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 dark:text-white block mb-1">Plantilla de Notificación para la App del Driver</label>
              <input
                type="text"
                value={selectedRule.driverNotificationTemplate}
                onChange={(e) => setSelectedRule({ ...selectedRule, driverNotificationTemplate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => handleSaveRule(selectedRule)}>
                Guardar Regla de Automatización
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: LOG DETAIL */}
      {selectedLogDetail && (
        <Modal
          isOpen={!!selectedLogDetail}
          onClose={() => setSelectedLogDetail(null)}
          title={`Detalle de Evento AI: ${selectedLogDetail.ruleName}`}
          subtitle={`Guía ${selectedLogDetail.trackingNumber} • Contacto: ${selectedLogDetail.personName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Número Marcado:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedLogDetail.personPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Canal Utilizado:</span>
                <span className="font-bold text-violet-600">{selectedLogDetail.channelUsed.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Duración de Llamada:</span>
                <span className="font-bold">{selectedLogDetail.durationSeconds || 20} Segundos</span>
              </div>
              <div>
                <span className="text-slate-400 block">Estado del Disparo:</span>
                <span className="font-bold text-emerald-600">{selectedLogDetail.status}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-violet-600" /> Transcripción de Audio Completa
              </h5>
              <div className="p-3 rounded-xl bg-slate-900 text-white font-sans text-xs whitespace-pre-wrap">
                {selectedLogDetail.callRecordingTranscript}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 space-y-1">
              <h5 className="font-bold text-violet-900 dark:text-violet-200 text-[11px]">
                Resumen Entregado a la App del Conductor:
              </h5>
              <p className="text-slate-700 dark:text-slate-300 text-xs">
                {selectedLogDetail.driverMessageDelivered}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLogDetail(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
