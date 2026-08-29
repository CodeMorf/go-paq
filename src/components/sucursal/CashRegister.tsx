import React from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, Printer, CheckCircle2, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button, Card, MetricCard } from '../ui/DesignSystem';

export const CashRegister: React.FC = () => {
  const { selectedBranch, formatMoney, addToast } = useApp();

  const handleCloseShift = () => {
    addToast('success', 'Arqueo Ejecutado', 'Cierre de caja Z impreso y balance transmitido a contabilidad central.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <span>Arqueo, Cuadre & Cierre de Caja (Corte X / Z)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sucursal: <strong className="text-slate-800 dark:text-slate-200">{selectedBranch.name}</strong> • Control de efectivo en mostrador y liquidación de conductores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />}>
            Corte Parcial (X)
          </Button>
          <Button variant="primary" size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={handleCloseShift}>
            Cerrar Turno & Bóveda (Z)
          </Button>
        </div>
      </div>

      {/* Cash breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Efectivo en Gaveta"
          value={formatMoney(selectedBranch.cashInDrawer, selectedBranch.currency)}
          subtitle="Fondo inicial + Ventas mostrador"
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          title="COD Entregado por Choferes"
          value={formatMoney(48500, selectedBranch.currency)}
          subtitle="3 drivers liquidaron turno hoy"
          icon={<DollarSign className="w-5 h-5" />}
          accent="indigo"
        />
        <MetricCard
          title="Tarjetas de Crédito POS"
          value={formatMoney(32900, selectedBranch.currency)}
          subtitle="Lote Verifone cerrado"
          icon={<FileText className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      {/* Detailed cash drawer report */}
      <Card className="space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Desglose de Movimientos del Turno Actual
        </h4>

        <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span>(+) Fondo de Caja Inicial Apertura</span>
            <span className="font-mono font-bold">{formatMoney(5000, selectedBranch.currency)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span>(+) Ventas Mostrador en Efectivo (14 envíos)</span>
            <span className="font-mono font-bold text-emerald-600">+{formatMoney(19450, selectedBranch.currency)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span>(+) Liquidaciones COD de Drivers Entregadas</span>
            <span className="font-mono font-bold text-emerald-600">+{formatMoney(48500, selectedBranch.currency)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span>(-) Retiro Parcial a Bóveda Blindada</span>
            <span className="font-mono font-bold text-rose-600">-{formatMoney(30000, selectedBranch.currency)}</span>
          </div>
          <div className="flex justify-between pt-3 text-sm font-bold text-slate-900 dark:text-white">
            <span>Saldo Físico Esperado en Gaveta:</span>
            <span className="text-lg font-mono text-indigo-600 dark:text-indigo-400">
              {formatMoney(selectedBranch.cashInDrawer, selectedBranch.currency)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
