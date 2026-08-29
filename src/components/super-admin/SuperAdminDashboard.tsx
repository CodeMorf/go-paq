import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, 
  Truck, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Building2, 
  Route, 
  Home, 
  ShieldAlert, 
  Radio, 
  ArrowUpRight, 
  Clock, 
  Activity, 
  Eye, 
  Plus
} from 'lucide-react';
import { MetricCard, Card, Button, StatusBadge, ServiceBadge } from '../ui/DesignSystem';
import { InteractiveMap } from '../ui/InteractiveMap';
import { Shipment } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    shipments, 
    drivers, 
    branches, 
    currentRoute, 
    formatMoney, 
    setActiveSubView, 
    setSelectedTracking,
    setCurrentSection,
    setIsNewShipmentModalOpen
  } = useApp();

  const totalShipmentsToday = 142;
  const inTransitCount = shipments.filter((s) => s.status === 'in_transit' || s.status === 'out_for_delivery').length + 38;
  const deliveredCount = 94;
  const pendingPickup = 12;
  const incidentsCount = 2;
  const codPendingSettlement = 184500;
  const incomeToday = 348200;
  const incomeMonth = 4250000;
  const activeClients = 380;
  const activeDrivers = drivers.filter((d) => d.status === 'busy' || d.status === 'available').length;
  const activeVehicles = 32;
  const activeRoutes = 8;
  const intlCargoInTransit = 420; // packages
  const scheduledMoves = 3;
  const heavyCargoActive = 2;

  const handleTrackShipment = (tracking: string) => {
    setSelectedTracking(tracking);
    setCurrentSection('portal');
    setActiveSubView('tracking');
  };

  return (
    <div className="space-y-6">
      {/* Live Operations Ticker Strip */}
      <div className="p-4 bg-linear-to-r from-indigo-900/90 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-wide uppercase">Operación en Vivo • GoPaq Core</h3>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-black">
                EN TIEMPO REAL
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              {activeDrivers} drivers en ruta • {activeRoutes} rutas activas • 6 sucursales operando normalmente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveSubView('operaciones-vivo')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            Ver Consola Operativa
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewShipmentModalOpen(true)}
          >
            Nuevo Envío
          </Button>
        </div>
      </div>

      {/* Main KPI Grid - 4 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Envíos Hoy"
          value={totalShipmentsToday}
          change="+18.4%"
          icon={<Package className="w-5 h-5" />}
          subtitle="94 completados • 38 en tránsito"
          accent="indigo"
          onClick={() => setActiveSubView('envios')}
        />
        <MetricCard
          title="Ingresos del Día"
          value={formatMoney(incomeToday)}
          change="+12.1%"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle={`Mes acumulado: ${formatMoney(incomeMonth)}`}
          accent="emerald"
        />
        <MetricCard
          title="COD Pendiente Liquidar"
          value={formatMoney(codPendingSettlement)}
          change="8 drivers"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle="Cobros en efectivo por conciliar"
          accent="amber"
          onClick={() => setActiveSubView('cod')}
        />
        <MetricCard
          title="Courier Internacional"
          value={`${intlCargoInTransit} pkgs`}
          change="3 vuelos hoy"
          icon={<Globe className="w-5 h-5" />}
          subtitle="MIA & MAD en aduanas AILA"
          accent="purple"
          onClick={() => setActiveSubView('courier-intl')}
        />
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">En Tránsito</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{inTransitCount}</span>
          <span className="text-[10px] text-indigo-500 font-medium block">Última milla</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Pickups Pendientes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{pendingPickup}</span>
          <span className="text-[10px] text-amber-500 font-medium block">4 asignados</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Incidencias</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{incidentsCount}</span>
          <span className="text-[10px] text-slate-400 block">En resolución</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Drivers Activos</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{activeDrivers} / 32</span>
          <span className="text-[10px] text-emerald-500 font-medium block">GPS Conectado</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Mudanzas</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{scheduledMoves}</span>
          <span className="text-[10px] text-purple-500 font-medium block">2 en ejecución</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Carga Pesada</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{heavyCargoActive}</span>
          <span className="text-[10px] text-blue-500 font-medium block">Pallets industriales</span>
        </div>
      </div>

      {/* Main Interactive Fleet & Live Operations Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Mapa de Red Logística & Flota en Tiempo Real</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoreo satelital de conductores, paradas de entrega, sucursales y hubs aduanales
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSubView('rutas')}
            className="text-xs text-indigo-600 dark:text-indigo-400"
          >
            Ver Planificador de Rutas →
          </Button>
        </div>

        <InteractiveMap height="h-104" showAllHubs={true} />
      </div>

      {/* Two Column Layout: Recent Shipments & Live Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shipments Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Envíos Recientes & Despacho</span>
            </h4>
            <button
              onClick={() => setActiveSubView('envios')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Ver todos ({shipments.length})
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Guía / Tracking</th>
                    <th className="py-3 px-4">Servicio</th>
                    <th className="py-3 px-4">Destinatario</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Driver / Sucursal</th>
                    <th className="py-3 px-4 text-right">Monto / COD</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {shipments.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {s.trackingNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {s.package.category.split('(')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <ServiceBadge type={s.serviceType} showIcon={false} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-900 dark:text-white font-semibold block truncate max-w-[140px]">
                          {s.destination.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {s.destination.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-300 block">
                          {s.driverName ? s.driverName.split(' ')[0] : s.branchName ? s.branchName.split(' ')[0] : 'Sin Asignar'}
                        </span>
                        {s.vehiclePlate && (
                          <span className="text-[10px] font-mono text-slate-400">{s.vehiclePlate}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {formatMoney(s.shippingCost, s.currency)}
                        </span>
                        {s.codAmount && s.codAmount > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                            COD {formatMoney(s.codAmount)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleTrackShipment(s.trackingNumber)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Rastrear Envío"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Operations Feed (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Eventos de Operación en Vivo</span>
            </h4>
            <span className="text-[10px] text-emerald-500 font-bold animate-pulse">● LIVE STREAM</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Driver Carlos Méndez completó parada en Piantini
                </p>
                <span className="text-[10px] text-slate-400">Hace 3 minutos • Cobro COD RD$ 2,850</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Vuelo AA 1039 Miami liberado en aduanas AILA
                </p>
                <span className="text-[10px] text-slate-400">Hace 12 minutos • 340 paquetes en clasificación</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Ruta RT-8839 iniciada en Bávaro - Punta Cana
                </p>
                <span className="text-[10px] text-slate-400">Hace 25 minutos • Driver Miguel Cruz</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Mudanza Residencial MUD-2026-881 en embalaje
                </p>
                <span className="text-[10px] text-slate-400">Hace 40 minutos • Bella Vista SD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
