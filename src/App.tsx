import React, { Component, ErrorInfo, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer, Modal } from './components/ui/DesignSystem';
import { CommandPalette } from './components/ui/CommandPalette';
import { ShipmentCreator } from './components/portal/ShipmentCreator';
import { ApiClient } from './api/client';
import { LoginPage, RegisterPage, RoleLoginPage, destinationForRole } from './components/auth/AuthPages';
import { UserRole } from './types';
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
import { BulkScanner } from './components/operations/BulkScanner';
import { LiveFleetMap } from './components/operations/LiveFleetMap';
import { ClientRegistrationAndBranchMatcher } from './components/clients/ClientRegistrationAndBranchMatcher';
import { ThermalLabelModal } from './components/ui/ThermalLabelModal';
import { PortalLayout } from './components/portal/PortalLayout';
import { PortalDashboard } from './components/portal/PortalDashboard';
import { TrackingSearch } from './components/portal/TrackingSearch';
import { LockerAddresses } from './components/portal/LockerAddresses';
import { ClientPackagesList } from './components/portal/ClientPackagesList';
import { ClientBilling } from './components/portal/ClientBilling';
import { ClientApiKeys } from './components/portal/ClientApiKeys';
import { SucursalLayout } from './components/sucursal/SucursalLayout';
import { SucursalDashboard } from './components/sucursal/SucursalDashboard';
import { CounterPOS } from './components/sucursal/CounterPOS';
import { BranchInventory } from './components/sucursal/BranchInventory';
import { DriversDispatch } from './components/sucursal/DriversDispatch';
import { CashRegister } from './components/sucursal/CashRegister';
import { DriverApp } from './components/driver/DriverApp';
import { ApiDocs } from './components/docs/ApiDocs';

type Section = 'super-admin' | 'portal' | 'sucursal' | 'driver';

interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('GoPaq Application Error:', error, errorInfo); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6"><div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4"><h2 className="text-xl font-bold text-rose-400">Error en la Aplicación</h2><p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-auto">{this.state.error?.message || 'Error inesperado'}</p><button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white">Reiniciar Plataforma</button></div></div>;
  }
}

