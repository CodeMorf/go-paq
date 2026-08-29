import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, 
  Globe, 
  DollarSign, 
  Truck, 
  Layers, 
  Plus, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Copy
} from 'lucide-react';
import { MetricCard, Card, Button, StatusBadge } from '../ui/DesignSystem';

export const PortalDashboard: React.FC = () => {
  const { shipments, internationalPackages, formatMoney, setActiveSubView, addToast, setSelectedTracking } = useApp();

  const myShipments = shipments.slice(0, 4);
  const myIntlPackages = internationalPackages.slice(0, 3);

  const handleCopyLocker = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('success', 'Copiado', 'Dirección de casillero copiada al portapapeles.');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/30 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
            Bienvenido al Portal de Clientes
          </span>
          <h2 className="text-xl font-black">
            TechStore Caribe SRL
          </h2>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            Gestiona tus envíos locales, recibe compras de Amazon/eBay en Miami y consolida tus paquetes con tarifas preferenciales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            onClick={() => setActiveSubView('casillero')}
          >
            Ver Mis Casilleros
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setActiveSubView('crear-envio')}
          >
            Nuevo Envío
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Envíos en Tránsito"
          value="4 Guías"
          subtitle="2 Locales • 2 Nacionales"
          icon={<Truck className="w-5 h-5" />}
          accent="indigo"
          onClick={() => setActiveSubView('tracking')}
        />
        <MetricCard
          title="Paquetes en Miami"
          value={`${myIntlPackages.length} Cajas`}
          subtitle="Listos para consolidar"
          icon={<Globe className="w-5 h-5" />}
          accent="blue"
          onClick={() => setActiveSubView('paquetes-list')}
        />
        <MetricCard
          title="Saldo COD por Cobrar"
          value={formatMoney(42500)}
          subtitle="Liquidación semanal viernes"
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
          onClick={() => setActiveSubView('cuenta-corriente')}
        />
        <MetricCard
          title="Línea de Crédito"
          value={formatMoney(150000)}
          subtitle="Disponible RD$ 115,200"
          icon={<DollarSign className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Domestic Shipments */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Mis Envíos Activos</span>
            </h3>
            <button
              onClick={() => setActiveSubView('tracking')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              Ver todos →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {myShipments.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white block">
                    {s.trackingNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Destino: {s.destination.name} ({s.destination.city})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} size="sm" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedTracking(s.trackingNumber);
                      setActiveSubView('tracking');
                    }}
                  >
                    Rastrear
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* International Locker Quick Copy */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Dirección de Casillero en Miami (USA)</span>
            </h3>
            <button
              onClick={() => setActiveSubView('casillero')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              Ver Europa →
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2 text-slate-800 dark:text-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Nombre / Casillero:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">TechStore / NX-8849</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Dirección Línea 1:</span>
              <span>8400 NW 25th Street</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Dirección Línea 2:</span>
              <span>Suite 100 / NX-8849</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Ciudad / Estado / Zip:</span>
              <span>Doral, FL 33198</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-sans">Teléfono:</span>
              <span>+1 (305) 555-0199</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={() => handleCopyLocker('TechStore / NX-8849, 8400 NW 25th Street, Suite 100, Doral FL 33198')}
          >
            Copiar Dirección Completa para Amazon
          </Button>
        </Card>
      </div>
    </div>
  );
};
