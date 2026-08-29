import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shipment, ShipmentStatus, ServiceType } from '../../types';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  MapPin, 
  Truck, 
  DollarSign, 
  CheckCircle, 
  Calendar,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Printer
} from 'lucide-react';
import { Button, StatusBadge, ServiceBadge, Drawer } from '../ui/DesignSystem';
import { TrackingTimeline } from '../ui/TrackingTimeline';

export const ShipmentsManager: React.FC = () => {
  const { 
    shipments, 
    formatMoney, 
    setIsNewShipmentModalOpen, 
    setSelectedTracking,
    setCurrentSection,
    setActiveSubView,
    setActiveLabelShipment
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [activeShipmentDetail, setActiveShipmentDetail] = useState<Shipment | null>(null);

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch = 
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.name.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.name.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    const matchesService = selectedService === 'all' || s.serviceType === selectedService;

    return matchesSearch && matchesStatus && matchesService;
  });

  const statusesList: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'out_for_delivery', label: 'En Reparto' },
    { id: 'in_transit', label: 'En Tránsito' },
    { id: 'picked_up', label: 'Recogidos' },
    { id: 'at_branch', label: 'En Sucursal' },
    { id: 'delivered', label: 'Entregados' },
    { id: 'confirmed', label: 'Confirmados' }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Gestión Integral de Envíos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervisión, despacho y trazabilidad de todos los envíos locales, nacionales e internacionales
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewShipmentModalOpen(true)}
        >
          Crear Nuevo Envío
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por guía NX-..., destinatario, ciudad o remitente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="all">Todos los Servicios</option>
              <option value="local">Local</option>
              <option value="nacional">Nacional</option>
              <option value="internacional">Courier Internacional</option>
              <option value="mudanza">Mudanzas</option>
              <option value="carga_pesada">Carga Pesada</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {statusesList.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedStatus === st.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Guía Tracking</th>
                <th className="py-3.5 px-4">Servicio</th>
                <th className="py-3.5 px-4">Origen & Destino</th>
                <th className="py-3.5 px-4">Dimensiones / Peso</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Driver / Sucursal</th>
                <th className="py-3.5 px-4 text-right">Tarifa / COD</th>
                <th className="py-3.5 px-3 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No se encontraron envíos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {s.trackingNumber}
                      </span>
                      {s.externalTracking && (
                        <span className="text-[10px] text-indigo-500 font-mono block">
                          Ext: {s.externalTracking}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <ServiceBadge type={s.serviceType} showIcon={false} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-900 dark:text-white font-semibold block truncate max-w-[150px]">
                          {s.destination.name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span>{s.origin.city} → {s.destination.city}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold block">
                        {s.package.weightKg} KG
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.package.lengthCm}×{s.package.widthCm}×{s.package.heightCm} cm
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 dark:text-slate-200 block">
                        {s.driverName || s.branchName || 'Pendiente Asignación'}
                      </span>
                      {s.vehiclePlate && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {s.vehiclePlate}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatMoney(s.shippingCost, s.currency)}
                      </span>
                      {s.codAmount && s.codAmount > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                          COD {formatMoney(s.codAmount)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setActiveLabelShipment(s)}
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                          title="Imprimir Etiqueta Térmica 4x6"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveShipmentDetail(s)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Ver Línea de Tiempo & Detalle"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Detail Drawer */}
      <Drawer
        isOpen={!!activeShipmentDetail}
        onClose={() => setActiveShipmentDetail(null)}
        title={`Detalle de Envío • ${activeShipmentDetail?.trackingNumber}`}
        width="lg"
      >
        {activeShipmentDetail && (
          <TrackingTimeline shipment={activeShipmentDetail} />
        )}
      </Drawer>
    </div>
  );
};
