import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Globe, Copy, CheckCircle2, Plus, Sparkles, Box, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../ui/DesignSystem';
import { MOCK_LOCKERS } from '../../data/mockData';

export const LockerAddresses: React.FC = () => {
  const { addToast } = useApp();
  const [isPrealertOpen, setIsPrealertOpen] = useState(false);
  const [storeName, setStoreName] = useState('Amazon');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [declaredValue, setDeclaredValue] = useState(45);
  const [description, setDescription] = useState('Ropa y calzado deportivo');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', 'Copiado', 'Dirección copiada para tus compras online.');
  };

  const handlePrealert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) return;
    setIsPrealertOpen(false);
    setTrackingNumber('');
    addToast('success', 'Pre-alerta Registrada', 'Te notificaremos tan pronto arribe al casillero en Miami.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            <span>Mis Casilleros Internacionales (USA / Europa)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Usa estas direcciones para tus compras en Amazon, eBay, Shein, AliExpress o tiendas europeas
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsPrealertOpen(!isPrealertOpen)}
        >
          {isPrealertOpen ? 'Cerrar Pre-Alerta' : 'Pre-Alertar Paquete'}
        </Button>
      </div>

      {/* Pre-alert form panel */}
      {isPrealertOpen && (
        <Card className="bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Pre-Alerta de Compra en Línea</span>
            </h3>
            <span className="text-[11px] text-slate-400">Acelera la liberación en aduanas</span>
          </div>

          <form onSubmit={handlePrealert} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Tienda</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Tracking (UPS, FedEx, USPS)</label>
              <input
                type="text"
                required
                placeholder="1Z9999999999999999"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Valor Declarado (USD)</label>
              <input
                type="number"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-500 dark:text-slate-400 block mb-1">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Guardar Pre-Alerta
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lockers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_LOCKERS.map((lkr) => (
          <Card key={lkr.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{lkr.flag}</span>
              <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                {lkr.lockerCode}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lkr.city}
              </h3>
              <p className="text-xs text-slate-500">{lkr.countryFullName}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl font-mono text-xs space-y-2 border border-slate-200/70 dark:border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Nombre:</span>
                <span className="font-bold text-slate-900 dark:text-white">TechStore / NX-8849</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Línea 1:</span>
                <span className="text-slate-800 dark:text-slate-200">{lkr.addressLine1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Línea 2:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{lkr.addressLine2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Ciudad/Zip:</span>
                <span className="text-slate-800 dark:text-slate-200">{lkr.cityStateZip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Teléfono:</span>
                <span className="text-slate-500">{lkr.phone}</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => handleCopy(`${lkr.addressLine1}, ${lkr.addressLine2}, ${lkr.cityStateZip}`)}
            >
              Copiar Dirección
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
