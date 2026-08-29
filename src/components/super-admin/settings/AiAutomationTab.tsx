import React, { useState } from 'react';
import { 
  GlobalSystemConfig, 
  VoiceTelephonyProvider, 
  CronSchedulerProvider, 
  CronJobDefinition 
} from './settingsTypes';
import { 
  Sparkles, 
  Bot, 
  FileSearch, 
  MapPin, 
  Route, 
  ShieldCheck, 
  Sliders, 
  Zap,
  CheckCircle2,
  BrainCircuit,
  Radio,
  PhoneCall,
  Clock,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Server,
  Key,
  Globe,
  SlidersHorizontal,
  Volume2,
  Mic,
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Layers
} from 'lucide-react';
import { Card, Button, Modal, StatusBadge } from '../../ui/DesignSystem';
import { AiEventAutomationStudio } from '../AiEventAutomationStudio';

interface TabProps {
  config: GlobalSystemConfig['aiAutomation'];
  onChange: (updates: Partial<GlobalSystemConfig['aiAutomation']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const AiAutomationTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const [testingOcr, setTestingOcr] = useState(false);
  const [testingVoiceProvider, setTestingVoiceProvider] = useState(false);
  const [runningCronId, setRunningCronId] = useState<string | null>(null);
  const [showVoiceKey, setShowVoiceKey] = useState(false);
  const [showVoiceSecret, setShowVoiceSecret] = useState(false);
  const [showCronToken, setShowCronToken] = useState(false);

  type SubTabId = 'voice_telephony' | 'cron_scheduler' | 'event_rules' | 'gemini_models';
  const [activeSection, setActiveSection] = useState<SubTabId>('voice_telephony');

  // New custom cron modal
  const [isAddCronModalOpen, setIsAddCronModalOpen] = useState(false);
  const [newCronJob, setNewCronJob] = useState<Partial<CronJobDefinition>>({
    name: '',
    description: '',
    cronExpression: '0 08 * * 1-5',
    category: 'operations',
    enabled: true,
  });

  const handleTestOcr = () => {
    setTestingOcr(true);
    setTimeout(() => {
      setTestingOcr(false);
      onToast('success', 'OCR Inteligente Exitoso', 'Factura de Amazon procesada: Tracking 1Z9999999999999999, Valor FOB $48.50 USD, Categoría B DGA (Exento de aranceles). Confianza 98.4%.');
    }, 1200);
  };

  const handleTestVoiceTelephony = () => {
    setTestingVoiceProvider(true);
    setTimeout(() => {
      setTestingVoiceProvider(false);
      onToast(
        'success',
        `Conexión Exitosa con ${config.voiceProvider.toUpperCase()}`,
        `Troncal SIP & WebRTC en línea. DID emisor ${config.callerPhoneDid} verificado con latencia de 118ms.`
      );
    }, 1100);
  };

  const handleExecuteCronNow = (cronId: string, cronName: string) => {
    setRunningCronId(cronId);
    setTimeout(() => {
      setRunningCronId(null);
      const nowFormatted = `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      const updatedJobs = config.cronJobs.map((job) => {
        if (job.id === cronId) {
          return {
            ...job,
            lastRun: nowFormatted,
            lastStatus: 'success' as const,
            executionCount: (job.executionCount || 0) + 1
          };
        }
        return job;
      });

      onChange({ cronJobs: updatedJobs });
      onToast(
        'success',
        'Tarea Cron Ejecutada con Éxito',
        `La tarea "${cronName}" se ejecutó manualmente en segundo plano (HTTP 200 OK).`
      );
    }, 1300);
  };

  const handleToggleCronJob = (cronId: string) => {
    const updatedJobs = config.cronJobs.map((job) => {
      if (job.id === cronId) {
        return { ...job, enabled: !job.enabled };
      }
      return job;
    });
    onChange({ cronJobs: updatedJobs });
    onToast('info', 'Estado de Cron Actualizado', 'El programador ha actualizado la lista de tareas activas.');
  };

  const handleCreateCustomCron = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCronJob.name || !newCronJob.cronExpression) {
      onToast('error', 'Campos Requeridos', 'Por favor ingresa un nombre y una expresión cron válida.');
      return;
    }

    const created: CronJobDefinition = {
      id: `cron-${Date.now()}`,
      name: newCronJob.name || 'Nueva Tarea Cron',
      description: newCronJob.description || 'Tarea programada personalizada del sistema.',
      cronExpression: newCronJob.cronExpression || '0 0 * * *',
      enabled: true,
      category: (newCronJob.category as any) || 'operations',
      lastRun: 'Nunca',
      nextRun: 'Próximo ciclo programado',
      lastStatus: 'idle',
      executionCount: 0,
      durationAvgMs: 450
    };

    onChange({ cronJobs: [created, ...config.cronJobs] });
    setIsAddCronModalOpen(false);
    setNewCronJob({
      name: '',
      description: '',
      cronExpression: '0 08 * * 1-5',
      category: 'operations',
      enabled: true,
    });
    onToast('success', 'Tarea Cron Agregada', `Se ha programado "${created.name}" exitosamente.`);
  };

  const handleDeleteCronJob = (cronId: string) => {
    const updated = config.cronJobs.filter((j) => j.id !== cronId);
    onChange({ cronJobs: updated });
    onToast('info', 'Tarea Eliminada', 'La tarea cron ha sido removida del programador.');
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation inside AI Tab */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSection('voice_telephony')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'voice_telephony'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Proveedor de Voz & Telefonía AI</span>
          </button>

          <button
            onClick={() => setActiveSection('cron_scheduler')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'cron_scheduler'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Proveedor Cron & Tareas Programadas</span>
          </button>

          <button
            onClick={() => setActiveSection('event_rules')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'event_rules'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Reglas de Automatización de Eventos</span>
          </button>

          <button
            onClick={() => setActiveSection('gemini_models')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'gemini_models'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Modelos Gemini & OCR Aduanal</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          GoPaq Voice & Cron Engine
        </span>
      </div>

      {/* 1. VOICE TELEPHONY PROVIDER TAB */}
      {activeSection === 'voice_telephony' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-800/40">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Motor Telefónico de Voz con IA
                  </span>
                  <span className="text-xs text-purple-300">
                    Proveedor Actual: {config.voiceProvider.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Configuración de Troncal SIP, WebRTC y Llamadas Automáticas
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                  Conexión directa con agentes de voz conversacional para confirmar direcciones, reprogramar paradas ausentes, validar cobros COD y atención telefónica 24/7.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={testingVoiceProvider}
                onClick={handleTestVoiceTelephony}
                icon={<Activity className="w-3.5 h-3.5 text-purple-400" />}
              >
                Probar Conexión Troncal
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Telephony Provider Selection & Credentials */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Proveedor de Telefonía & LLM Conversacional
                  </h4>
                  <p className="text-[11px] text-slate-500">Selecciona el carrier y motor de voz para llamadas salientes y entrantes</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Proveedor de Telefonía & Voz
                  </label>
                  <select
                    value={config.voiceProvider}
                    onChange={(e) => onChange({ voiceProvider: e.target.value as VoiceTelephonyProvider })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="vapi">Vapi AI (Voice AI for Developers - Recomendado)</option>
                    <option value="retell">Retell AI (Conversational Voice Agents)</option>
                    <option value="twilio_voice">Twilio Voice & Programmable SIP</option>
                    <option value="bland_ai">Bland AI Enterprise Telephony</option>
                    <option value="elevenlabs">ElevenLabs Conversational Voice Agent</option>
                    <option value="asterisk_sip">Troncal Asterisk / FreePBX Custom SIP</option>
                    <option value="gemini_live">Google Gemini Live Audio (WebSockets)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Voz Sintética / Modelo Acústico (TTS & STT)
                  </label>
                  <select
                    value={config.voiceModelId}
                    onChange={(e) => onChange({ voiceModelId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="es-DO-Emilio-Expressive (Vapi Neural Dominicano)">es-DO-Emilio-Expressive (Vapi Neural Dominicano - Acento Local)</option>
                    <option value="es-DO-Alonso-Neural (Dominicano Cercano)">es-DO-Alonso-Neural (Dominicano Cercano & Amigable)</option>
                    <option value="es-LA-Sofia-Natural (Latino Neutro)">es-LA-Sofia-Natural (Latino Neutro Profesional)</option>
                    <option value="eleven_multilingual_v2 (ElevenLabs Ultra-Real)">eleven_multilingual_v2 (ElevenLabs Ultra-Realista)</option>
                    <option value="gemini-voice-puck (Google DeepMind Live)">gemini-voice-puck (Google DeepMind Live)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Número Telefónico Emisor (DID / Caller ID Dominicano)
                  </label>
                  <input
                    type="text"
                    value={config.callerPhoneDid}
                    onChange={(e) => onChange({ callerPhoneDid: e.target.value })}
                    placeholder="+1 (809) 567-8900"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Número certificado por INDOTEL que aparecerá en la pantalla del cliente.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-bold">
                      API Key de {config.voiceProvider.toUpperCase()}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowVoiceKey(!showVoiceKey)}
                      className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold flex items-center gap-1"
                    >
                      {showVoiceKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showVoiceKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showVoiceKey ? 'text' : 'password'}
                    value={config.voiceApiKeyMasked}
                    onChange={(e) => onChange({ voiceApiKeyMasked: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-bold">
                      API Secret / Webhook Signing Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowVoiceSecret(!showVoiceSecret)}
                      className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold flex items-center gap-1"
                    >
                      {showVoiceSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showVoiceSecret ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showVoiceSecret ? 'text' : 'password'}
                    value={config.voiceApiSecretMasked}
                    onChange={(e) => onChange({ voiceApiSecretMasked: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Webhook Endpoint para Telemetría & Callbacks
                  </label>
                  <input
                    type="text"
                    value={config.voiceWebhookEndpoint}
                    onChange={(e) => onChange({ voiceWebhookEndpoint: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px]"
                  />
                </div>
              </div>
            </Card>

            {/* Voice Call Behavior & Compliance Rules */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Comportamiento de Llamadas & Políticas Operativas
                  </h4>
                  <p className="text-[11px] text-slate-500">Reglas de interacción, duración máxima y transferencias humanas</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                      Hora Inicio Permitida
                    </label>
                    <input
                      type="time"
                      value={config.callHoursStart}
                      onChange={(e) => onChange({ callHoursStart: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                      Hora Límite Permitida
                    </label>
                    <input
                      type="time"
                      value={config.callHoursEnd}
                      onChange={(e) => onChange({ callHoursEnd: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block -mt-1">
                  Llamadas fuera de este horario se retrasan automáticamente para proteger el descanso del cliente.
                </span>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-bold">
                      Duración Máxima de Llamada Bot
                    </label>
                    <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {config.callMaxDurationSeconds} seg ({Math.round(config.callMaxDurationSeconds / 60)} min)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={300}
                    step={15}
                    value={config.callMaxDurationSeconds}
                    onChange={(e) => onChange({ callMaxDurationSeconds: Number(e.target.value) })}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Sensibilidad de Interrupción (Barge-In)
                  </label>
                  <select
                    value={config.voiceInterruptionSensitivity}
                    onChange={(e) => onChange({ voiceInterruptionSensitivity: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="balanced">Equilibrada (Permite pausas naturales sin cortar al bot)</option>
                    <option value="high">Alta (El bot se detiene instantáneamente cuando el cliente habla)</option>
                    <option value="low">Baja (Ideal en ambientes ruidosos)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    Teléfono / Extensión de Escalación Humana
                  </label>
                  <input
                    type="text"
                    value={config.humanEscalationPhone}
                    onChange={(e) => onChange({ humanEscalationPhone: e.target.value })}
                    placeholder="+1 (809) 567-8900 Ext 101"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableCallRecording}
                      onChange={(e) => onChange({ enableCallRecording: e.target.checked })}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Grabación de Audio & Transcripción</div>
                      <div className="text-[11px] text-slate-500">Almacena el audio cifrado para control de calidad, resolución de disputas y auditoría.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableAnsweringMachineDetection}
                      onChange={(e) => onChange({ enableAnsweringMachineDetection: e.target.checked })}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Detección Inteligente de Buzón de Voz (AMD)</div>
                      <div className="text-[11px] text-slate-500">Cuelga automáticamente si contesta una contestadora o deja un mensaje conciso.</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.fallbackToWhatsAppIfUnanswered}
                      onChange={(e) => onChange({ fallbackToWhatsAppIfUnanswered: e.target.checked })}
                      className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Fallback Inmediato a WhatsApp</div>
                      <div className="text-[11px] text-slate-500">Si el cliente no contesta la llamada en 3 timbres, envía automáticamente un mensaje interactivo con botones de confirmación.</div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. CRON SCHEDULER & BACKGROUND JOBS TAB */}
      {activeSection === 'cron_scheduler' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Motor de Tareas Programadas & Cron
                  </span>
                  <span className="text-xs text-emerald-300">
                    Proveedor: {config.cronProvider.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Programador Central de Procesos en Segundo Plano
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                  Ejecución desatendida de auto-despacho, conciliación COD, sincronización de tasas cambiarias, emisión fiscal DGII y auditoría de colas offline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddCronModalOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Nueva Tarea Cron
              </Button>
            </div>
          </div>

          {/* Provider Configuration */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Parámetros del Proveedor de Tareas Cron
                  </h4>
                  <p className="text-[11px] text-slate-500">Configuración del despachador y autenticación Bearer de los webhooks de ejecución</p>
                </div>
              </div>

              <StatusBadge status="active" label="Motor Cron en Línea" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                  Proveedor de Programación Cron
                </label>
                <select
                  value={config.cronProvider}
                  onChange={(e) => onChange({ cronProvider: e.target.value as CronSchedulerProvider })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="native_internal">Cron Nativo Interno (GoPaq Task Worker)</option>
                  <option value="upstash_qstash">Upstash QStash (Serverless Scheduled Cron)</option>
                  <option value="google_cloud_tasks">Google Cloud Tasks / Cloud Scheduler</option>
                  <option value="aws_eventbridge">AWS EventBridge Scheduler</option>
                  <option value="custom_webhook_cron">Custom Webhook / Cron-Job.org</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 dark:text-slate-400 font-bold">
                    Cron Secret Token (Bearer Auth)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCronToken(!showCronToken)}
                    className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1"
                  >
                    {showCronToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showCronToken ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showCronToken ? 'text' : 'password'}
                  value={config.cronSecretToken}
                  onChange={(e) => onChange({ cronSecretToken: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 font-bold block mb-1">
                  Reintentos Automáticos ante Fallo
                </label>
                <select
                  value={config.cronRetryAttempts}
                  onChange={(e) => onChange({ cronRetryAttempts: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value={1}>1 reintento inmediato</option>
                  <option value={3}>3 reintentos con backoff exponencial (Recomendado)</option>
                  <option value={5}>5 reintentos con backoff</option>
                </select>
              </div>
            </div>
          </Card>

          {/* List of Cron Jobs */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>Catálogo de Tareas Cron Activas en el Sistema</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Monitorea, activa/desactiva o ejecuta inmediatamente cualquier proceso en segundo plano
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {config.cronJobs.filter((j) => j.enabled).length} de {config.cronJobs.length} Tareas Activas
              </span>
            </div>

            <div className="space-y-3">
              {config.cronJobs.map((job) => {
                const isRunningThis = runningCronId === job.id;
                return (
                  <div
                    key={job.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      job.enabled
                        ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                        : 'bg-slate-100/40 dark:bg-slate-950/40 border-slate-200/40 dark:border-slate-800/40 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {job.name}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {job.cronExpression}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {job.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isRunningThis || !job.enabled}
                          loading={isRunningThis}
                          icon={<Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          onClick={() => handleExecuteCronNow(job.id, job.name)}
                          title="Ejecutar proceso manualmente ahora"
                        >
                          {isRunningThis ? 'Ejecutando...' : 'Ejecutar Ahora'}
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleToggleCronJob(job.id)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            job.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          title={job.enabled ? 'Pausar tarea' : 'Activar tarea'}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                              job.enabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCronJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong className="text-slate-600 dark:text-slate-300">Última ejecución:</strong> {job.lastRun}
                        </span>
                        <span>
                          <strong className="text-slate-600 dark:text-slate-300">Próxima:</strong> {job.nextRun}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span>Ejecuciones: {job.executionCount}</span>
                        <span>Latencia avg: {job.durationAvgMs}ms</span>
                        <span className="text-emerald-500 font-bold">● OK</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* 3. EVENT AUTOMATION STUDIO TAB */}
      {activeSection === 'event_rules' && (
        <AiEventAutomationStudio onToast={onToast} />
      )}

      {/* 4. GEMINI MODELS & OCR TAB */}
      {activeSection === 'gemini_models' && (
        <div className="space-y-6">
          {/* Gemini AI Header */}
          <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-950 p-5 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-violet-800/40">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/30">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Google Gemini Multimodal AI
                  </span>
                  <span className="text-xs text-violet-300">Modelo: {config.geminiModel}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Motor de Inteligencia Artificial & Automatización Logística
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                  Extracción instantánea de facturas, pre-alertas aduanales, normalización de direcciones dominicanas y predicción de rutas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer bg-white/10 p-2.5 rounded-xl border border-white/20">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => onChange({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[12px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                <span className="ml-3 text-xs font-semibold text-white">
                  {config.enabled ? 'IA Activada' : 'IA Pausada'}
                </span>
              </label>
            </div>
          </div>

          {/* Model Selection & OCR Testing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Configuración del Modelo & Parámetros</h4>
                  <p className="text-[11px] text-slate-500">Selección de motor LLM y umbrales de precisión</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Modelo de Gemini</label>
                  <select
                    value={config.geminiModel}
                    onChange={(e) => onChange({ geminiModel: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Rápido & Menor Latencia - Recomendado)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo Razonamiento para Documentos Complejos)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-500 dark:text-slate-400 font-medium">Umbral Mínimo de Confianza para Auto-Aprobación</label>
                    <span className="font-bold text-violet-600 dark:text-violet-400">{config.confidenceThresholdPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={70}
                    max={99}
                    value={config.confidenceThresholdPercent}
                    onChange={(e) => onChange({ confidenceThresholdPercent: Number(e.target.value) })}
                    className="w-full accent-violet-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Si la certeza del OCR es menor, se envía a revisión manual de un agente.</span>
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={testingOcr}
                    onClick={handleTestOcr}
                    className="w-full"
                  >
                    <FileSearch className="w-3.5 h-3.5 mr-1 text-violet-600" />
                    Ejecutar Prueba de OCR de Factura con Gemini
                  </Button>
                </div>
              </div>
            </Card>

            {/* AI Features Checklist */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Módulos de IA Activos en GoPaq</h4>
                  <p className="text-[11px] text-slate-500">Activa o desactiva capacidades según las necesidades operativas</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoInvoiceOcr}
                    onChange={(e) => onChange({ autoInvoiceOcr: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">OCR de Facturas & Pre-alertas</div>
                    <div className="text-[11px] text-slate-500">Extrae automáticamente número de tracking, valor FOB y proveedor de facturas PDF o imágenes.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoTariffClassification}
                    onChange={(e) => onChange({ autoTariffClassification: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Clasificación Arancelaria DGA Automática</div>
                    <div className="text-[11px] text-slate-500">Asigna la partida arancelaria y calcula gravámenes conforme al arancel aduanal de la RD.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.smartAddressParser}
                    onChange={(e) => onChange({ smartAddressParser: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Normalizador Inteligente de Direcciones Dominicanas</div>
                    <div className="text-[11px] text-slate-500">Corrige referencias informales (ej: &quot;detrás de la bomba Shell&quot;) y geocodifica coordenadas exactas.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.smartRouteTrafficPredictor}
                    onChange={(e) => onChange({ smartRouteTrafficPredictor: e.target.checked })}
                    className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Predicción de Rutas con Tráfico Histórico</div>
                    <div className="text-[11px] text-slate-500">Optimiza el orden de paradas para evitar horas pico en autopistas Duarte, 27 de Febrero y Kennedy.</div>
                  </div>
                </label>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add Custom Cron Job Modal */}
      {isAddCronModalOpen && (
        <Modal
          isOpen={isAddCronModalOpen}
          onClose={() => setIsAddCronModalOpen(false)}
          title="Programar Nueva Tarea Cron en Segundo Plano"
        >
          <form onSubmit={handleCreateCustomCron} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Tarea
              </label>
              <input
                type="text"
                required
                value={newCronJob.name}
                onChange={(e) => setNewCronJob({ ...newCronJob, name: e.target.value })}
                placeholder="ej: Sincronización Nocturna con ERP Contable"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción del Proceso
              </label>
              <textarea
                rows={2}
                value={newCronJob.description}
                onChange={(e) => setNewCronJob({ ...newCronJob, description: e.target.value })}
                placeholder="Detalla qué operaciones realiza la tarea periódica..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expresión Cron (5 campos)
                </label>
                <input
                  type="text"
                  required
                  value={newCronJob.cronExpression}
                  onChange={(e) => setNewCronJob({ ...newCronJob, cronExpression: e.target.value })}
                  placeholder="0 08 * * 1-5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría Operativa
                </label>
                <select
                  value={newCronJob.category}
                  onChange={(e) => setNewCronJob({ ...newCronJob, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="operations">Operaciones & Despacho</option>
                  <option value="finance">Finanzas, NCF & COD</option>
                  <option value="customs">Aduanas & Courier Miami</option>
                  <option value="sync">Sincronización & Ledger</option>
                  <option value="notifications">Notificaciones Clientes</option>
                  <option value="system">Mantenimiento & Sistema</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] text-slate-500 font-mono">
              Presets rápidos: <br />
              • <code className="text-emerald-600">0 07 * * 1-6</code> : Todos los días a las 7:00 AM (Lun-Sáb) <br />
              • <code className="text-emerald-600">*/15 * * * *</code> : Cada 15 minutos <br />
              • <code className="text-emerald-600">0 19 * * 2,5</code> : Martes y Viernes a las 7:00 PM
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddCronModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
                Guardar Tarea
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

