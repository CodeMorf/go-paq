import React, { Component, ErrorInfo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ui/DesignSystem';
import { CommandPalette } from './components/ui/CommandPalette';
import { Modal } from './components/ui/DesignSystem';
import { ShipmentCreator } from './components/portal/ShipmentCreator';

// Super Admin
import { SuperAdminLayout } from './components/super-admin/SuperAdminLayout';
import { SuperAdminDashboard } from './components/super-admin/SuperAdminDashboard';
import { LiveConsole } from './components/super-admin/LiveConsole';
import { ShipmentsManager } from './components/super-admin/ShipmentsManager';
import { InternationalCourier } from './components/super-admin/InternationalCourier';
import { RoutesDispatcher } from './components/super-admin/RoutesDispatcher';
import { MovingHeavyCargo } from './components/super-admin/MovingHeavyCargo';
import { DriversFleet } from './components/super-admin/DriversFleet';
import { BranchesWarehouses } from './components/super-admin/BranchesWarehouses';
import { ClientsManager } from './components/super-admin/ClientsManager';
import { CodReconciliation } from './components/super-admin/CodReconciliation';
import { RatesEngine } from './components/super-admin/RatesEngine';
import { TeamRbac } from './components/super-admin/TeamRbac';
import { SystemSettings } from './components/super-admin/SystemSettings';
import { DangerousZonesManager } from './components/super-admin/DangerousZonesManager';
import { ZernioOmnichannelCenter } from './components/super-admin/ZernioOmnichannelCenter';
import { AiEventAutomationStudio } from './components/super-admin/AiEventAutomationStudio';

// Operations
import { BulkScanner } from './components/operations/BulkScanner';
import { LiveFleetMap } from './components/operations/LiveFleetMap';
import { ClientRegistrationAndBranchMatcher } from './components/clients/ClientRegistrationAndBranchMatcher';
import { ThermalLabelModal } from './components/ui/ThermalLabelModal';

// Client Portal
import { PortalLayout } from './components/portal/PortalLayout';
import { PortalDashboard } from './components/portal/PortalDashboard';
import { TrackingSearch } from './components/portal/TrackingSearch';
import { LockerAddresses } from './components/portal/LockerAddresses';
import { ClientPackagesList } from './components/portal/ClientPackagesList';
import { ClientBilling } from './components/portal/ClientBilling';
import { ClientApiKeys } from './components/portal/ClientApiKeys';

// Branch / Sucursal OS
import { SucursalLayout } from './components/sucursal/SucursalLayout';
import { SucursalDashboard } from './components/sucursal/SucursalDashboard';
import { CounterPOS } from './components/sucursal/CounterPOS';
import { BranchInventory } from './components/sucursal/BranchInventory';
import { DriversDispatch } from './components/sucursal/DriversDispatch';
import { CashRegister } from './components/sucursal/CashRegister';

// Driver App
import { DriverApp } from './components/driver/DriverApp';

// API Docs
import { ApiDocs } from './components/docs/ApiDocs';

// Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GoPaq Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-rose-400">Error en la Aplicación</h2>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-auto">
              {this.state.error?.message || 'Error inesperado'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white"
            >
              Reiniciar Plataforma
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { 
    currentSection, 
    setCurrentSection,
    currentRole,
    activeSubView, 
    isNewShipmentModalOpen, 
    setIsNewShipmentModalOpen,
    activeLabelShipment,
    setActiveLabelShipment
  } = useApp();

  // Role Protection Guard
  const isRoleAllowedForSection = (section: string, role: string) => {
    if (role === 'Owner' || role === 'Admin') return true;
    if (section === 'super-admin') return role === 'Operations';
    if (section === 'portal') return role.startsWith('Client_');
    if (section === 'sucursal') return ['Counter', 'Dispatcher', 'Warehouse', 'Manager', 'Operations'].includes(role);
    if (section === 'driver') return role === 'Driver';
    if (section === 'docs') return true;
    return false;
  };

  // Sync initial URL path if available
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/portal') && currentSection !== 'portal') {
      setCurrentSection('portal');
    } else if (path.startsWith('/sucursal') && currentSection !== 'sucursal') {
      setCurrentSection('sucursal');
    } else if (path.startsWith('/driver') && currentSection !== 'driver') {
      setCurrentSection('driver');
    } else if (path.startsWith('/docs') && currentSection !== 'docs') {
      setCurrentSection('docs');
    } else if (path.startsWith('/super-admin') && currentSection !== 'super-admin') {
      setCurrentSection('super-admin');
    }
  }, []);

  // Update browser URL on section change without full page reload
  React.useEffect(() => {
    const targetPath = `/${currentSection}`;
    if (window.location.pathname !== targetPath && window.location.pathname !== '/') {
      window.history.replaceState(null, '', targetPath);
    }
  }, [currentSection]);

  // Enforce role guard: if user role not allowed for current section, redirect to allowed default
  const isAllowed = isRoleAllowedForSection(currentSection, currentRole);
  const effectiveSection = isAllowed ? currentSection : (
    currentRole.startsWith('Client_') ? 'portal' :
    currentRole === 'Driver' ? 'driver' :
    ['Counter', 'Dispatcher', 'Warehouse', 'Manager'].includes(currentRole) ? 'sucursal' :
    'super-admin'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150">
      {/* Super Admin Ecosystem */}
      {effectiveSection === 'super-admin' && (
        <SuperAdminLayout>
          {activeSubView === 'dashboard' && <SuperAdminDashboard />}
          {activeSubView === 'operaciones-vivo' && <LiveConsole />}
          {activeSubView === 'zernio-omnichannel' && <ZernioOmnichannelCenter />}
          {activeSubView === 'ia-eventos' && <AiEventAutomationStudio />}
          {activeSubView === 'escaneo-masivo' && <BulkScanner />}
          {activeSubView === 'mapa-flota' && <LiveFleetMap />}
          {activeSubView === 'envios' && <ShipmentsManager />}
          {activeSubView === 'courier-intl' && <InternationalCourier />}
          {activeSubView === 'rutas' && <RoutesDispatcher />}
          {activeSubView === 'mudanzas-carga' && <MovingHeavyCargo />}
          {activeSubView === 'drivers' && <DriversFleet />}
          {activeSubView === 'sucursales' && <BranchesWarehouses />}
          {activeSubView === 'registro-sucursal-matcher' && <ClientRegistrationAndBranchMatcher />}
          {activeSubView === 'clientes' && <ClientsManager />}
          {activeSubView === 'zonas-peligrosas' && <DangerousZonesManager />}
          {activeSubView === 'cod' && <CodReconciliation />}
          {activeSubView === 'tarifas' && <RatesEngine />}
          {activeSubView === 'equipo' && <TeamRbac />}
          {activeSubView === 'configuracion' && <SystemSettings />}
          {![
            'dashboard', 'operaciones-vivo', 'zernio-omnichannel', 'ia-eventos',
            'escaneo-masivo', 'mapa-flota', 'envios', 'courier-intl', 'rutas',
            'mudanzas-carga', 'drivers', 'sucursales', 'registro-sucursal-matcher',
            'clientes', 'zonas-peligrosas', 'cod', 'tarifas', 'equipo', 'configuracion'
          ].includes(activeSubView) && <SuperAdminDashboard />}
        </SuperAdminLayout>
      )}

      {/* Client Portal Ecosystem */}
      {effectiveSection === 'portal' && (
        <PortalLayout>
          {activeSubView === 'dashboard' && <PortalDashboard />}
          {activeSubView === 'crear-envio' && <ShipmentCreator />}
          {activeSubView === 'rastreo' && <TrackingSearch />}
          {activeSubView === 'mis-paquetes' && <ClientPackagesList />}
          {activeSubView === 'casilleros' && <LockerAddresses />}
          {activeSubView === 'facturacion' && <ClientBilling />}
          {activeSubView === 'api-keys' && <ClientApiKeys />}
          {![
            'dashboard', 'crear-envio', 'rastreo', 'mis-paquetes',
            'casilleros', 'facturacion', 'api-keys'
          ].includes(activeSubView) && <PortalDashboard />}
        </PortalLayout>
      )}

      {/* Sucursal OS Ecosystem */}
      {effectiveSection === 'sucursal' && (
        <SucursalLayout>
          {activeSubView === 'dashboard' && <SucursalDashboard />}
          {activeSubView === 'mostrador-pos' && <CounterPOS />}
          {activeSubView === 'inventario' && <BranchInventory />}
          {activeSubView === 'despacho' && <DriversDispatch />}
          {activeSubView === 'caja' && <CashRegister />}
          {![
            'dashboard', 'mostrador-pos', 'inventario', 'despacho', 'caja'
          ].includes(activeSubView) && <SucursalDashboard />}
        </SucursalLayout>
      )}

      {/* Driver App Ecosystem */}
      {effectiveSection === 'driver' && <DriverApp />}

      {/* API Documentation */}
      {effectiveSection === 'docs' && <ApiDocs />}

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <CommandPalette />
      {activeLabelShipment && (
        <ThermalLabelModal
          shipment={activeLabelShipment}
          isOpen={!!activeLabelShipment}
          onClose={() => setActiveLabelShipment(null)}
        />
      )}

      {/* Global New Shipment Modal */}
      <Modal
        isOpen={isNewShipmentModalOpen}
        onClose={() => setIsNewShipmentModalOpen(false)}
        title="Crear Nuevo Envío"
        description="Wizard guiado para cotizar, registrar y generar guía de entrega."
        maxWidth="2xl"
      >
        <ShipmentCreator />
      </Modal>
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
