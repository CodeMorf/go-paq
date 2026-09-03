import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceType } from '../../types';
import { 
  Package, 
  MapPin, 
  Truck, 
  Camera, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Calculator,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button, Card, ServiceBadge } from '../ui/DesignSystem';
import { CameraPackageScanner } from '../ui/CameraPackageScanner';
import { ApiClient } from '../../api/client';

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const compactInputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export const ShipmentCreator: React.FC = () => {
  const { formatMoney, addToast, setActiveSubView, setSelectedTracking } = useApp();

  const [serviceType, setServiceType] = useState<ServiceType>('local');
  const [originName, setOriginName] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originCity, setOriginCity] = useState('Santo Domingo');
  const [originPhone, setOriginPhone] = useState('');

  const [destName, setDestName] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [destCity, setDestCity] = useState('Santiago de los Caballeros');
  const [destPhone, setDestPhone] = useState('');

  const [weightKg, setWeightKg] = useState(2.5);
  const [lengthCm, setLengthCm] = useState(30);
  const [widthCm, setWidthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(15);
  const [category, setCategory] = useState('Electrónica / Gadgets');

  const [enableCod, setEnableCod] = useState(false);
  const [codAmount, setCodAmount] = useState(3500);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [calculatedQuote, setCalculatedQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setQuoteLoading(true);
    ApiClient.calculateQuote({
      serviceType,
      originCity,
      destCity,
      originCountry: 'DO',
      destinationCountry: 'DO',
      originAddress,
      destinationAddress: destAddress,
      senderName: originName,
      recipientName: destName || undefined,
      senderPhone: originPhone,
      recipientPhone: destPhone || undefined,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      declaredValueUsd: 0,
      isFragile: false,
      codAmount: enableCod ? codAmount : 0
    }).then(result => {
      if (!active) return;
      setCalculatedQuote(result.success ? result.quote : null);
      setQuoteLoading(false);
    });
    return () => { active = false; };
  }, [serviceType, originCity, originAddress, originName, originPhone, destCity, destAddress, destName, destPhone, weightKg, lengthCm, widthCm, heightCm, enableCod, codAmount]);

  const handleScanComplete = (data: { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; category: string }) => {
    setLengthCm(data.lengthCm);
    setWidthCm(data.widthCm);
    setHeightCm(data.heightCm);
    setWeightKg(data.weightKg);
    setCategory(data.category);
    setIsScannerOpen(false);
    addToast('info', 'Medidas capturadas', 'Verifica las medidas y el peso; el precio será confirmado por el motor de tarifas del servidor.');
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originName || !originAddress || !originPhone || !destName || !destAddress || !destPhone) {
      addToast('error', 'Campos Incompletos', 'Completa los datos reales de remitente y destinatario, incluidos sus teléfonos.');
      return;
    }

    if (!calculatedQuote) {
      addToast('error', 'Cotización no disponible', 'El servidor todavía no ha confirmado una tarifa para este servicio.');
      return;
    }
    setSubmitting(true);
    const result = await ApiClient.createShipment({
      serviceType,
      origin: {
        name: originName,
        address: originAddress,
        city: originCity,
        country: 'DO',
        phone: originPhone
      },
      destination: {
        name: destName,
        address: destAddress,
        city: destCity,
        country: 'DO',
        phone: destPhone
      },
      package: {
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        category,
        declaredValueUsd: 0,
        isFragile: false
      },
      codAmount: enableCod ? codAmount : 0,
      codCurrency: 'DOP'
    }, `shipment-create-${crypto.randomUUID()}`);
    setSubmitting(false);
    if (!result.success) {
      addToast('error', 'No se creó el envío', result.error);
      return;
    }
    addToast('success', 'Envío guardado', `La guía ${result.shipment.trackingNumber} fue confirmada por el servidor.`);
    setSelectedTracking(result.shipment.trackingNumber);
    setActiveSubView('tracking');
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 dark:border-indigo-900/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-slate-900 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Nueva operación</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Cotizar y crear envío</span>
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            Completa los datos esenciales. La tarifa se confirma en el servidor y la guía solo se genera después de guardar correctamente.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Camera className="w-4 h-4 text-indigo-600" />}
          onClick={() => setIsScannerOpen(true)}
        >
          Escanear Paquete con Cámara IA
        </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-indigo-100 pt-4 text-[11px] dark:border-indigo-900/60 sm:max-w-xl sm:gap-4">
          {[['1', 'Servicio y dirección'], ['2', 'Paquete y COD'], ['3', 'Confirmación']].map(([step, label], index) => <div key={step} className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 ring-1 ring-indigo-200 dark:bg-slate-900 dark:ring-indigo-800'}`}>{step}</span><span className="hidden font-semibold sm:inline">{label}</span></div>)}
        </div>
      </div>

      {/* Service Type Switcher */}
      <div className="flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
        {[
          { type: 'local', label: 'Local Metropolitano', desc: 'Mismo día en ciudad' },
          { type: 'nacional', label: 'Nacional Express', desc: 'Interprovincial 24h' },
          { type: 'internacional', label: 'Courier USA / EU', desc: 'Casillero y aéreo' },
          { type: 'mudanza', label: 'Mudanza Residencial', desc: 'Con estibadores' },
          { type: 'carga_pesada', label: 'Carga Pesada / Pallet', desc: 'Camión plataforma' },
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => setServiceType(item.type as ServiceType)}
            className={`min-w-[168px] snap-start rounded-2xl border p-3 text-left transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/15 sm:min-w-0 ${
              serviceType === item.type
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <ServiceBadge type={item.type as ServiceType} showIcon={false} />
            <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateShipment} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left 2 Cols: Origin, Destination & Package Specs */}
        <div className="space-y-5">
          {/* Origin & Destination */}
          <Card className="space-y-5 p-4 sm:p-5">
            <div><h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Direcciones de origen y destino</span>
            </h3><p className="mt-1 text-xs text-slate-400">Indica quién entrega, quién recibe y dónde ocurre cada tramo.</p></div>

            <div className="grid grid-cols-1 gap-4 text-xs xl:grid-cols-2">
              {/* Origin */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div><span className="font-black text-slate-800 dark:text-slate-200">Origen</span><p className="mt-0.5 text-[11px] text-slate-500">Datos del remitente</p></div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300">Nombre o empresa<input aria-label="Nombre o empresa remitente" type="text" value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Ej. María Pérez o Tienda GoPaq" className={compactInputClass} /></label>
                <label className="block font-semibold text-slate-600 dark:text-slate-300">Dirección completa<input aria-label="Dirección del remitente" type="text" value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="Calle, número, sector y referencia" className={compactInputClass} /></label>
                <div className="grid gap-3 sm:grid-cols-2"><label className="block font-semibold text-slate-600 dark:text-slate-300">Ciudad<select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className={compactInputClass}
                >
                  <option>Santo Domingo</option>
                  <option>Santiago de los Caballeros</option>
                  <option>Punta Cana / Bávaro</option>
                  <option>La Romana</option>
                  <option>Puerto Plata</option>
                </select></label><label className="block font-semibold text-slate-600 dark:text-slate-300">Teléfono<input aria-label="Teléfono del remitente" type="tel" value={originPhone} onChange={(e) => setOriginPhone(e.target.value)} placeholder="809…" className={compactInputClass} /></label></div>
              </div>

              {/* Destination */}
              <div className="space-y-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <div><span className="font-black text-indigo-950 dark:text-indigo-200">Destino</span><p className="mt-0.5 text-[11px] text-indigo-700/70 dark:text-indigo-300/70">Datos del receptor</p></div>
                <label className="block font-semibold text-indigo-950/80 dark:text-indigo-100">Nombre o empresa<input required aria-label="Nombre o empresa destinataria" type="text" value={destName} onChange={(e) => setDestName(e.target.value)} placeholder="Ej. Juan Rodríguez" className={compactInputClass} /></label>
                <label className="block font-semibold text-indigo-950/80 dark:text-indigo-100">Dirección de entrega<input required aria-label="Dirección del destinatario" type="text" value={destAddress} onChange={(e) => setDestAddress(e.target.value)} placeholder="Calle, número, sector y referencia" className={compactInputClass} /></label>
                <div className="grid gap-3 sm:grid-cols-2"><label className="block font-semibold text-indigo-950/80 dark:text-indigo-100">Ciudad<select
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className={compactInputClass}
                  >
                    <option>Santo Domingo</option>
                    <option>Santiago de los Caballeros</option>
                    <option>Punta Cana / Bávaro</option>
                    <option>La Romana</option>
                    <option>Puerto Plata</option>
                  </select></label><label className="block font-semibold text-indigo-950/80 dark:text-indigo-100">Teléfono<input required aria-label="Teléfono del destinatario" type="tel" value={destPhone} onChange={(e) => setDestPhone(e.target.value)} placeholder="809…" className={compactInputClass} /></label></div>
              </div>
            </div>
          </Card>

          {/* Package Measurements & Weight */}
          <Card className="space-y-5 p-4 sm:p-5">
            <div><h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Paquete, peso y categoría</span>
            </h3><p className="mt-1 text-xs text-slate-400">Usa medidas reales; el servidor determina el peso facturable y el precio final.</p></div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div><label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Peso físico (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div><label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Largo (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div><label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Ancho (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div><label className="mb-1 block font-semibold text-slate-600 dark:text-slate-300">Alto (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Contenido o categoría del paquete<input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej. documentos, ropa, electrónica" className={inputClass} /></label>

            {/* COD Toggle Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={enableCod}
                  onChange={(e) => setEnableCod(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-amber-600"
                />
                <div>
                  <span className="block font-black text-amber-950 dark:text-amber-200">Cobro contra entrega (COD)</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-amber-800/80 dark:text-amber-300/80">El conductor cobrará al entregar. El monto y la comisión quedan registrados en el flujo financiero.</span>
                </div>
              </label>

              {enableCod && (
                <label className="w-full text-xs font-bold text-amber-900 dark:text-amber-200 sm:w-auto">Monto a cobrar (DOP)
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-amber-500/15 dark:border-amber-800 dark:bg-slate-900 dark:text-white sm:w-40"
                  />
                </label>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quotation Summary & Confirmation */}
        <div className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Desglose de cotización</span>
            </h3><p className="mt-1 text-[11px] text-slate-500">Confirmación del motor de tarifas</p></div><DollarSign className="h-5 w-5 text-indigo-200" /></div>

            {quoteLoading && <div className="space-y-2" aria-live="polite"><div className="h-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><p className="text-xs text-slate-400">Consultando tarifa real…</p></div>}
            {calculatedQuote && !quoteLoading && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start justify-between gap-3"><span>Tarifa base <span className="text-slate-400">({serviceType})</span></span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatMoney(calculatedQuote.baseRate)}</span></div>
                <div className="flex items-start justify-between gap-3">
                  <span>Peso facturable:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{calculatedQuote.billableWeightKg} kg</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Peso ({weightKg} kg):</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatMoney(calculatedQuote.weightCost)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Seguro / recargos:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatMoney(Number(calculatedQuote.insuranceCost || 0) + Number(calculatedQuote.fragileSurcharge || 0) + Number(calculatedQuote.dangerousZoneSurcharge || 0))}</span>
                </div>
                {enableCod && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Comisión Manejo COD (2.5%):</span>
                    <span className="font-mono">{formatMoney(calculatedQuote.codFee || 0)}</span>
                  </div>
                )}

                <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
                  <span className="font-black text-slate-900 dark:text-white">Total del flete</span>
                  <span className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {formatMoney(calculatedQuote.total)}
                  </span>
                </div>
              </div>
            )}

            {!quoteLoading && !calculatedQuote && <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500 dark:border-slate-700 dark:bg-slate-950">Completa una dirección, peso y dimensiones válidas para obtener una cotización confirmada por el servidor.</div>}

            <Button
              variant="primary"
              size="lg"
              className="w-full font-black shadow-md"
              icon={<CheckCircle2 className="w-4 h-4" />}
              type="submit"
              disabled={submitting || quoteLoading || !calculatedQuote}
            >
              {submitting ? 'Guardando en GoPaq…' : 'Generar Guía & Solicitar Despacho'}
            </Button>
          </div>
        </div>
      </form>

      {/* AI Camera Scanner Modal */}
      {isScannerOpen && (
        <CameraPackageScanner
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
};
