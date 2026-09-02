import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClient } from '../../api/client';
import { GoPaqLogo } from '../ui/GoPaqLogo';

export type LoginArea = 'super-admin' | 'portal' | 'sucursal' | 'driver';

const shell = 'min-h-screen bg-slate-950 text-white flex items-center justify-center p-5';
const card = 'w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl p-7';
const input = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20';
const button = 'w-full rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-60 px-4 py-3 text-sm font-bold transition';

const areaConfig: Record<LoginArea, { title: string; subtitle: string; allowed: string }> = {
  'super-admin': { title: 'Centro administrativo', subtitle: 'Gestiona operaciones, clientes, sucursales y seguridad.', allowed: 'SUPER_ADMIN · OWNER · ADMIN · OPERATIONS' },
  portal: { title: 'Portal de clientes', subtitle: 'Cotiza, crea envíos y consulta tu trazabilidad.', allowed: 'CLIENT · CUSTOMER' },
  sucursal: { title: 'Operación de sucursal', subtitle: 'Recibe, escanea, almacena y despacha con control.', allowed: 'BRANCH_MANAGER · MANAGER · COUNTER · DISPATCHER · WAREHOUSE · CASHIER' },
  driver: { title: 'Aplicación de conductor', subtitle: 'Consulta tu manifiesto y registra cada entrega.', allowed: 'DRIVER · COURIER' }
};

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
      ? 'La recuperación está registrada, pero el canal de correo todavía está NO CONFIGURADO.'
      : result.success ? 'Si la cuenta existe, recibirás instrucciones por el canal configurado.' : (result.error || 'No fue posible iniciar la recuperación.'));
  };
  return <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
    <h2 className="font-bold">Recuperar contraseña</h2>
    <p className="mt-1 text-xs text-slate-400">No mostramos si un correo está registrado.</p>
    <form onSubmit={submit} className="mt-3 space-y-3">
      <input className={input} type="email" autoComplete="email" placeholder="Correo de la cuenta" value={email} onChange={e => setEmail(e.target.value)} required />
      {message && <p className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-200">{message}</p>}
      <div className="flex gap-2"><button className={button} disabled={loading}>{loading ? 'Procesando…' : 'Solicitar recuperación'}</button><button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 text-sm">Cerrar</button></div>
    </form>
  </div>;
};

export const RoleLoginPage: React.FC<{ area: LoginArea }> = ({ area }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return <div className={shell}>
    <div className="w-full max-w-md">
      <div className="mb-5 flex justify-center"><GoPaqLogo variant="horizontal" size="lg" showSlogan={false} theme="dark" /></div>
      <form onSubmit={submit} className={card}>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">GoPaq · acceso seguro</p>
          <h1 className="mt-3 text-2xl font-black">{config.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{config.subtitle}</p>
          <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">Roles: {config.allowed}</p>
        </div>
        <div className="space-y-3">
          <input className={input} type="email" autoComplete="username" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={input} type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div role="alert" className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>}
          <button className={button} disabled={loading || demoLoading}>{loading ? 'Validando…' : 'Entrar'}</button>
        </div>
        <div className="mt-5 border-t border-slate-800 pt-5">
          <button type="button" onClick={demoLogin} disabled={loading || demoLoading} className="w-full rounded-xl border border-orange-700/70 bg-orange-950/20 px-4 py-3 text-sm font-bold text-orange-300 hover:bg-orange-950/40 disabled:opacity-60">{demoLoading ? 'Abriendo demo…' : 'Acceso de prueba'}</button>
          <p className="mt-2 text-center text-[11px] text-slate-500">Entorno aislado · sin pagos ni envíos externos reales</p>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-slate-400"><button type="button" onClick={() => setShowRecovery(v => !v)} className="hover:text-orange-300">¿Olvidaste tu contraseña?</button><button type="button" onClick={() => navigate('/login')} className="hover:text-orange-300">Cambiar área</button></div>
        {showRecovery && <Recovery onClose={() => setShowRecovery(false)} />}
      </form>
    </div>
  </div>;
};

export const LoginPage: React.FC = () => <div className={shell}>
  <div className="w-full max-w-3xl">
    <div className="mb-8 text-center"><GoPaqLogo variant="horizontal" size="xl" showSlogan={true} theme="dark" /><h1 className="mt-6 text-3xl font-black">Entra a tu espacio GoPaq</h1><p className="mt-2 text-slate-400">Selecciona el acceso que corresponde a tu operación.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(areaConfig) as LoginArea[]).map(area => <Link key={area} to={`/${area}/login`} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-orange-600"><h2 className="font-bold">{areaConfig[area].title}</h2><p className="mt-2 text-sm text-slate-400">{areaConfig[area].subtitle}</p><span className="mt-4 inline-block text-sm font-bold text-orange-400">Continuar →</span></Link>)}
    </div>
    <div className="mt-6 text-center text-sm text-slate-400"><Link to="/" className="hover:text-orange-300">Volver al sitio público</Link><span className="mx-3">·</span><Link to="/register" className="hover:text-orange-300">Crear cuenta de cliente</Link></div>
  </div>
</div>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); setLoading(true); const result = await ApiClient.register({ name, email, phone, password }); setLoading(false); if (!result.success || !result.user) { setError(result.error || 'No fue posible crear la cuenta.'); return; } navigate('/portal/dashboard', { replace: true }); };
  return <div className={shell}><form onSubmit={submit} className={card}><div className="mb-6 flex justify-center"><GoPaqLogo variant="horizontal" size="lg" showSlogan={false} theme="dark" /></div><h1 className="text-2xl font-black">Crear cuenta de cliente</h1><p className="mt-1 text-sm text-slate-400">Tu cuenta se crea en la organización pública configurada. Nunca puedes elegir un tenant interno desde el formulario.</p><div className="mt-6 space-y-3"><input className={input} placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required minLength={2} /><input className={input} type="email" autoComplete="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required /><input className={input} type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required /><input className={input} type="password" autoComplete="new-password" placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />{error && <div role="alert" className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>}<button className={button} disabled={loading}>{loading ? 'Creando…' : 'Crear cuenta'}</button></div><p className="mt-5 text-center text-sm text-slate-400"><button type="button" onClick={() => navigate('/portal/login')} className="text-orange-300 hover:text-orange-200">Ya tengo cuenta</button></p></form></div>;
};
