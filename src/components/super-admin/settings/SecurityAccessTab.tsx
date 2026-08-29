import React, { useState } from 'react';
import { GlobalSystemConfig } from './settingsTypes';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  AlertOctagon, 
  Database, 
  Clock, 
  Download, 
  Upload, 
  CheckCircle2, 
  Plus,
  Trash2
} from 'lucide-react';
import { Card, Button } from '../../ui/DesignSystem';

interface TabProps {
  config: GlobalSystemConfig['security'];
  onChange: (updates: Partial<GlobalSystemConfig['security']>) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  onDownloadBackup: () => void;
}

export const SecurityAccessTab: React.FC<TabProps> = ({ config, onChange, onToast, onDownloadBackup }) => {
  const [newIp, setNewIp] = useState('');

  const handleAddIp = () => {
    if (!newIp.trim()) return;
    if (config.ipWhitelist.includes(newIp.trim())) {
      onToast('warning', 'IP Duplicada', 'Esta dirección IP ya está en la lista blanca.');
      return;
    }
    onChange({ ipWhitelist: [...config.ipWhitelist, newIp.trim()] });
    setNewIp('');
    onToast('success', 'IP Agregada', `Dirección ${newIp.trim()} autorizada para acceso administrativo.`);
  };

  const handleRemoveIp = (ipToRemove: string) => {
    onChange({ ipWhitelist: config.ipWhitelist.filter(ip => ip !== ipToRemove) });
    onToast('info', 'IP Eliminada', `Dirección ${ipToRemove} removida de la lista blanca.`);
  };

  const handleManualBackup = () => {
    const now = new Date().toLocaleString();
    onChange({ lastBackupTimestamp: `${now} (Exitoso - 44.2 MB)` });
    onToast('success', 'Copia de Seguridad Creada', 'Snapshot completo del sistema generado y respaldado en almacenamiento en frío.');
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Emergency Alert */}
      <Card className={`border transition-all ${config.maintenanceMode ? 'border-rose-500 bg-rose-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.maintenanceMode ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo de Mantenimiento Global del Sistema</h4>
                {config.maintenanceMode && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase">
                    ACCESO PÚBLICO BLOQUEADO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Al activar el modo mantenimiento, solo los usuarios con rol Super Admin pueden acceder a la plataforma.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) => onChange({ maintenanceMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {config.maintenanceMode && (
          <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/60 text-xs">
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">Mensaje Público Mostrado a los Usuarios</label>
            <input
              type="text"
              value={config.maintenanceMessage}
              onChange={(e) => onChange({ maintenanceMessage: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </Card>

      {/* Grid: Auth policies & Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Policies & 2FA */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Políticas de Acceso & Doble Factor (2FA)</h4>
              <p className="text-[11px] text-slate-500">Reglas de seguridad para inicio de sesión y tiempos de sesión</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Tiempo Límite de Sesión Inactiva</label>
                <select
                  value={config.sessionTimeoutMinutes}
                  onChange={(e) => onChange({ sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium"
                >
                  <option value={15}>15 Minutos (Alta Seguridad)</option>
                  <option value={30}>30 Minutos</option>
                  <option value={60}>60 Minutos (1 Hora - Estándar)</option>
                  <option value={240}>4 Horas</option>
                  <option value={480}>8 Horas (Turno Completo)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Longitud Mínima de Claves</label>
                <input
                  type="number"
                  value={config.passwordMinLength}
                  onChange={(e) => onChange({ passwordMinLength: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enforce2faAdmins}
                  onChange={(e) => onChange({ enforce2faAdmins: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Forzar 2FA Obligatorio para Administradores & Finanzas</div>
                  <div className="text-[11px] text-slate-500">Exige Google Authenticator o código OTP para roles con permisos elevados.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allowDriverOfflineSync}
                  onChange={(e) => onChange({ allowDriverOfflineSync: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Permitir Sincronización Offline de Drivers</div>
                  <div className="text-[11px] text-slate-500">Almacena entregas y firmas localmente en la app si el conductor pierde cobertura 4G/5G.</div>
                </div>
              </label>
            </div>
          </div>
        </Card>

        {/* IP Whitelist & Backups */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Lista Blanca de IPs & Respaldos de Base de Datos</h4>
              <p className="text-[11px] text-slate-500">Control perimetral y copias de seguridad automáticas</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-medium block mb-1">IPs Permitidas para Acceso a Super Admin</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="ej. 190.166.45.12"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                />
                <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddIp}>
                  Añadir IP
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                {config.ipWhitelist.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  >
                    <span>{ip}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(ip)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Último Respaldo Automático:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{config.lastBackupTimestamp}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" className="flex-1" icon={<Database className="w-3.5 h-3.5" />} onClick={handleManualBackup}>
                  Crear Respaldo Ahora
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" icon={<Download className="w-3.5 h-3.5" />} onClick={onDownloadBackup}>
                  Descargar JSON
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
