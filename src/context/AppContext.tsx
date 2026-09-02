import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSection, Branch, CountryCode, Currency, NotificationItem, UserRole } from '../types';
import { ApiClient } from '../api/client';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  currentSection: AppSection;
  setCurrentSection: (section: AppSection) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeSubView: string;
  setActiveSubView: (view: string) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((previous: boolean) => boolean)) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
  formatMoney: (amount: number, currency?: Currency) => string;
  shipments: any[];
  drivers: any[];
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  selectedTracking: string | null;
  setSelectedTracking: (tracking: string | null) => void;
  isNewShipmentModalOpen: boolean;
  setIsNewShipmentModalOpen: (open: boolean) => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (type: Toast['type'], title: string, message: string) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState<AppSection>('super-admin');
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [activeSubView, setActiveSubView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('gopaq_theme');
    return saved ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  const [currency, setCurrency] = useState<Currency>('DOP');
  const [country, setCountry] = useState<CountryCode>('DO');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [isNewShipmentModalOpen, setIsNewShipmentModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('gopaq_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(previous => !previous);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([ApiClient.getBranches(), ApiClient.getShipments(), ApiClient.getDrivers()]).then(([branchResult, shipmentResult, driverResult]) => {
      if (!active) return;
      if (branchResult.success && branchResult.branches) {
        const loaded = branchResult.branches as Branch[];
        setBranches(loaded);
        setSelectedBranch(previous => previous && loaded.some(branch => branch.id === previous.id) ? previous : loaded[0] || null);
      }
      if (shipmentResult.success && shipmentResult.shipments) setShipments(shipmentResult.shipments);
      if (driverResult.success && driverResult.drivers) setDrivers(driverResult.drivers);
    }).catch(() => {
      // Individual screens surface their own API error; the context has no business fallback.
    });
    return () => { active = false; };
  }, []);

  const removeToast = (id: string) => setToasts(previous => previous.filter(toast => toast.id !== id));
  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts(previous => [...previous, { id, type, title, message }]);
    window.setTimeout(() => removeToast(id), 4500);
  };

  const formatMoney = (amount: number, selectedCurrency?: Currency) => {
    const target = selectedCurrency || currency;
    const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    if (target === 'DOP') return `RD$ ${amount.toLocaleString('es-DO', options)}`;
    if (target === 'USD') return `$ ${amount.toLocaleString('en-US', options)} USD`;
    return `€ ${amount.toLocaleString('es-ES', options)}`;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(previous => previous.map(notification => notification.id === id ? { ...notification, read: true } : notification));
  };
  const markAllNotificationsRead = () => setNotifications(previous => previous.map(notification => ({ ...notification, read: true })));

  return (
    <AppContext.Provider value={{
      currentSection, setCurrentSection, currentRole, setCurrentRole, activeSubView, setActiveSubView,
      darkMode, setDarkMode, currency, setCurrency, country, setCountry, formatMoney,
      shipments, drivers, branches, selectedBranch, setSelectedBranch, commandPaletteOpen, setCommandPaletteOpen,
      selectedTracking, setSelectedTracking, isNewShipmentModalOpen, setIsNewShipmentModalOpen,
      notifications, unreadNotificationsCount: notifications.filter(notification => !notification.read).length,
      markNotificationRead, markAllNotificationsRead, addToast, toasts, removeToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
