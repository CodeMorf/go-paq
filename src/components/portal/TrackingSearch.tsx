import React, { useEffect, useState } from 'react';
import { AlertCircle, Package, Search } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, StatusBadge } from '../ui/DesignSystem';
import { TrackingTimeline } from '../ui/TrackingTimeline';

export const TrackingSearch: React.FC = () => {
  const { selectedTracking, setSelectedTracking } = useApp();
  const [query, setQuery] = useState(selectedTracking || '');
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const search = async (value: string) => {
    const tracking = value.trim();
    if (!tracking) return;
    setLoading(true); setError(''); setShipment(null); setSelectedTracking(tracking);
    const result = await ApiClient.getTracking(tracking);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setShipment(result.shipment);
  };
  useEffect(() => { if (selectedTracking) void search(selectedTracking); }, []);
  return <div className="mx-auto max-w-4xl space-y-6"><div className="space-y-3 text-center"><h2 className="text-2xl font-black text-slate-900 dark:text-white">Rastreo de guías</h2><p className="mx-auto max-w-md text-xs text-slate-500">La consulta llega al motor de tracking y solo muestra eventos registrados por GoPaq.</p><form onSubmit={(event) => { event.preventDefault(); void search(query); }} className="mx-auto flex max-w-lg gap-2"><label htmlFor="portal-tracking" className="sr-only">Número de guía</label><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="portal-tracking" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="GP-..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 font-mono text-xs font-bold" required /></div><Button variant="primary" size="md" type="submit" disabled={loading}>{loading ? 'Consultando…' : 'Rastrear'}</Button></form></div>{error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}{shipment ? <Card className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-indigo-600">{shipment.trackingNumber}</p><h3 className="mt-1 text-lg font-bold">{shipment.destination?.name || 'Destinatario'}</h3></div><StatusBadge status={shipment.status} size="sm" /></div><TrackingTimeline shipment={shipment} /></Card> : !loading && !error && <div className="space-y-3 rounded-2xl border border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900"><Package className="mx-auto h-10 w-10 text-indigo-400" /><p className="text-xs text-slate-500">Introduce una guía para consultar su historial real.</p></div>}</div>;
};
