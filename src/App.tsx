import React from 'react';
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

const AppContent: React.FC = () => {
  const { 
    currentSection, 
    activeSubView, 
    isNewShipmentModalOpen, 
    setIsNewShipmentModalOpen 
  } = useApp();

  // Super Admin Ecosystem
  if (currentSection === 'super-admin') {
    return (
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
    );
  }

  // Client Portal Ecosystem
  if (currentSection === 'portal') {
    return (
      <PortalLayout>
        {activeSubView === 'dashboard' && <PortalDashboard />}
        {activeSubView === 'crear-envio' && <ShipmentCreator />}
        {activeSubView === 'tracking' && <TrackingSearch />}
        {activeSubView === 'casillero' && <LockerAddresses />}
        {activeSubView === 'paquetes-list' && <ClientPackagesList />}
        {activeSubView === 'cuenta-corriente' && <ClientBilling />}
        {activeSubView === 'api-keys' && <ClientApiKeys />}
        {![
          'dashboard', 'crear-envio', 'tracking', 'casillero', 'paquetes-list', 'cuenta-corriente', 'api-keys'
        ].includes(activeSubView) && <PortalDashboard />}
      </PortalLayout>
    );
  }

  // Sucursal / Agency Operating System
  if (currentSection === 'sucursal') {
    return (
      <SucursalLayout>
        {activeSubView === 'dashboard' && <SucursalDashboard />}
        {activeSubView === 'escaneo-masivo' && <BulkScanner />}
        {activeSubView === 'mostrador' && <CounterPOS />}
        {activeSubView === 'inventario' && <BranchInventory />}
        {activeSubView === 'despacho-drivers' && <DriversDispatch />}
        {activeSubView === 'arqueo-caja' && <CashRegister />}
        {![
          'dashboard', 'escaneo-masivo', 'mostrador', 'inventario', 'despacho-drivers', 'arqueo-caja'
        ].includes(activeSubView) && <SucursalDashboard />}
      </SucursalLayout>
    );
  }

  // Mobile Driver App
  if (currentSection === 'driver') {
    return <DriverApp />;
  }

  // API Docs
  if (currentSection === 'docs') {
    return <ApiDocs />;
  }

  return <SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <ToastContainer />
      <CommandPalette />
      
      {/* Global Create Shipment Modal */}
      <GlobalShipmentModal />
      <GlobalThermalLabelWrapper />
    </AppProvider>
  );
}

const GlobalThermalLabelWrapper: React.FC = () => {
  const { activeLabelShipment, setActiveLabelShipment } = useApp();

  if (!activeLabelShipment) return null;

  return (
    <ThermalLabelModal
      shipment={activeLabelShipment}
      isOpen={!!activeLabelShipment}
      onClose={() => setActiveLabelShipment(null)}
    />
  );
};

const GlobalShipmentModal: React.FC = () => {
  const { isNewShipmentModalOpen, setIsNewShipmentModalOpen } = useApp();

  return (
    <Modal
      isOpen={isNewShipmentModalOpen}
      onClose={() => setIsNewShipmentModalOpen(false)}
      title="Crear Nuevo Envío"
      size="xl"
    >
      <ShipmentCreator />
    </Modal>
  );
};
