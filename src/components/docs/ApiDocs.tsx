import React, { useState } from 'react';
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
  const { setCurrentSection, addToast } = useApp();
  const [selectedEndpoint, setSelectedEndpoint] = useState('create_shipment');
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python'>('curl');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    {
      id: 'create_shipment',
      method: 'POST',
      path: '/v1/shipments',
      title: 'Crear Envío (Local / Nacional)',
      desc: 'Genera una nueva guía de transporte con cálculo de tarifa automático y opción de cobro COD.'
    },
    {
      id: 'get_tracking',
      method: 'GET',
      path: '/v1/shipments/{trackingNumber}',
      title: 'Consultar Trazabilidad de Guía',
      desc: 'Obtiene el estado actual, geolocalización del conductor y el historial de eventos.'
    },
    {
      id: 'quote_rate',
      method: 'POST',
      path: '/v1/rates/calculate',
      title: 'Cotizar Tarifa en Tiempo Real',
      desc: 'Calcula el costo del flete considerando peso volumétrico, distancia y combustible.'
    },
    {
      id: 'get_locker_packages',
      method: 'GET',
      path: '/v1/lockers/{lockerCode}/packages',
      title: 'Listar Paquetes en Casillero',
      desc: 'Retorna los paquetes recibidos en almacenes de Miami, Madrid o Milán.'
    },
    {
      id: 'consolidate',
      method: 'POST',
      path: '/v1/lockers/consolidate',
      title: 'Consolidar Paquetes Internacionales',
      desc: 'Agrupa dos o más paquetes en una sola caja máster para ahorrar en el flete aéreo.'
    }
  ];

  const handleTestEndpoint = () => {
    setLoading(true);
    setTimeout(() => {
      if (selectedEndpoint === 'create_shipment') {
        setTestResponse(JSON.stringify({
          status: "success",
          data: {
            tracking_number: "GP-88291044",
            service_type: "local",
            status: "confirmed",
            shipping_cost_dop: 285.00,
            cod_amount_dop: 3500.00,
            label_url: "https://api.gopaq.com.do/v1/labels/GP-88291044.pdf",
            estimated_delivery: "2026-02-28T18:00:00Z"
          }
        }, null, 2));
      } else if (selectedEndpoint === 'get_tracking') {
        setTestResponse(JSON.stringify({
          status: "success",
          data: {
            tracking_number: "GP-99238411",
            current_status: "out_for_delivery",
            driver: {
              name: "Carlos Méndez",
              phone: "809-555-0144",
              vehicle: "Toyota Hilux G-449102"
            },
            timeline_events_count: 5
          }
        }, null, 2));
      } else {
        setTestResponse(JSON.stringify({
          status: "success",
          rate_quote: {
            base_dop: 180,
            distance_dop: 75,
            fuel_surcharge_dop: 22.50,
            total_dop: 277.50
          }
        }, null, 2));
      }
      setLoading(false);
      addToast('success', 'Petición Completada', 'Respuesta HTTP 200 OK recibida de la API.');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentSection('super-admin')}
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
              v1.4 OpenAPI 3.0
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
                      https://api.gopaq.com.do{current.path}
                    </h2>
                  </div>
                  <h3 className="text-base font-bold text-amber-400 mt-2">{current.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{current.desc}</p>
                </div>

                {/* Request Header Specs */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Headers Requeridos</h4>
                  <div className="font-mono text-xs text-slate-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-amber-400">Authorization:</span>
                      <span>Bearer YOUR_API_SECRET_KEY</span>
                    </div>
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
                      Probar Endpoint (Try It Out)
                    </Button>
                  </div>

                  <pre className="p-4 text-xs font-mono text-amber-300 font-medium overflow-x-auto">
{activeLang === 'curl' ? `curl -X ${current.method} "https://api.gopaq.com.do${current.path}" \\
  -H "Authorization: Bearer gp_live_sec_991204" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient_name": "Carlos Gomez", "weight_kg": 2.5}'` :
activeLang === 'node' ? `const response = await fetch("https://api.gopaq.com.do${current.path}", {
  method: "${current.method}",
  headers: {
    "Authorization": "Bearer gp_live_sec_991204",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ recipient_name: "Carlos Gomez", weight_kg: 2.5 })
});
const data = await response.json();` :
`import requests

url = "https://api.gopaq.com.do${current.path}"
headers = {"Authorization": "Bearer gp_live_sec_991204"}
response = requests.${current.method.toLowerCase()}(url, headers=headers, json={"weight_kg": 2.5})`}
                  </pre>
                </div>

                {/* Response Visualizer */}
                {testResponse && (
                  <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl overflow-hidden space-y-2 p-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">Response: 200 OK</span>
                      <span className="text-slate-500">Latency: 142ms</span>
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
