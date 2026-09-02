import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Globe, 
  Search, 
  CreditCard, 
  Code, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Layers,
  FileText,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { Button } from '../ui/DesignSystem';
import { GoPaqLogo } from '../ui/GoPaqLogo';

export const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    activeSubView, 
    setActiveSubView, 
    darkMode, 
    setDarkMode, 
    currency, 
    setCurrency, 
    setCommandPaletteOpen,
    setIsNewShipmentModalOpen
  } = useApp();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Mi Panel General', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'crear-envio', label: 'Crear / Cotizar Envío', icon: <PlusCircle className="w-4 h-4 text-indigo-500" /> },
    { id: 'tracking', label: 'Rastrear Guía', icon: <Search className="w-4 h-4" /> },
    { id: 'casillero', label: 'Mis Casilleros (USA/EUR)', icon: <Globe className="w-4 h-4" /> },
    { id: 'paquetes-list', label: 'Mis Paquetes & Consolidación', icon: <Layers className="w-4 h-4" /> },
    { id: 'cuenta-corriente', label: 'Estado de Cuenta & COD', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'api-keys', label: 'Integración E-commerce / API', icon: <Code className="w-4 h-4" /> },
  ];

  const handleSelectNav = (id: string) => {
    setActiveSubView(id);
    setIsMobileDrawerOpen(false);
  };

  const renderNavContent = () => (
    <>
      <div className="h-16 md:h-20 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoPaqLogo size="sm" variant="horizontal" showSlogan={true} />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            PORTAL
          </span>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 touch-scroll">
        {menuItems.map((item) => {
          const isActive = activeSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User locker info pill */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 pb-safe">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
            JM
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">
              TechStore Caribe
            </span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              Casillero: NX-8849
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex-col shrink-0 z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              onClick={() => setActiveSubView('crear-envio')}
              className="px-2.5 sm:px-3 text-xs"
            >
              <span className="hidden sm:inline">Nuevo Envío</span>
              <span className="sm:hidden">Cotizar</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="hidden sm:block text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="DOP">🇩🇴 DOP</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="EUR">🇪🇸 EUR</option>
            </select>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <NotificationCenter />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6 touch-scroll">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
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
            onClick={() => setActiveSubView('tracking')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'tracking'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Rastrear</span>
          </button>

          {/* Center Create Button */}
          <button
            onClick={() => setActiveSubView('crear-envio')}
            className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
            title="Nuevo Envío"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSubView('paquetes-list')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'paquetes-list'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Paquetes</span>
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

