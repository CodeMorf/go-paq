import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Branch, ClientProfile } from '../../types';
import { 
  Building2, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  Box, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowRight,
  Plane,
  Truck
} from 'lucide-react';
import { Button, Card, Modal } from '../ui/DesignSystem';

export const ClientRegistrationAndBranchMatcher: React.FC = () => {
  const { branches, findNearestBranch, addToast } = useApp();

  // Registration Form State
  const [clientType, setClientType] = useState<'individual' | 'business'>('individual');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rncOrDni, setRncOrDni] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [sector, setSector] = useState('Piantini');
  const [selectedProvince, setSelectedProvince] = useState('Distrito Nacional');
  const [deliveryPreference, setDeliveryPreference] = useState<'domicilio' | 'locker_sucursal'>('domicilio');

  // Auto-calculated matched branch
  const matchedInfo = findNearestBranch(undefined, undefined, `${selectedProvince} ${sector}`);
  const [manualBranchId, setManualBranchId] = useState<string | null>(null);

  const activeBranch = manualBranchId
    ? branches.find((b) => b.id === manualBranchId) || matchedInfo.branch
    : matchedInfo.branch;

  const [registeredClient, setRegisteredClient] = useState<{
    profile: ClientProfile;
    assignedBranch: Branch;
    lockerCode: string;
  } | null>(null);

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestBranch(pos.coords.latitude, pos.coords.longitude);
          setManualBranchId(nearest.branch.id);
          addToast('success', 'GPS Sincronizado', `Sucursal más cercana identificada: ${nearest.branch.name} (${nearest.distanceKm} km).`);
        },
        () => {
          addToast('info', 'GPS Simulado', `Ubicación estimada en ${selectedProvince}.`);
        }
      );
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      addToast('error', 'Campos Obligatorios', 'Por favor completa todos los campos requeridos.');
      return;
    }

    const generatedLockerCode = `NX-${Math.floor(1000 + Math.random() * 9000)}-${activeBranch.city.substring(0, 3).toUpperCase()}`;

    const mappedType: ClientProfile['clientType'] = clientType === 'business' ? 'corporate' : 'individual';

    const newProfile: ClientProfile = {
      id: `cli-${Date.now()}`,
      name: fullName,
      companyName: clientType === 'business' ? fullName : undefined,
      clientType: mappedType,
      email,
      phone,
      lockerCode: generatedLockerCode,
      activeShipments: 0,
      balanceDop: 0,
      creditLimitDop: clientType === 'business' ? 50000 : 0,
      codPendingPayoutDop: 0,
      discountRatePercent: clientType === 'business' ? 10 : 0,
      addressesCount: 1,
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setRegisteredClient({
      profile: newProfile,
      assignedBranch: activeBranch,
      lockerCode: generatedLockerCode
    });

    addToast('success', '¡Registro Exitoso!', `Cliente registrado y asignado a ${activeBranch.name}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span>Registro de Clientes & Asignación Inteligente de Sucursal</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cada cliente se vincula automáticamente al Hub o Sucursal más cercana según su geolocalización o sector de residencia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setClientType('individual')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    clientType === 'individual'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Persona Individual (Casillero / Envíos Personales)
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('business')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    clientType === 'business'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Empresa / E-Commerce / Negocio
                </button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {clientType === 'business' ? 'Razón Social / Negocio *' : 'Nombre y Apellidos *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={clientType === 'business' ? 'Ej. Tienda Tech Dominicana SRL' : 'Ej. Carlos Méndez'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {clientType === 'business' ? 'RNC Empresarial' : 'Cédula de Identidad / DNI'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 131-98765-4"
                    value={rncOrDni}
                    onChange={(e) => setRncOrDni(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono Móvil / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="809-555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Geographic Info for Nearest Branch Auto-Matching */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Ubicación & Sector de Residencia</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentGPS}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-300 font-bold hover:bg-indigo-50 flex items-center gap-1 shadow-xs text-[10px]"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Detectar GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                      Provincia
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => {
                        setSelectedProvince(e.target.value);
                        setManualBranchId(null);
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    >
                      <option value="Distrito Nacional">Distrito Nacional (Santo Domingo)</option>
                      <option value="Santo Domingo Este">Santo Domingo Este</option>
                      <option value="Santiago">Santiago de los Caballeros (Cibao)</option>
                      <option value="La Altagracia (Punta Cana)">La Altagracia (Punta Cana / Bávaro)</option>
                      <option value="La Romana">La Romana</option>
                      <option value="Puerto Plata">Puerto Plata</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                      Sector / Barrio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Piantini, Naco, Bella Vista, Cienfuegos..."
                      value={sector}
                      onChange={(e) => {
                        setSector(e.target.value);
                        setManualBranchId(null);
                      }}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                    Calle, Número de Edificio o Casa
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Calle Federico Geraldino #45, Apto 3B"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Delivery Preference */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Preferencia de Entrega Predeterminada
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                      deliveryPreference === 'domicilio'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryPref"
                      checked={deliveryPreference === 'domicilio'}
                      onChange={() => setDeliveryPreference('domicilio')}
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-bold">Entrega a Domicilio</div>
                      <div className="text-[10px] text-slate-500">Reparto por chofer a tu puerta</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                      deliveryPreference === 'locker_sucursal'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryPref"
                      checked={deliveryPreference === 'locker_sucursal'}
                      onChange={() => setDeliveryPreference('locker_sucursal')}
                      className="text-indigo-600"
                    />
                    <div>
                      <div className="font-bold">Retiro en Sucursal</div>
                      <div className="text-[10px] text-slate-500">Pick-up en locker de tu Hub asignado</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="lg" type="submit" className="w-full" icon={<UserCheck className="w-4 h-4" />}>
                  Registrar Cliente y Activar Casillero
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Dynamic Branch Matcher Display */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-linear-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border-indigo-900/50 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
                  Motor de Asignación Automática
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                100% Cobertura
              </span>
            </div>

            {/* Matched Branch Hero Banner */}
            <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-3">
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                SUCURSAL DE CABECERA RECOMENDADA
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {activeBranch.name}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {activeBranch.address} • {activeBranch.city}
                  </p>
                </div>
                <div className="px-2.5 py-1 bg-indigo-500/30 rounded-xl border border-indigo-400/40 text-center">
                  <div className="text-[9px] font-mono text-indigo-300">DISTANCIA</div>
                  <div className="text-sm font-black font-mono text-white">
                    {matchedInfo.distanceKm} KM
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tiempo: ~{matchedInfo.estimatedMin} mins</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{activeBranch.phone}</span>
                </div>
              </div>
            </div>

            {/* Network Branch Selection Overrider */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Otras Sucursales en la Red:</span>
                <span className="text-[10px] text-slate-400 font-mono">Haz clic para reasignar</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setManualBranchId(b.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      activeBranch.id === b.id
                        ? 'bg-indigo-600/40 border-indigo-400 text-white font-bold'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.city} • Capacidad: {b.activeFleetCount} vehículos</div>
                    </div>
                    {activeBranch.id === b.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Locker Details */}
            {registeredClient && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Casillero Internacional y Local Activado</span>
                </div>
                <div className="font-mono text-sm font-black text-white bg-slate-900/80 p-2 rounded-lg border border-emerald-400/30 text-center">
                  CÓDIGO: {registeredClient.lockerCode}
                </div>
                <div className="text-[11px] text-slate-300">
                  <strong>Dirección Miami:</strong> 8200 NW 27th St, Suite 100, Box {registeredClient.lockerCode}, Miami FL 33122.
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
