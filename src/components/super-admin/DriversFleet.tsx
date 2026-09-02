import React, { useEffect, useState } from 'react';
import { AlertCircle, Battery, CheckCircle2, Copy, ExternalLink, IdCard, Link2, Plus, RefreshCw, Star, Truck, User, X } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

type PhotoUpload = { url: string; expiresAt: string; expiresInHours: number };
type UploadLinkState = PhotoUpload & { driverId: string; driverName: string };

function formatExpiry(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character));
}

export const DriversFleet: React.FC = () => {
  const { addToast, formatMoney } = useApp();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehiculos'>('drivers');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', licenseNumber: '', vehicleType: '', vehiclePlate: '', branchId: '' });
  const [uploadLink, setUploadLink] = useState<UploadLinkState | null>(null);
  const [linkLoading, setLinkLoading] = useState('');
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState<any | null>(null);
  const [cardPhotoUrl, setCardPhotoUrl] = useState('');
  const [cardLoading, setCardLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const result = await ApiClient.getDrivers();
    if (result.success) { setDrivers(result.drivers || []); setError(''); } else setError(result.error);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    void ApiClient.getBranches().then((result) => {
      if (result.success) {
        setBranches(result.branches || []);
        setForm((current) => ({ ...current, branchId: current.branchId || result.branches?.[0]?.id || '' }));
      }
    });
  }, []);
  useEffect(() => () => { if (cardPhotoUrl) URL.revokeObjectURL(cardPhotoUrl); }, [cardPhotoUrl]);

  const vehicles = Array.from(new Map(drivers.filter(driver => driver.vehicle_type || driver.vehicle_plate).map(driver => [`${driver.vehicle_type}-${driver.vehicle_plate}`, driver])).values());

  const showUploadLink = (driver: any, photoUpload: PhotoUpload) => {
    setUploadLink({ driverId: driver.id, driverName: driver.name, ...photoUpload });
    setCopied(false);
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    const result = await ApiClient.createDriver({ ...form, email: form.email || undefined });
    setCreating(false);
    if (!result.success) { setError(result.error); return; }
    showUploadLink(result.driver, result.photoUpload);
    addToast('success', 'Conductor creado', 'El perfil y el enlace temporal de foto quedaron persistidos en GoPaq.');
    setForm({ name: '', email: '', phone: '', licenseNumber: '', vehicleType: '', vehiclePlate: '', branchId: branches[0]?.id || '' });
    await load();
  };

  const generateLink = async (driver: any) => {
    setLinkLoading(driver.id);
    const result = await ApiClient.generateDriverPhotoLink(driver.id);
    setLinkLoading('');
    if (!result.success) { setError(result.error); return; }
    showUploadLink(driver, result.photoUpload);
    addToast('success', 'Enlace generado', 'El enlace anterior quedó revocado y este nuevo enlace vence en 24 horas.');
  };

  const copyLink = async () => {
    if (!uploadLink) return;
    try {
      await navigator.clipboard.writeText(uploadLink.url);
      setCopied(true);
      addToast('success', 'Enlace copiado', 'Puedes enviarlo al conductor por el canal autorizado.');
    } catch {
      setError('El navegador no permitió copiar automáticamente. Selecciona el enlace y cópialo manualmente.');
    }
  };

  const openCard = async (driverId: string) => {
    setCardLoading(true);
    setCard(null);
    if (cardPhotoUrl) URL.revokeObjectURL(cardPhotoUrl);
    setCardPhotoUrl('');
    const result = await ApiClient.getDriverCard(driverId);
    if (!result.success) { setError(result.error); setCardLoading(false); return; }
    setCard(result.card);
    if (result.card.has_photo) {
      const photo = await ApiClient.getDriverPhoto(driverId);
      if (photo.success) setCardPhotoUrl(photo.url);
      else setError(photo.error);
    }
    setCardLoading(false);
  };

  const printCard = () => {
    if (!card || !cardPhotoUrl) return;
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=720,height=560');
    if (!popup) { setError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para imprimir el carnet.'); return; }
    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Carnet GoPaq - ${escapeHtml(card.name)}</title><style>body{margin:0;padding:32px;background:#eef2ff;font-family:Arial,sans-serif;color:#111827}.card{width:640px;max-width:100%;margin:auto;background:#fff;border:1px solid #dbe3f0;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px #1118271c}.top{padding:22px 28px;background:#0f172a;color:#fff;display:flex;justify-content:space-between;align-items:center}.top img{width:148px;height:52px;object-fit:contain}.badge{border:1px solid #fb923c;border-radius:999px;padding:7px 12px;color:#fed7aa;font-size:11px;font-weight:bold}.body{display:flex;gap:26px;padding:30px}.photo{width:148px;height:176px;border-radius:18px;object-fit:cover;border:4px solid #e0e7ff}.details{flex:1}.label{margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.name{margin:5px 0 22px;font-size:25px;font-weight:800}.row{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #eef2f7;padding:9px 0;font-size:13px}.row b{font-weight:700}.foot{padding:15px 28px;background:#f8fafc;color:#64748b;font-size:11px}@media print{body{padding:0;background:#fff}.card{box-shadow:none}}</style></head><body><article class="card"><header class="top"><img src="/assets/brand/gopaq-logo-lockup.png" alt="GoPaq"><span class="badge">CARNET OPERATIVO</span></header><section class="body"><img class="photo" src="${escapeHtml(cardPhotoUrl)}" alt="Foto de ${escapeHtml(card.name)}"><div class="details"><p class="label">Conductor autorizado</p><h1 class="name">${escapeHtml(card.name)}</h1><div class="row"><span>Carnet</span><b>${escapeHtml(card.card_number)}</b></div><div class="row"><span>Sucursal</span><b>${escapeHtml(card.branch_name || '—')}</b></div><div class="row"><span>Vehículo</span><b>${escapeHtml(card.vehicle_type || '—')} · ${escapeHtml(card.vehicle_plate || '—')}</b></div><div class="row"><span>Licencia</span><b>${escapeHtml(card.license_number || '—')}</b></div></div></section><footer class="foot">Emitido por GoPaq · ${escapeHtml(card.card_issued_at ? formatExpiry(card.card_issued_at) : '')}</footer></article><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    popup.document.close();
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white"><Truck className="h-6 w-6 text-indigo-600" />Conductores y flota</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Crea el perfil operativo, envía un enlace seguro para la foto y emite el carnet desde la información confirmada por el servidor.</p></div>
      <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Actualizar</Button>
    </div>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}<button className="ml-auto font-bold" onClick={() => setError('')} aria-label="Cerrar alerta">×</button></div>}

    {uploadLink && <Card className="border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/30"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-black text-indigo-950 dark:text-indigo-100"><Link2 className="h-4 w-4" />Enlace de foto para {uploadLink.driverName}</p><p className="mt-1 text-xs text-indigo-800 dark:text-indigo-200">Enlace de un solo uso · vence el {formatExpiry(uploadLink.expiresAt)} · el conductor no necesita iniciar sesión.</p></div><button className="rounded-lg p-1 text-indigo-700 hover:bg-indigo-100" onClick={() => setUploadLink(null)} aria-label="Cerrar enlace"><X className="h-4 w-4" /></button></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input readOnly value={uploadLink.url} className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none" aria-label="Enlace temporal de carga" /><Button size="sm" variant="primary" icon={<Copy className="h-4 w-4" />} onClick={() => void copyLink()}>{copied ? 'Copiado' : 'Copiar enlace'}</Button><a href={uploadLink.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><ExternalLink className="h-4 w-4" />Abrir</a></div></Card>}

    <Card><div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-indigo-600" /><div><h3 className="text-sm font-bold">Registrar conductor</h3><p className="mt-1 text-xs text-slate-500">Al guardar se genera automáticamente un enlace temporal para completar la foto.</p></div></div><form onSubmit={create} className="grid gap-4 md:grid-cols-2"><label className="text-xs font-bold">Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">Correo opcional<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">Teléfono<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">Licencia<input required value={form.licenseNumber} onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-950" /></label><label className="text-xs font-bold">Tipo de vehículo<input required value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value })} placeholder="Motocicleta, van, camión" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold">Placa<input required value={form.vehiclePlate} onChange={(event) => setForm({ ...form, vehiclePlate: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label><label className="text-xs font-bold md:col-span-2">Sucursal<select required value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="" disabled>Selecciona una sucursal</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select></label><div className="md:col-span-2"><Button type="submit" variant="primary" disabled={creating || !form.branchId} loading={creating}>{creating ? 'Guardando…' : 'Crear conductor y generar enlace'}</Button></div></form></Card>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><MetricCard title="Conductores activos" value={String(drivers.length)} subtitle="Registros del servidor" icon={<User className="h-5 w-5" />} accent="indigo" /><MetricCard title="Disponibles" value={String(drivers.filter(d => ['available', 'idle'].includes(d.status)).length)} subtitle="Estado persistido" icon={<Battery className="h-5 w-5" />} accent="emerald" /><MetricCard title="Carnets emitidos" value={String(drivers.filter(d => d.card_status === 'issued').length)} subtitle="Foto confirmada" icon={<IdCard className="h-5 w-5" />} accent="purple" /></div>
    <div className="flex gap-2 border-b border-slate-200 text-xs font-semibold dark:border-slate-800"><button onClick={() => setActiveTab('drivers')} className={`border-b-2 px-3 pb-3 ${activeTab === 'drivers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Conductores ({drivers.length})</button><button onClick={() => setActiveTab('vehiculos')} className={`border-b-2 px-3 pb-3 ${activeTab === 'vehiculos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Vehículos ({vehicles.length})</button></div>
    {loading ? <Card><p className="text-sm text-slate-500">Cargando flota desde GoPaq…</p></Card> : activeTab === 'drivers' ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{drivers.map(driver => <Card key={driver.id} className="space-y-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${driver.has_photo ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{driver.has_photo ? <CheckCircle2 className="h-5 w-5" /> : <User className="h-5 w-5" />}</div><div className="min-w-0"><h4 className="truncate text-sm font-bold">{driver.name}</h4><p className="truncate text-[11px] text-slate-500">{driver.user_email || driver.email || 'Cuenta no enlazada'}</p></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${driver.card_status === 'issued' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{driver.card_status === 'issued' ? 'Carnet listo' : 'Foto pendiente'}</span></div><div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60"><div className="flex justify-between"><span className="text-slate-400">Vehículo:</span><span className="font-semibold">{driver.vehicle_type || 'No asignado'}</span></div><div className="flex justify-between"><span className="text-slate-400">Placa:</span><span className="font-mono font-bold">{driver.vehicle_plate || '—'}</span></div><div className="flex justify-between"><span className="text-slate-400">Posición:</span><span className="font-mono">{driver.current_lat != null && driver.current_lng != null ? `${Number(driver.current_lat).toFixed(5)}, ${Number(driver.current_lng).toFixed(5)}` : 'Sin GPS'}</span></div><div className="flex justify-between"><span className="text-slate-400">Carnet:</span><span className="font-mono">{driver.card_number || 'Pendiente de foto'}</span></div><div className="flex justify-between"><span className="text-slate-400">COD:</span><span className="font-mono">{formatMoney(Number(driver.cod_collected_today || 0))}</span></div></div><div className="flex items-center gap-1 text-xs text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-500" />{driver.rating ?? 'Sin calificación'}</div><div className="grid gap-2 sm:grid-cols-2"><Button size="sm" variant="secondary" icon={<Link2 className="h-4 w-4" />} loading={linkLoading === driver.id} onClick={() => void generateLink(driver)}>{linkLoading === driver.id ? 'Generando…' : 'Enlace de foto'}</Button><Button size="sm" variant={driver.card_status === 'issued' ? 'primary' : 'outline'} icon={<IdCard className="h-4 w-4" />} disabled={driver.card_status !== 'issued' || cardLoading} onClick={() => void openCard(driver.id)}>Ver carnet</Button></div></Card>)}</div> : <Card><h3 className="mb-4 text-sm font-bold">Vehículos asociados a conductores</h3>{!vehicles.length ? <p className="text-sm text-slate-500">No hay vehículos registrados en este tenant.</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{vehicles.map(driver => <div key={driver.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="font-bold">{driver.vehicle_type || 'Vehículo'}</p><p className="mt-1 font-mono text-sm text-indigo-600">{driver.vehicle_plate || 'Sin placa'}</p><p className="mt-3 text-xs text-slate-500">Conductor: {driver.name}</p></div>)}</div>}</Card>}

    {card && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Carnet del conductor"><div className="max-h-[95vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Documento persistido</p><h3 className="text-lg font-black text-slate-950">Carnet operativo</h3></div><button onClick={() => setCard(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar carnet"><X className="h-5 w-5" /></button></div><div className="p-5 sm:p-8"><div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl"><div className="flex items-center justify-between bg-slate-950 px-5 py-4"><img src="/assets/brand/gopaq-logo-lockup.png" alt="GoPaq" className="h-10 w-32 object-contain" /><span className="rounded-full border border-orange-400/50 px-3 py-1 text-[10px] font-black text-orange-200">CARNET OPERATIVO</span></div><div className="grid gap-5 p-5 sm:grid-cols-[150px_1fr] sm:p-7"><div>{cardPhotoUrl ? <img src={cardPhotoUrl} alt={`Foto de ${card.name}`} className="h-44 w-full rounded-2xl border-4 border-indigo-100 object-cover sm:w-36" /> : <div className="flex h-44 w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400 sm:w-36"><User className="h-12 w-12" /></div>}</div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Conductor autorizado</p><h4 className="mt-1 text-2xl font-black text-slate-950">{card.name}</h4><div className="mt-4 grid gap-2 text-xs"><div className="flex justify-between gap-3 border-b border-slate-100 py-2"><span className="text-slate-500">Carnet</span><span className="font-mono font-bold">{card.card_number}</span></div><div className="flex justify-between gap-3 border-b border-slate-100 py-2"><span className="text-slate-500">Sucursal</span><span className="font-bold">{card.branch_name || '—'}</span></div><div className="flex justify-between gap-3 border-b border-slate-100 py-2"><span className="text-slate-500">Vehículo</span><span className="font-bold">{card.vehicle_type} · {card.vehicle_plate}</span></div><div className="flex justify-between gap-3 border-b border-slate-100 py-2"><span className="text-slate-500">Licencia</span><span className="font-bold">{card.license_number}</span></div></div></div></div><div className="bg-slate-50 px-5 py-3 text-[11px] text-slate-500">Emitido por GoPaq · {formatExpiry(card.card_issued_at)}</div></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setCard(null)}>Cerrar</Button><Button variant="primary" icon={<ExternalLink className="h-4 w-4" />} disabled={!cardPhotoUrl} onClick={printCard}>Imprimir carnet</Button></div></div></div></div>}
  </div>;
};
