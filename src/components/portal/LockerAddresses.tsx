import React, { useEffect, useState } from 'react';
import { Globe, Copy, Plus, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card } from '../ui/DesignSystem';

type Locker = {
  id: string;
  locker_code: string;
  us_address?: string | null;
  es_address?: string | null;
  it_address?: string | null;
  client_name?: string;
};

export const LockerAddresses: React.FC = () => {
  const { addToast } = useApp();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrealertOpen, setIsPrealertOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockerId, setLockerId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [declaredValue, setDeclaredValue] = useState(0);
  const [weightLbs, setWeightLbs] = useState(1);
  const [description, setDescription] = useState('');

  const loadLockers = async () => {
    setLoading(true);
    const result = await ApiClient.getInternationalLockers();
    if (result.success) {
      setLockers(result.lockers || []);
      if (!lockerId && result.lockers?.[0]) setLockerId(result.lockers[0].id);
      setError('');
    } else setError(result.error);
    setLoading(false);
  };

  useEffect(() => { void loadLockers(); }, []);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast('success', 'Copiado', 'Dirección obtenida del servidor y copiada al portapapeles.');
    } catch { addToast('error', 'No se pudo copiar', 'Copia la dirección manualmente desde la tarjeta.'); }
  };

  const handlePrealert = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lockerId) { addToast('error', 'Casillero requerido', 'No tienes un casillero seleccionado.'); return; }
    setSubmitting(true);
    const result = await ApiClient.prealertInternational({ lockerId, merchantName: storeName, trackingNumber, declaredValueUsd: declaredValue, weightLbs, description }, `prealert-${crypto.randomUUID()}`);
    setSubmitting(false);
    if (!result.success) { addToast('error', 'No se guardó la pre-alerta', result.error); return; }
    addToast('success', 'Pre-alerta guardada', 'El paquete quedó registrado en el servidor con estado recibido en Miami.');
    setIsPrealertOpen(false);
    setStoreName(''); setTrackingNumber(''); setDeclaredValue(0); setWeightLbs(1); setDescription('');
  };

  const addressRows = (locker: Locker) => [
    ['Línea USA', locker.us_address],
    ['Línea España', locker.es_address],
    ['Línea Italia', locker.it_address]
  ].filter(([, value]) => value) as Array<[string, string]>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-6 h-6 text-indigo-600" /><span>Mis Casilleros Internacionales</span></h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Direcciones y pre-alertas sincronizadas con el motor internacional de GoPaq.</p>
        </div>
        <div className="flex gap-2"><Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void loadLockers()}>Actualizar</Button><Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setIsPrealertOpen(!isPrealertOpen)}>{isPrealertOpen ? 'Cerrar Pre-alerta' : 'Pre-alertar paquete'}</Button></div>
      </div>

      {isPrealertOpen && <Card className="bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" />Registrar compra internacional</h3><span className="text-[11px] text-slate-400">Persistirá como paquete recibido en Miami</span></div><form onSubmit={handlePrealert} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs"><label className="block">Casillero<select required value={lockerId} onChange={e => setLockerId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">{lockers.map(locker => <option key={locker.id} value={locker.id}>{locker.locker_code}</option>)}</select></label><label className="block">Tienda<input required value={storeName} onChange={e => setStoreName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><label className="block">Tracking externo<input required value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-mono" /></label><label className="block">Peso (lb)<input required type="number" min="0.01" step="0.01" value={weightLbs} onChange={e => setWeightLbs(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><label className="block">Valor declarado (USD)<input required type="number" min="0" step="0.01" value={declaredValue} onChange={e => setDeclaredValue(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><label className="block sm:col-span-2">Descripción<input required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><div className="flex items-end justify-end"><Button type="submit" variant="primary" size="sm" disabled={submitting || !lockers.length}>{submitting ? 'Guardando…' : 'Guardar en GoPaq'}</Button></div></form></Card>}

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {loading ? <Card><p className="text-sm text-slate-500">Cargando casilleros desde GoPaq…</p></Card> : !lockers.length ? <Card><p className="text-sm text-slate-500">No hay casilleros asignados a esta cuenta.</p></Card> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{lockers.map(locker => <Card key={locker.id} className="space-y-4"><div className="flex items-center justify-between"><span className="text-3xl">🌎</span><span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">{locker.locker_code}</span></div><div><h3 className="text-base font-bold text-slate-900 dark:text-white">Casillero internacional</h3><p className="text-xs text-slate-500">Asignado a {locker.client_name || 'tu cuenta'}</p></div><div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl font-mono text-xs space-y-2 border border-slate-200/70 dark:border-slate-700/60">{addressRows(locker).map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-slate-400 font-sans">{label}:</span><span className="text-slate-800 dark:text-slate-200 text-right">{value}</span></div>)}</div><Button variant="secondary" size="sm" className="w-full text-xs" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => handleCopy(addressRows(locker).map(([, value]) => value).join(', '))}>Copiar dirección real</Button></Card>)}</div>}
    </div>
  );
};
