import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClient } from '../../api/client';

const shell = 'min-h-screen bg-slate-950 text-white flex items-center justify-center p-6';
const card = 'w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-7';
const input = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none focus:border-indigo-500';
const button = 'w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-4 py-3 text-sm font-bold transition';

export function destinationForRole(role?: string) {
  const normalized = String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['CLIENT', 'CUSTOMER'].includes(normalized)) return '/portal/dashboard';
  if (['DRIVER', 'COURIER'].includes(normalized)) return '/driver';
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(normalized)) return '/sucursal/dashboard';
  return '/super-admin/dashboard';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await ApiClient.login(email, password);
    setLoading(false);
    if (!result.success || !result.user) {
      setError(result.error || 'No fue posible iniciar sesión.');
      return;
    }
    navigate(destinationForRole(result.user.role), { replace: true });
  };

  return <div className={shell}>
    <form onSubmit={submit} className={card}>
      <div className="mb-6">
        <div className="text-2xl font-black tracking-tight">GoPaq</div>
        <h1 className="mt-5 text-xl font-bold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-400">Accede al área asignada a tu rol.</p>
      </div>
      <div className="space-y-3">
        <input className={input} type="email" autoComplete="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className={input} type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>}
        <button className={button} disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </div>
      <button type="button" className="mt-5 w-full text-sm text-indigo-300 hover:text-indigo-200" onClick={() => navigate('/register')}>Crear cuenta de cliente</button>
    </form>
  </div>;
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await ApiClient.register({ name, email, phone, password });
    setLoading(false);
    if (!result.success || !result.user) {
      setError(result.error || 'No fue posible crear la cuenta.');
      return;
    }
    navigate('/portal/dashboard', { replace: true });
  };

  return <div className={shell}>
    <form onSubmit={submit} className={card}>
      <div className="mb-6">
        <div className="text-2xl font-black tracking-tight">GoPaq</div>
        <h1 className="mt-5 text-xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-400">Registro público únicamente para clientes.</p>
      </div>
      <div className="space-y-3">
        <input className={input} placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
        <input className={input} type="email" autoComplete="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className={input} type="tel" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
        <input className={input} type="password" autoComplete="new-password" placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        {error && <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">{error}</div>}
        <button className={button} disabled={loading}>{loading ? 'Creando…' : 'Crear cuenta'}</button>
      </div>
      <button type="button" className="mt-5 w-full text-sm text-indigo-300 hover:text-indigo-200" onClick={() => navigate('/login')}>Ya tengo una cuenta</button>
    </form>
  </div>;
};
