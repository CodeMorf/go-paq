import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClientProfile } from '../../types';
import {
  Users,
  Building2,
  CreditCard,
  Banknote,
  FileText,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Download,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Package,
  Layers,
  Send,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';
import { ClientCard } from './clients/ClientCard';
import { ClientsTableView } from './clients/ClientsTableView';
import { ClientsCodReconciliationTab } from './clients/ClientsCodReconciliationTab';
import { ClientsInvoicingTab } from './clients/ClientsInvoicingTab';
import { ClientDetailModal } from './clients/ClientDetailModal';
import { NewClientModal } from './clients/NewClientModal';
import { CodPayoutModal } from './clients/CodPayoutModal';
import { CreditAdjustmentModal } from './clients/CreditAdjustmentModal';

export const ClientsManager: React.FC = () => {
  const { clients, formatMoney, addToast } = useApp();

  // Navigation & View Mode
  const [activeMainTab, setActiveMainTab] = useState<'directory' | 'cod' | 'invoicing'>('directory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_cod' | 'high_credit'>('all');

  // Modals state
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<ClientProfile | null>(null);
  const [payoutClient, setPayoutClient] = useState<ClientProfile | null>(null);
  const [creditAdjustClient, setCreditAdjustClient] = useState<ClientProfile | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Executive Metrics Calculations
  const totalB2BClients = clients.length;
  const enterpriseCount = clients.filter((c) => c.clientType === 'enterprise').length;
  const corporateCount = clients.filter((c) => c.clientType === 'corporate' || c.clientType === 'ecommerce').length;
  
  const totalCreditApproved = clients.reduce((acc, c) => acc + (c.creditLimitDop || 0), 0);
  const totalCreditUsed = clients.reduce((acc, c) => acc + (c.creditUsedDop || c.balanceDop || 0), 0);
  
  const totalPendingCodPayout = clients.reduce((acc, c) => acc + (c.codPendingPayoutDop || 0), 0);
  const totalInvoicedNcf = clients.reduce(
    (acc, c) => acc + (c.invoices || []).reduce((invSum, inv) => invSum + inv.amountDop, 0),
    0
  );

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase())) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.lockerCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.rncOrDni && c.rncOrDni.toLowerCase().includes(search.toLowerCase())) ||
      (c.accountExecutive && c.accountExecutive.toLowerCase().includes(search.toLowerCase()));

    const matchesType = clientTypeFilter === 'all' || c.clientType === clientTypeFilter;

    let matchesStatus = true;
    if (statusFilter === 'with_cod') {
      matchesStatus = (c.codPendingPayoutDop || 0) > 0;
    } else if (statusFilter === 'high_credit') {
      matchesStatus = (c.creditLimitDop || 0) >= 150000;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportClients = () => {
    addToast('success', 'Exportación B2B Generada', 'Descargando cartera corporativa con RNC, límites crediticios y saldos COD.');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Gestión de Clientes & Cuentas Corporativas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Líneas de crédito B2B, comprobantes fiscales NCF, liquidación bancaria de fondos COD y claves API
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportClients}
            icon={<Download className="w-4 h-4" />}
          >
            Exportar Cartera
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewClientModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo Cliente / Empresa
          </Button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Cartera B2B Activa</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalB2BClients} <span className="text-xs font-normal text-slate-400">Cuentas</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 font-bold">
              {enterpriseCount} Enterprise
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold">
              {corporateCount} Corporativas
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Líneas de Crédito Otorgadas</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {formatMoney(totalCreditApproved)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>Uso actual: <strong>{formatMoney(totalCreditUsed)}</strong></span>
            <span>{totalCreditApproved > 0 ? Math.round((totalCreditUsed / totalCreditApproved) * 100) : 0}%</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Fondos COD por Liquidar</span>
            <Banknote className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatMoney(totalPendingCodPayout)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Cobrado en ruta a favor de comercios
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Facturado B2B con NCF</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatMoney(totalInvoicedNcf)}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Comprobantes B01 / B14 (DGII)
          </p>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveMainTab('directory')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'directory'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Directorio de Cuentas B2B ({clients.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('cod')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'cod'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4 text-amber-500" />
            <span>Liquidaciones COD & ACH ({clients.filter((c) => c.codPendingPayoutDop > 0).length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('invoicing')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'invoicing'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Facturación NCF & Cartera Fiscal</span>
          </button>
        </div>

        {/* View Switcher (Only in Directory Tab) */}
        {activeMainTab === 'directory' && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista Cuadrícula 360°"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista Tabla B2B"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* DIRECTORY VIEW */}
      {activeMainTab === 'directory' && (
        <div className="space-y-5">
          {/* Search & Filter bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Empresa, RNC, Contacto, Casillero (GP-), Email o Ejecutivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={clientTypeFilter}
                onChange={(e) => setClientTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium"
              >
                <option value="all">Todos los Tipos</option>
                <option value="enterprise">Enterprise B2B</option>
                <option value="corporate">Corporativo</option>
                <option value="ecommerce">E-commerce / Tiendas</option>
                <option value="individual">Casilleros Personales</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium"
              >
                <option value="all">Todos los Estados</option>
                <option value="with_cod">Con Saldo COD Pendiente</option>
                <option value="high_credit">Línea Crédito ≥ RD$ 150k</option>
              </select>
            </div>
          </div>

          {/* Cards or Table */}
          {filteredClients.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onOpenDetail={(c) => setSelectedClientForDetail(c)}
                    onOpenCodPayout={(c) => setPayoutClient(c)}
                    onOpenCreditAdjust={(c) => setCreditAdjustClient(c)}
                  />
                ))}
              </div>
            ) : (
              <ClientsTableView
                clients={filteredClients}
                onOpenDetail={(c) => setSelectedClientForDetail(c)}
                onOpenCodPayout={(c) => setPayoutClient(c)}
                onOpenCreditAdjust={(c) => setCreditAdjustClient(c)}
              />
            )
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-slate-500">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron clientes corporativos</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No hay resultados coincidentes con los filtros aplicados. Intente ajustar el término de búsqueda o cree una nueva cuenta.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setClientTypeFilter('all');
                  setStatusFilter('all');
                }}
              >
                Restablecer Filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* COD RECONCILIATION TAB */}
      {activeMainTab === 'cod' && (
        <ClientsCodReconciliationTab
          onOpenCodPayout={(c) => setPayoutClient(c)}
          onOpenDetail={(c) => setSelectedClientForDetail(c)}
        />
      )}

      {/* INVOICING TAB */}
      {activeMainTab === 'invoicing' && (
        <ClientsInvoicingTab
          onOpenDetail={(c) => setSelectedClientForDetail(c)}
        />
      )}

      {/* MODALS */}
      {selectedClientForDetail && (
        <ClientDetailModal
          client={selectedClientForDetail}
          isOpen={!!selectedClientForDetail}
          onClose={() => setSelectedClientForDetail(null)}
          onOpenCodPayout={(c) => {
            setSelectedClientForDetail(null);
            setPayoutClient(c);
          }}
          onOpenCreditAdjust={(c) => {
            setSelectedClientForDetail(null);
            setCreditAdjustClient(c);
          }}
        />
      )}

      {isNewClientModalOpen && (
        <NewClientModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
        />
      )}

      {payoutClient && (
        <CodPayoutModal
          client={payoutClient}
          isOpen={!!payoutClient}
          onClose={() => setPayoutClient(null)}
        />
      )}

      {creditAdjustClient && (
        <CreditAdjustmentModal
          client={creditAdjustClient}
          isOpen={!!creditAdjustClient}
          onClose={() => setCreditAdjustClient(null)}
        />
      )}

    </div>
  );
};
export default ClientsManager;
