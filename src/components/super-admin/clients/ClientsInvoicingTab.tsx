import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile, ClientInvoice } from '../../../types';
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface ClientsInvoicingTabProps {
  onOpenDetail: (client: ClientProfile) => void;
}

export const ClientsInvoicingTab: React.FC<ClientsInvoicingTabProps> = ({ onOpenDetail }) => {
  const { clients, formatMoney, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  // Flatten all invoices
  const allInvoices = clients.flatMap((c) =>
    (c.invoices || []).map((inv) => ({
      ...inv,
      clientName: c.companyName || c.name,
      clientLocker: c.lockerCode,
      rnc: c.rncOrDni,
      clientId: c.id
    }))
  );

  const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.amountDop, 0);
  const pendingInvoiced = allInvoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amountDop, 0);
  const paidInvoiced = allInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountDop, 0);

  const filteredInvoices = allInvoices.filter((inv) => {
    const matchesSearch =
      inv.ncf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientLocker.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Facturado B2B (NCF)</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatMoney(totalInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Comprobantes Fiscales Emitidos (DGII)</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Cuentas por Cobrar (Crédito)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatMoney(pendingInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pendiente de pago por clientes corporativos</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Cobrado Este Periodo</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatMoney(paidInvoiced)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Pagado vía transferencia o retención</span>
        </div>
      </div>

      {/* Invoices Grid */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Registro General de Comprobantes Fiscales (NCF B01 / B14 / B15)</span>
            </h3>
            <p className="text-xs text-slate-500">Facturación electrónica conforme a la Dirección General de Impuestos Internos</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar NCF o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <Button
              variant="secondary"
              size="xs"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={() => addToast('success', 'Reporte 607 Generado', 'Exportando archivo TXT para formato de ventas DGII 607.')}
            >
              Formato 607 DGII
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `Todas (${allInvoices.length})` },
            { id: 'pending', label: 'Pendientes' },
            { id: 'paid', label: 'Pagadas' },
            { id: 'overdue', label: 'Vencidas' }
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setStatusFilter(flt.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                statusFilter === flt.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">NCF Fiscal</th>
                  <th className="p-3">Cliente / Razón Social</th>
                  <th className="p-3">RNC</th>
                  <th className="p-3">Fecha Emisión</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Monto Total</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.ncf}
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-900 dark:text-white block font-bold">{inv.clientName}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{inv.clientLocker}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{inv.rnc || '—'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{inv.issueDate}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{inv.dueDate}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatMoney(inv.amountDop)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : inv.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {inv.status === 'paid' ? 'Pagada' : inv.status === 'pending' ? 'Pendiente' : 'Vencida'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => addToast('info', 'Descarga de Factura', `Generando PDF para NCF ${inv.ncf}`)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-6 text-center">No se encontraron facturas con los filtros actuales.</p>
        )}
      </Card>
    </div>
  );
};
