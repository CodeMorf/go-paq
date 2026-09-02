import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Clock, DollarSign, Download, FileCheck, RefreshCw, Truck } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

type CodTransaction = {
  id: string;
  tracking_number?: string;
  client_name?: string;
  driver_name?: string;
  branch_name?: string;
  collected_at?: string;
  amount: number;
  currency?: string;
  status: string;
};

const statusLabel: Record<string, string> = {
  pending_collection: 'Pendiente de cobro',
  collected_driver: 'En manos del driver',
  received_branch: 'Recibido en sucursal',
  reconciled: 'Conciliado',
  settled_merchant: 'Liquidado al comercio'
};

export const CodReconciliation: React.FC = () => {
  const { formatMoney, addToast } = useApp();
  const [transactions, setTransactions] = useState<CodTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadLedger = async () => {
    setLoading(true);
    const result = await ApiClient.getCodLedger();
    if (result.success) { setTransactions(result.transactions || []); setError(''); }
    else setError(result.error);
    setLoading(false);
  };

  useEffect(() => { void loadLedger(); }, []);

  const totals = useMemo(() => transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount || 0);
    if (tx.status === 'collected_driver') acc.driver += amount;
    if (tx.status === 'received_branch') acc.branch += amount;
    if (tx.status === 'reconciled') acc.reconciled += amount;
    if (tx.status === 'settled_merchant') acc.settled += amount;
    return acc;
  }, { driver: 0, branch: 0, reconciled: 0, settled: 0 }), [transactions]);

  const visible = filterStatus === 'all' ? transactions : transactions.filter(tx => tx.status === filterStatus);

  const transition = async (tx: CodTransaction, operation: 'receive' | 'reconcile' | 'settle') => {
    setBusyId(tx.id);
    const key = `cod-${operation}-${tx.id}-${crypto.randomUUID()}`;
    const result = operation === 'receive'
      ? await ApiClient.receiveCod([tx.id], undefined, undefined, key)
      : operation === 'reconcile'
        ? await ApiClient.reconcileCod([tx.id], undefined, undefined, key)
        : await ApiClient.settleCod([tx.id], 'Liquidación autorizada desde conciliación COD', key);
    setBusyId(null);
    if (!result.success) { addToast('error', 'Operación COD rechazada', result.error); return; }
    addToast('success', 'Estado COD actualizado', `${tx.tracking_number || tx.id}: ${statusLabel[operation === 'receive' ? 'received_branch' : operation === 'reconcile' ? 'reconciled' : 'settled_merchant']}.`);
    await loadLedger();
  };

  const exportCsv = () => {
    const header = ['id', 'tracking_number', 'client', 'driver', 'branch', 'amount', 'currency', 'status', 'collected_at'];
    const rows = transactions.map(tx => [tx.id, tx.tracking_number || '', tx.client_name || '', tx.driver_name || '', tx.branch_name || '', tx.amount, tx.currency || 'DOP', tx.status, tx.collected_at || '']);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `gopaq-cod-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-indigo-600" /><span>Módulo Financiero COD</span></h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Estados confirmados en PostgreSQL: driver → sucursal → conciliación → comercio.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportCsv} disabled={!transactions.length}>Exportar registro</Button><Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void loadLedger()}>Actualizar</Button></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><MetricCard title="En manos de drivers" value={formatMoney(totals.driver)} subtitle="Cobro confirmado en entrega" icon={<Truck className="w-5 h-5" />} accent="indigo" /><MetricCard title="Recibido en sucursal" value={formatMoney(totals.branch)} subtitle="Esperando conciliación" icon={<Building2 className="w-5 h-5" />} accent="emerald" /><MetricCard title="Conciliado" value={formatMoney(totals.reconciled)} subtitle="Listo para liquidar" icon={<CheckCircle2 className="w-5 h-5" />} accent="amber" /><MetricCard title="Liquidado al comercio" value={formatMoney(totals.settled)} subtitle="Estado final registrado" icon={<FileCheck className="w-5 h-5" />} accent="purple" /></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    <Card className="p-0 overflow-hidden"><div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-900 dark:text-white">Registro de cobros COD</h4><div className="flex items-center gap-2"><select value={filterStatus} onChange={event => setFilterStatus(event.target.value)} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs"><option value="all">Todos los estados</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="text-xs font-mono text-slate-400">{visible.length} transacciones</span></div></div><div className="overflow-x-auto">{loading ? <p className="p-6 text-sm text-slate-500">Cargando libro COD desde GoPaq…</p> : !visible.length ? <p className="p-6 text-sm text-slate-500">No hay transacciones para este filtro.</p> : <table className="w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase"><tr><th className="py-3 px-4">Guía</th><th className="py-3 px-4">Cliente</th><th className="py-3 px-4">Driver / Sucursal</th><th className="py-3 px-4">Monto</th><th className="py-3 px-4">Estado</th><th className="py-3 px-4 text-right">Siguiente acción</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">{visible.map(tx => <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{tx.tracking_number || tx.id}</td><td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">{tx.client_name || '—'}</td><td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{tx.driver_name || '—'}<br /><span className="text-[11px]">{tx.branch_name || '—'}</span></td><td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(Number(tx.amount), tx.currency as any)}</td><td className="py-3.5 px-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${tx.status === 'settled_merchant' ? 'bg-emerald-50 text-emerald-700' : tx.status === 'reconciled' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}><Clock className="w-3 h-3" />{statusLabel[tx.status] || tx.status}</span></td><td className="py-3.5 px-4 text-right"><div className="flex justify-end gap-1">{tx.status === 'collected_driver' && <Button size="sm" variant="secondary" disabled={busyId === tx.id} onClick={() => void transition(tx, 'receive')}>Recibir</Button>}{tx.status === 'received_branch' && <Button size="sm" variant="secondary" disabled={busyId === tx.id} onClick={() => void transition(tx, 'reconcile')}>Conciliar</Button>}{tx.status === 'reconciled' && <Button size="sm" variant="primary" disabled={busyId === tx.id} onClick={() => void transition(tx, 'settle')}>Liquidar</Button>}</div></td></tr>)}</tbody></table>}</div></Card>
  </div>;
};
