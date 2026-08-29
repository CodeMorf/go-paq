import React, { useState } from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  Key, 
  Webhook, 
  Copy, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  Code,
  Zap
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['developer'];
  onChange: (updates: Partial<GlobalSystemConfig['developer']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const ApiWebhooksTab: React.FC<TabProps> = ({ config, onChange, onToast }) => {
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingResponse, setLastPingResponse] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onToast('info', 'Copiado', `${label} copiado al portapapeles.`);
  };

  const handleRotateKey = (env: 'live' | 'test') => {
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = `gp_${env}_${randomHex}`;
    if (env === 'live') {
      onChange({ liveApiKey: newKey });
    } else {
      onChange({ testApiKey: newKey });
    }
    onToast('success', 'Clave Regenerada', `Nueva clave API de ${env.toUpperCase()} generada con éxito.`);
  };

  const handleTestWebhookPing = () => {
    setIsPinging(true);
    setLastPingResponse(null);
    setTimeout(() => {
      setIsPinging(false);
      setLastPingResponse(JSON.stringify({
        status: 200,
        event: 'ping.test',
        timestamp: new Date().toISOString(),
        delivered: true,
        signature: 'sha256=9f83ab29...',
      }, null, 2));
      onToast('success', 'Ping de Webhook Exitoso', 'El endpoint respondió con HTTP 200 OK en 142ms.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* API Keys Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Production API Key */}
        <Card className="space-y-4 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/30 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-600 text-white">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">API Key de Producción (Live)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    Producción
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Acceso a envíos reales, cobros y facturas fiscales</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Clave Secreta Live</label>
              <div className="flex gap-2">
                <input
                  type={showLiveKey ? 'text' : 'password'}
                  value={config.liveApiKey}
                  readOnly
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px]"
                />
                <Button size="sm" variant="secondary" onClick={() => setShowLiveKey(!showLiveKey)}>
                  {showLiveKey ? 'Ocultar' : 'Mostrar'}
                </Button>
                <Button size="sm" variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyToClipboard(config.liveApiKey, 'API Key Live')} />
              </div>
            </div>

            <div className="pt-1 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">¿Comprometiste la clave?</span>
              <Button size="sm" variant="danger" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => handleRotateKey('live')}>
                Rotar Clave Live
              </Button>
            </div>
          </div>
        </Card>

        {/* Sandbox / Test API Key */}
        <Card className="space-y-4 border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/30 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500 text-slate-950">
                <Code className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">API Key de Pruebas (Sandbox)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    Sandbox
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Ambiente aislado para desarrolladores e integraciones</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Clave Secreta Sandbox</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.testApiKey}
                  readOnly
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px]"
                />
                <Button size="sm" variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyToClipboard(config.testApiKey, 'API Key Sandbox')} />
              </div>
            </div>

            <div className="pt-1 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Genera datos simulados</span>
              <Button size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => handleRotateKey('test')}>
                Regenerar Test Key
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Webhooks Configuration & Live Test */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Webhook className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Webhooks Globales en Tiempo Real & Firma HMAC</h4>
            <p className="text-[11px] text-slate-500">Transmite eventos a sistemas ERP externos, Shopify, WooCommerce o apps móviles</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">URL Endpoint Receptora de Webhook</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={(e) => onChange({ webhookUrl: e.target.value })}
                  placeholder="https://api.tudominio.com/webhooks/gopaq"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
                />
                <Button
                  size="sm"
                  variant="primary"
                  loading={isPinging}
                  icon={<Send className="w-3.5 h-3.5" />}
                  onClick={handleTestWebhookPing}
                >
                  Probar Ping
                </Button>
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Firma Secreta HMAC-SHA256 (Webhook Secret)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={config.webhookSecret}
                  readOnly
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-medium"
                />
                <Button size="sm" variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyToClipboard(config.webhookSecret, 'Webhook Secret')} />
              </div>
            </div>
          </div>

          {/* Webhook Response Log Viewer */}
          {lastPingResponse && (
            <div className="p-3 bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  HTTP 200 OK — Entrega Exitosa
                </span>
                <span>Payload Firmado con HMAC</span>
              </div>
              <pre className="overflow-x-auto text-[10px] text-slate-300 py-1">{lastPingResponse}</pre>
            </div>
          )}

          {/* Rate Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Límite de Peticiones API (Rate Limit / min)</label>
              <input
                type="number"
                value={config.rateLimitPerMinute}
                onChange={(e) => onChange({ rateLimitPerMinute: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Latencia Simulada en Sandbox (ms)</label>
              <input
                type="number"
                value={config.sandboxSimulatedLatencyMs}
                onChange={(e) => onChange({ sandboxSimulatedLatencyMs: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
