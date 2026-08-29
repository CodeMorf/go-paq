import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  Scale, 
  Barcode, 
  Printer, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Package,
  User
} from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';
import { Shipment } from '../../types';

export const CounterPOS: React.FC = () => {
  const { addShipment, selectedBranch, formatMoney, addToast } = useApp();

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [destCity, setDestCity] = useState('Santiago de los Caballeros');
  const [destAddress, setDestAddress] = useState('');

  const [weightKg, setWeightKg] = useState(1.8);
  const [packageCategory, setPackageCategory] = useState('Documentos & Sobres');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const [createdLabel, setCreatedLabel] = useState<Shipment | null>(null);

  const calculateTotal = () => {
    const base = destCity === 'Santo Domingo' ? 180 : 320;
    const extraKg = Math.max(0, weightKg - 1) * 35;
    return base + extraKg;
  };

  const handleSimulateScale = () => {
    const randomWeight = +(Math.random() * 4 + 0.5).toFixed(2);
    setWeightKg(randomWeight);
    addToast('info', 'Báscula USB Conectada', `Lectura en tiempo real: ${randomWeight} KG.`);
  };

  const handleProcessOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !destAddress) {
      addToast('error', 'Campos Incompletos', 'Completa la información del destinatario.');
      return;
    }

    const trackNum = `NX-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const cost = calculateTotal();

    const newShip: Shipment = {
      id: `ship-pos-${Date.now()}`,
      trackingNumber: trackNum,
      serviceType: destCity === 'Santo Domingo' ? 'local' : 'nacional',
      status: 'at_branch',
      branchName: selectedBranch.name,
      origin: {
        name: senderName || 'Cliente Mostrador',
        address: selectedBranch.address,
        city: selectedBranch.city,
        country: 'DO',
        phone: senderPhone || '809-000-0000'
      },
      destination: {
        name: recipientName,
        address: destAddress,
        city: destCity,
        country: 'DO',
        phone: recipientPhone
      },
      package: {
        weightKg,
        lengthCm: 25,
        widthCm: 20,
        heightCm: 10,
        category: packageCategory
      },
      shippingCost: cost,
      currency: 'DOP',
      timeline: [
        {
          id: `ev-${Date.now()}`,
          status: 'at_branch',
          title: 'Recibido en Mostrador Sucursal',
          description: `Ingresado en caja mostrador de ${selectedBranch.name}`,
          timestamp: new Date().toLocaleString(),
          location: selectedBranch.city
        }
      ],
      createdAt: new Date().toISOString()
    };

    addShipment(newShip);
    setCreatedLabel(newShip);
    addToast('success', 'Envío Creado', `Guía ${trackNum} generada y lista para imprimir.`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            <span>Punto de Venta Mostrador (POS Recepción Rápida)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Operando en: <strong className="text-slate-800 dark:text-slate-200">{selectedBranch.name}</strong> • Emisión de guías térmicas
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Scale className="w-4 h-4 text-emerald-600" />}
          onClick={handleSimulateScale}
        >
          Capturar Peso de Báscula USB
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Left 2 Cols */}
        <form onSubmit={handleProcessOrder} className="lg:col-span-2 space-y-4">
          <Card className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Datos del Envío Presencial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Nombre Remitente</label>
                <input
                  type="text"
                  placeholder="Ej: José Reyes"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Teléfono Remitente</label>
                <input
                  type="tel"
                  placeholder="809-555-0101"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Nombre Destinatario *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Luisa Ramírez"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Teléfono Destinatario *</label>
                <input
                  type="tel"
                  required
                  placeholder="829-555-0202"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Ciudad Destino</label>
                <select
                  value={destCity}
                  onChange={(e) => setDestCity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium"
                >
                  <option>Santo Domingo</option>
                  <option>Santiago de los Caballeros</option>
                  <option>Punta Cana / Bávaro</option>
                  <option>La Romana</option>
                  <option>Puerto Plata</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Dirección de Destino *</label>
                <input
                  type="text"
                  required
                  placeholder="Calle, Número, Sector"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Peso Verificado (KG)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                  />
                  <Button size="sm" variant="secondary" type="button" onClick={handleSimulateScale}>
                    Báscula
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Contenido / Categoría</label>
                <select
                  value={packageCategory}
                  onChange={(e) => setPackageCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-medium"
                >
                  <option>Documentos & Sobres</option>
                  <option>Electrónica / Celulares</option>
                  <option>Ropa & Calzado</option>
                  <option>Repuestos & Accesorios</option>
                  <option>Cosméticos / Medicinas</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Método de Pago en Mostrador:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Efectivo en Caja</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    paymentMethod === 'card'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta (Verifone POS)</span>
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full">
              Cobrar {formatMoney(calculateTotal())} & Emitir Guía Térmica
            </Button>
          </Card>
        </form>

        {/* Right 1 Col: Thermal Sticker Preview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Sticker Térmico (Zebra 4x6)</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold">
                Listo para Imprimir
              </span>
            </div>

            {/* Thermal Label representation */}
            <div className="border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-xl p-4 bg-white text-slate-950 space-y-3 font-mono shadow-xs">
              <div className="flex justify-between items-start border-b border-black pb-2">
                <div>
                  <span className="font-black text-base tracking-tight block">GoPaq EXPRESS</span>
                  <span className="text-[9px] block">ORIGEN: {selectedBranch.code}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] block font-bold">FECHA: 28/02/2026</span>
                  <span className="text-xs font-bold">{weightKg} KG</span>
                </div>
              </div>

              {/* Barcode visual */}
              <div className="text-center py-2 bg-slate-50 rounded border border-slate-300">
                <div className="h-10 flex items-center justify-center tracking-widest font-black text-2xl">
                  ||| | |||| || | ||||| |||
                </div>
                <span className="text-xs font-bold tracking-widest block">
                  {createdLabel ? createdLabel.trackingNumber : 'NX-89234811'}
                </span>
              </div>

              <div className="border-t border-black pt-2 text-[10px] space-y-1">
                <p><strong>DESTINATARIO:</strong> {recipientName || 'JUAN PÉREZ'}</p>
                <p><strong>CIUDAD:</strong> {destCity}</p>
                <p><strong>DIR:</strong> {destAddress || 'AV. 27 DE FEBRERO #40'}</p>
                <p><strong>TEL:</strong> {recipientPhone || '809-555-0199'}</p>
              </div>

              <div className="border-t border-black pt-2 flex justify-between items-center text-xs font-bold">
                <span>PAGADO: {formatMoney(calculateTotal())}</span>
                <span>{paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => addToast('info', 'Impresión Enviada', 'Sticker térmico enviado a la impresora Zebra ZD421.')}
            >
              Imprimir Etiqueta Térmica
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
