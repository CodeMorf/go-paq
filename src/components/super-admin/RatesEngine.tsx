import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CoverageZoneRate, CountryCode } from '../../types';
import { 
  Sliders, 
  DollarSign, 
  MapPin, 
  Scale, 
  Zap, 
  ShieldCheck, 
  Save, 
  Plus,
  Layers,
  Fuel,
  Globe,
  Truck,
  Calculator,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { Button, Card, Modal } from '../ui/DesignSystem';

export const RatesEngine: React.FC = () => {
  const { coverageZones, setCoverageZones, updateCoverageZone, formatMoney, addToast, branches } = useApp();

  // Selected Zone for quick inline editing
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [isNewZoneModalOpen, setIsNewZoneModalOpen] = useState(false);

  // New Zone Form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState<CountryCode>('DO');
  const [newProvinces, setNewProvinces] = useState('');
  const [newType, setNewType] = useState<CoverageZoneRate['type']>('urbana');
  const [newBaseDop, setNewBaseDop] = useState(200);
  const [newPerKgDop, setNewPerKgDop] = useState(30);
  const [newFuelPercent, setNewFuelPercent] = useState(7.5);
  const [newEstimatedTime, setNewEstimatedTime] = useState('24 horas');

  // Interactive Live Quote Simulator Test Bench
  const [simOriginBranchId, setSimOriginBranchId] = useState(branches[0]?.id || 'br-hq-sd');
  const [simDestinationZoneId, setSimDestinationZoneId] = useState(coverageZones[0]?.id || '');
  const [simWeightKg, setSimWeightKg] = useState(2.5);
  const [simLengthCm, setSimLengthCm] = useState(30);
  const [simWidthCm, setSimWidthCm] = useState(20);
  const [simHeightCm, setSimHeightCm] = useState(15);
  const [simDeclaredValue, setSimDeclaredValue] = useState(1500);
  const [simCodAmount, setSimCodAmount] = useState(0);

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) {
      addToast('error', 'Campos Requeridos', 'Completa el código y nombre de la zona.');
      return;
    }

    const created: CoverageZoneRate = {
      id: `cz-${Date.now()}`,
      code: newCode.toUpperCase(),
      name: newName,
      country: newCountry,
      provinces: newProvinces.split(',').map((p) => p.trim()).filter(Boolean),
      type: newType,
      baseRateDop: Number(newBaseDop),
      perKgRateDop: Number(newPerKgDop),
      fuelSurchargePercent: Number(newFuelPercent),
      volumetricDivisor: 5000,
      estimatedDeliveryTime: newEstimatedTime,
      isActive: true
    };

    setCoverageZones((prev) => [...prev, created]);
    setIsNewZoneModalOpen(false);
    addToast('success', 'Zona Tarifaria Creada', `Se incorporó ${newName} a la matriz logística.`);

    setNewCode('');
    setNewName('');
    setNewProvinces('');
  };

  // Compute live quote for simulator
  const activeSimZone = coverageZones.find((z) => z.id === simDestinationZoneId) || coverageZones[0];
  const volumetricWeightKg = Math.round(((simLengthCm * simWidthCm * simHeightCm) / (activeSimZone?.volumetricDivisor || 5000)) * 10) / 10;
  const billableWeightKg = Math.max(simWeightKg, volumetricWeightKg);
  const baseCost = activeSimZone?.baseRateDop || 180;
  const weightCost = billableWeightKg > 1 ? (billableWeightKg - 1) * (activeSimZone?.perKgRateDop || 25) : 0;
  const subtotal = baseCost + weightCost;
  const fuelCost = Math.round(subtotal * ((activeSimZone?.fuelSurchargePercent || 6.5) / 100));
  const insuranceCost = simDeclaredValue > 2000 ? Math.round(simDeclaredValue * 0.015) : 0;
  const codFee = simCodAmount > 0 ? Math.round(simCodAmount * 0.03) : 0;
  const totalQuote = subtotal + fuelCost + insuranceCost + codFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            <span>Motor de Tarifas Extremo a Extremo (País, Provincia & Zonas)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Matriz de tarificación logística: precios base, tarifa por kilo/libra, recargo de combustible, divisor IATA y cobertura provincial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewZoneModalOpen(true)}
          >
            Agregar Zona Tarifaria
          </Button>
        </div>
      </div>

      {/* Main Grid: Rate Matrix Table & Interactive Live Quote Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Coverage Zones Matrix Table */}
        <div className="xl:col-span-8 space-y-4">
          <Card className="p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Matriz de Zonas Tarifarias & Cobertura Geográfica ({coverageZones.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Código / Zona</th>
                    <th className="py-3 px-4">Provincias Incluidas</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Base (DOP)</th>
                    <th className="py-3 px-4">/ KG (DOP)</th>
                    <th className="py-3 px-4">Fuel %</th>
                    <th className="py-3 px-4">Tiempo Promedio</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {coverageZones.map((zone) => {
                    const isEditing = editingZoneId === zone.id;

                    return (
                      <tr key={zone.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block">
                            {zone.code}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {zone.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            País: {zone.country}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {zone.provinces.slice(0, 3).map((p, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                              >
                                {p}
                              </span>
                            ))}
                            {zone.provinces.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[10px]">
                                +{zone.provinces.length - 3} más
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {zone.type}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {isEditing ? (
                            <input
                              type="number"
                              defaultValue={zone.baseRateDop}
                              onBlur={(e) => {
                                updateCoverageZone(zone.id, { baseRateDop: Number(e.target.value) });
                                setEditingZoneId(null);
                              }}
                              className="w-16 p-1 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => setEditingZoneId(zone.id)}
                              className="cursor-pointer hover:underline"
                              title="Clic para editar"
                            >
                              {formatMoney(zone.baseRateDop)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatMoney(zone.perKgRateDop)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-amber-600">
                          {zone.fuelSurchargePercent}%
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {zone.estimatedDeliveryTime}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => updateCoverageZone(zone.id, { isActive: !zone.isActive })}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              zone.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {zone.isActive ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Interactive Live Quote Simulator */}
        <div className="xl:col-span-4 space-y-4">
          <Card className="p-5 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-900/50 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Simulador de Tarifas en Tiempo Real
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Motor Activo
              </span>
            </div>

            {/* Form controls for simulation */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Origen (Hub / Sucursal):</label>
                <select
                  value={simOriginBranchId}
                  onChange={(e) => setSimOriginBranchId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 font-bold"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destino (Zona Tarifaria / Provincia):</label>
                <select
                  value={simDestinationZoneId}
                  onChange={(e) => setSimDestinationZoneId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 font-bold"
                >
                  {coverageZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Peso Físico (KG):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={simWeightKg}
                    onChange={(e) => setSimWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cobro COD (RD$):</label>
                  <input
                    type="number"
                    value={simCodAmount}
                    onChange={(e) => setSimCodAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Largo (cm)</label>
                  <input
                    type="number"
                    value={simLengthCm}
                    onChange={(e) => setSimLengthCm(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-1.5 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ancho (cm)</label>
                  <input
                    type="number"
                    value={simWidthCm}
                    onChange={(e) => setSimWidthCm(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-1.5 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Alto (cm)</label>
                  <input
                    type="number"
                    value={simHeightCm}
                    onChange={(e) => setSimHeightCm(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-1.5 font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Peso Facturable:</span>
                <span className="font-bold text-white">{billableWeightKg} KG</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tarifa Base Zona:</span>
                <span className="font-bold text-white">{formatMoney(baseCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Exceso por Peso:</span>
                <span className="font-bold text-white">{formatMoney(weightCost)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Recargo Combustible ({activeSimZone?.fuelSurchargePercent}%):</span>
                <span className="font-bold text-amber-400">{formatMoney(fuelCost)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Comisión Recaudo COD (3%):</span>
                  <span className="font-bold text-indigo-300">{formatMoney(codFee)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-sm font-black">
                <span className="text-amber-400">TOTAL ESTIMADO:</span>
                <span className="text-2xl text-emerald-400">{formatMoney(totalQuote)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: New Coverage Zone */}
      <Modal
        isOpen={isNewZoneModalOpen}
        onClose={() => setIsNewZoneModalOpen(false)}
        title="Crear Nueva Zona Tarifaria & Cobertura Geográfica"
        size="lg"
      >
        <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Código de Zona *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Z-SUR-05"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre Descriptivo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Zona 5: Línea Noroeste & Montecristi"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                País
              </label>
              <select
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value as CountryCode)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="DO">🇩🇴 República Dominicana</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="ES">🇪🇸 España</option>
                <option value="PR">🇵🇷 Puerto Rico</option>
                <option value="CO">🇨🇴 Colombia</option>
                <option value="MX">🇲🇽 México</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo de Cobertura
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="urbana">Urbana / Metropolitana</option>
                <option value="suburbana">Suburbana</option>
                <option value="interprovincial">Interprovincial / Nacional</option>
                <option value="remota">Remota / Difícil Acceso</option>
                <option value="internacional">Internacional Aérea</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tiempo de Entrega
              </label>
              <input
                type="text"
                placeholder="Ej. 24 a 48 horas"
                value={newEstimatedTime}
                onChange={(e) => setNewEstimatedTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Provincias y Ciudades Asignadas (separadas por coma) *
            </label>
            <input
              type="text"
              placeholder="Ej. Montecristi, Dajabón, Valverde Mao, Santiago Rodríguez"
              value={newProvinces}
              onChange={(e) => setNewProvinces(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tarifa Base (DOP)
              </label>
              <input
                type="number"
                value={newBaseDop}
                onChange={(e) => setNewBaseDop(Number(e.target.value))}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tarifa / KG Adicional (DOP)
              </label>
              <input
                type="number"
                value={newPerKgDop}
                onChange={(e) => setNewPerKgDop(Number(e.target.value))}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Recargo Combustible (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newFuelPercent}
                onChange={(e) => setNewFuelPercent(Number(e.target.value))}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" size="md" onClick={() => setIsNewZoneModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" icon={<Save className="w-4 h-4" />}>
              Guardar Zona
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
