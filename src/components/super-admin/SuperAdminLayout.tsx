import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Globe, 
  Route, 
  Users, 
  Truck, 
  Building2, 
  UserCheck, 
  Home, 
  Building, 
  DollarSign, 
  Sliders, 
  ShieldAlert, 
  Bell, 
  Settings, 
  Search, 
  Sun, 
  Moon, 
  PlusCircle, 
  Radio, 
  Layers, 
  Code, 
  Smartphone,
  ChevronDown,
  Scan,
  Navigation,
  UserPlus,
  Bot,
  Zap,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { Button } from '../ui/DesignSystem';
import { GoPaqLogo } from '../ui/GoPaqLogo';

export const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    activeSubView, 
    setActiveSubView, 
    setCurrentSection, 
    darkMode, 
    setDarkMode, 
    currency, 
    setCurrency, 
    country, 
    setCountry, 
    setCommandPaletteOpen,
    currentRole,
    setCurrentRole,
    setIsNewShipmentModalOpen
  } = useApp();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'operaciones-vivo', label: 'Operación en Vivo', icon: <Radio className="w-4 h-4 text-emerald-500" />, badge: 'LIVE' },
        { id: 'zernio-omnichannel', label: 'Mensajería & IA Omnicanal', icon: <Radio className="w-4 h-4 text-indigo-500" />, badge: 'AI BOT' },
        { id: 'ia-eventos', label: 'Automatizaciones & IA de Voz', icon: <Bot className="w-4 h-4 text-purple-500" />, badge: 'VOICE AI' },
      ]
    },
    {
      title: 'Operaciones & Envíos',
      items: [
        { id: 'escaneo-masivo', label: 'Escaneo Masivo', icon: <Scan className="w-4 h-4 text-indigo-500" />, badge: 'PISTOLA' },
        { id: 'mapa-flota', label: 'Mapa Drivers GPS', icon: <Navigation className="w-4 h-4 text-emerald-500" />, badge: 'GPS' },
        { id: 'envios', label: 'Todos los Envíos', icon: <Package className="w-4 h-4" /> },
        { id: 'courier-intl', label: 'Courier Internacional', icon: <Globe className="w-4 h-4" /> },
        { id: 'rutas', label: 'Rutas & Despacho', icon: <Route className="w-4 h-4" /> },
        { id: 'mudanzas-carga', label: 'Mudanzas & Carga Pesada', icon: <Home className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Recursos & Red',
      items: [
        { id: 'drivers', label: 'Drivers & Flota', icon: <Truck className="w-4 h-4" /> },
        { id: 'sucursales', label: 'Sucursales & Warehouses', icon: <Building2 className="w-4 h-4" /> },
        { id: 'registro-sucursal-matcher', label: 'Registro & Matching Sucursal', icon: <UserPlus className="w-4 h-4 text-indigo-500" /> },
        { id: 'clientes', label: 'Clientes & Empresas', icon: <Users className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Finanzas & Seguridad',
      items: [
        { id: 'zonas-peligrosas', label: 'Zonas Rojas / Seguridad', icon: <ShieldAlert className="w-4 h-4 text-rose-500" />, badge: 'ALERTA' },
        { id: 'cod', label: 'Módulo COD & Liquidación', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'tarifas', label: 'Matriz de Tarifas', icon: <Sliders className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Administración',
      items: [
        { id: 'equipo', label: 'Equipo & Roles (RBAC)', icon: <UserCheck className="w-4 h-4" /> },
        { id: 'configuracion', label: 'Configuración Global', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  const handleSelectNav = (id: string) => {
    setActiveSubView(id);
    setIsMobileDrawerOpen(false);
  };

  const renderNavContent = () => (
    <>
      {/* Brand Logo Header */}
      <div className="h-16 md:h-20 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoPaqLogo size="sm" variant="horizontal" showSlogan={true} />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            ADMIN
          </span>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Global Area Switcher Ribbon */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Cambiar Entorno:
        </label>
        <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
          <button
            onClick={() => { setCurrentSection('super-admin'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg bg-indigo-600 text-white text-center shadow-xs"
            title="Super Admin"
          >
            Admin
          </button>
          <button
            onClick={() => { setCurrentSection('portal'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
            title="Portal Cliente"
          >
            Portal
          </button>
          <button
            onClick={() => { setCurrentSection('sucursal'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
            title="Sucursal Operating System"
          >
            Agencia
          </button>
          <button
            onClick={() => { setCurrentSection('driver'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
            title="App Móvil Driver"
          >
            Driver
          </button>
        </div>
      </div>

      {/* Navigation Menus */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 touch-scroll">
        {menuSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {sec.title}
            </h5>
            {sec.items.map((item) => {
              const isActive = activeSubView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 md:py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* API Docs link at bottom */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 pb-safe">
        <button
          onClick={() => { navigate('/docs/api'); setIsMobileDrawerOpen(false); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" />
            <span>Documentación API</span>
          </div>
          <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
            v1.4
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex-col shrink-0 z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Off-Canvas Drawer Backdrop & Container */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          {/* Slide-out Drawer */}
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          {/* Left: Mobile Drawer Trigger + Global Search trigger */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-lg">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden shrink-0"
              aria-label="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs border border-slate-200/80 dark:border-slate-700/60 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Buscar envíos, clientes, drivers...</span>
              </div>
              <kbd className="hidden sm:inline text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 pl-2">
            {/* Quick Action Button */}
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              onClick={() => setIsNewShipmentModalOpen(true)}
              className="px-2.5 sm:px-3 text-xs"
            >
              <span className="hidden sm:inline">Crear Envío</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>

            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="hidden lg:block text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="DOP">🇩🇴 DOP</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="EUR">🇪🇸 EUR</option>
            </select>

            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cambiar tema"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification Center Bell */}
            <NotificationCenter />

            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center border border-indigo-500/40">GP</div>
              <div className="hidden xl:block text-left text-xs">
                <span className="font-bold text-slate-900 dark:text-white block leading-tight">Sesión autenticada</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{currentRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View Content with mobile safe-padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6 touch-scroll">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Fixed for quick 1-tap navigation on phones) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around pb-safe shadow-lg">
          <button
            onClick={() => setActiveSubView('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Inicio</span>
          </button>

          <button
            onClick={() => setActiveSubView('operaciones-vivo')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'operaciones-vivo'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Radio className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] mt-0.5">En Vivo</span>
          </button>

          {/* Center Scan / Create Action */}
          <button
            onClick={() => setActiveSubView('escaneo-masivo')}
            className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
            title="Escaneo Masivo"
          >
            <Scan className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSubView('envios')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'envios'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Envíos</span>
          </button>

          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Menú</span>
          </button>
        </div>
      </div>
    </div>
  );
};

