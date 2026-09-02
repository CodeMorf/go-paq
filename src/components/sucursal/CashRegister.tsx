import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, DollarSign, Printer, RefreshCw } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

export const CashRegister: React.FC = () => {
  const { formatMoney, addToast } = useApp();
  const [branch, setBranch] = useState<any>(null);
  const [totalCash, setTotalCash] = useState(0);
  const [totalPos, setTotalPos] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { ApiClient.getBranches().then(result => { if (result.success) setBranch(result.branches?.[0] || null); else setError(result.error); setLoading(false); }); }, []);
  const grandTotal = totalCash + totalPos + totalTransfers;
  const close = async (event: React.FormEvent) => { event.preventDefault(); if (!branch) return; setSubmitting(true); const result = await ApiClient.closeBranchCash(branch.id, { totalCash, totalPos, totalTransfers, notes }); setSubmitting(false); if (!result.success) { setError(result.error); return; } addToast('success', 'Cierre guardado', `Cierre ${result.summary.id} confirmado por GoPaq.`); setError(''); };
  return <div className="space-y-6 max-w-4xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-indigo-600" />Arqueo y cierre de caja</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{branch?.name || 'Sucursal'} · los totales se guardan en el libro de caja del servidor.</p></div><Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => window.location.reload()}>Actualizar</Button></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><MetricCard title="Efectivo declarado" value={formatMoney(totalCash)} subtitle="Entrada manual del arqueo" icon={<DollarSign className="w-5 h-5" />} accent="emerald" /><MetricCard title="Total del cierre" value={formatMoney(grandTotal)} subtitle="Efectivo + POS + transferencias" icon={<CheckCircle2 className="w-5 h-5" />} accent="indigo" /></div><form onSubmit={close}><Card className="space-y-4"><h3 className="text-sm font-bold">Registrar corte Z</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"><label>Efectivo en caja<input required type="number" min="0" step="0.01" value={totalCash} onChange={e => setTotalCash(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><label>Ventas POS<input required type="number" min="0" step="0.01" value={totalPos} onChange={e => setTotalPos(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><label>Transferencias<input required type="number" min="0" step="0.01" value={totalTransfers} onChange={e => setTotalTransfers(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label></div><label className="block text-xs">Notas<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} maxLength={500} className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2" /></label><div className="flex justify-end"><Button type="submit" variant="primary" disabled={loading || submitting || !branch} icon={<Printer className="w-4 h-4" />}>{submitting ? 'Guardando…' : 'Guardar cierre en GoPaq'}</Button></div></Card></form></div>;
};
