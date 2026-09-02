import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Box, FileText, Globe, Layers, Plane, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

export const InternationalCourier: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'paquetes' | 'manifiestos' | 'aduanas' | 'casilleros'>('paquetes');
  const [packages, setPackages] = useState<any[]>([]);
  const [lockers, setLockers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [packagesRes, lockersRes] = await Promise.all([ApiClient.getInternationalPackages(), ApiClient.getInternationalLockers()]);
    if (packagesRes.success) setPackages(packagesRes.packages || []); else setError(packagesRes.error);
    if (lockersRes.success) setLockers(lockersRes.lockers || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => packages.filter(pkg => `${pkg.tracking_number} ${pkg.merchant_name || ''} ${pkg.description || ''}`.toLowerCase().includes(search.toLowerCase())), [packages, search]);
  const selectable = filtered.filter(pkg => !['consolidated', 'delivered'].includes(pkg.status));
  const consolidate = async () => {
    if (selected.length < 2) return;
    const result = await ApiClient.consolidateInternationalPackages(selected, 'Consolidación solicitada desde operaciones');
    if (!result.success) { addToast('error', 'No se consolidaron los paquetes', result.error); return; }
    addToast('success', 'Consolidación guardada', `${result.packagesConsolidated} paquetes vinculados al master ${result.masterTracking}.`);
    setSelected([]); await load();
  };

  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-6 h-6 text-indigo-600" />Courier internacional</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Paquetes, casilleros y consolidaciones consultados desde el motor internacional.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>Actualizar</Button><Button variant="primary" size="sm" icon={<Layers className="w-4 h-4" />} disabled={selected.length < 2} onClick={() => void consolidate()}>Consolidar ({selected.length})</Button></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><MetricCard title="Paquetes registrados" value={String(packages.length)} subtitle="Datos del tenant actual" icon={<Box className="w-5 h-5" />} accent="indigo" /><MetricCard title="Listos para consolidar" value={String(selectable.length)} subtitle="Estados operables" icon={<Layers className="w-5 h-5" />} accent="blue" /><MetricCard title="Consolidados" value={String(packages.filter(pkg => pkg.status === 'consolidated').length)} subtitle="Consolidación persistida" icon={<Plane className="w-5 h-5" />} accent="purple" /><MetricCard title="Casilleros" value={String(lockers.length)} subtitle="Asignados en este tenant" icon={<ShieldCheck className="w-5 h-5" />} accent="emerald" /></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto">{([['paquetes', 'Paquetes'], ['manifiestos', 'Manifiestos'], ['aduanas', 'Aduanas'], ['casilleros', 'Casilleros']] as const).map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`pb-3 px-3 border-b-2 whitespace-nowrap ${activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>{label}</button>)}</div>
    {activeTab === 'paquetes' && <Card className="p-0 overflow-hidden"><div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-3"><h3 className="text-sm font-bold">Paquetes internacionales</h3><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tracking, tienda o descripción" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs" /></div>{loading ? <p className="p-6 text-sm text-slate-500">Cargando paquetes desde GoPaq…</p> : !filtered.length ? <p className="p-6 text-sm text-slate-500">No hay paquetes registrados.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase text-slate-500"><tr><th className="p-3">Seleccionar</th><th className="p-3">Tracking</th><th className="p-3">Tienda</th><th className="p-3">Descripción</th><th className="p-3">Peso / valor</th><th className="p-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(pkg => <tr key={pkg.id}><td className="p-3"><input type="checkbox" disabled={['consolidated', 'delivered'].includes(pkg.status)} checked={selected.includes(pkg.id)} onChange={() => setSelected(prev => prev.includes(pkg.id) ? prev.filter(id => id !== pkg.id) : [...prev, pkg.id])} /></td><td className="p-3 font-mono font-bold">{pkg.tracking_number}</td><td className="p-3">{pkg.merchant_name || '—'}</td><td className="p-3">{pkg.description}</td><td className="p-3 font-mono">{pkg.weight_lbs} lb · US$ {Number(pkg.declared_value_usd || 0).toFixed(2)}</td><td className="p-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{pkg.status}</span></td></tr>)}</tbody></table></div>}</Card>}
    {activeTab === 'casilleros' && <Card><h3 className="text-sm font-bold mb-4">Casilleros registrados</h3>{!lockers.length ? <p className="text-sm text-slate-500">No hay casilleros en este tenant.</p> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{lockers.map(locker => <div key={locker.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"><p className="font-mono font-bold text-indigo-600">{locker.locker_code}</p><p className="mt-2 text-xs text-slate-500">{locker.client_name || 'Cliente no disponible'}</p><p className="mt-3 text-xs">{locker.us_address || 'Dirección USA no configurada'}</p></div>)}</div>}</Card>}
    {(activeTab === 'manifiestos' || activeTab === 'aduanas') && <Card><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-amber-600" /><div><h3 className="text-sm font-bold">{activeTab === 'manifiestos' ? 'Manifiestos y vuelos' : 'Aduanas'}</h3><p className="mt-1 text-sm text-slate-500">No hay registros persistidos ni proveedor externo configurado para esta vista. GoPaq no muestra datos inventados.</p></div></div></Card>}
  </div>;
};
