import React, { useState } from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  PhoneCall,
  Smartphone,
  Check,
  Eye
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['communications'];
  onChange: (updates: Partial<GlobalSystemConfig['communications']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const CommunicationsNotificationsTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const [testPhoneNumber, setTestPhoneNumber] = useState('+1 (829) 450-2020');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleTestWhatsApp = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      onToast('success', 'Mensaje de Prueba Enviado', `Plantilla de WhatsApp disparada exitosamente a ${testPhoneNumber}`);
    }, 900);
  };

  const handleTriggerToggle = (key: keyof GlobalSystemConfig['communications']['eventTriggers']) => {
    onChange({
      eventTriggers: {
        ...config.eventTriggers,
        [key]: !config.eventTriggers[key],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Cloud API Banner */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 text-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">WhatsApp Business Cloud API (Meta Oficial)</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Conectado Live
                </span>
              </div>
              <p className="text-xs text-slate-300">Notificaciones automáticas con botones interactivos y links de rastreo en tiempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+1 (829) 000-0000"
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 font-mono"
            />
            <Button
              size="sm"
              variant="primary"
              icon={<Send className="w-3.5 h-3.5" />}
              loading={isSendingTest}
              onClick={handleTestWhatsApp}
            >
              Probar Plantilla
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Phone Number ID (Meta)</label>
            <input
              type="text"
              value={config.whatsappPhoneNumberId}
              onChange={(e) => onChange({ whatsappPhoneNumberId: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Business Account ID (WABA)</label>
            <input
              type="text"
              value={config.whatsappBusinessAccountId}
              onChange={(e) => onChange({ whatsappBusinessAccountId: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Permanent Access Token (Cifrado)</label>
            <input
              type="password"
              value={config.whatsappAccessTokenMasked}
              readOnly
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-400 text-[11px]"
            />
          </div>
        </div>
      </Card>

      {/* Grid: SMS, Email & Event Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS & Email Providers */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Proveedores de SMS & Correo Transaccional</h4>
              <p className="text-[11px] text-slate-500">Canales de contingencia para alertas de OTP y facturas</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Proveedor de Mensajería SMS</label>
              <select
                value={config.smsProvider}
                onChange={(e) => onChange({ smsProvider: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="twilio">Twilio Cloud Communications (Recomendado)</option>
                <option value="infobip">Infobip Enterprise</option>
                <option value="messagebird">MessageBird / Bird</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  value={config.twilioAccountSid}
                  onChange={(e) => onChange({ twilioAccountSid: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Nombre de Remitente (Sender ID)</label>
                <input
                  type="text"
                  value={config.twilioSenderName}
                  onChange={(e) => onChange({ twilioSenderName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Motor de Correo Transaccional</label>
              <select
                value={config.emailProvider}
                onChange={(e) => onChange({ emailProvider: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
              >
                <option value="sendgrid">SendGrid (Twilio)</option>
                <option value="resend">Resend.com (Modern Dev-first)</option>
                <option value="postmark">Postmark</option>
                <option value="aws_ses">Amazon Simple Email Service (SES)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Email Emisor (From)</label>
                <input
                  type="email"
                  value={config.emailFromAddress}
                  onChange={(e) => onChange({ emailFromAddress: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                />
              </div>
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Nombre Mostrado</label>
                <input
                  type="text"
                  value={config.emailFromName}
                  onChange={(e) => onChange({ emailFromName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Automated Event Triggers Matrix */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Matriz de Disparadores Automáticos</h4>
              <p className="text-[11px] text-slate-500">Eventos que despachan alertas instantáneas a los clientes</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { key: 'onMiamiReceived', title: 'Paquete Recibido en Miami Warehouse', desc: 'Notifica peso en libras y confirmación de recepción' },
              { key: 'onInTransitFlight', title: 'Paquete en Vuelo / Tránsito Internacional', desc: 'Avisa fecha estimada de llegada a aduanas' },
              { key: 'onCustomsClearance', title: 'Paquete en Aduanas / DGA', desc: 'Indica estado de inspección o requerimiento de factura' },
              { key: 'onBranchReadyPickup', title: 'Listo para Retiro en Sucursal', desc: 'Incluye código QR de retiro rápido y horario' },
              { key: 'onOutForDeliveryWithGps', title: 'En Ruta de Entrega con Driver (GPS Live)', desc: 'Envía link interactivo de seguimiento del repartidor' },
              { key: 'onDeliveredWithPod', title: 'Entrega Exitosa con Comprobante POD', desc: 'Adjunta foto de entrega, firma y comprobante digital' },
              { key: 'onCodPaymentReady', title: 'Liquidación COD Emitida al Comercio', desc: 'Notifica depósito bancario y número de referencia ACH' },
            ].map(({ key, title, desc }) => {
              const active = config.eventTriggers[key as keyof typeof config.eventTriggers];
              return (
                <div
                  key={key}
                  onClick={() => handleTriggerToggle(key as any)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    active
                      ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-70'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{title}</div>
                    <div className="text-[11px] text-slate-500">{desc}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${active ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
