import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Store, 
  Package, 
  Layers, 
  Truck, 
  DollarSign, 
  Barcode, 
  Printer, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { MetricCard, Card, Button } from '../ui/DesignSystem';

export const SucursalDashboard: React.FC = () => {
  const { selectedBranch, formatMoney, setActiveSubView } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
            Terminal de Agencia • {selectedBranch.code}
          </span>
          <h2 className="text-xl font-black mt-1">
            {selectedBranch.name}
          </h2>
          <p className="text-xs text-slate-400">
            Encargado: {selectedBranch.managerName} • {selectedBranch.address}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={<Store className="w-4 h-4" />}
            onClick={() => setActiveSubView('mostrador')}
          >
            Recepción Rápida Mostrador
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Paquetes en Sucursal"
          value={`${selectedBranch.currentPackagesCount}`}
          subtitle={`Capacidad max: ${selectedBranch.capacityMaxPackages}`}
          icon={<Package className="w-5 h-5" />}
          accent="indigo"
          onClick={() => setActiveSubView('inventario')}
        />
        <MetricCard
          title="Efectivo en Caja Actual"
          value={formatMoney(selectedBranch.cashInDrawer, selectedBranch.currency)}
          subtitle="Arqueo del turno abierto"
          icon={<DollarSign className="w-5 h-5" />}
          accent="emerald"
          onClick={() => setActiveSubView('arqueo-caja')}
        />
        <MetricCard
          title="Drivers en Ruta Local"
          value={`${selectedBranch.activeDriversCount} Conductores`}
          subtitle="Despachados hoy"
          icon={<Truck className="w-5 h-5" />}
          accent="blue"
          onClick={() => setActiveSubView('despacho-drivers')}
        />
        <MetricCard
          title="Entregas en Mostrador Hoy"
          value="38 Paquetes"
          subtitle="Pick-up en tienda"
          icon={<Store className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card
          onClick={() => setActiveSubView('mostrador')}
          className="hover:border-indigo-500 cursor-pointer space-y-2"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl w-fit">
            <Store className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Punto de Venta Mostrador</h4>
          <p className="text-xs text-slate-500">Recibe paquetes de clientes presenciales y emite sticker térmico de guía.</p>
        </Card>

        <Card
          onClick={() => setActiveSubView('inventario')}
          className="hover:border-indigo-500 cursor-pointer space-y-2"
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl w-fit">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Racks & Zonas de Almacén</h4>
          <p className="text-xs text-slate-500">Ubica paquetes en estanterías por código de barra (Rack A1, B2, Jaula).</p>
        </Card>

        <Card
          onClick={() => setActiveSubView('arqueo-caja')}
          className="hover:border-indigo-500 cursor-pointer space-y-2"
        >
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl w-fit">
            <DollarSign className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cierre & Arqueo de Caja</h4>
          <p className="text-xs text-slate-500">Cuadre de efectivo de mostrador y cobros COD entregados por los drivers.</p>
        </Card>
      </div>
    </div>
  );
};
