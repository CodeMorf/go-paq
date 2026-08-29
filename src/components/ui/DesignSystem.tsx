import React from 'react';
import { ShipmentStatus, ServiceType } from '../../types';
import { 
  Package, 
  Truck, 
  Globe, 
  Home, 
  Building2, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ===================== BADGES =====================

export const StatusBadge: React.FC<{ status: ShipmentStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const configs: Record<ShipmentStatus, { label: string; bg: string; text: string; dot: string }> = {
    draft: { label: 'Borrador', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
    pending: { label: 'Pendiente', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    confirmed: { label: 'Confirmado', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    assigned: { label: 'Asignado', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
    pickup_pending: { label: 'Recolección Pendiente', bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    driver_en_route: { label: 'Driver en Camino', bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
    picked_up: { label: 'Recogido', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500' },
    at_branch: { label: 'En Sucursal', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    at_warehouse: { label: 'En Warehouse', bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
    in_transit: { label: 'En Tránsito', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
    customs: { label: 'En Aduanas (DGA)', bg: 'bg-yellow-50 dark:bg-yellow-950/50', text: 'text-yellow-800 dark:text-yellow-400', dot: 'bg-yellow-500' },
    out_for_delivery: { label: 'En Reparto Final', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    delivered: { label: 'Entregado', bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
    failed: { label: 'Intento Fallido', bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    returned: { label: 'Devolución', bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    cancelled: { label: 'Cancelado', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', dot: 'bg-zinc-400' }
  };

  const config = configs[status] || configs.pending;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-current/10 ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="truncate">{config.label}</span>
    </span>
  );
};

export const ServiceBadge: React.FC<{ type: ServiceType; showIcon?: boolean }> = ({ type, showIcon = true }) => {
  const configs: Record<ServiceType, { label: string; icon: React.ReactNode; color: string }> = {
    local: { label: 'Envío Local', icon: <Package className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
    nacional: { label: 'Envío Nacional', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' },
    internacional: { label: 'Courier Internacional', icon: <Globe className="w-3.5 h-3.5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800' },
    mudanza: { label: 'Mudanza', icon: <Home className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
    carga_pesada: { label: 'Carga Pesada', icon: <Building2 className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800' },
    express: { label: 'Express Prioritario', icon: <Zap className="w-3.5 h-3.5" />, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' },
    programado: { label: 'Programado', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
  };

  const config = configs[type] || configs.local;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.color}`}>
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

// ===================== BUTTONS =====================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500 border border-transparent dark:bg-indigo-600 dark:hover:bg-indigo-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-400 border border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
    outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 focus:ring-slate-400 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-slate-800/80',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 border border-transparent'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm rounded-lg gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 min-h-[48px]'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

// ===================== CARD & STATS =====================

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}> = ({ children, className = '', id, onClick }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors ${
        onClick ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  accent?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
  id?: string;
  onClick?: () => void;
}> = ({ title, value, change, isPositive = true, icon, subtitle, accent = 'indigo', id, onClick }) => {
  const accentColors = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400 border-purple-100 dark:border-purple-900/40',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
  };

  return (
    <Card id={id} onClick={onClick} className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${accentColors[accent]}`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className={`font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          <span className="text-slate-400 dark:text-slate-500">vs periodo anterior</span>
        </div>
      )}
    </Card>
  );
};

// ===================== MODAL & DRAWER =====================

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}> = ({ isOpen, onClose, title, description, children, maxWidth = 'lg' }) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 pb-safe`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 touch-scroll">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, width = 'lg' }) => {
  if (!isOpen) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0 overflow-hidden" onClick={onClose}>
        <div className="fixed inset-y-0 right-0 pl-4 sm:pl-10 max-w-full flex">
          <div 
            className={`w-screen max-w-[92vw] ${widthClasses[width]} bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 pb-safe`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 touch-scroll">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================== TOAST CONTAINER =====================

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none pb-safe">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-xl border border-slate-700/80 animate-in slide-in-from-bottom-3 duration-200"
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
          {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          
          <div className="flex-1 pr-2">
            <h4 className="text-xs font-bold text-slate-100">{t.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
          </div>
          
          <button
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// ===================== SKELETON & EMPTY STATE =====================

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} />;
};

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}> = ({ icon, title, description, action }) => {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <Button variant="primary" size="sm" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
