import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer, Modal } from './components/ui/DesignSystem';
import { CommandPalette } from './components/ui/CommandPalette';
import { ShipmentCreator } from './components/portal/ShipmentCreator';
import { ApiClient } from './api/client';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';

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

type Section = 'super-admin' | 'portal' | 'sucursal' | 'driver' | 'docs';
type SessionUser = { role?: string; [key: string]: any };

const routeFor = (section: string, view: string) => {
  const root = section === 'docs' ? '/docs/api' : `/${section}`;
  if (section === 'driver' || section === 'docs') return root;
  const normalized = view === 'paquetes-list' ? 'paquetes' : view === 'cuenta-corriente' ? 'facturacion' : view;
  return `${root}/${normalized || 'dashboard'}`;
};

const stateForPath = (pathname: string): { section: Section; view: string } => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'portal') return { section: 'portal', view: parts[1] === 'paquetes' ? 'paquetes-list' : parts[1] === 'facturacion' ? 'cuenta-corriente' : (parts[1] || 'dashboard') };
  if (parts[0] === 'sucursal') return { section: 'sucursal', view: parts[1] || 'dashboard' };
  if (parts[0] === 'driver') return { section: 'driver', view: 'dashboard' };
  if (parts[0] === 'docs') return { section: 'docs', view: 'api' };
  return { section: 'super-admin', view: parts[0] === 'super-admin' ? (parts[1] || 'dashboard') : 'dashboard' };
};

const normalizeRole = (role?: string) => (role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

const sectionForRole = (role?: string): Exclude<Section, 'docs'> => {
  const normalized = normalizeRole(role);
  if (['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(normalized)) return 'super-admin';
  if (['CLIENT', 'CUSTOMER'].includes(normalized)) return 'portal';
  if (['DRIVER', 'COURIER'].includes(normalized)) return 'driver';
  if (['BRANCH_MANAGER', 'MANAGER', 'SUPERVISOR', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(normalized)) return 'sucursal';
  return 'portal';
};

const homeForRole = (role?: string) => {
  const section = sectionForRole(role);
  return section === 'driver' ? '/driver' : `/${section}/dashboard`;
};

const isPublicPath = (pathname: string) => pathname === '/login' || pathname === '/register' || pathname.startsWith('/docs');

const AppContent: React.FC = () => {
  const { currentSection, setCurrentSection, activeSubView, setActiveSubView } = useApp();
  const [pathname, setPathname] = useState(window.location.pathname || '/');
  const [sessionState, setSessionState] = useState<'checking' | 'valid' | 'invalid'>(ApiClient.hasSession() ? 'checking' : 'invalid');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const navigate = (to: string, replace = true) => {
    if (window.location.pathname === to) {
      setPathname(to);
      return;
    }
    if (replace) window.history.replaceState({}, '', to);
    else window.history.pushState({}, '', to);
    setPathname(to);
  };

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!ApiClient.hasSession()) {
      setSessionUser(null);
      setSessionState('invalid');
      return;
    }

    let active = true;
    setSessionState('checking');
    ApiClient.getMe().then((response) => {
      if (!active) return;
      setSessionUser(response.user);
      setSessionState('valid');
    }).catch(() => {
      if (!active) return;
      ApiClient.logout();
      setSessionUser(null);
      setSessionState('invalid');
    });

    return () => { active = false; };
  }, [pathname === '/login' || pathname === '/register']);

  useEffect(() => {
    if (isPublicPath(pathname) || sessionState !== 'valid' || !sessionUser) return;

    if (pathname === '/' || pathname === '') {
      navigate(homeForRole(sessionUser.role));
      return;
    }

    const requested = stateForPath(pathname);
    const allowedSection = sectionForRole(sessionUser.role);

    if (requested.section !== allowedSection) {
      navigate(homeForRole(sessionUser.role));
      return;
    }

    if (requested.section !== currentSection) setCurrentSection(requested.section as any);
    if (requested.view !== activeSubView) setActiveSubView(requested.view);
  }, [pathname, sessionState, sessionUser]);

  useEffect(() => {
    if (isPublicPath(pathname) || sessionState !== 'valid' || !sessionUser) return;
    const allowedSection = sectionForRole(sessionUser.role);

    if (currentSection !== allowedSection) {
      setCurrentSection(allowedSection as any);
      setActiveSubView('dashboard');
      navigate(homeForRole(sessionUser.role));
      return;
    }

    const desired = routeFor(currentSection, activeSubView);
    if (desired !== pathname) navigate(desired);
  }, [currentSection, activeSubView, sessionState, sessionUser]);

  if (pathname === '/login') {
    if (sessionState === 'valid' && sessionUser) {
      navigate(homeForRole(sessionUser.role));
      return null;
    }
    return <LoginPage />;
  }
  if (pathname === '/register') {
    if (sessionState === 'valid' && sessionUser) {
      navigate(homeForRole(sessionUser.role));
      return null;
    }
    return <RegisterPage />;
  }
  if (pathname.startsWith('/docs')) return <ApiDocs />;

  if (sessionState === 'checking') return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Validando sesión…</div>;
  if (sessionState === 'invalid') {
    navigate('/login');
    return <LoginPage />;
  }

  const allowedSection = sectionForRole(sessionUser?.role);
  if (currentSection !== allowedSection) return null;

  if (currentSection === 'super-admin') {
    return <SuperAdminLayout>
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
    </SuperAdminLayout>;
  }

  if (currentSection === 'portal') {
    return <PortalLayout>
      {activeSubView === 'dashboard' && <PortalDashboard />}
      {activeSubView === 'crear-envio' && <ShipmentCreator />}
      {activeSubView === 'tracking' && <TrackingSearch />}
      {activeSubView === 'casillero' && <LockerAddresses />}
      {activeSubView === 'paquetes-list' && <ClientPackagesList />}
      {activeSubView === 'cuenta-corriente' && <ClientBilling />}
      {activeSubView === 'api-keys' && <ClientApiKeys />}
    </PortalLayout>;
  }

  if (currentSection === 'sucursal') {
    return <SucursalLayout>
      {activeSubView === 'dashboard' && <SucursalDashboard />}
      {activeSubView === 'escaneo-masivo' && <BulkScanner />}
      {activeSubView === 'mostrador' && <CounterPOS />}
      {activeSubView === 'inventario' && <BranchInventory />}
      {activeSubView === 'despacho-drivers' && <DriversDispatch />}
      {activeSubView === 'arqueo-caja' && <CashRegister />}
    </SucursalLayout>;
  }

  if (currentSection === 'driver') return <DriverApp />;
  return null;
};

export default function App() {
  return <AppProvider>
    <AppContent />
    <ToastContainer />
    <CommandPalette />
    <GlobalShipmentModal />
    <GlobalThermalLabelWrapper />
  </AppProvider>;
}

const GlobalThermalLabelWrapper: React.FC = () => {
  const { activeLabelShipment, setActiveLabelShipment } = useApp();
  if (!activeLabelShipment) return null;
  return <ThermalLabelModal shipment={activeLabelShipment} isOpen={!!activeLabelShipment} onClose={() => setActiveLabelShipment(null)} />;
};

const GlobalShipmentModal: React.FC = () => {
  const { isNewShipmentModalOpen, setIsNewShipmentModalOpen } = useApp();
  return <Modal isOpen={isNewShipmentModalOpen} onClose={() => setIsNewShipmentModalOpen(false)} title="Crear Nuevo Envío" size="xl"><ShipmentCreator /></Modal>;
};
