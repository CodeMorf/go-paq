import React, { useEffect, useState } from 'react';
import { AlertCircle, Barcode, Layers, RefreshCw } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { Button, Card } from '../ui/DesignSystem';

const parse = (value: unknown) => { try { return typeof value === 'string' ? JSON.parse(value || '{}') : value || {}; } catch { return {}; } };

export const BranchInventory: React.FC = () => {
  const [branch, setBranch] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [scanCode, setScanCode] = useState('');
  const [location, setLocation] = useState('');
  const [action, setAction] = useState<'receive' | 'store' | 'dispatch'>('store');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const branches = await ApiClient.getBranches();
    const selected = branches.success ? branches.branches?.[0] : null;
    if (!selected) { setError(branches.success ? 'No hay sucursal asignada a esta cuenta.' : branches.error); setLoading(false); return; }
    setBranch(selected);
    const result = await ApiClient.getBranchInventory(selected.id);
    if (result.success) { setInventory(result.inventory || []); setError(''); } else setError(result.error);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const handleScan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!branch || !scanCode.trim()) return;
    setSubmitting(true);
    const result = await ApiClient.scanBranchShipment(branch.id, { trackingNumber: scanCode.trim(), action, location: location.trim() || undefined }, `branch-scan-${crypto.randomUUID()}`);
    setSubmitting(false);
    if (!result.success) { setError(result.error); return; }
    setScanCode(''); setLocation(''); setError(''); await load();
  };

  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Layers className="w-6 h-6 text-indigo-600" />Almacén y escaneo · {branch?.name || 'Sucursal'}</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recepciones, ubicación y despacho con estado persistido en el servidor.</p></div><Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>Actualizar</Button></div><form onSubmit={handleScan} className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div className="relative flex-1 min-w-48"><Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input required value={scanCode} onChange={e => setScanCode(e.target.value)} placeholder="Guía o tracking" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono" /></div><select value={action} onChange={e => setAction(e.target.value as any)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"><option value="receive">Recibir</option><option value="store">Almacenar</option><option value="dispatch">Despachar</option></select><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Rack / ubicación (opcional)" className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs" /><Button variant="primary" size="sm" type="submit" disabled={submitting || !branch}>{submitting ? 'Procesando…' : 'Registrar escaneo'}</Button></form>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}<Card className="p-0 overflow-hidden"><div className="p-4 border-b border-slate-200 dark:border-slate-800"><h3 className="text-sm font-bold">Paquetes en custodia ({inventory.length})</h3></div>{loading ? <p className="p-6 text-sm text-slate-500">Cargando inventario desde GoPaq…</p> : !inventory.length ? <p className="p-6 text-sm text-slate-500">No hay paquetes en custodia en esta sucursal.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase text-slate-500"><tr><th className="p-3">Tracking</th><th className="p-3">Destinatario</th><th className="p-3">Ubicación</th><th className="p-3">Peso</th><th className="p-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{inventory.map(item => { const packageData = parse(item.package); const currentLocation = parse(item.current_location_json); return <tr key={item.id}><td className="p-3 font-mono font-bold">{item.tracking_number || item.trackingNumber}</td><td className="p-3">{item.destination?.name || '—'}</td><td className="p-3 font-mono text-indigo-600">{currentLocation.location || 'Sin ubicación asignada'}</td><td className="p-3">{packageData.weightKg || '—'} kg</td><td className="p-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{item.status}</span></td></tr>; })}</tbody></table></div>}</Card></div>;
};
