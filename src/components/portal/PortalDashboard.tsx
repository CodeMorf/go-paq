import React, { useEffect, useState } from 'react';
import { Package, Globe, DollarSign, Truck, Plus, Search, Copy, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { MetricCard, Card, Button, StatusBadge } from '../ui/DesignSystem';

export const PortalDashboard: React.FC = () => {
  const { formatMoney, setActiveSubView, addToast, setSelectedTracking } = useApp();
  const [shipments, setShipments] = useState<any[]>([]);
  const [internationalPackages, setInternationalPackages] = useState<any[]>([]);
  const [lockers, setLockers] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    const [shipmentsRes, packagesRes, lockersRes, clientsRes] = await Promise.all([ApiClient.getShipments(), ApiClient.getInternationalPackages(), ApiClient.getInternationalLockers(), ApiClient.getClients()]);
    if (shipmentsRes.success) setShipments(shipmentsRes.shipments || []); else setError(shipmentsRes.error);
    if (packagesRes.success) setInternationalPackages(packagesRes.packages || []);
    if (lockersRes.success) setLockers(lockersRes.lockers || []);
    if (clientsRes.success) setClient(clientsRes.clients?.[0] || null);
    setLoading(false);
  };

  useEffect(() => { void loadDashboard(); }, []);

  const activeShipments = shipments.filter(s => !['delivered', 'cancelled'].includes(s.status));
  const myShipments = shipments.slice(0, 4);
  const copyLocker = async () => {
    const locker = lockers[0];
    if (!locker) return;
    const text = [client?.company_name || client?.name, locker.locker_code, locker.us_address].filter(Boolean).join(', ');
    try { await navigator.clipboard.writeText(text); addToast('success', 'Copiado', 'Dirección obtenida del servidor y copiada al portapapeles.'); }
    catch { addToast('error', 'No se pudo copiar', 'Copia la dirección manualmente.'); }
  };

  return <div className="space-y-6">
    <div className="p-6 bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/30 text-white flex flex-wrap items-center justify-between gap-4 shadow-md"><div className="space-y-1.5"><span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Portal de clientes</span><h2 className="text-xl font-black">{client?.company_name || client?.name || 'Cuenta de cliente'}</h2><p className="text-xs text-indigo-200/80 max-w-xl">Gestiona tus envíos, casilleros y estados de cuenta con información sincronizada desde GoPaq.</p></div><div className="flex items-center gap-3"><Button variant="secondary" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs" onClick={() => setActiveSubView('casillero')}>Ver casilleros</Button><Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setActiveSubView('crear-envio')}>Nuevo envío</Button></div></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><MetricCard title="Envíos activos" value={`${activeShipments.length} Guías`} subtitle={loading ? 'Sincronizando…' : 'Consultados en PostgreSQL'} icon={<Truck className="w-5 h-5" />} accent="indigo" onClick={() => setActiveSubView('tracking')} /><MetricCard title="Paquetes internacionales" value={`${internationalPackages.length} Cajas`} subtitle="Paquetes de tu cuenta" icon={<Globe className="w-5 h-5" />} accent="blue" onClick={() => setActiveSubView('paquetes-list')} /><MetricCard title="Saldo COD" value={formatMoney(Number(client?.cod_pending_balance || 0))} subtitle="Saldo registrado en cuenta" icon={<DollarSign className="w-5 h-5" />} accent="emerald" onClick={() => setActiveSubView('cuenta-corriente')} /><MetricCard title="Línea de crédito" value={formatMoney(Number(client?.credit_limit || 0))} subtitle={`Utilizado: ${formatMoney(Number(client?.balance || 0))}`} icon={<DollarSign className="w-5 h-5" />} accent="purple" /></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Truck className="w-4 h-4 text-indigo-600" />Mis envíos</h3><button onClick={() => setActiveSubView('tracking')} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Ver todos →</button></div><div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">{!loading && !myShipments.length && <p className="py-6 text-sm text-slate-500">No hay envíos registrados en esta cuenta.</p>}{myShipments.map(s => <div key={s.id} className="py-3 flex items-center justify-between gap-3"><div><span className="font-mono font-bold text-slate-900 dark:text-white block">{s.trackingNumber || s.tracking_number}</span><span className="text-[11px] text-slate-400">Destino: {s.destination?.name || '—'} ({s.destination?.city || '—'})</span></div><div className="flex items-center gap-3"><StatusBadge status={s.status} size="sm" /><Button size="sm" variant="ghost" onClick={() => { setSelectedTracking(s.trackingNumber || s.tracking_number); setActiveSubView('tracking'); }}>Rastrear</Button></div></div>)}</div></Card><Card className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-600" />Casillero asignado</h3><button onClick={() => setActiveSubView('casillero')} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Gestionar →</button></div>{lockers[0] ? <><div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2 text-slate-800 dark:text-slate-200"><div className="flex justify-between items-center gap-3"><span className="text-slate-400 font-sans">Cuenta:</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{client?.company_name || client?.name || 'Tu cuenta'}</span></div><div className="flex justify-between items-center gap-3"><span className="text-slate-400 font-sans">Código:</span><span>{lockers[0].locker_code}</span></div><div className="flex justify-between items-center gap-3"><span className="text-slate-400 font-sans">Dirección:</span><span className="text-right">{lockers[0].us_address || 'No configurada'}</span></div></div><Button variant="secondary" size="sm" className="w-full" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => void copyLocker()}>Copiar dirección asignada</Button></> : <p className="text-sm text-slate-500">No hay casillero asignado a esta cuenta.</p>}</Card></div>
  </div>;
};
