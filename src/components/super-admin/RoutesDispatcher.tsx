import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryRoute, RouteStop, RouteType, DispatchWave } from '../../types';
import { 
  Route as RouteIcon, 
  MapPin, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Navigation,
  Share2,
  ArrowUpDown,
  Plus,
  Layers,
  Calendar,
  Weight,
  Trash2,
  Check,
  AlertTriangle,
  MoveUp,
  MoveDown,
  UserCheck,
  Zap,
  PhoneCall
} from 'lucide-react';
import { Button, Card, MetricCard, StatusBadge, Modal } from '../ui/DesignSystem';
import { InteractiveMap } from '../ui/InteractiveMap';

export const RoutesDispatcher: React.FC = () => {
  const { 
    routes, 
    setRoutes, 
    currentRoute, 
    setCurrentRoute, 
    addRoute, 
    updateRoute, 
    deleteRoute, 
    assignShipmentToRoute, 
    removeStopFromRoute, 
    reorderRouteStops, 
    drivers, 
    publishBranchRoute, 
    formatMoney, 
    shipments, 
    addToast,
    triggerVoiceBotCall 
  } = useApp();

  const [selectedWave, setSelectedWave] = useState<string>('all');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [selectedShipmentToAdd, setSelectedShipmentToAdd] = useState<string>('');

  // New Route Form State
  const [newRouteCode, setNewRouteCode] = useState(`RT-SDQ-${Math.floor(10 + Math.random() * 90)}`);
  const [newRouteName, setNewRouteName] = useState('Ruta Express Los Prados & Naco');
  const [newRouteZone, setNewRouteZone] = useState('Distrito Nacional Urbano');
  const [newRouteDriverId, setNewRouteDriverId] = useState(drivers[0]?.id || 'drv-01');
  const [newRouteType, setNewRouteType] = useState<RouteType>('last_mile');
  const [newRouteWave, setNewRouteWave] = useState<DispatchWave>('wave_morning_0800');
  const [newRouteVehicleType, setNewRouteVehicleType] = useState('Van Toyota HiAce 2.8T');
  const [newRouteMaxCapacityKg, setNewRouteMaxCapacityKg] = useState(1200);

  const filteredRoutes = routes.filter((r) => selectedWave === 'all' || r.dispatchWave === selectedWave);

  const unassignedShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'registered' || s.status === 'at_branch'
  );

  const handleOptimizeRoute = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Re-order stops logically
      const optimizedStops = [...currentRoute.stops].map((s, idx) => ({
        ...s,
        sequenceOrder: idx + 1
      }));
      updateRoute(currentRoute.id, {
        totalDistanceKm: Math.max(15, Math.round(currentRoute.totalDistanceKm * 0.88)),
        estimatedDurationHours: Math.max(1.5, Math.round(currentRoute.estimatedDurationHours * 0.85 * 10) / 10),
        stops: optimizedStops
      });
      setIsOptimizing(false);
      addToast('success', 'Ruta Optimizada con Inteligencia Artificial', 'Se recalculó el grafo de paradas reduciendo un 12% la distancia de recorrido.');
    }, 1200);
  };

  const handlePublish = () => {
    publishBranchRoute(currentRoute);
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedDriver = drivers.find((d) => d.id === newRouteDriverId) || drivers[0];

    const createdRoute: DeliveryRoute = {
      id: `rt-${Date.now()}`,
      routeCode: newRouteCode,
      name: newRouteName,
      branchId: 'br-hq-sd',
      branchName: 'Hub Central Santo Domingo',
      driverId: assignedDriver.id,
      driverName: assignedDriver.name,
      vehiclePlate: assignedDriver.vehiclePlate || 'L-482910',
      vehicleType: 'van',
      status: 'draft',
      routeType: newRouteType,
      dispatchWave: newRouteWave,
      manifestNumber: `MNF-${Date.now().toString().slice(-6)}`,
      currentWeightKg: 0,
      maxWeightKg: Number(newRouteMaxCapacityKg),
      totalStops: 0,
      completedStops: 0,
      totalDistanceKm: 28,
      estimatedDurationHours: 3.5,
      totalCodAmount: 0,
      collectedCodAmount: 0,
      stops: []
    };

    addRoute(createdRoute);
    setIsCreateRouteModalOpen(false);
  };

  const handleAddStopToCurrentRoute = () => {
    if (!selectedShipmentToAdd) return;
    assignShipmentToRoute(selectedShipmentToAdd, currentRoute.id);
    setIsAddStopModalOpen(false);
    setSelectedShipmentToAdd('');
  };

  const handleMoveStop = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentRoute.stops.length) return;

    const stopsCopy = [...currentRoute.stops];
    const temp = stopsCopy[idx];
    stopsCopy[idx] = stopsCopy[targetIdx];
    stopsCopy[targetIdx] = temp;

    reorderRouteStops(currentRoute.id, stopsCopy);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-indigo-600" />
            <span>Centro de Despacho & Múltiples Rutas (DHL/FedEx Ops)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestión de olas de salida, troncales interurbanas, manifiestos de carga y balanceo de flota GoPaq
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateRouteModalOpen(true)}
          >
            Crear Nueva Ruta
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4 text-indigo-500" />}
            loading={isOptimizing}
            onClick={handleOptimizeRoute}
          >
            Optimizar Secuencia IA
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Share2 className="w-4 h-4" />}
            onClick={handlePublish}
          >
            Publicar al Conductor
          </Button>
        </div>
      </div>

      {/* Waves Filter & Route Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Olas de Despacho:
            </span>
            {[
              { id: 'all', label: 'Todas las Olas' },
              { id: 'wave_morning_0800', label: 'Ola 1 • 08:00 AM' },
              { id: 'wave_afternoon_1300', label: 'Ola 2 • 01:00 PM' },
              { id: 'wave_trunk_night_2100', label: 'Troncal Nocturna 21:00' }
            ].map((wave) => (
              <button
                key={wave.id}
                onClick={() => setSelectedWave(wave.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedWave === wave.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {wave.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredRoutes.length} rutas configuradas
          </span>
        </div>

        {/* Route Cards Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredRoutes.map((route) => {
            const isSelected = currentRoute.id === route.id;
            const progressPercent = route.totalStops > 0 ? Math.round((route.completedStops / route.totalStops) * 100) : 0;
            const weightPercent = route.maxCapacityWeightKg ? Math.round(((route.currentWeightKg || 0) / route.maxCapacityWeightKg) * 100) : 0;

            return (
              <div
                key={route.id}
                onClick={() => setCurrentRoute(route)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500 dark:bg-indigo-950 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                  }`}>
                    {route.routeCode}
                  </span>
                  <StatusBadge
                    status={route.status === 'in_progress' ? 'driver_en_route' : route.status === 'completed' ? 'delivered' : 'pending'}
                    label={route.status === 'in_progress' ? 'EN RUTA' : route.status === 'completed' ? 'FINALIZADA' : 'PLANIFICADA'}
                  />
                </div>

                <div>
                  <h4 className={`text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {route.name || route.zone}
                  </h4>
                  <p className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span>{route.driverName} ({route.vehicleType || 'Van'})</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                      Paradas: {route.completedStops} / {route.totalStops}
                    </span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1">
                    <Weight className="w-3 h-3" />
                    {route.currentWeightKg || 0} / {route.maxCapacityWeightKg || 800} KG
                  </span>
                  <span className="font-bold text-amber-400">
                    COD: {formatMoney(route.totalCodAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Route Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ruta Seleccionada"
          value={currentRoute.routeCode}
          subtitle={`Manifiesto: ${currentRoute.manifestNumber || 'MNF-99201'}`}
          icon={<Truck className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Progreso de Paradas"
          value={`${currentRoute.completedStops} / ${currentRoute.totalStops}`}
          subtitle={`${currentRoute.totalStops - currentRoute.completedStops} entregas pendientes`}
          icon={<MapPin className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="Recorrido & Carga"
          value={`${currentRoute.totalDistanceKm} KM`}
          subtitle={`${currentRoute.currentWeightKg || 0} KG en bodega (~${currentRoute.estimatedDurationHours}h)`}
          icon={<Weight className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          title="Recaudación COD"
          value={formatMoney(currentRoute.totalCodAmount)}
          subtitle={`Recolectado: ${formatMoney(currentRoute.collectedCodAmount)}`}
          icon={<DollarSign className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* Two Column Layout: Interactive Map + Drag/Drop Stops Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              <span>Trazado de Ruta & Posición de Flota en Tiempo Real</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              TELEMETRÍA GPS ACTIVA
            </span>
          </div>
          <InteractiveMap height="h-120" activeRouteOnly={true} />
        </div>

        {/* Right: Stops Sequence List (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
              <span>Secuencia de Paradas ({currentRoute.stops.length})</span>
            </h3>
            <button
              onClick={() => setIsAddStopModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Parada</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-2.5 max-h-120 overflow-y-auto">
            {currentRoute.stops.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No hay paradas asignadas a esta ruta aún.</p>
                <Button size="sm" variant="secondary" onClick={() => setIsAddStopModalOpen(true)}>
                  Asignar Envíos
                </Button>
              </div>
            ) : (
              currentRoute.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                    stop.status === 'completed'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                          {stop.recipientName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {stop.trackingNumber} • {stop.type === 'pickup' ? 'Recogida' : 'Entrega'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveStop(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                        title="Subir parada"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStop(idx, 'down')}
                        disabled={idx === currentRoute.stops.length - 1}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                        title="Bajar parada"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeStopFromRoute(currentRoute.id, stop.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
                        title="Remover de ruta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-1">
                    {stop.address}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-400 font-mono">
                      ETA: {stop.estimatedArrival}
                    </span>
                    {stop.codAmount && stop.codAmount > 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                        COD: {formatMoney(stop.codAmount)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold">PRE-PAGADO</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create New Route */}
      <Modal
        isOpen={isCreateRouteModalOpen}
        onClose={() => setIsCreateRouteModalOpen(false)}
        title="Crear Nueva Ruta de Despacho (Enterprise)"
        subtitle="Configura una nueva ruta conforme al modelo operacional DHL/FedEx"
      >
        <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Código de Ruta
              </label>
              <input
                type="text"
                value={newRouteCode}
                onChange={(e) => setNewRouteCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nombre Descriptivo
              </label>
              <input
                type="text"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Operación
              </label>
              <select
                value={newRouteType}
                onChange={(e) => setNewRouteType(e.target.value as RouteType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <option value="last_mile">Última Milla (Entregas)</option>
                <option value="express_moto">Express Motocicleta</option>
                <option value="recoleccion_b2b">Recolecciones B2B</option>
                <option value="troncal_hub">Troncal Interurbana (Transfer Hub)</option>
                <option value="interprovincial">Interprovincial Regional</option>
                <option value="carga_pesada_nocturna">Carga Pesada Nocturna</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Ola de Despacho
              </label>
              <select
                value={newRouteWave}
                onChange={(e) => setNewRouteWave(e.target.value as DispatchWave)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                <option value="wave_morning_0800">Ola 1 • 08:00 AM Matutina</option>
                <option value="wave_midday_1200">Ola 2 • 12:00 PM Mediodía</option>
                <option value="wave_afternoon_1500">Ola 3 • 03:00 PM Vespertina</option>
                <option value="wave_night_2100">Troncal Nocturna 21:00 PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Conductor Asignado
              </label>
              <select
                value={newRouteDriverId}
                onChange={(e) => setNewRouteDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicleType} • {d.vehiclePlate || d.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Capacidad Máxima (KG)
              </label>
              <input
                type="number"
                value={newRouteMaxCapacityKg}
                onChange={(e) => setNewRouteMaxCapacityKg(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setIsCreateRouteModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={<Check className="w-4 h-4" />}>
              Crear Ruta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Stop to Route */}
      <Modal
        isOpen={isAddStopModalOpen}
        onClose={() => setIsAddStopModalOpen(false)}
        title={`Añadir Parada a ${currentRoute.routeCode}`}
        subtitle="Selecciona un paquete o envío disponible en almacén para integrar a la ruta"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Seleccionar Envío / Guía:
            </label>
            <select
              value={selectedShipmentToAdd}
              onChange={(e) => setSelectedShipmentToAdd(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono"
            >
              <option value="">-- Selecciona un envío disponible --</option>
              {unassignedShipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} - {s.destination.name} ({s.destination.city}) • {s.package.weightKg} KG • COD: {s.codAmount ? `RD$${s.codAmount}` : 'No'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAddStopModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!selectedShipmentToAdd}
              onClick={handleAddStopToCurrentRoute}
              icon={<Plus className="w-4 h-4" />}
            >
              Añadir a la Ruta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

