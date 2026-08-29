import React, { useRef } from 'react';
import { Shipment, PackageDimensions } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Printer, 
  Download, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Package, 
  Sparkles, 
  FileText,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Button } from './DesignSystem';

interface ThermalLabelModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalLabelModal: React.FC<ThermalLabelModalProps> = ({ shipment, isOpen, onClose }) => {
  const { formatMoney, branches } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !shipment) return null;

  const pkg = shipment.package;
  const isFragile = shipment.isFragile || pkg.isFragile || pkg.category?.toLowerCase().includes('frágil') || pkg.category?.toLowerCase().includes('cristal');
  const isElectronic = pkg.category?.toLowerCase().includes('electrónica') || pkg.category?.toLowerCase().includes('batería') || pkg.category?.toLowerCase().includes('laptop') || pkg.category?.toLowerCase().includes('celular');
  const hasCod = (shipment.codAmount || 0) > 0;
  const isHeavyCargo = shipment.serviceType === 'carga_pesada' || shipment.serviceType === 'mudanza' || pkg.weightKg > 30;
  const isDocuments = pkg.category?.toLowerCase().includes('documento') || pkg.detectedType === 'sobre';

  const nearestBranch = branches.find((b) => b.id === shipment.branchId) || branches[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Impresión de Etiqueta Térmica 4×6"</span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
                  Zebra / Dymo Standard
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guía: {shipment.trackingNumber} • Servicio: {shipment.serviceType.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Imprimir Etiqueta
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Thermal Label Preview */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950/60 flex flex-col items-center">
          {/* Printable Container */}
          <div
            ref={printRef}
            id="printable-thermal-label"
            className="w-[380px] sm:w-[400px] bg-white text-black p-5 border-2 border-black rounded-lg shadow-md font-sans text-xs select-none"
            style={{ minHeight: '580px' }}
          >
            {/* Header: Carrier Brand & Service */}
            <div className="flex items-start justify-between border-b-2 border-black pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-2xl tracking-tighter text-black">
                    Go<span className="text-black">Paq</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-black text-white rounded font-mono uppercase font-bold">
                    {shipment.serviceType}
                  </span>
                </div>
                <div className="text-[8px] font-bold tracking-widest text-slate-800 uppercase mt-0.5">
                  LOGÍSTICA PUERTA A PUERTA
                </div>
                <div className="text-[7px] font-mono text-slate-600">
                  RÁPIDO • SEGURO • CONFIABLE
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-lg text-black">
                  HUB-{shipment.destination.city.substring(0, 3).toUpperCase()}
                </div>
                <div className="text-[9px] font-mono text-slate-700 font-bold">
                  Ruta: {shipment.branchName ? shipment.branchName.substring(0, 15) : 'METRO-01'}
                </div>
              </div>
            </div>

            {/* Specialized Badge Alert based on Product */}
            {isFragile && (
              <div className="my-2 p-2 bg-black text-white flex items-center justify-between font-black text-xs uppercase tracking-wider rounded">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>FRÁGIL • MANIPULAR CON CUIDADO</span>
                </div>
                <span className="text-[10px] font-mono">VIDRIO / CRISTAL</span>
              </div>
            )}

            {isElectronic && !isFragile && (
              <div className="my-2 p-1.5 border-2 border-black flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-black" />
                  <span>CONTIENE BATERÍA DE LITIO (UN3481)</span>
                </div>
                <span className="text-[9px]">NO PERFORAR</span>
              </div>
            )}

            {/* COD High-Contrast Highlight */}
            {hasCod && (
              <div className="my-2 p-2 bg-black text-white rounded text-center border-2 border-black">
                <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                  ⚠️ COBRO CONTRA ENTREGA (COD) OBLIGATORIO ⚠️
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white my-0.5">
                  {formatMoney(shipment.codAmount || 0, shipment.currency || 'DOP')}
                </div>
                <div className="text-[9px] font-mono uppercase text-slate-300">
                  CHOFER: NO ENTREGAR EL PAQUETE SIN RECIBIR EL PAGO EN EFECTIVO
                </div>
              </div>
            )}

            {/* Heavy Cargo Bultos Indicator */}
            {isHeavyCargo && (
              <div className="my-2 p-1.5 bg-slate-200 border border-black flex items-center justify-between font-bold text-xs">
                <span>BULTO 1 DE 1 • CARGA PESADA</span>
                <span className="font-mono font-black">{pkg.weightKg} KG BRUTO</span>
              </div>
            )}

            {/* Barcode & Tracking Number */}
            <div className="my-3 text-center border-b-2 border-black pb-3">
              {/* Simulated Code-128 High Density Barcode SVG */}
              <div className="flex justify-center my-1">
                <svg className="w-full h-16" viewBox="0 0 300 60" preserveAspectRatio="none">
                  {/* Generate clean barcode lines */}
                  {Array.from({ length: 55 }).map((_, i) => {
                    const width = (i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 1);
                    const x = i * 5.4 + 4;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y="0"
                        width={width}
                        height="55"
                        fill="#000000"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="font-mono font-black text-lg tracking-widest text-black">
                {shipment.trackingNumber}
              </div>
              {shipment.externalTracking && (
                <div className="text-[10px] font-mono text-slate-700">
                  Tracking Internacional: {shipment.externalTracking}
                </div>
              )}
            </div>

            {/* Destination & Recipient */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="text-[9px] font-bold uppercase text-slate-600 tracking-wider">
                DESTINATARIO / SHIP TO:
              </div>
              <div className="font-black text-base text-black uppercase leading-tight mt-0.5">
                {shipment.destination.name}
              </div>
              <div className="font-bold text-xs text-black mt-1">
                {shipment.destination.address || shipment.destination.street || 'Dirección no especificada'}
              </div>
              <div className="text-xs font-semibold text-black">
                {shipment.destination.sector ? `${shipment.destination.sector}, ` : ''}
                {shipment.destination.city}, {shipment.destination.country}
              </div>
              <div className="text-xs font-mono font-bold text-black mt-1 flex items-center justify-between">
                <span>TEL: {shipment.destination.phone || '809-555-0000'}</span>
                <span>ZONA: {shipment.destination.city.toUpperCase()}</span>
              </div>
            </div>

            {/* Origin & Shipper */}
            <div className="border-b-2 border-black pb-2 mb-2 text-[10px]">
              <div className="text-[9px] font-bold uppercase text-slate-600">
                REMITENTE / FROM:
              </div>
              <div className="font-bold text-black truncate">
                {shipment.origin.name} • {shipment.origin.city}
              </div>
              <div className="text-slate-700 truncate">
                {shipment.origin.address || shipment.origin.street}
              </div>
            </div>

            {/* Package Specs Grid */}
            <div className="grid grid-cols-4 gap-1 text-center border-b-2 border-black pb-2 mb-2 text-[10px] font-mono">
              <div className="p-1 bg-slate-100 border border-slate-300">
                <div className="text-[8px] uppercase text-slate-500 font-sans">PESO REAL</div>
                <div className="font-black text-xs text-black">{pkg.weightKg} KG</div>
              </div>
              <div className="p-1 bg-slate-100 border border-slate-300">
                <div className="text-[8px] uppercase text-slate-500 font-sans">VOLUMÉTRICO</div>
                <div className="font-black text-xs text-black">
                  {Math.round(((pkg.lengthCm * pkg.widthCm * pkg.heightCm) / 5000) * 10) / 10} KG
                </div>
              </div>
              <div className="p-1 bg-slate-100 border border-slate-300">
                <div className="text-[8px] uppercase text-slate-500 font-sans">MEDIDAS (CM)</div>
                <div className="font-bold text-[9px] text-black">
                  {pkg.lengthCm}×{pkg.widthCm}×{pkg.heightCm}
                </div>
              </div>
              <div className="p-1 bg-slate-100 border border-slate-300">
                <div className="text-[8px] uppercase text-slate-500 font-sans">CATEGORÍA</div>
                <div className="font-bold text-[9px] text-black truncate">
                  {pkg.category || 'General'}
                </div>
              </div>
            </div>

            {/* Footer QR & Sorter Info */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5 text-[9px] font-mono">
                <div>FECHA: {new Date(shipment.createdAt).toLocaleDateString('es-DO')}</div>
                <div>SUCURSAL: {nearestBranch.code}</div>
                <div>ESTADO: {shipment.status.toUpperCase()}</div>
              </div>

              {/* QR Code Graphic Placeholder */}
              <div className="w-14 h-14 border border-black p-1 flex items-center justify-center bg-white">
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-mono text-center p-0.5">
                  QR SCAN
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Formato 100% compatible con impresoras térmicas ESC/POS, Zebra ZPL y TSPL</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
