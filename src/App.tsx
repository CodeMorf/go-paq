import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// 404 Not Found Component
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-black text-indigo-500">404</h1>
        <h2 className="text-2xl font-bold">Página No Encontrada</h2>
        <p className="text-slate-400 text-sm">La ruta solicitada no existe en la plataforma GoPaq.</p>
        <a href="/" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm">
          Volver al Inicio
        </a>
      </div>
    </div>
  );
};

// Role Guard Component
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallbackPath }) => {
  const { currentRole } = useApp();

  const isRoleAllowed = (role: string) => {
    if (role === 'Owner' || role === 'Admin') return true;
    if (allowedRoles.includes(role)) return true;
    if (allowedRoles.includes('SUPER_ADMIN') && (role === 'Owner' || role === 'Admin' || role === 'Operations')) return true;
    if (allowedRoles.includes('CLIENT') && role.startsWith('Client_')) return true;
    if (allowedRoles.includes('DRIVER') && role === 'Driver') return true;
    if (allowedRoles.includes('BRANCH') && ['Counter', 'Dispatcher', 'Warehouse', 'Manager'].includes(role)) return true;
    return false;
  };

  if (!isRoleAllowed(currentRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

const MainRouter: React.FC = () => {
  const { 
    currentSection, 
    activeSubView, 
    isNewShipmentModalOpen, 
    setIsNewShipmentModalOpen,
    activeLabelShipment,
    setActiveLabelShipment
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150">
      <Routes>
        {/* Super Admin Ecosystem */}
        <Route
          path="/super-admin/*"
          element={
            <RoleGuard allowedRoles={['SUPER_ADMIN', 'Owner', 'Admin', 'Operations']} fallbackPath="/portal/dashboard">
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
            </RoleGuard>
          }
        />

        {/* Client Portal Ecosystem */}
        <Route
          path="/portal/*"
          element={
            <RoleGuard allowedRoles={['CLIENT', 'Owner', 'Admin']} fallbackPath="/driver">
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
            </RoleGuard>
          }
        />

        {/* Sucursal OS Ecosystem */}
        <Route
          path="/sucursal/*"
          element={
            <RoleGuard allowedRoles={['BRANCH', 'Owner', 'Admin', 'Operations']} fallbackPath="/portal/dashboard">
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
            </RoleGuard>
          }
        />

        {/* Driver App Ecosystem */}
        <Route
          path="/driver/*"
          element={
            <RoleGuard allowedRoles={['DRIVER', 'Owner', 'Admin']} fallbackPath="/portal/dashboard">
              <DriverApp />
            </RoleGuard>
          }
        />

        {/* API Documentation */}
        <Route path="/docs/api" element={<ApiDocs />} />

        {/* Root Fallback */}
        <Route
          path="/"
          element={
            currentSection === 'super-admin' ? <Navigate to="/super-admin" replace /> :
            currentSection === 'portal' ? <Navigate to="/portal/dashboard" replace /> :
            currentSection === 'sucursal' ? <Navigate to="/sucursal" replace /> :
            currentSection === 'driver' ? <Navigate to="/driver" replace /> :
            <Navigate to="/docs/api" replace />
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

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
    <BrowserRouter>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
