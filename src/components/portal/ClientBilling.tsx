import React from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, DollarSign, Download, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { MetricCard, Card, Button } from '../ui/DesignSystem';

export const ClientBilling: React.FC = () => {
  const { formatMoney } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>Estado de Cuenta & Balances COD</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resumen de cobros contra entrega recaudados por los drivers y facturación de fletes
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>
          Descargar Estado de Cuenta (PDF)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Balance COD a tu Favor"
          value={formatMoney(42500)}
          subtitle="Próxima liquidación: Viernes"
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="Línea de Crédito Fletes"
          value={formatMoney(150000)}
          subtitle="Consumo del mes: RD$ 34,800"
          icon={<CreditCard className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Facturas por Pagar"
          value={formatMoney(0)}
          subtitle="Cuenta al día"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="blue"
        />
      </div>

      {/* Invoices and Transfers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Historial de Transferencias Bancarias & Liquidaciones COD
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Referencia ACH</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4">Banco Destino</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Monto Liquidado</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  ACH-BPD-99214
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  Liquidación Semanal COD (18 entregas)
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  Banco Popular Dominicano •••• 4091
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-500">
                  18 Feb 2026
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatMoney(68450)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Completado
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
