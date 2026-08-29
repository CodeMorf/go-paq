import React from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  Building2,
  Mail,
  Phone,
  CreditCard,
  Banknote,
  Sliders,
  Send,
  Eye,
  Trash2,
  Copy,
  Key
} from 'lucide-react';
import { Card } from '../../ui/DesignSystem';

interface ClientsTableViewProps {
  clients: ClientProfile[];
  onOpenDetail: (client: ClientProfile) => void;
  onOpenCodPayout: (client: ClientProfile) => void;
  onOpenCreditAdjust: (client: ClientProfile) => void;
}

export const ClientsTableView: React.FC<ClientsTableViewProps> = ({
  clients,
  onOpenDetail,
  onOpenCodPayout,
  onOpenCreditAdjust
}) => {
  const { formatMoney, deleteClient, addToast } = useApp();

  return (
    <Card className="p-0 overflow-hidden border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3.5">Empresa / Cliente</th>
              <th className="p-3.5">RNC / Cédula</th>
              <th className="p-3.5">Tipo & Casillero</th>
              <th className="p-3.5">Línea de Crédito</th>
              <th className="p-3.5">Fondo COD Pendiente</th>
              <th className="p-3.5">Tarifa & NCF</th>
              <th className="p-3.5">Ejecutivo</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {clients.map((client) => {
              const creditUsed = client.creditUsedDop || client.balanceDop || 0;
              const creditUsagePercent =
                client.creditLimitDop > 0
                  ? Math.min(100, Math.round((creditUsed / client.creditLimitDop) * 100))
                  : 0;

              return (
                <tr
                  key={client.id}
                  onClick={() => onOpenDetail(client)}
                  className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition cursor-pointer"
                >
                  {/* Name */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {(client.companyName || client.name).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-bold">
                          {client.companyName || client.name}
                        </strong>
                        <span className="text-[11px] text-slate-500">{client.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* RNC */}
                  <td className="p-3.5 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {client.rncOrDni || '—'}
                  </td>

                  {/* Type & Locker */}
                  <td className="p-3.5">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        client.clientType === 'enterprise'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : client.clientType === 'corporate'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : client.clientType === 'ecommerce'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {client.clientType}
                      </span>
                      <span className="block font-mono text-[10px] text-slate-400 font-bold">
                        {client.lockerCode}
                      </span>
                    </div>
                  </td>

                  {/* Credit line */}
                  <td className="p-3.5">
                    <div className="space-y-1 min-w-[130px]">
                      <div className="flex justify-between font-mono text-xs">
                        <strong className="text-slate-900 dark:text-white">
                          {formatMoney(client.creditLimitDop)}
                        </strong>
                        <span className="text-[10px] text-slate-400">{creditUsagePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            creditUsagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${creditUsagePercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{client.creditDays || 30} días plazo</span>
                    </div>
                  </td>

                  {/* COD */}
                  <td className="p-3.5">
                    {client.codPendingPayoutDop > 0 ? (
                      <div className="space-y-1">
                        <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold block">
                          {formatMoney(client.codPendingPayoutDop)}
                        </strong>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCodPayout(client);
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Liquidar Fondos</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        Al día (RD$ 0.00)
                      </span>
                    )}
                  </td>

                  {/* Rate & NCF */}
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {client.discountRatePercent}% OFF
                      </span>
                      <span className="block text-[10px] font-mono text-purple-600 dark:text-purple-400">
                        NCF: {client.ncfType || 'B01'}
                      </span>
                    </div>
                  </td>

                  {/* Executive */}
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {client.accountExecutive || 'Sin asignar'}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenDetail(client)}
                        title="Ver Ficha 360°"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenCreditAdjust(client)}
                        title="Ajustar Línea de Crédito"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                      {client.codPendingPayoutDop > 0 && (
                        <button
                          onClick={() => onOpenCodPayout(client)}
                          title="Liquidar Fondos COD"
                          className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la cuenta de ${client.companyName || client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        title="Eliminar Cuenta"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
