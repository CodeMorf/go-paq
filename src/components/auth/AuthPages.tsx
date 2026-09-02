import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClient } from '../../api/client';
import { ClientAuthAvatar } from './ClientAuthAvatar';
import { GoPaqLogo } from '../ui/GoPaqLogo';

export type LoginArea = 'super-admin' | 'portal' | 'sucursal' | 'driver';

const areaConfig: Record<LoginArea, { title: string; subtitle: string; allowed: string }> = {
  'super-admin': { title: 'Centro administrativo', subtitle: 'Gestiona operaciones, clientes, sucursales y seguridad.', allowed: 'SUPER_ADMIN · OWNER · ADMIN · OPERATIONS' },
  portal: { title: 'Portal de clientes', subtitle: 'Cotiza, crea envíos y consulta tu trazabilidad.', allowed: 'CLIENT · CUSTOMER' },
  sucursal: { title: 'Operación de sucursal', subtitle: 'Recibe, escanea, almacena y despacha con control.', allowed: 'BRANCH_MANAGER · MANAGER · COUNTER · DISPATCHER · WAREHOUSE · CASHIER' },
  driver: { title: 'Aplicación de conductor', subtitle: 'Consulta tu manifiesto y registra cada entrega.', allowed: 'DRIVER · COURIER' }
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';
const primaryButtonClass = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60';

export function destinationForRole(role?: string) {
  const normalized = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['CLIENT', 'CUSTOMER'].includes(normalized)) return '/portal/dashboard';
  if (['DRIVER', 'COURIER'].includes(normalized)) return '/driver';
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(normalized)) return '/sucursal/dashboard';
  return '/super-admin/dashboard';
}

const Recovery: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const result = await ApiClient.requestPasswordReset(email);
    setLoading(false);
    setMessage(result.success && result.status === 'not_configured'
      ? 'La solicitud fue registrada, pero el canal de correo todavía está NO CONFIGURADO.'
      : result.success ? 'Si la cuenta existe, recibirás instrucciones por el canal configurado.' : (result.error || 'No fue posible iniciar la recuperación.'));
  };

  return <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <h2 className="font-bold text-slate-900">Recuperar contraseña</h2>
    <p className="mt-1 text-xs text-slate-500">No mostramos si un correo está registrado.</p>
    <form onSubmit={submit} className="mt-3 space-y-3">
      <input className={inputClass} type="email" autoComplete="email" placeholder="Correo de la cuenta" value={email} onChange={(event) => setEmail(event.target.value)} required />
      {message && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row"><button className={primaryButtonClass} disabled={loading}>{loading ? 'Procesando…' : 'Solicitar recuperación'}</button><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Cerrar</button></div>
    </form>
  </div>;
};

const ClientTrustPanel: React.FC<{ register?: boolean }> = ({ register = false }) => <aside className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
  <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden="true" />
  <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
  <div className="relative z-10">
    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-200">Portal de clientes</span>
    <h2 className="mt-5 max-w-sm text-3xl font-black leading-tight">{register ? 'Tu operación logística empieza aquí.' : 'Todo lo que envías, en un solo lugar.'}</h2>
    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">Cotizaciones reales, guías persistidas y trazabilidad consultada directamente desde GoPaq.</p>
  </div>
  <div className="relative z-10 flex items-end justify-between gap-4">
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300"><div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" />Sesión protegida</div><p className="mt-2 leading-5">Tu cuenta se mantiene separada de las áreas operativas.</p></div>
    <ClientAuthAvatar />
  </div>
</aside>;

