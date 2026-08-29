import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Truck, 
  Building2, 
  Users, 
  Download,
  Filter
} from 'lucide-react';
import { Button, Card, MetricCard } from '../ui/DesignSystem';
import { MOCK_COD_TRANSACTIONS } from '../../data/mockData';

export const CodReconciliation: React.FC = () => {
  const { formatMoney, addToast } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const totalCollected = 148500;
  const totalPendingPayout = 89400;
  const inBranchVault = 45200;

  const handleSettle = () => {
    addToast('success', 'Liquidación Ejecutada', 'Se generó comprobante de transferencia bancaria ACH para 3 clientes.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <span>Módulo Financiero COD (Cash On Delivery)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conciliación de recaudaciones en efectivo de drivers, arqueo en bóveda de sucursales y dispersión ACH a comercios
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
            Exportar Reporte
          </Button>
          <Button variant="primary" size="sm" icon={<FileCheck className="w-4 h-4" />} onClick={handleSettle}>
            Liquidar a Clientes
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Recaudado Hoy por Drivers"
          value={formatMoney(totalCollected)}
          subtitle="Cobros en efectivo confirmados"
          icon={<Truck className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Depositado en Bóveda / Caja"
          value={formatMoney(inBranchVault)}
          subtitle="Recibido en sucursales hoy"
          icon={<Building2 className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="Pendiente Dispersión ACH"
          value={formatMoney(totalPendingPayout)}
          subtitle="Por transferir a comercios"
          icon={<DollarSign className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Registro de Cobros COD & Estado de Conciliación
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {MOCK_COD_TRANSACTIONS.length} Transacciones registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Guía Tracking</th>
                <th className="py-3 px-4">Cliente / Comercio</th>
                <th className="py-3 px-4">Driver Cobrador</th>
                <th className="py-3 px-4">Sucursal Receptora</th>
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4 text-right">Monto Recaudado</th>
                <th className="py-3 px-4 text-center">Estado Conciliación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {MOCK_COD_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {tx.shipmentTracking}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {tx.clientName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {tx.driverName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {tx.branchName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {tx.collectedAt}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatMoney(tx.amount, tx.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {tx.status === 'transferred_to_client' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Liquidado al Cliente ✓
                      </span>
                    ) : tx.status === 'deposited_in_branch' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        En Bóveda Sucursal
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        En Manos del Driver
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
