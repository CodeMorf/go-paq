import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  Banknote,
  Send,
  CheckCircle2,
  Download,
  Building2,
  ArrowUpRight,
  Search,
  Filter,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface ClientsCodReconciliationTabProps {
  onOpenCodPayout: (client: ClientProfile) => void;
  onOpenDetail: (client: ClientProfile) => void;
}

export const ClientsCodReconciliationTab: React.FC<ClientsCodReconciliationTabProps> = ({
  onOpenCodPayout,
  onOpenDetail
}) => {
  const { clients, formatMoney, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Clients with pending COD payouts
  const pendingClients = clients.filter((c) => (c.codPendingPayoutDop || 0) > 0);
  const totalPendingCod = pendingClients.reduce((acc, c) => acc + (c.codPendingPayoutDop || 0), 0);

  // All payout history
  const allPayouts = clients.flatMap((c) =>
    (c.codPayoutsHistory || []).map((p) => ({
      ...p,
      clientName: c.companyName || c.name,
      clientLocker: c.lockerCode,
      clientId: c.id
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredPending = pendingClients.filter(
    (c) =>
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lockerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadAchBatch = () => {
    addToast('success', 'Archivo ACH Generado', 'Descargando lote bancario SIPARD / ACH para Banreservas y Banco Popular.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
            Caja Central GoPaq • Recaudos Contra Entrega (COD)
          </span>
          <div className="text-3xl font-black font-mono mt-1">
            {formatMoney(totalPendingCod)}
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Fondos cobrados por motoristas y furgonetas pendientes de transferir a <strong>{pendingClients.length} comercios B2B</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadAchBatch}
            icon={<Download className="w-4 h-4" />}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Exportar Lote ACH Bancario
          </Button>
        </div>
      </div>

      {/* Pending Payouts Table */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-500" />
              <span>Comercios con Liquidaciones COD Pendientes ({pendingClients.length})</span>
            </h3>
            <p className="text-xs text-slate-500">Transfiera los balances a las cuentas bancarias de cada cliente</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por comercio o casillero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </div>

        {filteredPending.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Comercio</th>
                  <th className="p-3">Casillero</th>
                  <th className="p-3">Banco & Cuenta Registrada</th>
                  <th className="p-3">Balance por Pagar</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPending.map((client) => (
                  <tr key={client.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition">
                    <td className="p-3">
                      <strong className="text-slate-900 dark:text-white block font-bold">
                        {client.companyName || client.name}
                      </strong>
                      <span className="text-[11px] text-slate-500">{client.email}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                      {client.lockerCode}
                    </td>
                    <td className="p-3">
                      {client.bankInfo ? (
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{client.bankInfo.bankName}</strong>
                          <span className="text-[11px] font-mono text-slate-500">{client.bankInfo.accountNumber} ({client.bankInfo.accountType})</span>
                        </div>
                      ) : (
                        <span className="text-rose-500 text-[11px] font-semibold">Sin cuenta bancaria</span>
                      )}
                    </td>
                    <td className="p-3">
                      <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm font-black">
                        {formatMoney(client.codPendingPayoutDop)}
                      </strong>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => onOpenCodPayout(client)}
                        icon={<Send className="w-3 h-3" />}
                      >
                        Liquidar Transferencia
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No hay saldos COD pendientes de transferir en este momento. Todas las cuentas están al día.
          </div>
        )}
      </Card>

      {/* Historic Payouts */}
      <Card className="space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Historial General de Liquidaciones & Comprobantes Bancarios</span>
        </h3>

        {allPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Comercio</th>
                  <th className="p-3">Monto Desembolsado</th>
                  <th className="p-3">Referencia ACH</th>
                  <th className="p-3">Banco</th>
                  <th className="p-3">Guías</th>
                  <th className="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{payout.date}</td>
                    <td className="p-3">
                      <strong className="text-slate-900 dark:text-white block font-bold">{payout.clientName}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{payout.clientLocker}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(payout.amountDop)}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {payout.referenceNumber}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{payout.bankName}</td>
                    <td className="p-3 font-semibold">{payout.shipmentsCount} paquetes</td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Transferido
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No hay registros previos de liquidaciones.</p>
        )}
      </Card>
    </div>
  );
};
