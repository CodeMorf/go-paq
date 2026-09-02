import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, ExternalLink, MapPin, Navigation, PackageCheck, Phone, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { GoPaqLogo } from '../ui/GoPaqLogo';
import { SignaturePad } from '../ui/SignaturePad';

type DriverStop = {
  id: string;
  sequenceOrder: number;
  shipmentId?: string;
  trackingNumber: string;
  type: 'pickup' | 'delivery';
  recipientName: string;
  phone?: string;
  address: string;
  lat?: number;
  lng?: number;
  status: 'pending' | 'arrived' | 'completed' | 'failed' | 'skipped';
  codAmount: number;
  packageSummary: string;
  completedAt?: string;
  notes?: string;
};

type Manifest = { driver: any; route: any | null; stops: DriverStop[] };
type PendingOperation = { id: string; kind: 'start' | 'complete' | 'fail'; routeId?: string; stopId?: string; payload: any; idempotencyKey: string; createdAt: string };

const DB_NAME = 'gopaq-driver-offline';
const STORE_NAME = 'operations';

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el outbox local.'));
  });
}

async function readOfflineOperations(): Promise<PendingOperation[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll(); request.onsuccess = () => { db.close(); resolve(request.result as PendingOperation[]); }; request.onerror = () => { db.close(); reject(request.error); }; });
}

async function saveOfflineOperation(operation: PendingOperation) {
  const db = await openOfflineDb();
  return new Promise<void>((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(operation); request.onsuccess = () => { db.close(); resolve(); }; request.onerror = () => { db.close(); reject(request.error); }; });
}

async function removeOfflineOperation(id: string) {
  const db = await openOfflineDb();
  return new Promise<void>((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id); request.onsuccess = () => { db.close(); resolve(); }; request.onerror = () => { db.close(); reject(request.error); }; });
}

function normalizeStop(raw: any): DriverStop {
  const address = raw.address && typeof raw.address === 'object' ? raw.address : {};
  return {
    id: String(raw.id),
    sequenceOrder: Number(raw.sequence_order ?? raw.sequenceOrder ?? 0),
    shipmentId: raw.shipment_id || raw.shipmentId || undefined,
    trackingNumber: String(raw.tracking_number || raw.trackingNumber || ''),
    type: raw.type === 'pickup' ? 'pickup' : 'delivery',
    recipientName: String(raw.contact_name || raw.recipientName || address.name || 'Contacto'),
    phone: raw.contact_phone || raw.phone || address.phone || undefined,
    address: typeof raw.address === 'string' ? raw.address : [address.street || address.address, address.sector, address.city].filter(Boolean).join(', '),
    lat: Number.isFinite(Number(address.lat)) ? Number(address.lat) : undefined,
    lng: Number.isFinite(Number(address.lng)) ? Number(address.lng) : undefined,
    status: ['pending', 'arrived', 'completed', 'failed', 'skipped'].includes(raw.status) ? raw.status : 'pending',
    codAmount: Number(raw.cod_amount || raw.codAmount || 0),
    packageSummary: String(raw.package_summary || raw.packageSummary || 'Paquete GoPaq'),
    completedAt: raw.completed_at || raw.completedAt,
    notes: raw.notes || undefined
  };
}

