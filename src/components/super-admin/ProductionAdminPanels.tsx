import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDot,
  Database,
  DollarSign,
  Globe2,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  ScanLine,
  ServerCog,
  ShieldCheck,
  Truck,
  UserRound,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, MetricCard, StatusBadge } from '../ui/DesignSystem';

type LoadedData = {
  shipments: any[];
  drivers: any[];
  branches: any[];
  routes: any[];
  cod: any[];
  international: any[];
};

const emptyData: LoadedData = { shipments: [], drivers: [], branches: [], routes: [], cod: [], international: [] };

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusText: Record<string, string> = {
  pending: 'Pendiente',
  picked_up: 'Recogido',
  at_branch: 'En sucursal',
  out_for_delivery: 'En reparto',
  delivered: 'Entregado',
  failed: 'Incidencia',
  cancelled: 'Cancelado',
  draft: 'Borrador',
  in_progress: 'En curso',
  completed: 'Completada',
  assigned: 'Asignada',
};

const statusLabel = (value: unknown) => statusText[String(value)] || String(value || 'Sin estado');

const formatDate = (value: unknown) => {
  if (!value) return 'Sin fecha';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' });
};

const PanelHeader: React.FC<{ icon: React.ReactNode; title: string; description: string; onRefresh?: () => void; loading?: boolean }> = ({ icon, title, description, onRefresh, loading }) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">{icon}{title}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    {onRefresh && <Button variant="secondary" size="sm" icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />} onClick={onRefresh} disabled={loading}>Actualizar</Button>}
  </div>
);

const ErrorBox: React.FC<{ message?: string }> = ({ message }) => message ? <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null;

async function loadOperations(): Promise<{ data: LoadedData; error: string }> {
  const [shipments, drivers, branches, routes, cod, international] = await Promise.all([
    ApiClient.getShipments(),
    ApiClient.getDrivers(),
    ApiClient.getBranches(),
    ApiClient.getRoutes(),
    ApiClient.getCodLedger(),
    ApiClient.getInternationalPackages(),
  ]);
  const errors = [shipments, drivers, branches, routes, cod, international].filter((result) => !result.success).map((result) => result.error);
  return {
    data: {
      shipments: shipments.success ? shipments.shipments || [] : [],
      drivers: drivers.success ? drivers.drivers || [] : [],
      branches: branches.success ? branches.branches || [] : [],
      routes: routes.success ? routes.routes || [] : [],
      cod: cod.success ? cod.transactions || [] : [],
      international: international.success ? international.packages || [] : [],
    },
    error: errors.join(' · '),
  };
}

