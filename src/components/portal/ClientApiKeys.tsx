import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Code, Key, Copy, Check, ExternalLink, Sparkles, Terminal } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';

export const ClientApiKeys: React.FC = () => {
  const { addToast } = useApp();
  const [apiKey] = useState('nx_prod_sec_89234891238912378912389');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    addToast('success', 'Copiada', 'API Key copiada al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-indigo-600" />
            <span>Integración API & Plugins para E-Commerce</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conecta tu tienda Shopify, WooCommerce o sistema ERP para crear guías y cotizar envíos automáticamente
          </p>
        </div>
      </div>

      {/* API Key Box */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-600" />
          <span>Tu Clave de Acceso Secreta (API Secret Key)</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-xs text-slate-900 dark:text-white"
          />
          <Button
            variant="primary"
            size="md"
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopy}
          >
            {copied ? 'Copiado' : 'Copiar Key'}
          </Button>
        </div>
      </Card>

      {/* Code Snippet Example */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span>Ejemplo de Creación de Envío por cURL</span>
          </h4>
          <span className="text-[10px] font-mono text-indigo-500 font-bold">POST /api/v1/shipments</span>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl text-indigo-300 font-mono text-xs overflow-x-auto">
{`curl -X POST https://api.gopaq.com.do/v1/shipments \\
  -H "Authorization: Bearer gp_prod_sec_89234891238912378912389" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_type": "local",
    "recipient": {
      "name": "Maria Santos",
      "address": "Calle Las Mercedes #45",
      "city": "Santo Domingo",
      "phone": "809-555-0199"
    },
    "package": {
      "weight_kg": 1.5,
      "cod_amount": 2500
    }
  }'`}
        </pre>
      </Card>
    </div>
  );
};