export const DriverApp: React.FC = () => {
  const [manifest, setManifest] = useState<Manifest>({ driver: null, route: null, stops: [] });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [activeStop, setActiveStop] = useState<DriverStop | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientDni, setRecipientDni] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [codCollected, setCodCollected] = useState(0);
  const [codMethod, setCodMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [failureReason, setFailureReason] = useState('Cliente ausente');
  const [failureNotes, setFailureNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadManifest = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    const [me, result] = await Promise.all([ApiClient.getMe(), ApiClient.getActiveManifest()]);
    if (me.success) setUser(me.user);
    if (!result.success) setError(result.error || 'No fue posible cargar el manifiesto desde GoPaq.');
    else setManifest({ driver: result.driver, route: result.route, stops: (result.stops || []).map(normalizeStop).sort((a, b) => a.sequenceOrder - b.sequenceOrder) });
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { void loadManifest(); void readOfflineOperations().then(setPendingOperations).catch(() => undefined); }, [loadManifest]);

  useEffect(() => {
    const onlineHandler = () => { setOnline(true); void flushOffline(); };
    const offlineHandler = () => setOnline(false);
    window.addEventListener('online', onlineHandler); window.addEventListener('offline', offlineHandler);
    return () => { window.removeEventListener('online', onlineHandler); window.removeEventListener('offline', offlineHandler); };
  });

  useEffect(() => {
    const token = sessionStorage.getItem('gopaq_access_token');
    if (!token || !manifest.route) return;
    const protocol = `gopaq-bearer.${token}`;
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`, protocol);
    socket.onmessage = event => { try { const value = JSON.parse(event.data); if (value.type !== 'connected') void loadManifest(true); } catch { /* ignore malformed provider event */ } };
    return () => socket.close();
  }, [manifest.route?.id, loadManifest]);

  useEffect(() => {
    if (!manifest.driver?.id || !manifest.route || !('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(position => {
      if (!navigator.onLine) return;
      void ApiClient.sendDriverTelemetry({ driverId: manifest.driver.id, lat: position.coords.latitude, lng: position.coords.longitude, speed: Math.max(0, (position.coords.speed || 0) * 3.6), heading: position.coords.heading || 0, battery: 100 }).then(result => { if (!result.success) setActionMessage('La posición no pudo sincronizarse con GoPaq.'); });
    }, () => setActionMessage('Permiso de ubicación pendiente: activa GPS para transmitir telemetría real.'), { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [manifest.driver?.id, manifest.route?.id]);

  async function queueOperation(operation: Omit<PendingOperation, 'id' | 'createdAt'>) {
    const item: PendingOperation = { ...operation, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await saveOfflineOperation(item); setPendingOperations(prev => [...prev, item]);
  }

  async function flushOffline() {
    if (!navigator.onLine) return;
    const operations = await readOfflineOperations().catch(() => []);
    for (const operation of operations) {
      let result: any;
      if (operation.kind === 'start' && operation.routeId) result = await ApiClient.startRoute(operation.routeId);
      if (operation.kind === 'complete' && operation.stopId) result = await ApiClient.completeDriverStop(operation.stopId, operation.payload, operation.idempotencyKey);
      if (operation.kind === 'fail' && operation.stopId) result = await ApiClient.failDriverStop(operation.stopId, operation.payload, operation.idempotencyKey);
      if (result?.success) await removeOfflineOperation(operation.id);
    }
    const remaining = await readOfflineOperations().catch(() => []); setPendingOperations(remaining); if (remaining.length !== operations.length) void loadManifest(true);
  }

  const progress = useMemo(() => { const total = manifest.stops.length; const complete = manifest.stops.filter(stop => stop.status === 'completed').length; return { total, complete, percent: total ? Math.round((complete / total) * 100) : 0 }; }, [manifest.stops]);

  const startRoute = async () => {
    if (!manifest.route?.id) return;
    setSubmitting(true); setActionMessage('');
    if (!navigator.onLine) { await queueOperation({ kind: 'start', routeId: manifest.route.id, payload: {}, idempotencyKey: crypto.randomUUID() }); setActionMessage('Ruta en cola local; todavía no está iniciada en el servidor.'); setSubmitting(false); return; }
    const result = await ApiClient.startRoute(manifest.route.id); setSubmitting(false);
    if (!result.success) { setActionMessage(result.error || 'La ruta no pudo iniciarse.'); return; }
    setActionMessage('Ruta iniciada y confirmada por GoPaq.'); await loadManifest(true);
  };

  const openComplete = (stop: DriverStop) => { setActiveStop(stop); setRecipientName(stop.recipientName); setRecipientDni(''); setSignatureUrl(''); setPhotoUrl(''); setCodCollected(stop.codAmount); setCompleteOpen(true); };
  const openFail = (stop: DriverStop) => { setActiveStop(stop); setFailureReason('Cliente ausente'); setFailureNotes(''); setFailureOpen(true); };

  const submitComplete = async (event: FormEvent) => {
    event.preventDefault(); if (!activeStop || !signatureUrl) { setActionMessage('La firma del destinatario es obligatoria para generar el POD.'); return; }
    setSubmitting(true); const payload = { pod: { recipientName, recipientDni: recipientDni || undefined, signatureUrl, photoUrl: photoUrl || undefined }, collectedCod: codCollected, codMethod };
    if (!navigator.onLine) { await queueOperation({ kind: 'complete', stopId: activeStop.id, payload, idempotencyKey: crypto.randomUUID() }); setActionMessage('POD guardado en el outbox local; aún no está entregado en el servidor.'); setSubmitting(false); setCompleteOpen(false); return; }
    const result = await ApiClient.completeDriverStop(activeStop.id, payload, crypto.randomUUID()); setSubmitting(false);
    if (!result.success) { setActionMessage(result.error || 'El servidor no confirmó la entrega.'); return; }
    setActionMessage(`Entrega ${result.trackingNumber} confirmada con POD real.`); setCompleteOpen(false); await loadManifest(true);
  };

  const submitFailure = async (event: FormEvent) => {
    event.preventDefault(); if (!activeStop) return; setSubmitting(true); const payload = { reason: failureReason, notes: failureNotes || undefined };
    if (!navigator.onLine) { await queueOperation({ kind: 'fail', stopId: activeStop.id, payload, idempotencyKey: crypto.randomUUID() }); setActionMessage('Incidencia guardada en el outbox local; aún no está registrada en el servidor.'); setSubmitting(false); setFailureOpen(false); return; }
    const result = await ApiClient.failDriverStop(activeStop.id, payload, crypto.randomUUID()); setSubmitting(false);
    if (!result.success) { setActionMessage(result.error || 'La incidencia no pudo registrarse.'); return; }
    setActionMessage('Incidencia registrada y confirmada por GoPaq.'); setFailureOpen(false); await loadManifest(true);
  };

  const capturePhoto = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2_000_000) { setActionMessage('La foto supera el máximo de 2 MB.'); return; } const reader = new FileReader(); reader.onload = () => setPhotoUrl(String(reader.result || '')); reader.readAsDataURL(file); };
  const openNavigation = (stop: DriverStop) => { const target = stop.lat !== undefined && stop.lng !== undefined ? `${stop.lat},${stop.lng}` : stop.address; window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`, '_blank', 'noopener,noreferrer'); };
  const logout = async () => { await ApiClient.logout(); window.location.assign('/driver/login'); };

  if (loading) return <DriverShell><Loading text="Cargando manifiesto real…" /></DriverShell>;
  return <DriverShell>
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><GoPaqLogo size="sm" showSlogan={false} /><div><p className="text-xs font-black">Aplicación Driver</p><p className="text-[11px] text-slate-500">{manifest.driver?.name || user?.name || 'Conductor'}</p></div></div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{online ? <><Wifi className="mr-1 inline h-3 w-3" />En línea</> : <><WifiOff className="mr-1 inline h-3 w-3" />Offline</>}</span><button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-rose-600">Salir</button></div></div></header>
    <main className="space-y-4 p-4"><div className="rounded-3xl bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-400">Manifiesto unificado</p><h1 className="mt-2 text-2xl font-black">{manifest.route?.name || 'Sin ruta activa'}</h1><p className="mt-1 text-xs text-slate-400">{manifest.route ? `${manifest.route.date || ''} · ${manifest.route.status}` : 'Las asignaciones aparecerán cuando despacho las confirme.'}</p></div><button onClick={() => void loadManifest(true)} disabled={refreshing} className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:border-orange-400" aria-label="Actualizar manifiesto"><RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /></button></div>{manifest.route && <><div className="mt-6 flex items-end justify-between"><div><p className="text-3xl font-black">{progress.complete}<span className="text-lg text-slate-500">/{progress.total}</span></p><p className="text-xs text-slate-400">paradas completadas</p></div><p className="text-2xl font-black text-orange-400">{progress.percent}%</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress.percent}%` }} /></div></>}</div>{actionMessage && <div role="status" className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-xs font-semibold text-orange-800">{actionMessage}</div>}{error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</div>}{pendingOperations.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><strong>{pendingOperations.length} operación(es) pendientes.</strong> Se enviarán cuando haya conexión y solo se marcarán como sincronizadas después de confirmación del servidor.</div>}{manifest.route && manifest.route.status !== 'in_progress' && <button onClick={() => void startRoute()} disabled={submitting || !online} className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{online ? 'Iniciar ruta' : 'Conecta internet para iniciar la ruta'}</button>}{manifest.stops.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center"><PackageCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No hay paradas asignadas.</p><p className="mt-1 text-xs text-slate-400">El despacho aparecerá aquí cuando una ruta real sea asignada.</p></div> : <div className="space-y-3">{manifest.stops.map(stop => <StopCard key={stop.id} stop={stop} onNavigate={openNavigation} onComplete={openComplete} onFail={openFail} />)}</div>}</main>
    {completeOpen && activeStop && <Modal title="Confirmar entrega" onClose={() => setCompleteOpen(false)}><form onSubmit={submitComplete} className="space-y-4"><div><p className="text-xs font-black uppercase tracking-wider text-orange-600">{activeStop.trackingNumber}</p><h2 className="mt-1 text-lg font-black">POD para {activeStop.recipientName}</h2></div><label className="block text-xs font-bold">Nombre de quien recibe<input className={inputClass} value={recipientName} onChange={event => setRecipientName(event.target.value)} required /></label><label className="block text-xs font-bold">Documento (opcional)<input className={inputClass} value={recipientDni} onChange={event => setRecipientDni(event.target.value)} /></label>{activeStop.codAmount > 0 && <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs font-bold text-amber-800">COD requerido: {money(activeStop.codAmount)}</p><div className="mt-2 flex gap-2"><input type="number" min="0" step="0.01" className={inputClass} value={codCollected} onChange={event => setCodCollected(Number(event.target.value))} required /><select className={inputClass} value={codMethod} onChange={event => setCodMethod(event.target.value as any)}><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option></select></div></div>}<div><p className="mb-2 text-xs font-bold">Firma del destinatario</p><SignaturePad onSave={setSignatureUrl} /></div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-bold text-slate-600"><Camera className="h-4 w-4" />{photoUrl ? 'Foto capturada' : 'Adjuntar foto POD'}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={capturePhoto} /></label><button disabled={submitting || !signatureUrl} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Enviando…' : 'Confirmar POD en GoPaq'}</button></form></Modal>}{failureOpen && activeStop && <Modal title="Registrar incidencia" onClose={() => setFailureOpen(false)}><form onSubmit={submitFailure} className="space-y-4"><p className="text-xs text-slate-500">Guía {activeStop.trackingNumber}</p><select className={inputClass} value={failureReason} onChange={event => setFailureReason(event.target.value)}><option>Cliente ausente</option><option>Dirección incorrecta</option><option>Cliente rechazó el paquete</option><option>Sin efectivo para COD</option><option>Zona inaccesible</option></select><textarea className={inputClass} rows={4} placeholder="Detalle de la incidencia" value={failureNotes} onChange={event => setFailureNotes(event.target.value)} /><button disabled={submitting} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{submitting ? 'Registrando…' : 'Registrar incidencia'}</button></form></Modal>}
  </DriverShell>;
};

const StopCard: React.FC<{ stop: DriverStop; onNavigate: (stop: DriverStop) => void; onComplete: (stop: DriverStop) => void; onFail: (stop: DriverStop) => void }> = ({ stop, onNavigate, onComplete, onFail }) => { const processed = stop.status === 'completed' || stop.status === 'failed'; return <article className={`rounded-3xl border bg-white p-4 shadow-sm ${stop.status === 'completed' ? 'border-emerald-200' : stop.status === 'failed' ? 'border-rose-200' : 'border-slate-200'}`}><div className="flex gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${stop.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : stop.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-slate-950 text-white'}`}>{stop.sequenceOrder}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-black">{stop.recipientName}</p><p className="font-mono text-[11px] text-orange-600">{stop.trackingNumber}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">{stop.status}</span></div><p className="mt-3 text-xs leading-5 text-slate-600"><MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{stop.address || 'Dirección no disponible'}</p><p className="mt-1 text-xs text-slate-500">{stop.packageSummary}{stop.codAmount > 0 ? ` · COD ${money(stop.codAmount)}` : ''}</p>{stop.phone && <a href={`tel:${stop.phone}`} className="mt-3 inline-block text-xs font-bold text-sky-700"><Phone className="mr-1 inline h-3.5 w-3.5" />Llamar</a>}<div className="mt-4 flex gap-2"><button onClick={() => onNavigate(stop)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><Navigation className="mr-1 inline h-3.5 w-3.5" />Navegar</button>{!processed && <><button onClick={() => onFail(stop)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700" aria-label="Registrar incidencia"><AlertTriangle className="h-3.5 w-3.5" /></button><button onClick={() => onComplete(stop)} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Entregar</button></>}</div></div></div></article>; };

const DriverShell: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="min-h-screen bg-slate-100 text-slate-900 md:flex md:justify-center"><div className="min-h-screen w-full max-w-lg bg-slate-100 shadow-2xl md:border-x md:border-slate-200">{children}</div></div>;
const Loading: React.FC<{ text: string }> = ({ text }) => <div className="flex min-h-screen items-center justify-center p-6"><div className="text-center"><GoPaqLogo size="lg" showSlogan={false} /><p className="mt-5 text-sm font-bold text-slate-500">{text}</p></div></div>;
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"><div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2><button type="button" onClick={onClose} className="text-sm font-bold text-slate-500">Cerrar</button></div>{children}</div></div>;
const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10';
const money = (value: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value || 0));
