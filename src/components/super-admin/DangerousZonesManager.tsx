import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DangerousZone, CountryCode } from '../../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Ban, 
  Clock, 
  DollarSign, 
  Building2, 
  Plus, 
  CheckCircle2, 
  X, 
  Sliders, 
  FileText,
  AlertOctagon,
  EyeOff
} from 'lucide-react';
import { Button, Card, Modal } from '../ui/DesignSystem';

export const DangerousZonesManager: React.FC = () => {
  const { dangerousZones, updateDangerousZone, setDangerousZones, branches, addToast } = useApp();
  
  const [selectedZone, setSelectedZone] = useState<DangerousZone | null>(null);
  const [isNewZoneModalOpen, setIsNewZoneModalOpen] = useState(false);

  // Form state for creating a new dangerous zone
  const [newZoneName, setNewZoneName] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newCity, setNewCity] = useState('Santo Domingo');
  const [newProvince, setNewProvince] = useState('Distrito Nacional');
  const [newRiskLevel, setNewRiskLevel] = useState<'medio' | 'alto' | 'critico'>('alto');
  const [newBlockCod, setNewBlockCod] = useState(true);
  const [newForceBranch, setNewForceBranch] = useState(true);
  const [newTimeStart, setNewTimeStart] = useState('09:00');
  const [newTimeEnd, setNewTimeEnd] = useState('13:00');
  const [newNearestBranchId, setNewNearestBranchId] = useState(branches[0]?.id || 'br-hq-sd');
  const [newNotes, setNewNotes] = useState('');

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName || !newSector) {
      addToast('error', 'Campos Requeridos', 'Por favor ingresa el nombre de la zona y el sector delimitado.');
      return;
    }

    const branchObj = branches.find((b) => b.id === newNearestBranchId) || branches[0];

    const createdZone: DangerousZone = {
      id: `dz-${Date.now()}`,
      name: newZoneName,
      sector: newSector,
      city: newCity,
      province: newProvince,
      country: 'DO',
      riskLevel: newRiskLevel,
      isSuspended: newForceBranch,
      blockCod: newBlockCod,
      forceBranchPickup: newForceBranch,
      timeRestrictionStart: newTimeStart,
      timeRestrictionEnd: newTimeEnd,
      assignedNearestBranchId: branchObj.id,
      assignedNearestBranchName: branchObj.name,
      notes: newNotes || 'Zona incorporada por el comité de seguridad y operaciones.',
      center: { lat: 18.486, lng: -69.931 },
      affectedShipmentsCount: 0
    };

    setDangerousZones((prev) => [createdZone, ...prev]);
    setIsNewZoneModalOpen(false);
    addToast('success', 'Zona de Riesgo Creada', `Se delimitó el perímetro de seguridad para ${newZoneName}.`);
    
    // Reset form
    setNewZoneName('');
    setNewSector('');
    setNewNotes('');
  };

  const getRiskBadge = (level: DangerousZone['riskLevel']) => {
    switch (level) {
      case 'critico':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-rose-600 animate-pulse" />
            <span>Nivel Crítico (Zona Roja)</span>
          </span>
        );
      case 'alto':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Riesgo Alto</span>
          </span>
        );
      case 'medio':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Riesgo Moderado</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Gestión & Suspensión de Zonas de Riesgo (Zonas Rojas)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Protocolos de seguridad para repartidores: restricción de cobros COD, bloqueo de entrega a domicilio y desvío a sucursal
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewZoneModalOpen(true)}
        >
          Delimitar Nueva Zona de Riesgo
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">Zonas Suspendidas</span>
            <Ban className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-2">
            {dangerousZones.filter((z) => z.isSuspended).length} de {dangerousZones.length}
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            Entrega a domicilio bloqueada (desvío automático a sucursal)
          </p>
        </Card>

        <Card className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Zonas sin Efectivo (COD)</span>
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-2">
            {dangerousZones.filter((z) => z.blockCod).length} Zonas
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            Prohibido recaudar efectivo para proteger a choferes
          </p>
        </Card>

        <Card className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">Envíos Redirigidos a Sucursales</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 mt-2">
            {dangerousZones.reduce((acc, z) => acc + (z.affectedShipmentsCount || 0), 0)} Envíos
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">
            Paquetes asegurados esperando retiro en mostrador
          </p>
        </Card>
      </div>

      {/* Dangerous Zones Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {dangerousZones.map((zone) => (
          <Card
            key={zone.id}
            className={`space-y-4 border-2 transition-all ${
              zone.isSuspended
                ? 'border-rose-400/80 dark:border-rose-800 bg-white dark:bg-slate-900 shadow-md'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {zone.name}
                  </h3>
                  {getRiskBadge(zone.riskLevel)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{zone.sector} • {zone.city}, {zone.province}</span>
                </div>
              </div>

              {/* Quick Suspend Switch */}
              <button
                onClick={() =>
                  updateDangerousZone(zone.id, {
                    isSuspended: !zone.isSuspended,
                    forceBranchPickup: !zone.isSuspended
                  })
                }
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                  zone.isSuspended
                    ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {zone.isSuspended ? (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>SUSPENDIDA</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>OPERATIVA CON REGLAS</span>
                  </>
                )}
              </button>
            </div>

            {/* Restrictive Policies Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Delivery Policy */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase text-slate-400">Modalidad de Entrega</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  {zone.forceBranchPickup ? (
                    <>
                      <Building2 className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-600 dark:text-rose-400">Solo Retiro en Sucursal</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Domicilio con Precaución</span>
                    </>
                  )}
                </div>
              </div>

              {/* COD Policy */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase text-slate-400">Cobro en Efectivo (COD)</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  {zone.blockCod ? (
                    <>
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span className="text-rose-600 dark:text-rose-400">COD Prohibido (Prepagado)</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>COD Permitido</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time Window */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase text-slate-400">Ventana Horaria Segura</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>
                    {zone.timeRestrictionStart && zone.timeRestrictionEnd
                      ? `${zone.timeRestrictionStart} - ${zone.timeRestrictionEnd}`
                      : 'Sin límite'}
                  </span>
                </div>
              </div>

              {/* Nearest Fallback Branch */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase text-slate-400">Sucursal de Retiro Seguro</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={zone.assignedNearestBranchName}>
                  {zone.assignedNearestBranchName}
                </div>
              </div>
            </div>

            {/* Notes & Incidents */}
            <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Motivo / Instrucciones:
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                {zone.notes}
              </p>
              {zone.lastIncidentReport && (
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono pt-1 border-t border-slate-200 dark:border-slate-700">
                  Último Reporte: {zone.lastIncidentReport}
                </div>
              )}
            </div>

            {/* Card Action Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px]">
                {zone.affectedShipmentsCount} envíos activos redirigidos a retiro
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateDangerousZone(zone.id, { blockCod: !zone.blockCod });
                  }}
                  className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium"
                >
                  {zone.blockCod ? 'Habilitar COD' : 'Bloquear COD'}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: New Dangerous Zone */}
      <Modal
        isOpen={isNewZoneModalOpen}
        onClose={() => setIsNewZoneModalOpen(false)}
        title="Delimitar Perímetro de Zona de Riesgo (Zona Roja)"
        size="lg"
      >
        <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre Identificador de la Zona *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Sector Capotillo / Ribera Ozama"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Sector / Calles Delimitadas *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Callejones 4, 6 y Av. Central"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Provincia
              </label>
              <input
                type="text"
                value={newProvince}
                onChange={(e) => setNewProvince(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nivel de Riesgo
              </label>
              <select
                value={newRiskLevel}
                onChange={(e) => setNewRiskLevel(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600"
              >
                <option value="critico">🔴 Crítico (Zona Roja)</option>
                <option value="alto">🟠 Alto Riesgo</option>
                <option value="medio">🟡 Moderado</option>
              </select>
            </div>
          </div>

          {/* Restriction Toggles */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Reglas de Operación & Bloqueos
            </h4>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={newForceBranch}
                onChange={(e) => setNewForceBranch(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>Suspender entrega a domicilio (Forzar retiro en sucursal segura)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={newBlockCod}
                onChange={(e) => setNewBlockCod(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>Prohibir cobro en efectivo COD (Solo envíos prepagados)</span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-500 block mb-1">Horario Seguro Desde</label>
                <input
                  type="time"
                  value={newTimeStart}
                  onChange={(e) => setNewTimeStart(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Horario Seguro Hasta</label>
                <input
                  type="time"
                  value={newTimeEnd}
                  onChange={(e) => setNewTimeEnd(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">Sucursal Asignada para Retiro</label>
              <select
                value={newNearestBranchId}
                onChange={(e) => setNewNearestBranchId(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Notas & Reportes de Incidentes
            </label>
            <textarea
              rows={2}
              placeholder="Instrucciones para el despachador y chofer..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" size="md" onClick={() => setIsNewZoneModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" icon={<ShieldAlert className="w-4 h-4" />}>
              Guardar Perímetro de Seguridad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
