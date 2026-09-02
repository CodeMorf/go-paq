import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  Code, 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  Layers, 
  Globe, 
  Package, 
  DollarSign, 
  Webhook,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';

export const ApiDocs: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();
  const [selectedEndpoint, setSelectedEndpoint] = useState('create_shipment');
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python'>('curl');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    {
      id: 'create_shipment',
      method: 'POST',
      path: '/v1/shipments',
      title: 'Crear Envío (Local / Nacional)',
      desc: 'Genera una nueva guía de transporte con cálculo de tarifa automático y opción de cobro COD.',
      auth: true,
      requestExample: '{"serviceType":"local","origin":{"name":"Remitente","address":"Calle 1","city":"Santo Domingo","country":"DO"},"destination":{"name":"Destinatario","address":"Calle 2","city":"Santiago","country":"DO"},"package":{"weightKg":2,"lengthCm":20,"widthCm":15,"heightCm":10}}'
    },
    {
      id: 'get_tracking',
      method: 'GET',
      path: '/v1/tracking/{trackingNumber}',
      title: 'Consultar Trazabilidad de Guía',
      desc: 'Obtiene el estado actual y el historial canónico de eventos registrados por GoPaq.',
      auth: false,
      requestExample: ''
    },
    {
      id: 'quote_rate',
      method: 'POST',
      path: '/v1/quotes',
      title: 'Cotizar Tarifa en Tiempo Real',
      desc: 'Calcula el costo del flete considerando peso real, peso volumétrico y la matriz de tarifas activa.',
      auth: false,
      requestExample: '{"serviceType":"local","originCity":"Santo Domingo","destCity":"Santiago","weightKg":2,"lengthCm":20,"widthCm":15,"heightCm":10}'
    },
    {
      id: 'get_locker_packages',
      method: 'GET',
      path: '/v1/international/packages',
      title: 'Listar Paquetes en Casillero',
      desc: 'Retorna los paquetes internacionales autorizados para la organización o cuenta cliente.',
      auth: true,
      requestExample: ''
    },
    {
      id: 'consolidate',
      method: 'POST',
      path: '/v1/international/consolidate',
      title: 'Consolidar Paquetes Internacionales',
      desc: 'Agrupa dos o más paquetes recibidos en una consolidación persistida.',
      auth: true,
      requestExample: '{"packageIds":["pkg-1","pkg-2"]}'
    },
    {
      id: 'moving_quote',
      method: 'POST',
      path: '/v1/moving/quote',
      title: 'Cotizar Mudanza',
      desc: 'Calcula una cotización de mudanza con volumen, pisos, ayudantes y distancia.',
      auth: false,
      requestExample: '{"volumeM3":15,"floors":2,"hasElevator":false,"crewCount":3,"distanceKm":10}'
    },
    {
      id: 'heavy_quote',
      method: 'POST',
      path: '/v1/heavy-cargo/quote',
      title: 'Cotizar Carga Pesada',
      desc: 'Calcula una cotización con pallets, peso, dimensiones y equipo requerido.',
      auth: false,
      requestExample: '{"palletsCount":2,"totalWeightKg":1500,"lengthM":2,"widthM":1.2,"heightM":1.4,"equipmentRequired":"Montacargas"}'
    }
  ];

  const handleTestEndpoint = async () => {
    setLoading(true);
    setTestResponse(null);
    setTestStatus(null);
    const response = await fetch('/api/ready', { credentials: 'include' });
    const body = await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}` }));
    setTestStatus(response.status);
    setTestResponse(JSON.stringify(body, null, 2));
    setLoading(false);
    addToast(response.ok ? 'info' : 'error', response.ok ? 'API verificada' : 'API no disponible', `La comprobación de solo lectura devolvió HTTP ${response.status}.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/super-admin/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la App</span>
          </button>
          <div className="h-5 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-400" />
            <span className="font-extrabold text-sm tracking-tight text-white">
              GoPaq DEVELOPER API REFERENCE
            </span>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
              v1.5 OpenAPI 3.1
            </span>
          </div>
        </div>
      </header>

      {/* Main Docs Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar of Endpoints */}
        <aside className="w-72 border-r border-slate-800 bg-slate-950 p-4 space-y-4 overflow-y-auto shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2">
              Endpoints Disponibles
            </span>
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setTestResponse(null);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all space-y-1 ${
                  selectedEndpoint === ep.id
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                    ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-[11px] truncate">{ep.path}</span>
                </div>
                <p className="text-[11px] font-medium opacity-80 truncate">{ep.title}</p>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block px-2">
              Eventos Webhook
            </span>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
              <span className="text-emerald-400 block font-bold">shipment.delivered</span>
              <span className="text-blue-400 block font-bold">shipment.out_for_delivery</span>
              <span className="text-purple-400 block font-bold">locker.package_received</span>
              <span className="text-amber-400 block font-bold">cod.collected</span>
            </div>
          </div>
        </aside>

        {/* Center/Right Documentation & Interactive Sandbox */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 max-w-4xl">
          {(() => {
            const current = endpoints.find((e) => e.id === selectedEndpoint)!;
            return (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono font-black px-2 py-1 rounded ${
                      current.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {current.method}
                    </span>
                    <h2 className="text-xl font-bold font-mono text-white">
                      {window.location.origin}/api{current.path}
                    </h2>
                  </div>
                  <h3 className="text-base font-bold text-amber-400 mt-2">{current.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{current.desc}</p>
                </div>

                {/* Request Header Specs */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Headers Requeridos</h4>
                  <div className="font-mono text-xs text-slate-300 space-y-1.5">
                    {current.auth ? <div className="flex justify-between"><span className="text-amber-400">X-API-Key:</span><span>YOUR_API_KEY</span></div> : <div className="text-slate-500">Este endpoint público no requiere autenticación.</div>}
                    <div className="flex justify-between">
                      <span className="text-amber-400">Content-Type:</span>
                      <span>application/json</span>
                    </div>
                  </div>
                </div>

                {/* Code Tabs */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(['curl', 'node', 'python'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setActiveLang(lang)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
                            activeLang === lang
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Send className="w-3.5 h-3.5" />}
                      loading={loading}
                      onClick={handleTestEndpoint}
                    >
                      Comprobar API (solo lectura)
                    </Button>
                  </div>

                  <pre className="p-4 text-xs font-mono text-amber-300 font-medium overflow-x-auto">
{activeLang === 'curl' ? `curl -X ${current.method} "${window.location.origin}/api${current.path}"${current.auth ? ' \\\n  -H "X-API-Key: YOUR_API_KEY"' : ''}${current.method === 'POST' ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${current.requestExample}'` : ''}` :
activeLang === 'node' ? `const response = await fetch("${window.location.origin}/api${current.path}", {
  method: "${current.method}",
  headers: {
    ${current.auth ? '"X-API-Key": "YOUR_API_KEY",' : ''}
    ${current.method === 'POST' ? '"Content-Type": "application/json"' : ''}
  }${current.method === 'POST' ? `,
  body: JSON.stringify(${current.requestExample})` : ''}
});
const data = await response.json();` :
`import requests

url = "${window.location.origin}/api${current.path}"
headers = {${current.auth ? '"X-API-Key": "YOUR_API_KEY"' : ''}${current.auth && current.method === 'POST' ? ', ' : ''}${current.method === 'POST' ? '"Content-Type": "application/json"' : ''}}
response = requests.${current.method.toLowerCase()}(url, headers=headers${current.method === 'POST' ? `, json=${current.requestExample}` : ''})`}
                  </pre>
                </div>

                {/* Response Visualizer */}
                {testResponse && (
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl overflow-hidden space-y-2 p-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={testStatus && testStatus < 400 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>Response: HTTP {testStatus}</span>
                      <span className="text-slate-500">Respuesta real de /api/ready</span>
                    </div>
                    <pre className="text-xs font-mono text-emerald-300 overflow-x-auto bg-slate-900/80 p-3 rounded-xl">
                      {testResponse}
                    </pre>
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
};
