import React, { useState } from 'react';
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
  Bell, 
  Sun, 
  Moon,
  ChevronDown,
  Scan,
  Menu,
  X
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { Button } from '../ui/DesignSystem';
import { GoPaqLogo } from '../ui/GoPaqLogo';

export const SucursalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    activeSubView, 
    setActiveSubView, 
    setCurrentSection, 
    darkMode, 
    setDarkMode, 
    currency, 
    setCurrency,
    selectedBranch,
    setSelectedBranch,
    branches
  } = useApp();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Panel de Sucursal', icon: <Building2 className="w-4 h-4" /> },
    { id: 'escaneo-masivo', label: 'Pistola / Escaneo Masivo', icon: <Scan className="w-4 h-4 text-indigo-500" /> },
    { id: 'mostrador', label: 'Punto de Venta / Recepción POS', icon: <Store className="w-4 h-4 text-emerald-500" /> },
    { id: 'inventario', label: 'Racks & Almacén de Tránsito', icon: <Layers className="w-4 h-4" /> },
    { id: 'despacho-drivers', label: 'Despacho a Conductores', icon: <Truck className="w-4 h-4" /> },
    { id: 'arqueo-caja', label: 'Arqueo & Cierre de Caja', icon: <DollarSign className="w-4 h-4 text-amber-500" /> },
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
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            SUCURSAL
          </span>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Environment Navigation Ribbon */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Navegar Entorno:
        </label>
        <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
          <button
            onClick={() => { setCurrentSection('super-admin'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
          >
            Admin
          </button>
          <button
            onClick={() => { setCurrentSection('portal'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
          >
            Portal
          </button>
          <button
            onClick={() => { setCurrentSection('sucursal'); setActiveSubView('dashboard'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg bg-indigo-600 text-white text-center shadow-xs"
          >
            Agencia
          </button>
          <button
            onClick={() => { setCurrentSection('driver'); setIsMobileDrawerOpen(false); }}
            className="p-2 md:p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-center"
          >
            Driver
          </button>
        </div>
      </div>

      {/* Branch Selector Dropdown */}
      <div className="p-3 border-b border-slate-200/80 dark:border-slate-800">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Sucursal en Operación:
        </label>
        <select
          value={selectedBranch?.id || ''}
          onChange={(e) => {
            const b = branches.find((item) => item.id === e.target.value);
            if (b) setSelectedBranch(b);
          }}
          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>
      </div>

      {/* Menu Items */}
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

      {/* Operator Badge */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 pb-safe">
        <div className="flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
            OP
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Sesión autenticada
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedBranch?.code || 'Sucursal sin seleccionar'}
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
              icon={<Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              onClick={() => setActiveSubView('mostrador')}
              className="px-2.5 sm:px-3 text-xs"
            >
              <span className="hidden sm:inline">Abrir Mostrador POS</span>
              <span className="sm:hidden">POS Caja</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sm:hidden text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              {selectedBranch?.code || '—'}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <NotificationCenter />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6 touch-scroll">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around pb-safe shadow-lg">
          <button
            onClick={() => setActiveSubView('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Sucursal</span>
          </button>

          <button
            onClick={() => setActiveSubView('escaneo-masivo')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'escaneo-masivo'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Scan className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Escaneo</span>
          </button>

          {/* Center POS Action */}
          <button
            onClick={() => setActiveSubView('mostrador')}
            className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
            title="Punto de Venta POS"
          >
            <Store className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveSubView('inventario')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              activeSubView === 'inventario'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Racks</span>
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