export const ProductionAdminDashboard: React.FC = () => {
  const { formatMoney, setActiveSubView, setIsNewShipmentModalOpen } = useApp();
  const [data, setData] = useState<LoadedData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const result = await loadOperations();
    setData(result.data);
    setError(result.error);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayShipments = data.shipments.filter((shipment) => String(shipment.created_at || shipment.createdAt || '').slice(0, 10) === today);
  const inTransit = data.shipments.filter((shipment) => ['picked_up', 'at_branch', 'out_for_delivery'].includes(String(shipment.status))).length;
  const delivered = data.shipments.filter((shipment) => shipment.status === 'delivered').length;
  const codPending = data.cod.filter((transaction) => ['pending_collection', 'collected_driver', 'received_branch', 'reconciled'].includes(String(transaction.status))).reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const activeRoutes = data.routes.filter((route) => ['assigned', 'in_progress'].includes(String(route.status))).length;
  const activeDrivers = data.drivers.filter((driver) => ['available', 'idle', 'on_route', 'in_motion'].includes(String(driver.status))).length;
  const currentMonthIncome = data.shipments.filter((shipment) => String(shipment.created_at || shipment.createdAt || '').slice(0, 7) === today.slice(0, 7)).reduce((sum, shipment) => sum + toNumber(shipment.shipping_cost || shipment.shippingCost), 0);

  return <div className="space-y-6">
    <PanelHeader icon={<BarChart3 className="h-6 w-6 text-indigo-600" />} title="Centro operativo GoPaq" description="Indicadores calculados desde PostgreSQL del tenant actual. Cuando no hay registros, se muestra cero y no una cifra estimada." onRefresh={() => void load()} loading={loading} />
    <ErrorBox message={error} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Envíos creados hoy" value={String(todayShipments.length)} subtitle={`${data.shipments.length} registros consultados`} icon={<Package className="h-5 w-5" />} accent="indigo" onClick={() => setActiveSubView('envios')} />
      <MetricCard title="En tránsito" value={String(inTransit)} subtitle={`${delivered} entregados en el tenant`} icon={<Truck className="h-5 w-5" />} accent="purple" />
      <MetricCard title="COD bajo custodia" value={formatMoney(codPending)} subtitle="Pendiente de flujo financiero" icon={<DollarSign className="h-5 w-5" />} accent="amber" onClick={() => setActiveSubView('cod')} />
      <MetricCard title="Ingresos registrados" value={formatMoney(currentMonthIncome)} subtitle="Costo de envíos del mes actual" icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Drivers activos</p><p className="mt-1 text-2xl font-black">{activeDrivers}</p><p className="text-[11px] text-slate-500">de {data.drivers.length} registrados</p></Card>
      <Card className="p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Rutas activas</p><p className="mt-1 text-2xl font-black">{activeRoutes}</p><p className="text-[11px] text-slate-500">estado persistido</p></Card>
      <Card className="p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Sucursales</p><p className="mt-1 text-2xl font-black">{data.branches.length}</p><p className="text-[11px] text-slate-500">publicadas en el tenant</p></Card>
      <Card className="p-4"><p className="text-[11px] font-bold uppercase text-slate-400">Internacional</p><p className="mt-1 text-2xl font-black">{data.international.length}</p><p className="text-[11px] text-slate-500">paquetes registrados</p></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="p-0 overflow-hidden"><div className="border-b border-slate-200 p-4 dark:border-slate-800"><h3 className="flex items-center gap-2 text-sm font-bold"><Radio className="h-4 w-4 text-emerald-500" />Últimos envíos registrados</h3></div>{loading ? <p className="p-6 text-sm text-slate-500">Consultando el backend…</p> : !data.shipments.length ? <p className="p-6 text-sm text-slate-500">No hay envíos persistidos en este tenant.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{data.shipments.slice(0, 8).map((shipment) => <div key={shipment.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-mono text-xs font-bold">{shipment.tracking_number || shipment.trackingNumber}</p><p className="text-xs text-slate-500">{shipment.destination?.city || 'Destino no indicado'} · {formatDate(shipment.created_at || shipment.createdAt)}</p></div><StatusBadge status={shipment.status} label={statusLabel(shipment.status)} size="sm" /></div>)}</div>}</Card>
      <Card className="space-y-4"><h3 className="flex items-center gap-2 text-sm font-bold"><ServerCog className="h-4 w-4 text-indigo-600" />Acciones operativas</h3><p className="text-xs leading-5 text-slate-500">Cada acción de negocio debe terminar en una confirmación de API. Las capacidades externas sin credenciales permanecen identificadas como no configuradas.</p><div className="grid gap-2"><Button variant="primary" onClick={() => setIsNewShipmentModalOpen(true)}>Crear envío mediante API</Button><Button variant="secondary" onClick={() => setActiveSubView('rutas')}>Abrir despacho</Button><Button variant="secondary" onClick={() => setActiveSubView('mapa-flota')}>Ver telemetría registrada</Button></div></Card>
    </div>
  </div>;
};

export const ProductionOperationsConsole: React.FC = () => {
  const [data, setData] = useState<LoadedData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); const result = await loadOperations(); setData(result.data); setError(result.error); setLoading(false); };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PanelHeader icon={<Radio className="h-6 w-6 text-emerald-600" />} title="Consola operativa" description="Actividad real registrada por GoPaq. No se generan eventos, posiciones ni latencias artificiales." onRefresh={() => void load()} loading={loading} /><ErrorBox message={error} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><MetricCard title="Rutas en curso" value={String(data.routes.filter((route) => route.status === 'in_progress').length)} subtitle="Estado en PostgreSQL" icon={<RouteIcon className="h-5 w-5" />} accent="indigo" /><MetricCard title="Drivers con telemetría" value={String(data.drivers.filter((driver) => driver.current_lat != null && driver.current_lng != null).length)} subtitle="Coordenadas recibidas" icon={<MapPin className="h-5 w-5" />} accent="emerald" /><MetricCard title="Eventos COD" value={String(data.cod.length)} subtitle="Libro financiero actual" icon={<DollarSign className="h-5 w-5" />} accent="amber" /></div><Card className="p-0 overflow-hidden"><div className="border-b border-slate-200 p-4 dark:border-slate-800"><h3 className="text-sm font-bold">Rutas y estados</h3></div>{!data.routes.length ? <p className="p-6 text-sm text-slate-500">No hay rutas persistidas.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{data.routes.map((route) => <div key={route.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-mono text-xs font-bold">{route.id}</p><p className="text-xs text-slate-500">{route.name} · {route.driver_name || 'Sin conductor'} · {route.stops?.length || 0} paradas</p></div><StatusBadge status={route.status === 'in_progress' ? 'out_for_delivery' : route.status === 'completed' ? 'delivered' : 'pending'} label={statusLabel(route.status)} size="sm" /></div>)}</div>}</Card></div>;
};

export const ProductionFleetPanel: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); const result = await ApiClient.getDrivers(); if (result.success) { setDrivers(result.drivers || []); setError(''); } else setError(result.error); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const withPosition = useMemo(() => drivers.filter((driver) => driver.current_lat != null && driver.current_lng != null), [drivers]);
  return <div className="space-y-6"><PanelHeader icon={<Truck className="h-6 w-6 text-indigo-600" />} title="Flota y telemetría registrada" description="Solo se muestran las posiciones y métricas enviadas por la app Driver al backend. Sin coordenadas, no se dibuja una posición." onRefresh={() => void load()} loading={loading} /><ErrorBox message={error} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><MetricCard title="Conductores" value={String(drivers.length)} subtitle="Registros activos" icon={<UserRound className="h-5 w-5" />} accent="indigo" /><MetricCard title="Con GPS recibido" value={String(withPosition.length)} subtitle="Última posición persistida" icon={<MapPin className="h-5 w-5" />} accent="emerald" /><MetricCard title="Sin telemetría" value={String(drivers.length - withPosition.length)} subtitle="No se inventa ubicación" icon={<WifiOff className="h-5 w-5" />} accent="amber" /></div><Card className="p-0 overflow-hidden"><div className="border-b border-slate-200 p-4 dark:border-slate-800"><h3 className="text-sm font-bold">Detalle de telemetría</h3></div>{!drivers.length ? <p className="p-6 text-sm text-slate-500">No hay conductores activos registrados.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{drivers.map((driver) => { const hasPosition = driver.current_lat != null && driver.current_lng != null; return <div key={driver.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm font-bold">{driver.name}</p><p className="text-xs text-slate-500">{driver.vehicle_type || 'Vehículo no indicado'} · {driver.vehicle_plate || 'Placa no indicada'}</p></div><div className="text-right text-xs">{hasPosition ? <><p className="font-mono text-emerald-700">{toNumber(driver.current_lat).toFixed(6)}, {toNumber(driver.current_lng).toFixed(6)}</p><p className="text-slate-500">{toNumber(driver.speed).toFixed(1)} km/h · batería {driver.battery == null ? '—' : `${toNumber(driver.battery).toFixed(0)}%`}</p></> : <p className="text-amber-700">Sin telemetría recibida</p>}</div></div>; })}</div>}</Card></div>;
};

export const ProductionBranchScanner: React.FC = () => {
  const { addToast } = useApp();
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [action, setAction] = useState<'receive' | 'store' | 'dispatch'>('store');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { ApiClient.getBranches().then((result) => { if (result.success) { setBranches(result.branches || []); setBranchId(result.branches?.[0]?.id || ''); } else setError(result.error); }); }, []);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!branchId || !trackingNumber.trim()) return; setBusy(true); setError(''); const result = await ApiClient.scanBranchShipment(branchId, { trackingNumber: trackingNumber.trim(), action, location: location.trim() || undefined }, `branch-scan-${crypto.randomUUID()}`); setBusy(false); if (!result.success) { setError(result.error); return; } addToast('success', 'Escaneo confirmado', `La guía ${result.trackingNumber} quedó en estado ${statusLabel(result.status)}.`); setTrackingNumber(''); };
  return <div className="space-y-6"><PanelHeader icon={<ScanLine className="h-6 w-6 text-indigo-600" />} title="Escaneo de sucursal" description="El código debe existir en el tenant y la transición será validada por el motor de sucursales." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-bold">Sucursal<select required value={branchId} onChange={(event) => setBranchId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label><label className="block text-xs font-bold">Número de guía<input required value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm" placeholder="GP-..." /></label><label className="block text-xs font-bold">Acción<select value={action} onChange={(event) => setAction(event.target.value as typeof action)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="receive">Recibir</option><option value="store">Almacenar</option><option value="dispatch">Despachar</option></select></label><label className="block text-xs font-bold">Ubicación física opcional<input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" placeholder="Rack / bin" /></label><Button type="submit" variant="primary" className="w-full" disabled={busy || !branchId}>{busy ? 'Confirmando…' : 'Confirmar escaneo'}</Button></form></Card><Card className="space-y-4"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h3 className="text-sm font-bold">Control de integridad</h3></div><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">No se crean paquetes al leer un código desconocido. La operación falla y conserva el error devuelto por el servidor.</p><div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"><p className="font-bold">Idempotencia activa</p><p className="mt-1">Cada intento utiliza una clave única y el backend evita repetir la transición si la petición se reintenta.</p></div></Card></div></div>;
};

export const ProductionQuotePanel: React.FC = () => {
  const { formatMoney } = useApp();
  const [form, setForm] = useState({ serviceType: 'local', originCity: 'Santo Domingo', destCity: 'Santo Domingo', weightKg: '1', lengthCm: '20', widthCm: '15', heightCm: '10', declaredValueUsd: '0', codAmount: '0' });
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(''); const result = await ApiClient.calculateQuote({ ...form, weightKg: Number(form.weightKg), lengthCm: Number(form.lengthCm), widthCm: Number(form.widthCm), heightCm: Number(form.heightCm), declaredValueUsd: Number(form.declaredValueUsd), codAmount: Number(form.codAmount) }); setLoading(false); if (!result.success) { setError(result.error); setQuote(null); return; } setQuote(result.quote); };
  return <div className="space-y-6"><PanelHeader icon={<DollarSign className="h-6 w-6 text-indigo-600" />} title="Cotizador conectado" description="Las tarifas y recargos provienen exclusivamente del motor de tarifas del backend. Esta pantalla no mantiene una matriz local ni calcula precios por su cuenta." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[1fr_.8fr]"><Card><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Servicio<select value={form.serviceType} onChange={(event) => update('serviceType', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="local">Local</option><option value="express">Express</option><option value="nacional">Nacional</option><option value="internacional">Internacional</option><option value="mudanza">Mudanza</option><option value="carga_pesada">Carga pesada</option></select></label><label className="text-xs font-bold">Peso (kg)<input required type="number" min="0.1" step="0.1" value={form.weightKg} onChange={(event) => update('weightKg', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Origen<input required value={form.originCity} onChange={(event) => update('originCity', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Destino<input required value={form.destCity} onChange={(event) => update('destCity', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Largo (cm)<input required type="number" min="1" value={form.lengthCm} onChange={(event) => update('lengthCm', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Ancho (cm)<input required type="number" min="1" value={form.widthCm} onChange={(event) => update('widthCm', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Alto (cm)<input required type="number" min="1" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">COD (DOP)<input type="number" min="0" value={form.codAmount} onChange={(event) => update('codAmount', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><div className="sm:col-span-2"><Button type="submit" variant="primary" disabled={loading}>{loading ? 'Consultando motor…' : 'Calcular tarifa real'}</Button></div></form></Card><Card className="flex min-h-64 flex-col justify-center bg-slate-950 text-white">{quote ? <><p className="text-xs font-black uppercase tracking-widest text-orange-400">Respuesta del backend</p><p className="mt-4 text-4xl font-black">{formatMoney(toNumber(quote.total), quote.currency)}</p><div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-300"><p className="flex justify-between"><span>Peso facturable</span><b className="text-white">{quote.billableWeightKg} kg</b></p><p className="flex justify-between"><span>Servicio</span><b className="text-white">{quote.serviceType}</b></p><p className="flex justify-between"><span>Referencia</span><b className="text-white">{quote.quoteReference || 'Sin referencia'}</b></p></div></> : <><p className="text-xs font-black uppercase tracking-widest text-orange-400">Sin cotización cargada</p><p className="mt-4 text-2xl font-black">Consulta la tarifa del tenant.</p><p className="mt-3 text-sm leading-6 text-slate-300">Si no existe una matriz activa, el backend rechaza la operación y no se muestra un precio predeterminado.</p></>}</Card></div></div>;
};

export const ProductionBranchNetwork: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); const result = await ApiClient.getBranches(); if (!result.success) { setError(result.error); setLoading(false); return; } const list = result.branches || []; setBranches(list); const target = selected && list.find((branch) => branch.id === selected.id) || list[0]; setSelected(target || null); if (target) { const stock = await ApiClient.getBranchInventory(target.id); if (stock.success) setInventory(stock.inventory || []); else setError(stock.error); } else setInventory([]); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const choose = async (branch: any) => { setSelected(branch); const result = await ApiClient.getBranchInventory(branch.id); if (result.success) { setInventory(result.inventory || []); setError(''); } else setError(result.error); };
  return <div className="space-y-6"><PanelHeader icon={<Building2 className="h-6 w-6 text-indigo-600" />} title="Sucursales y almacenes" description="Ubicaciones e inventario consultados desde el motor de sucursales. No se estiman capacidades ni movimientos." onRefresh={() => void load()} loading={loading} /><ErrorBox message={error} />{!branches.length && !loading ? <Card><p className="text-sm text-slate-500">No hay sucursales activas registradas.</p></Card> : <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><div className="space-y-3">{branches.map((branch) => <button key={branch.id} onClick={() => void choose(branch)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id === branch.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{branch.name}</p><p className="mt-1 text-xs text-slate-500">{branch.code} · {branch.city}</p></div>{branch.is_hub ? <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold text-white">HUB</span> : null}</div><p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{branch.address}</p></button>)}</div><Card><div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800"><div><h3 className="text-sm font-bold">Inventario persistido</h3><p className="mt-1 text-xs text-slate-500">{selected?.name || 'Selecciona una sucursal'}</p></div><span className="font-mono text-xs text-slate-500">{inventory.length} registros</span></div>{!inventory.length ? <p className="py-8 text-sm text-slate-500">No hay paquetes en inventario para esta sucursal.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{inventory.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><span className="font-mono font-bold">{item.tracking_number || item.trackingNumber}</span><span className="text-slate-500">{item.status}</span><span className="text-slate-500">{item.current_location_json ? 'Ubicación registrada' : 'Sin ubicación física'}</span></div>)}</div>}</Card></div>}</div>;
};

export const ProductionClientDirectory: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); const result = await ApiClient.getClients(); if (result.success) { setClients(result.clients || []); setError(''); } else setError(result.error); setLoading(false); };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PanelHeader icon={<UserRound className="h-6 w-6 text-indigo-600" />} title="Clientes" description="Directorio consultado desde PostgreSQL del tenant actual. Las altas se realizan con validación y persistencia en el backend." onRefresh={() => void load()} loading={loading} /><ErrorBox message={error} /><Card className="p-0 overflow-hidden"><div className="border-b border-slate-200 p-4 text-sm font-bold dark:border-slate-800">{clients.length} clientes activos</div>{!clients.length ? <p className="p-6 text-sm text-slate-500">No hay clientes registrados.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{clients.map((client) => <div key={client.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm font-bold">{client.company_name || client.companyName || client.name}</p><p className="text-xs text-slate-500">{client.email} · {client.phone || 'Teléfono no indicado'}</p></div><div className="text-right text-xs text-slate-500"><p>{client.tier || 'Sin segmento'}</p><p>Saldo: {client.balance ?? 0}</p></div></div>)}</div>}</Card></div>;
};

export const ProductionShipmentsManager: React.FC = () => {
  const { setIsNewShipmentModalOpen, setSelectedTracking, setActiveSubView } = useApp();
  const [shipments, setShipments] = useState<any[]>([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); const result = await ApiClient.getShipments(); if (result.success) { setShipments(result.shipments || []); setError(''); } else setError(result.error); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const visible = shipments.filter((shipment) => { const needle = search.toLowerCase(); const text = `${shipment.tracking_number || shipment.trackingNumber || ''} ${shipment.destination?.name || ''} ${shipment.destination?.city || ''}`.toLowerCase(); return (!needle || text.includes(needle)) && (status === 'all' || shipment.status === status); });
  const openTracking = (shipment: any) => { setSelectedTracking(shipment.tracking_number || shipment.trackingNumber); setActiveSubView('rastreo'); };
  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-extrabold"><Package className="h-6 w-6 text-indigo-600" />Envíos</h2><p className="mt-1 text-xs text-slate-500">Listado y estados obtenidos del motor de envíos del tenant actual.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Actualizar</Button><Button variant="primary" size="sm" onClick={() => setIsNewShipmentModalOpen(true)}>Crear envío</Button></div></div><ErrorBox message={error} /><Card className="flex flex-wrap gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar guía, destinatario o ciudad" className="min-w-64 flex-1 rounded-xl border border-slate-200 p-3 text-sm" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm"><option value="all">Todos los estados</option>{Object.entries(statusText).filter(([key]) => !['draft', 'assigned', 'in_progress', 'completed'].includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Card><Card className="overflow-hidden p-0">{loading ? <p className="p-6 text-sm text-slate-500">Cargando envíos…</p> : !visible.length ? <p className="p-6 text-sm text-slate-500">No hay envíos que coincidan con el filtro.</p> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map((shipment) => <div key={shipment.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-mono text-sm font-bold">{shipment.tracking_number || shipment.trackingNumber}</p><p className="mt-1 text-xs text-slate-500">{shipment.origin?.city || 'Origen no indicado'} → {shipment.destination?.city || 'Destino no indicado'} · {shipment.destination?.name || 'Destinatario no indicado'}</p></div><div className="flex items-center gap-3"><StatusBadge status={shipment.status} label={statusLabel(shipment.status)} size="sm" /><button type="button" onClick={() => openTracking(shipment)} className="text-xs font-bold text-indigo-600 hover:underline">Ver tracking</button></div></div>)}</div>}</Card></div>;
};

export const ProductionUnavailablePanel: React.FC<{ title: string; description: string; icon?: React.ReactNode; provider?: string }> = ({ title, description, icon = <XCircle className="h-6 w-6 text-amber-600" />, provider }) => <div className="space-y-6"><PanelHeader icon={icon} title={title} description={description} /><Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20"><div className="flex items-start gap-3 text-amber-900 dark:text-amber-200"><CircleDot className="mt-0.5 h-5 w-5 shrink-0" /><div><h3 className="font-bold">{provider ? `${provider}: NO CONFIGURADO` : 'Capacidad no configurada'}</h3><p className="mt-2 text-sm leading-6">{description} Esta pantalla no simula éxito ni inventa registros. Cuando el servicio y su endpoint persistente estén disponibles, podrá habilitarse mediante un adaptador.</p></div></div></Card></div>;

export const ProductionSettingsPanel: React.FC = () => {
  const [ready, setReady] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); const [readiness, health] = await Promise.all([ApiClient.getReadiness(), ApiClient.getIntegrationsHealth()]); if (readiness.success) setReady(readiness); else setError(readiness.error); if (health.success) setIntegrations(health); else setError((current) => current ? `${current} · ${health.error}` : health.error); setLoading(false); };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PanelHeader icon={<ServerCog className="h-6 w-6 text-indigo-600" />} title="Estado y configuración de producción" description="La configuración sensible se administra por secretos del entorno y no se guarda desde una pantalla local." onRefresh={() => void load()} loading={loading} /><ErrorBox message={error} /><div className="grid gap-4 md:grid-cols-2"><Card><div className="flex items-center gap-2"><Database className="h-5 w-5 text-indigo-600" /><h3 className="text-sm font-bold">Dependencias críticas</h3></div><div className="mt-4 space-y-3 text-sm"><StatusLine label="API" ok={!!ready?.success} value={ready?.status || 'Sin respuesta'} /><StatusLine label="PostgreSQL / PostGIS" ok={ready?.database?.ok} value={ready?.database?.version || 'Sin respuesta'} /><StatusLine label="Redis" ok={ready?.redis?.ok} value={ready?.redis?.status || 'Sin respuesta'} /><StatusLine label="Migraciones" ok={ready?.migrations} value={ready?.migrations ? 'Aplicadas' : 'Sin confirmar'} /></div></Card><Card><div className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-indigo-600" /><h3 className="text-sm font-bold">Proveedores externos</h3></div><div className="mt-4 space-y-3 text-sm"><StatusLine label="Witylogix" ok={integrations?.witylogix?.status === 'ONLINE'} value={integrations?.witylogix?.status || 'NO CONFIGURADO'} /><StatusLine label="Karrio" ok={integrations?.karrio?.status === 'ONLINE'} value={integrations?.karrio?.status || 'NO CONFIGURADO'} /></div><p className="mt-4 text-xs leading-5 text-slate-500">WhatsApp, SMS, email, pagos, IA y almacenamiento externo permanecen deshabilitados mientras no existan credenciales verificables.</p></Card></div><Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" /><div><h3 className="font-bold">Cambios sensibles protegidos</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">No se ofrece un botón de “Guardar” para aparentar persistencia. Las variables de producción, TLS, base de datos, Redis y proveedores se controlan mediante deployment y auditoría del servidor.</p></div></div></Card></div>;
};

const StatusLine: React.FC<{ label: string; value: string; ok?: boolean }> = ({ label, value, ok }) => <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"><span className="text-slate-600 dark:text-slate-300">{label}</span><span className={`flex items-center gap-1 text-xs font-bold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}{value}</span></div>;

export const ProductionClientRegistration: React.FC = () => {
  const { addToast } = useApp();
  const [form, setForm] = useState({ name: '', companyName: '', email: '', phone: '', rncTaxId: '', branchId: '' });
  const [branches, setBranches] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { ApiClient.getBranches().then((result) => { if (result.success) { setBranches(result.branches || []); setForm((current) => ({ ...current, branchId: current.branchId || result.branches?.[0]?.id || '' })); } else setError(result.error); }); }, []);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); setError(''); const result = await ApiClient.createClient(form); setBusy(false); if (!result.success) { setError(result.error); return; } addToast('success', 'Cliente registrado', 'El backend confirmó el registro y la cuenta quedó persistida.'); setForm({ name: '', companyName: '', email: '', phone: '', rncTaxId: '', branchId: branches[0]?.id || '' }); };
  return <div className="space-y-6"><PanelHeader icon={<UserRound className="h-6 w-6 text-indigo-600" />} title="Registro de clientes" description="Alta real de clientes en la organización actual. Cada cliente debe pertenecer a una sucursal activa; no se generan lockers, API keys ni coordenadas ficticias." /><ErrorBox message={error} /><Card><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><label className="text-xs font-bold">Nombre<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Empresa opcional<input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Correo<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Teléfono<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">RNC / identificación<input value={form.rncTaxId} onChange={(event) => setForm({ ...form, rncTaxId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="text-xs font-bold">Sucursal<select required value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="" disabled>Selecciona una sucursal</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><div className="md:col-span-2"><Button type="submit" variant="primary" disabled={busy || !form.branchId}>{busy ? 'Guardando…' : 'Registrar cliente'}</Button></div></form></Card></div>;
};
