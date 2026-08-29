import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Shipment, BulkScanItem, ShipmentStatus } from '../../types';
import { soundAlerts } from '../../utils/audioAlerts';
import { 
  Scan, 
  Barcode, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Download, 
  Truck, 
  Building2, 
  Layers, 
  Package, 
  ShieldAlert, 
  Play, 
  FileSpreadsheet, 
  Sparkles,
  Search,
  Volume2
} from 'lucide-react';
import { Button, Card, StatusBadge } from '../ui/DesignSystem';
import { CameraPackageScanner } from '../ui/CameraPackageScanner';
import { ThermalLabelModal } from '../ui/ThermalLabelModal';

export const BulkScanner: React.FC = () => {
  const { 
    shipments, 
    updateShipmentStatus, 
    drivers, 
    branches, 
    selectedBranch, 
    dangerousZones,
    bulkScanHistory,
    addBulkScanItem,
    clearBulkScanHistory,
    formatMoney,
    addToast
  } = useApp();

  const [scanInput, setScanInput] = useState('');
  const [scanMode, setScanMode] = useState<BulkScanItem['scanOperation']>('inbound_branch');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [selectedRackLocation, setSelectedRackLocation] = useState('ZONA-A-ESTANTE-01');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeLabelShipment, setActiveLabelShipment] = useState<Shipment | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep focus on input for continuous barcode gun scanning
    if (!isCameraOpen) {
      inputRef.current?.focus();
    }
  }, [isCameraOpen, bulkScanHistory.length]);

  const processTrackingCode = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    // Check if already in current batch
    const alreadyScanned = bulkScanHistory.some((item) => item.trackingNumber === cleanCode);
    if (alreadyScanned) {
      soundAlerts.playErrorAlert();
      addToast('warning', 'Paquete Duplicado', `El paquete ${cleanCode} ya fue escaneado en esta sesión.`);
      setScanInput('');
      return;
    }

    // Find in global shipments database
    const matchedShipment = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === cleanCode || s.externalTracking?.toUpperCase() === cleanCode
    );

    if (!matchedShipment) {
      // Create ad-hoc scan item
      soundAlerts.playSuccessScan();
      const newItem: BulkScanItem = {
        id: `scan-${Date.now()}`,
        trackingNumber: cleanCode,
        recipientName: 'Paquete de Tránsito',
        destinationCity: selectedBranch.city,
        weightKg: 1.5,
        serviceType: 'local',
        status: 'at_branch',
        scannedAt: new Date().toLocaleTimeString(),
        scanOperation: scanMode,
        driverId: scanMode === 'outbound_driver' ? selectedDriverId : undefined,
        rackLocation: scanMode === 'rack_placement' ? selectedRackLocation : undefined
      };
      addBulkScanItem(newItem);
      addToast('info', 'Código Registrado', `Guía externa ${cleanCode} ingresada al lote.`);
      setScanInput('');
      return;
    }

    // Check dangerous zone match
    const isDangerous = dangerousZones.some(
      (dz) =>
        dz.isSuspended &&
        (matchedShipment.destination.sector?.toLowerCase().includes(dz.sector.toLowerCase()) ||
          matchedShipment.destination.city.toLowerCase() === dz.city.toLowerCase())
    );

    if (isDangerous) {
      soundAlerts.playErrorAlert();
      addToast('error', '⚠️ ALERTA DE SEGURIDAD', `El destino de ${matchedShipment.trackingNumber} está en una ZONA ROJA suspendida.`);
    } else {
      soundAlerts.playSuccessScan();
    }

    // Map new status based on operation
    let newStatus: ShipmentStatus = 'at_branch';
    if (scanMode === 'outbound_driver') newStatus = 'out_for_delivery';
    if (scanMode === 'rack_placement') newStatus = 'at_warehouse';
    if (scanMode === 'direct_delivery') newStatus = 'delivered';

    // Add to batch list
    const scanItem: BulkScanItem = {
      id: `scan-${Date.now()}`,
      trackingNumber: matchedShipment.trackingNumber,
      recipientName: matchedShipment.destination.name,
      destinationCity: matchedShipment.destination.city,
      weightKg: matchedShipment.package.weightKg,
      serviceType: matchedShipment.serviceType,
      status: newStatus,
      scannedAt: new Date().toLocaleTimeString(),
      scanOperation: scanMode,
      driverId: scanMode === 'outbound_driver' ? selectedDriverId : undefined,
      rackLocation: scanMode === 'rack_placement' ? selectedRackLocation : undefined,
      codAmount: matchedShipment.codAmount,
      isDangerousZone: isDangerous,
      isFragile: matchedShipment.isFragile || matchedShipment.package.isFragile
    };

    addBulkScanItem(scanItem);
    updateShipmentStatus(matchedShipment.trackingNumber, newStatus, {
      driverId: scanMode === 'outbound_driver' ? selectedDriverId : matchedShipment.driverId,
      branchId: selectedBranch.id,
      branchName: selectedBranch.name,
      warehouseSlot: scanMode === 'rack_placement' ? selectedRackLocation : undefined
    });

    setScanInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processTrackingCode(scanInput);
    }
  };

  const handleExecuteBatch = () => {
    if (bulkScanHistory.length === 0) return;
    soundAlerts.playBatchComplete();
    addToast(
      'success',
      'Lote Procesado con Éxito',
      `Se actualizaron ${bulkScanHistory.length} paquetes a la operación seleccionada.`
    );
  };

  const handleExportCSV = () => {
    if (bulkScanHistory.length === 0) {
      addToast('info', 'Sin Datos', 'Escanea al menos un paquete para exportar el manifiesto.');
      return;
    }

    const headers = ['Guía Tracking', 'Destinatario', 'Ciudad', 'Peso (KG)', 'Operación', 'Hora', 'COD'];
    const rows = bulkScanHistory.map((i) => [
      i.trackingNumber,
      `"${i.recipientName}"`,
      `"${i.destinationCity}"`,
      i.weightKg,
      i.scanOperation,
      i.scannedAt,
      i.codAmount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Manifiesto_Escaneo_${selectedBranch.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Manifiesto Descargado', 'Archivo CSV generado para la auditoría de almacén.');
  };

  const totalKg = bulkScanHistory.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
  const totalCod = bulkScanHistory.reduce((acc, curr) => acc + (curr.codAmount || 0), 0);
  const dangerousCount = bulkScanHistory.filter((i) => i.isDangerousZone).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Scan className="w-6 h-6 text-indigo-600" />
            <span>Estación de Escaneo Masivo (Bulk Scanner Hub)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ingreso y despacho continuo de paquetes por pistola láser USB / Bluetooth o cámara inteligente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Camera className="w-4 h-4" />}
            onClick={() => setIsCameraOpen(true)}
          >
            Abrir Cámara OCR
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Exportar Manifiesto
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Play className="w-4 h-4" />}
            onClick={handleExecuteBatch}
            disabled={bulkScanHistory.length === 0}
          >
            Confirmar Lote ({bulkScanHistory.length})
          </Button>
        </div>
      </div>

      {/* Operation Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setScanMode('inbound_branch')}
          className={`p-3 rounded-2xl border text-left font-medium transition-all ${
            scanMode === 'inbound_branch'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>1. Recepción Sucursal</span>
          </div>
          <p className="text-[10px] text-slate-500">Ingreso a {selectedBranch.name}</p>
        </button>

        <button
          onClick={() => setScanMode('outbound_driver')}
          className={`p-3 rounded-2xl border text-left font-medium transition-all ${
            scanMode === 'outbound_driver'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>2. Despacho a Chofer</span>
          </div>
          <p className="text-[10px] text-slate-500">Cargar a ruta de reparto</p>
        </button>

        <button
          onClick={() => setScanMode('rack_placement')}
          className={`p-3 rounded-2xl border text-left font-medium transition-all ${
            scanMode === 'rack_placement'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>3. Ubicación en Rack</span>
          </div>
          <p className="text-[10px] text-slate-500">Organizar por estante</p>
        </button>

        <button
          onClick={() => setScanMode('direct_delivery')}
          className={`p-3 rounded-2xl border text-left font-medium transition-all ${
            scanMode === 'direct_delivery'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>4. Entrega Mostrador</span>
          </div>
          <p className="text-[10px] text-slate-500">Retiro directo de cliente</p>
        </button>
      </div>

      {/* Main Scan Input Card */}
      <Card className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
              <Barcode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
                  Modo Pistola Láser Activo
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Pistolear Código de Barra o Guía (Enter)
              </h3>
            </div>
          </div>

          {/* Conditional Selectors */}
          {scanMode === 'outbound_driver' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Asignar a Chofer:</span>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 focus:outline-none font-bold"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicleName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {scanMode === 'rack_placement' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Estante / Rack:</span>
              <select
                value={selectedRackLocation}
                onChange={(e) => setSelectedRackLocation(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 focus:outline-none font-bold"
              >
                <option value="ZONA-A-ESTANTE-01">Zona A - Estante 01 (Express)</option>
                <option value="ZONA-B-ESTANTE-04">Zona B - Estante 04 (Nacional)</option>
                <option value="ZONA-INT-RACK-02">Zona INT - Rack 02 (Aduanas)</option>
                <option value="JAULA-SEGURIDAD-01">Jaula Seguridad (Alto Valor / COD)</option>
              </select>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Esperando lectura de pistola láser (ej. NX-2026-001)..."
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-5 pr-32 py-4 bg-slate-950/80 border-2 border-indigo-500/50 rounded-2xl text-lg font-mono font-black text-emerald-400 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 tracking-wider shadow-inner"
            autoFocus
          />
          <button
            onClick={() => processTrackingCode(scanInput)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Registrar
          </button>
        </div>

        {/* Real-time scanning KPIs */}
        <div className="grid grid-cols-4 gap-3 pt-2 text-center text-xs font-mono">
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Paquetes Leídos</div>
            <div className="text-xl font-black text-white">{bulkScanHistory.length}</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Peso Total</div>
            <div className="text-xl font-black text-indigo-300">{Math.round(totalKg * 10) / 10} KG</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Total COD</div>
            <div className="text-xl font-black text-amber-400">{formatMoney(totalCod)}</div>
          </div>
          <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Alertas Seguridad</div>
            <div className={`text-xl font-black ${dangerousCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {dangerousCount}
            </div>
          </div>
        </div>
      </Card>

      {/* Scanned Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <span>Paquetes Procesados en la Sesión ({bulkScanHistory.length})</span>
          </h3>

          {bulkScanHistory.length > 0 && (
            <button
              onClick={clearBulkScanHistory}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Lista</span>
            </button>
          )}
        </div>

        {bulkScanHistory.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Barcode className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Listo para recibir lecturas de código de barras
            </p>
            <p className="text-xs text-slate-400">
              Utiliza la pistola lectora o escribe el código en el recuadro superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Guía Tracking</th>
                  <th className="py-3 px-4">Destinatario</th>
                  <th className="py-3 px-4">Destino</th>
                  <th className="py-3 px-4">Peso</th>
                  <th className="py-3 px-4">Operación</th>
                  <th className="py-3 px-4">Estado Resultante</th>
                  <th className="py-3 px-4 text-center">Etiqueta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {bulkScanHistory.map((item, idx) => {
                  const originalShipment = shipments.find((s) => s.trackingNumber === item.trackingNumber);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        item.isDangerousZone ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {bulkScanHistory.length - idx}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {item.trackingNumber}
                        </span>
                        {item.isDangerousZone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="w-3 h-3" /> ZONA ROJA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.recipientName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.destinationCity}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.weightKg} KG
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          {item.scanOperation}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {originalShipment ? (
                          <button
                            onClick={() => setActiveLabelShipment(originalShipment)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-medium transition-colors"
                            title="Reimprimir Etiqueta Térmica"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Camera Package Scanner Modal */}
      {isCameraOpen && (
        <CameraPackageScanner
          onDetectPackage={(data) => {
            setIsCameraOpen(false);
            const simTracking = `NX-CAM-${Math.floor(100000 + Math.random() * 900000)}`;
            processTrackingCode(simTracking);
            addToast('success', 'IA Scanner Detectado', `Dimensiones: ${data.lengthCm}×${data.widthCm}×${data.heightCm} cm (${data.detectedType})`);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Thermal Label Modal */}
      {activeLabelShipment && (
        <ThermalLabelModal
          shipment={activeLabelShipment}
          isOpen={!!activeLabelShipment}
          onClose={() => setActiveLabelShipment(null)}
        />
      )}
    </div>
  );
};