const normalizeRole = (role?: string) => String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
const sectionForRole = (role?: string): Section => {
  const r = normalizeRole(role);
  if (['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS'].includes(r)) return 'super-admin';
  if (['DRIVER', 'COURIER'].includes(r)) return 'driver';
  if (['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(r)) return 'sucursal';
  return 'portal';
};
const uiRoleFor = (role?: string): UserRole => {
  const r = normalizeRole(role);
  if (r === 'SUPER_ADMIN' || r === 'OWNER') return 'Owner';
  if (r === 'ADMIN') return 'Admin';
  if (r === 'DRIVER' || r === 'COURIER') return 'Driver';
  if (r === 'DISPATCHER') return 'Dispatcher';
  if (r === 'WAREHOUSE') return 'Warehouse';
  if (r === 'COUNTER' || r === 'CASHIER') return 'Counter';
  if (r === 'BRANCH_MANAGER' || r === 'MANAGER') return 'Manager';
  if (r === 'OPERATIONS') return 'Operations';
  return 'Client_Owner';
};

const viewForPath = (section: Section, pathname: string) => {
  const part = pathname.split('/').filter(Boolean)[1] || 'dashboard';
  if (section === 'portal') {
    const aliases: Record<string, string> = { tracking: 'rastreo', paquetes: 'mis-paquetes', casillero: 'casilleros', billing: 'facturacion' };
    return aliases[part] || part;
  }
  if (section === 'sucursal') {
    const aliases: Record<string, string> = { mostrador: 'mostrador-pos', 'despacho-drivers': 'despacho', 'arqueo-caja': 'caja' };
    return aliases[part] || part;
  }
  return part;
};

const pathForView = (section: Section, view: string) => {
  if (section === 'driver') return '/driver';
  const reversePortal: Record<string, string> = { rastreo: 'tracking', 'mis-paquetes': 'paquetes', casilleros: 'casillero', facturacion: 'billing' };
  const reverseSucursal: Record<string, string> = { 'mostrador-pos': 'mostrador', despacho: 'despacho-drivers', caja: 'arqueo-caja' };
  const slug = section === 'portal' ? (reversePortal[view] || view) : section === 'sucursal' ? (reverseSucursal[view] || view) : view;
  return `/${section}/${slug || 'dashboard'}`;
};

const ProtectedArea: React.FC<{ section: Section }> = ({ section }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSubView, setCurrentSection, setCurrentRole, setActiveSubView } = useApp();
  const [state, setState] = useState<{ loading: boolean; user?: any; invalid?: boolean }>({ loading: true });

  useEffect(() => {
    let live = true;
    ApiClient.getMe().then(result => {
      if (!live) return;
      if (!result.success || !result.user) { ApiClient.logout(); setState({ loading: false, invalid: true }); return; }
      setState({ loading: false, user: result.user });
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!state.user) return;
    setCurrentSection(section as any);
    setCurrentRole(uiRoleFor(state.user.role));
    const view = viewForPath(section, location.pathname);
    if (view !== activeSubView) setActiveSubView(view);
  }, [state.user, section, location.pathname]);

  useEffect(() => {
    if (!state.user) return;
    const allowed = sectionForRole(state.user.role);
    if (allowed !== section) return;
    const target = pathForView(section, activeSubView);
    if (target !== location.pathname) navigate(target, { replace: false });
  }, [activeSubView, state.user, section]);

  if (state.loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Validando sesión…</div>;
  if (state.invalid) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const allowed = sectionForRole(state.user?.role);
  if (allowed !== section) return <Navigate to={destinationForRole(state.user?.role)} replace />;
  return <AreaContent section={section} />;
};

const AreaContent: React.FC<{ section: Section }> = ({ section }) => {
  const { activeSubView, isNewShipmentModalOpen, setIsNewShipmentModalOpen, activeLabelShipment, setActiveLabelShipment } = useApp();
  let body: React.ReactNode = null;

  if (section === 'super-admin') body = <SuperAdminLayout>
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
    {!['dashboard','operaciones-vivo','zernio-omnichannel','ia-eventos','escaneo-masivo','mapa-flota','envios','courier-intl','rutas','mudanzas-carga','drivers','sucursales','registro-sucursal-matcher','clientes','zonas-peligrosas','cod','tarifas','equipo','configuracion'].includes(activeSubView) && <SuperAdminDashboard />}
  </SuperAdminLayout>;

  if (section === 'portal') body = <PortalLayout>
    {activeSubView === 'dashboard' && <PortalDashboard />}
    {activeSubView === 'crear-envio' && <ShipmentCreator />}
    {activeSubView === 'rastreo' && <TrackingSearch />}
    {activeSubView === 'mis-paquetes' && <ClientPackagesList />}
    {activeSubView === 'casilleros' && <LockerAddresses />}
    {activeSubView === 'facturacion' && <ClientBilling />}
    {activeSubView === 'api-keys' && <ClientApiKeys />}
    {!['dashboard','crear-envio','rastreo','mis-paquetes','casilleros','facturacion','api-keys'].includes(activeSubView) && <PortalDashboard />}
  </PortalLayout>;

  if (section === 'sucursal') body = <SucursalLayout>
    {activeSubView === 'dashboard' && <SucursalDashboard />}
    {activeSubView === 'mostrador-pos' && <CounterPOS />}
    {activeSubView === 'inventario' && <BranchInventory />}
    {activeSubView === 'despacho' && <DriversDispatch />}
    {activeSubView === 'caja' && <CashRegister />}
    {!['dashboard','mostrador-pos','inventario','despacho','caja'].includes(activeSubView) && <SucursalDashboard />}
  </SucursalLayout>;

  if (section === 'driver') body = <DriverApp />;

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150">
    {body}<ToastContainer /><CommandPalette />
    {activeLabelShipment && <ThermalLabelModal shipment={activeLabelShipment} isOpen={!!activeLabelShipment} onClose={() => setActiveLabelShipment(null)} />}
    <Modal isOpen={isNewShipmentModalOpen} onClose={() => setIsNewShipmentModalOpen(false)} title="Crear Nuevo Envío" description="Wizard guiado para cotizar, registrar y generar guía de entrega." maxWidth="2xl"><ShipmentCreator /></Modal>
  </div>;
};

const RootRedirect = () => {
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    if (!ApiClient.hasSession()) { setTarget('/login'); return; }
    ApiClient.getMe().then(result => setTarget(result.success && result.user ? destinationForRole(result.user.role) : '/login'));
  }, []);
  return target ? <Navigate to={target} replace /> : <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Cargando GoPaq…</div>;
};

export default function App() {
  return <ErrorBoundary><AppProvider><BrowserRouter><Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/super-admin/login" element={<RoleLoginPage area="super-admin" />} />
    <Route path="/portal/login" element={<RoleLoginPage area="portal" />} />
    <Route path="/sucursal/login" element={<RoleLoginPage area="sucursal" />} />
    <Route path="/driver/login" element={<RoleLoginPage area="driver" />} />
    <Route path="/docs/api/*" element={<ApiDocs />} />
    <Route path="/super-admin/*" element={<ProtectedArea section="super-admin" />} />
    <Route path="/portal/*" element={<ProtectedArea section="portal" />} />
    <Route path="/sucursal/*" element={<ProtectedArea section="sucursal" />} />
    <Route path="/driver/*" element={<ProtectedArea section="driver" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter></AppProvider></ErrorBoundary>;
}
