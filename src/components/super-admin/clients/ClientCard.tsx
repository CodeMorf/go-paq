import React from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  Building2,
  Mail,
  Phone,
  CreditCard,
  Banknote,
  Percent,
  ChevronRight,
  Send,
  Sliders,
  CheckCircle2,
  ExternalLink,
  MapPin,
  FileText
} from 'lucide-react';
import { Card } from '../../ui/DesignSystem';

interface ClientCardProps {
  client: ClientProfile;
  onOpenDetail: (client: ClientProfile) => void;
  onOpenCodPayout: (client: ClientProfile) => void;
  onOpenCreditAdjust: (client: ClientProfile) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onOpenDetail,
  onOpenCodPayout,
  onOpenCreditAdjust
}) => {
  const { formatMoney } = useApp();

  const creditUsed = client.creditUsedDop || client.balanceDop || 0;
  const creditUsagePercent = client.creditLimitDop > 0 ? Math.min(100, Math.round((creditUsed / client.creditLimitDop) * 100)) : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group">
      <div className="space-y-4">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 shrink-0">
              {(client.companyName || client.name).substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  client.clientType === 'enterprise'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : client.clientType === 'corporate'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : client.clientType === 'ecommerce'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {client.clientType}
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {client.lockerCode}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate max-w-[200px]">
                {client.companyName || client.name}
              </h4>
            </div>
          </div>

          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Activo
          </span>
        </div>

        {/* Contact info & RNC */}
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl">
          {client.rncOrDni && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">RNC / Cédula:</span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">{client.rncOrDni}</strong>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Contacto:</span>
            <span className="truncate max-w-[170px]">{client.name}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Teléfono:</span>
            <span className="font-mono">{client.phone}</span>
          </div>
        </div>

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Credit Limit */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Línea Crédito</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreditAdjust(client);
                }}
                className="hover:text-indigo-600"
                title="Ajustar Límite"
              >
                <Sliders className="w-3 h-3" />
              </button>
            </div>
            <strong className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
              {formatMoney(client.creditLimitDop)}
            </strong>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Uso: {creditUsagePercent}%</span>
              <span className="text-indigo-600 font-semibold">{client.creditDays || 30}d</span>
            </div>
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  creditUsagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${creditUsagePercent}%` }}
              ></div>
            </div>
          </div>

          {/* COD Pending Payout */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 mb-1">
              <span>COD por Liquidar</span>
              <Banknote className="w-3 h-3" />
            </div>
            <strong className="text-xs font-bold text-amber-700 dark:text-amber-400 font-mono block">
              {formatMoney(client.codPendingPayoutDop)}
            </strong>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Fondo retenido</span>
              {client.codPendingPayoutDop > 0 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCodPayout(client);
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Pagar →
                </button>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold">Al día</span>
              )}
            </div>
          </div>
        </div>

        {/* Commercial terms pill */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-slate-500 flex items-center gap-1">
            <Percent className="w-3 h-3 text-emerald-500" />
            <span>Desc: <strong className="text-slate-900 dark:text-white font-bold">{client.discountRatePercent}%</strong></span>
          </span>
          <span className="text-slate-500">
            NCF: <strong className="font-mono text-purple-600 dark:text-purple-400">{client.ncfType || 'B01'}</strong>
          </span>
          <span className="text-slate-500">
            Guías: <strong className="text-slate-900 dark:text-white font-bold">{client.activeShipments}</strong>
          </span>
        </div>

      </div>

      {/* Footer action button */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Ejecutivo: <strong>{client.accountExecutive?.split(' ')[1] || 'Asignado'}</strong>
        </span>

        <button
          onClick={() => onOpenDetail(client)}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Ficha 360°</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
