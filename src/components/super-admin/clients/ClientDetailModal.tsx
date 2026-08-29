import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile, ClientBranchAddress, ClientInvoice, ClientCodPayout } from '../../../types';
import {
  Building2,
  X,
  Mail,
  Phone,
  CreditCard,
  Key,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Copy,
  RefreshCw,
  Plus,
  ExternalLink,
  Percent,
  Truck,
  Package,
  Layers,
  Banknote,
  Send,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/DesignSystem';

interface ClientDetailModalProps {
  client: ClientProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenCodPayout: (client: ClientProfile) => void;
  onOpenCreditAdjust: (client: ClientProfile) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onOpenCodPayout,
  onOpenCreditAdjust
}) => {
  const { formatMoney, shipments, generateClientApiKey, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    'general' | 'finance' | 'cod' | 'shipments' | 'branches' | 'api' | 'rates'
  >('general');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    addToast('success', 'Copiado al Portapapeles', `${label} copiado con éxito.`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Shipments for this client (filter by sender or locker)
  const clientShipments = shipments.filter(
    (s) =>
      (client.companyName && s.origin?.name?.toLowerCase().includes(client.companyName.toLowerCase())) ||
      (client.name && s.origin?.name?.toLowerCase().includes(client.name.toLowerCase())) ||
      (client.lockerCode && (s.lockerCode === client.lockerCode || s.trackingNumber?.includes(client.lockerCode)))
  );

  const creditUsed = client.creditUsedDop || client.balanceDop || 0;
  const creditAvailable = Math.max(0, client.creditLimitDop - creditUsed);
  const creditUsagePercent = client.creditLimitDop > 0 ? Math.min(100, Math.round((creditUsed / client.creditLimitDop) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
              {(client.companyName || client.name).substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {client.companyName || client.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  client.clientType === 'enterprise'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : client.clientType === 'corporate'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : client.clientType === 'ecommerce'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {client.clientType}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold">
                  Casillero: {client.lockerCode}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Activo
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                {client.rncOrDni && (
                  <span className="font-mono">RNC/Cédula: <strong className="text-slate-700 dark:text-slate-200">{client.rncOrDni}</strong></span>
                )}
                <span>Contacto: <strong className="text-slate-700 dark:text-slate-200">{client.name}</strong></span>
                <span>Ejecutivo Asignado: <strong className="text-indigo-600 dark:text-indigo-400">{client.accountExecutive || 'Sin asignar'}</strong></span>
                <span>Registro: <strong>{client.registeredDate}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          {[
            { id: 'general', label: 'Resumen 360°', icon: <Building2 className="w-4 h-4" /> },
            { id: 'finance', label: 'Línea de Crédito & NCF', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'cod', label: `Liquidaciones COD (${formatMoney(client.codPendingPayoutDop)})`, icon: <Banknote className="w-4 h-4 text-amber-500" /> },
            { id: 'shipments', label: `Guías & Envíos (${clientShipments.length || client.activeShipments})`, icon: <Package className="w-4 h-4" /> },
            { id: 'branches', label: `Sucursales (${client.branchesList?.length || 1})`, icon: <MapPin className="w-4 h-4" /> },
            { id: 'api', label: 'API B2B & Webhooks', icon: <Key className="w-4 h-4" /> },
            { id: 'rates', label: `Tarifas Negociadas (${client.discountRatePercent}%)`, icon: <Percent className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40 dark:bg-slate-900/50">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Línea de Crédito</span>
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {formatMoney(client.creditLimitDop)}
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Uso: {creditUsagePercent}%</span>
                      <span>Disp: {formatMoney(creditAvailable)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          creditUsagePercent > 80 ? 'bg-rose-500' : creditUsagePercent > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${creditUsagePercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Fondos COD por Pagarle</span>
                    <Banknote className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {formatMoney(client.codPendingPayoutDop)}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Cobrado en entregas</span>
                    {client.codPendingPayoutDop > 0 && (
                      <button
                        onClick={() => onOpenCodPayout(client)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Liquidar →
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Descuento Comercial</span>
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {client.discountRatePercent}% OFF
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {client.customRates?.freePickups ? 'Recogidas B2B Gratis incluidas' : 'Tarifa estándar de recogida'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Facturación Fiscal</span>
                    <FileText className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    {client.ncfType || 'B01'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Plazo: <strong>{client.creditDays || 30} días</strong> crédito
                  </p>
                </div>
              </div>

              {/* Company Info & Fiscal Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Datos Fiscales & Legales (República Dominicana)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">RNC / Cédula Fiscal</span>
                      <strong className="text-slate-900 dark:text-white font-mono text-sm">
                        {client.rncOrDni || 'No registrado'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Tipo de Comprobante Fiscal</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {client.ncfType === 'B01' ? 'Crédito Fiscal (B01 / E31)' : client.ncfType === 'B14' ? 'Régimen Especial / Zona Franca (B14)' : 'Consumidor Final (B02)'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl col-span-2">
                      <span className="text-slate-400 block text-[10px]">Razón Social Completa</span>
                      <strong className="text-slate-900 dark:text-white">
                        {client.companyName || client.name}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl col-span-2">
                      <span className="text-slate-400 block text-[10px]">Dirección Fiscal de Facturación</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                        {client.billingAddress
                          ? `${client.billingAddress.street}, ${client.billingAddress.sector}, ${client.billingAddress.city}, ${client.billingAddress.province}`
                          : 'Santo Domingo, República Dominicana'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Datos Bancarios para Desembolso COD</span>
                  </h4>

                  {client.bankInfo ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Banco Receptor:</span>
                          <strong className="text-slate-900 dark:text-white font-bold">{client.bankInfo.bankName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tipo de Cuenta:</span>
                          <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{client.bankInfo.accountType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Número de Cuenta:</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{client.bankInfo.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Titular Registrado:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{client.bankInfo.holderName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">Cuenta verificada por ACH</span>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onOpenCodPayout(client)}
                          icon={<Send className="w-3 h-3" />}
                        >
                          Emitir Desembolso Manual
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                      <p className="font-medium">No se han registrado datos bancarios para este cliente.</p>
                      <p className="text-[11px] mt-1 text-slate-500">Configure una cuenta corriente o de ahorros para transferir los cobros COD automáticamente.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE & CREDIT */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* Credit limit management banner */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Línea de Crédito Comercial B2B</span>
                  <div className="text-3xl font-black font-mono mt-1">
                    {formatMoney(client.creditLimitDop)}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Plazo de cobro: <strong>{client.creditDays || 30} días</strong> desde emisión de NCF • Crédito usado actualmente: <strong>{formatMoney(creditUsed)}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenCreditAdjust(client)}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Ajustar Línea de Crédito
                  </Button>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Facturas Emitidas & Comprobantes Fiscales (NCF)</span>
                  </h4>
                  <span className="text-xs text-slate-500">DGII Compliance Dominicana</span>
                </div>

                {client.invoices && client.invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">NCF Fiscal</th>
                          <th className="p-3">Fecha Emisión</th>
                          <th className="p-3">Vencimiento</th>
                          <th className="p-3">Guías</th>
                          <th className="p-3">Monto Facturado</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {client.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              {inv.ncf}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{inv.issueDate}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{inv.dueDate}</td>
                            <td className="p-3 font-bold">{inv.shipmentsCount} guías</td>
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              {formatMoney(inv.amountDop)}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : inv.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}>
                                {inv.status === 'paid' ? 'Pagada' : inv.status === 'pending' ? 'Pendiente' : 'Vencida'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => addToast('info', 'Descargando Factura PDF', `Comprobante fiscal ${inv.ncf}`)}
                                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <span>Ver NCF</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No hay facturas emitidas recientemente para esta cuenta.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: COD PAYOUTS */}
          {activeTab === 'cod' && (
            <div className="space-y-6">
              {/* COD Balance Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Balance COD Retenido por Liquidar</span>
                  <div className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
                    {formatMoney(client.codPendingPayoutDop)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Efectivo recaudado por los conductores en las entregas contra entrega de este comercio.
                  </p>
                </div>

                {client.codPendingPayoutDop > 0 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenCodPayout(client)}
                    icon={<Send className="w-4 h-4" />}
                  >
                    Procesar Liquidación Ahora
                  </Button>
                ) : (
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Todos los fondos COD están liquidados al día
                  </span>
                )}
              </div>

              {/* Payouts History */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Historial de Desembolsos & Transferencias Bancarias Realizadas</span>
                </h4>

                {client.codPayoutsHistory && client.codPayoutsHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Monto Transferido</th>
                          <th className="p-3">Ref. Bancaria ACH</th>
                          <th className="p-3">Banco Destino</th>
                          <th className="p-3">Guías Pagadas</th>
                          <th className="p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {client.codPayoutsHistory.map((payout) => (
                          <tr key={payout.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                            <td className="p-3 font-medium text-slate-900 dark:text-white">{payout.date}</td>
                            <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatMoney(payout.amountDop)}
                            </td>
                            <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-bold">{payout.referenceNumber}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{payout.bankName}</td>
                            <td className="p-3 font-medium">{payout.shipmentsCount} órdenes</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                {payout.status === 'processed' ? 'Procesado' : 'En Tránsito'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No hay registros de desembolsos previos.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: SHIPMENTS */}
          {activeTab === 'shipments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Guías & Envíos Asociados a {client.companyName || client.name}
                </h4>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  {clientShipments.length} envíos encontrados
                </span>
              </div>

              {clientShipments.length > 0 ? (
                <div className="space-y-3">
                  {clientShipments.map((shp) => (
                    <div
                      key={shp.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{shp.trackingNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {shp.serviceType}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">
                            Destino: {shp.destination?.name || 'Cliente Final'} • {shp.destination?.city || 'Santo Domingo'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {shp.codAmount ? (
                          <div className="text-right">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">COD por Cobrar</span>
                            <span className="font-mono font-bold">{formatMoney(shp.codAmount)}</span>
                          </div>
                        ) : null}

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Flete</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{formatMoney(shp.shippingCost)}</span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          shp.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : shp.status === 'in_transit' || shp.status === 'out_for_delivery'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {shp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-500">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No se registran envíos activos en este momento para esta cuenta.
                </div>
              )}
            </div>
          )}

          {/* TAB: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sucursales & Almacenes del Cliente</h4>
                  <p className="text-xs text-slate-500">Puntos de recogida programada para choferes de GoPaq</p>
                </div>

                <Button
                  variant="secondary"
                  size="xs"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => addToast('info', 'Registrar Sucursal', 'Formulario de nueva dirección de recogida')}
                >
                  Agregar Sede
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.branchesList && client.branchesList.length > 0 ? (
                  client.branchesList.map((branch) => (
                    <div
                      key={branch.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 relative"
                    >
                      {branch.isPrimary && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          Sede Principal
                        </span>
                      )}
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        {branch.name}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{branch.address}, {branch.sector}, {branch.city}</p>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Contacto: <strong>{branch.contactPerson}</strong></span>
                        <span>Tel: <strong>{branch.phone}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 col-span-2 text-center">
                    Sede única registrada en dirección fiscal.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: API & WEBHOOKS */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      <span>Claves de Acceso API GoPaq Logistics (REST / GraphQL)</span>
                    </h4>
                    <p className="text-xs text-slate-500">Para conectar tiendas Shopify, WooCommerce, Magento o ERPs empresariales</p>
                  </div>

                  <Button
                    variant="secondary"
                    size="xs"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => generateClientApiKey(client.id, 'live')}
                  >
                    Regenerar Clave Live
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Live Key */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Clave de Producción (Live API Key)
                      </span>
                      <button
                        onClick={() => handleCopy(client.apiKey?.liveKey || 'gpq_live_sample', 'Live API Key')}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'Live API Key' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-slate-900 dark:text-white break-all bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      {client.apiKey?.liveKey || 'gpq_live_9a8f1029c782019b88210'}
                    </p>
                  </div>

                  {/* Test Key */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Clave Sandbox / Pruebas (Test Key)
                      </span>
                      <button
                        onClick={() => handleCopy(client.apiKey?.testKey || 'gpq_test_sample', 'Test API Key')}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'Test API Key' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-slate-900 dark:text-white break-all bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      {client.apiKey?.testKey || 'gpq_test_881bca001298471bcca11'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Endpoint */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Webhook URL del Cliente</span>
                </h4>
                <p className="text-xs text-slate-500">GoPaq despachará eventos en tiempo real (`shipment.delivered`, `cod.collected`, `shipment.delayed`) a esta URL.</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-xs text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="truncate">{client.webhookUrl || 'https://api.cliente.do/v1/gopaq-webhooks'}</span>
                  <button
                    onClick={() => addToast('info', 'Ping Webhook', 'Enviando payload de prueba a servidor del cliente...')}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-2 shrink-0"
                  >
                    Probar Ping
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RATES & DISCOUNTS */}
          {activeTab === 'rates' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  <span>Tarifario Comercial Especial Acordado</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Rutas Urbanas (Gran SD & Santiago)</span>
                    <strong className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {client.customRates?.baseUrbanDiscount || client.discountRatePercent}% de Descuento
                    </strong>
                    <p className="text-[11px] text-slate-500">Aplica sobre tarifa base urbana de RD$ 180</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Rutas Interprovinciales & Cibao/Este</span>
                    <strong className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {client.customRates?.baseInterprovincialDiscount || client.discountRatePercent}% de Descuento
                    </strong>
                    <p className="text-[11px] text-slate-500">Aplica sobre tarifa de corredor nacional</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Recogidas Masivas en Almacén</span>
                    <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {client.customRates?.freePickups ? 'GRATIS' : 'RD$ 150 / Parada'}
                    </strong>
                    <p className="text-[11px] text-slate-500">Pickups programados en sede o sucursales</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>ID Interno: <strong className="font-mono">{client.id}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar Ficha
            </Button>
            {client.codPendingPayoutDop > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenCodPayout(client);
                }}
                icon={<Banknote className="w-4 h-4" />}
              >
                Liquidar COD ({formatMoney(client.codPendingPayoutDop)})
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
