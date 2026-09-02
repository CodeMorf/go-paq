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

export const ShipmentCreator: React.FC = () => {
  const { formatMoney, addToast, setActiveSubView, setSelectedTracking } = useApp();

  const [serviceType, setServiceType] = useState<ServiceType>('local');
  const [originName, setOriginName] = useState('TechStore Caribe');
  const [originAddress, setOriginAddress] = useState('Av. Winston Churchill #1099, Piantini');
  const [originCity, setOriginCity] = useState('Santo Domingo');
  const [originPhone, setOriginPhone] = useState('809-555-0144');

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
      declaredValueUsd: 120,
      isFragile: true,
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
    addToast('success', 'Escaneo IA Exitoso', 'Las medidas y peso fueron calculados automáticamente.');
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName || !destAddress) {
      addToast('error', 'Campos Incompletos', 'Por favor completa el nombre y dirección del destinatario.');
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
        declaredValueUsd: 120,
        isFragile: true
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Cotizador & Creación de Envíos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calcula la tarifa en tiempo real con recargos de combustible, seguro y cobro contra entrega (COD)
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

      {/* Service Type Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            className={`p-3 rounded-2xl border text-left transition-all ${
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

      <form onSubmit={handleCreateShipment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Origin, Destination & Package Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Origin & Destination */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Direcciones de Origen & Destino</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Origin */}
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="font-bold text-slate-700 dark:text-slate-300">Punto de Origen (Remitente)</span>
                <input
                  type="text"
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  placeholder="Nombre / Empresa Remitente"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
                <input
                  type="text"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  placeholder="Dirección completa"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                >
                  <option>Santo Domingo</option>
                  <option>Santiago de los Caballeros</option>
                  <option>Punta Cana / Bávaro</option>
                  <option>La Romana</option>
                  <option>Puerto Plata</option>
                </select>
              </div>

              {/* Destination */}
              <div className="space-y-2 p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">Punto de Destino (Receptor)</span>
                <input
                  type="text"
                  required
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  placeholder="Nombre del Destinatario *"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
                <input
                  type="text"
                  required
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  placeholder="Dirección de Entrega *"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                  >
                    <option>Santo Domingo</option>
                    <option>Santiago de los Caballeros</option>
                    <option>Punta Cana / Bávaro</option>
                    <option>La Romana</option>
                    <option>Puerto Plata</option>
                  </select>
                  <input
                    type="tel"
                    value={destPhone}
                    onChange={(e) => setDestPhone(e.target.value)}
                    placeholder="Teléfono móvil"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Package Measurements & Weight */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>Dimensiones, Peso & Categoría</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Peso Físico (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Largo (CM)</label>
                <input
                  type="number"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ancho (CM)</label>
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Alto (CM)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                />
              </div>
            </div>

            {/* COD Toggle Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCod}
                  onChange={(e) => setEnableCod(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Cobro Contra Entrega (COD - Cash On Delivery)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    El conductor cobrará el valor del producto al entregar y se transferirá a tu cuenta.
                  </span>
                </div>
              </label>

              {enableCod && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Monto a Cobrar:</span>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Number(e.target.value))}
                    className="w-32 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-lg p-2 font-mono font-bold text-slate-900 dark:text-white text-xs"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quotation Summary & Confirmation */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Desglose de Cotización</span>
            </h3>

            {quoteLoading && <p className="text-xs text-slate-400">Consultando tarifa real…</p>}
            {calculatedQuote && !quoteLoading && (
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Tarifa Base ({serviceType}):</span>
                  <span className="font-mono font-semibold">{formatMoney(calculatedQuote.baseRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso facturable:</span>
                  <span className="font-mono font-semibold">{calculatedQuote.billableWeightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso ({weightKg} kg):</span>
                  <span className="font-mono font-semibold">{formatMoney(calculatedQuote.weightCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seguro / recargos:</span>
                  <span className="font-mono font-semibold">{formatMoney(Number(calculatedQuote.insuranceCost || 0) + Number(calculatedQuote.fragileSurcharge || 0) + Number(calculatedQuote.dangerousZoneSurcharge || 0))}</span>
                </div>
                {enableCod && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Comisión Manejo COD (2.5%):</span>
                    <span className="font-mono">{formatMoney(calculatedQuote.codFee || 0)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Total a Pagar Flete:</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatMoney(calculatedQuote.total)}
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md"
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