export const RoleLoginPage: React.FC<{ area: LoginArea }> = ({ area }) => {
  const navigate = useNavigate();
  const isClient = area === 'portal';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const config = areaConfig[area];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await ApiClient.login(email, password, area);
    setLoading(false);
    if (!result.success || !result.user) { setError(result.error || 'No fue posible iniciar sesión.'); return; }
    navigate(destinationForRole(result.user.role), { replace: true });
  };

  const demoLogin = async () => {
    setError('');
    setDemoLoading(true);
    const result = await ApiClient.demo(area);
    setDemoLoading(false);
    if (!result.success || !result.user) { setError(result.error === 'demo_not_configured' ? 'El acceso demo está temporalmente NO CONFIGURADO.' : (result.error || 'No fue posible abrir el demo.')); return; }
    navigate(destinationForRole(result.user.role), { replace: true });
  };

  return <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-6 sm:py-8 lg:px-10">
    <div className={`mx-auto grid min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-4rem)] ${isClient ? 'max-w-6xl lg:grid-cols-[1fr_0.9fr]' : 'max-w-xl'}`}>
      <section className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-12">
        <div className="flex items-center justify-between gap-4"><GoPaqLogo variant="horizontal" size="md" showSlogan={false} /><Link to="/login" className="text-xs font-bold text-slate-500 hover:text-indigo-600">Cambiar área</Link></div>
        {isClient && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 lg:hidden"><ClientAuthAvatar size="compact" /><div><p className="text-xs font-black text-indigo-900">Bienvenido al Portal GoPaq</p><p className="mt-0.5 text-[11px] text-indigo-700">Gestiona envíos y entregas desde tu cuenta.</p></div></div>}
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Acceso seguro GoPaq</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{config.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{config.subtitle}</p>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Roles autorizados: {config.allowed}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-xs font-bold text-slate-700">Correo electrónico<input className={`mt-1.5 ${inputClass}`} type="email" autoComplete="username" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label className="block text-xs font-bold text-slate-700">Contraseña<div className="relative mt-1.5"><input className={`${inputClass} pr-12`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
            <button className={primaryButtonClass} disabled={loading || demoLoading}>{loading ? 'Validando…' : <>Entrar <ArrowRight className="h-4 w-4" /></>}</button>
          </form>
          <div className="mt-5 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => setShowRecovery((current) => !current)} className="text-left font-bold text-indigo-600 hover:text-indigo-800">¿Olvidaste tu contraseña?</button>{isClient && <Link to="/register" className="font-bold text-slate-600 hover:text-indigo-600">Crear cuenta de cliente</Link>}</div>
          {showRecovery && <Recovery onClose={() => setShowRecovery(false)} />}
          <div className="mt-8 border-t border-slate-100 pt-5"><button type="button" onClick={demoLogin} disabled={loading || demoLoading} className="w-full rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60">{demoLoading ? 'Abriendo entorno demo…' : 'Acceso de prueba'}</button><p className="mt-2 text-center text-[11px] text-slate-500">Sesión aislada · sin pagos ni comunicaciones externas reales</p></div>
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-center text-[11px] text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Autenticación real y permisos verificados por el servidor.</div>
      </section>
      {isClient && <ClientTrustPanel />}
    </div>
  </main>;
};

export const LoginPage: React.FC = () => <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8"><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-center"><div className="text-center"><GoPaqLogo variant="horizontal" size="xl" showSlogan theme="dark" /><h1 className="mt-8 text-3xl font-black">Entra a tu espacio GoPaq</h1><p className="mt-2 text-slate-400">Selecciona el acceso que corresponde a tu operación.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2">{(Object.keys(areaConfig) as LoginArea[]).map((area) => <Link key={area} to={`/${area}/login`} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500"><h2 className="font-bold">{areaConfig[area].title}</h2><p className="mt-2 text-sm text-slate-400">{areaConfig[area].subtitle}</p><span className="mt-4 inline-block text-sm font-bold text-indigo-400">Continuar →</span></Link>)}</div><div className="mt-6 text-center text-sm text-slate-400"><Link to="/" className="hover:text-indigo-300">Volver al sitio público</Link><span className="mx-3">·</span><Link to="/register" className="hover:text-indigo-300">Crear cuenta de cliente</Link></div></div></main>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await ApiClient.register({ name, email, phone: phone || undefined, companyName: companyName || undefined, password });
    setLoading(false);
    if (!result.success || !result.user) { setError(result.error || 'No fue posible crear la cuenta.'); return; }
    navigate('/portal/dashboard', { replace: true });
  };

  return <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-6 sm:py-8 lg:px-10"><div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_0.9fr]"><section className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-12"><div className="flex items-center justify-between gap-4"><GoPaqLogo variant="horizontal" size="md" showSlogan={false} /><Link to="/portal/login" className="text-xs font-bold text-slate-500 hover:text-indigo-600">Ya tengo cuenta</Link></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 lg:hidden"><ClientAuthAvatar size="compact" /><div><p className="text-xs font-black text-indigo-900">Crea tu cuenta GoPaq</p><p className="mt-0.5 text-[11px] text-indigo-700">Tus envíos quedarán asociados al tenant público real.</p></div></div><div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Registro de cliente</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Empieza con GoPaq</h1><p className="mt-2 text-sm leading-6 text-slate-500">La cuenta se crea en la organización pública configurada. El backend asigna el cliente, la sucursal inicial y el casillero sin aceptar IDs internos desde el navegador.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-indigo-500" />Nombre completo</span><input className={`mt-1.5 ${inputClass}`} autoComplete="name" placeholder="Tu nombre" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /></label><label className="block text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-500" />Correo electrónico</span><input className={`mt-1.5 ${inputClass}`} type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><Phone className="h-4 w-4 text-indigo-500" />Teléfono <span className="font-normal text-slate-400">(opcional)</span></span><input className={`mt-1.5 ${inputClass}`} type="tel" autoComplete="tel" placeholder="+1 809…" value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label className="block text-xs font-bold text-slate-700">Comercio <span className="font-normal text-slate-400">(opcional)</span><input className={`mt-1.5 ${inputClass}`} autoComplete="organization" placeholder="Nombre del negocio" value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></label></div><label className="block text-xs font-bold text-slate-700"><span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-indigo-500" />Contraseña</span><div className="relative mt-1.5"><input className={`${inputClass} pr-12`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}<button className={primaryButtonClass} disabled={loading}>{loading ? 'Creando cuenta…' : <>Crear cuenta <ArrowRight className="h-4 w-4" /></>}</button></form><p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Al crear la cuenta, GoPaq registra la operación en PostgreSQL y te entrega una sesión protegida.</p></div><div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-center text-[11px] text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Tu cuenta no puede acceder a áreas administrativas u operativas.</div></section><ClientTrustPanel register /></div></main>;
};
