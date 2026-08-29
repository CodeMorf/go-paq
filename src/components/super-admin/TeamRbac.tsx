import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  UserCheck, 
  Shield, 
  Mail, 
  Building2, 
  Plus, 
  Lock, 
  CheckCircle2, 
  MoreVertical,
  UserPlus
} from 'lucide-react';
import { Button, Card, Modal } from '../ui/DesignSystem';
import { MOCK_TEAM_MEMBERS } from '../../data/mockData';
import { UserRole } from '../../types';

export const TeamRbac: React.FC = () => {
  const { addToast } = useApp();
  const [members, setMembers] = useState(MOCK_TEAM_MEMBERS);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Dispatcher');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember = {
      id: `tm-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      branchName: 'Hub Central Santo Domingo',
      status: 'invited' as const,
      lastActive: 'Invitación enviada'
    };

    setMembers([...members, newMember]);
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
    addToast('success', 'Invitación Enviada', `Se envió correo de acceso a ${inviteEmail} con rol ${inviteRole}.`);
  };

  const rolesCatalog: Array<{ role: UserRole; desc: string; color: string }> = [
    { role: 'Owner', desc: 'Acceso total y configuración de facturación', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    { role: 'Admin', desc: 'Control operativo, sucursales y finanzas', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { role: 'Dispatcher', desc: 'Creación, optimización y asignación de rutas', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { role: 'Warehouse', desc: 'Ingreso, pesaje, ubicación en racks e inventario', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    { role: 'Counter', desc: 'Recepción rápida y cobros en mostrador', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { role: 'Finance', desc: 'Conciliación COD, arqueo de caja y dispersión', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Equipo & Control de Acceso por Roles (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permisos granulares para Super Admin, Despachadores, Encargados de Almacén, Mostrador y Finanzas
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Invitar Miembro
        </Button>
      </div>

      {/* Roles Catalog Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {rolesCatalog.map((rc) => (
          <div key={rc.role} className={`p-3 rounded-xl border border-current/10 ${rc.color} space-y-1`}>
            <span className="font-bold text-xs block">{rc.role}</span>
            <p className="text-[10px] opacity-80 line-clamp-2 leading-tight">{rc.desc}</p>
          </div>
        ))}
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Miembros del Equipo ({members.length})
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Sucursal / Ubicación</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Última Actividad</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {m.branchName || 'Todas las sucursales'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {m.status === 'active' ? 'Activo' : 'Invitado'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {m.lastActive}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invitar Nuevo Miembro al Equipo"
        description="Selecciona el rol y permisos que tendrá en la plataforma"
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              placeholder="Ej: Lic. Marcos Santana"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Correo Electrónico Corporativo</label>
            <input
              type="email"
              required
              placeholder="ejemplo@gopaq.com.do"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Rol & Nivel de Acceso</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="Admin">Admin (Administrador)</option>
              <option value="Dispatcher">Dispatcher (Despachador de Rutas)</option>
              <option value="Warehouse">Warehouse (Almacén & Clasificación)</option>
              <option value="Counter">Counter (Caja & Mostrador)</option>
              <option value="Finance">Finance (Finanzas & COD)</option>
              <option value="Viewer">Viewer (Solo Lectura)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Enviar Invitación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
