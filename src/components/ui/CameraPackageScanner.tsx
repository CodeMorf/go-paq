import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  Box, 
  Check, 
  RotateCcw, 
  Layers, 
  Truck, 
  DollarSign, 
  Sliders, 
  Scan,
  AlertCircle
} from 'lucide-react';
import { Button } from './DesignSystem';
import { PackageDimensions, ServiceType } from '../../types';
import { useApp } from '../../context/AppContext';

interface CameraPackageScannerProps {
  onDimensionsDetected: (dims: PackageDimensions, serviceRecommended: ServiceType, price: number) => void;
  onCancel?: () => void;
}

export const CameraPackageScanner: React.FC<CameraPackageScannerProps> = ({
  onDimensionsDetected,
  onCancel
}) => {
  const { formatMoney } = useApp();
  const [scanState, setScanState] = useState<'scanning' | 'detected' | 'editing'>('scanning');
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Detected parameters
  const [lengthCm, setLengthCm] = useState(62);
  const [widthCm, setWidthCm] = useState(42);
  const [heightCm, setHeightCm] = useState(39);
  const [weightKg, setWeightKg] = useState(8.4);
  const [detectedCategory, setDetectedCategory] = useState<'caja' | 'sobre' | 'maleta' | 'mueble' | 'electrodomestico' | 'pallet'>('caja');
  const [confidence, setConfidence] = useState(0.96);

  // Volumetric formula: (L x W x H) / 5000
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(1));

  // Determine recommendation
  const getRecommendation = () => {
    let service: ServiceType = 'nacional';
    let vehicle = 'Van';
    let basePrice = 580;

    if (volumetricWeightKg > 50 || weightKg > 50) {
      service = 'carga_pesada';
      vehicle = 'Camión Isuzu';
      basePrice = 2800;
    } else if (volumetricWeightKg < 3 && weightKg < 2) {
      service = 'local';
      vehicle = 'Moto Express';
      basePrice = 220;
    } else {
      service = 'nacional';
      vehicle = 'Van de Carga';
      basePrice = 450 + Math.round(Math.max(weightKg, volumetricWeightKg) * 35);
    }

    return { service, vehicle, price: basePrice };
  };

  const rec = getRecommendation();

  // Try real camera if requested
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useRealCamera) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          setCameraError('Permiso de cámara no concedido. Usando escáner AR asistido por IA.');
          setUseRealCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useRealCamera]);

  // Simulate scanning timer
  useEffect(() => {
    if (scanState === 'scanning') {
      const timer = setTimeout(() => {
        setScanState('detected');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  const handleConfirm = () => {
    const pkg: PackageDimensions = {
      lengthCm,
      widthCm,
      heightCm,
      weightKg,
      volumetricWeightKg,
      category: `Caja Mediana (${lengthCm}x${widthCm}x${heightCm}cm)`,
      detectedType: detectedCategory,
      confidence
    };
    onDimensionsDetected(pkg, rec.service, rec.price);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-white">
      {/* Top Banner */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Escáner Dimensional por Cámara IA</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Vision Engine v4.2
              </span>
            </h4>
            <p className="text-xs text-slate-400">Reconocimiento volumétrico en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseRealCamera(!useRealCamera)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
              useRealCamera 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useRealCamera ? 'Cámara Web Activa' : 'Simulador AR'}</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Viewport Canvas / Video */}
      <div className="relative aspect-video max-h-72 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {useRealCamera ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          /* Simulated Package in Warehouse Studio */
          <div className="relative w-full h-full flex items-center justify-center bg-radial from-slate-800 to-slate-950">
            {/* Visual 3D cardboard box mock */}
            <div className="relative w-48 h-40 bg-linear-to-br from-amber-700 to-amber-900 border-2 border-amber-500/40 rounded-xl shadow-2xl transform -rotate-3 flex flex-col items-center justify-center p-3">
              <div className="w-full h-3 border-b-2 border-dashed border-amber-950/50 mb-2" />
              <Box className="w-12 h-12 text-amber-300/70 mb-1" />
              <div className="text-[10px] font-mono font-bold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded">
                FRÁGIL • ESTÁNDAR
              </div>
              {/* Barcode graphic */}
              <div className="mt-2 w-28 h-5 bg-white/90 rounded flex items-center justify-around px-1">
                <span className="h-4 w-1 bg-black" />
                <span className="h-4 w-2 bg-black" />
                <span className="h-4 w-0.5 bg-black" />
                <span className="h-4 w-1.5 bg-black" />
                <span className="h-4 w-1 bg-black" />
                <span className="h-4 w-2 bg-black" />
              </div>
            </div>
          </div>
        )}

        {/* AI Augmented Reality Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
          {scanState === 'scanning' ? (
            <div className="relative w-72 h-52 border-2 border-dashed border-indigo-400 rounded-2xl flex flex-col items-center justify-center">
              {/* Laser beam */}
              <div className="absolute inset-x-0 h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_15px_#22d3ee] top-1/2 -translate-y-1/2" />
              <div className="bg-slate-950/80 px-3 py-1.5 rounded-full border border-indigo-500/40 text-xs font-semibold text-indigo-300 flex items-center gap-2">
                <Scan className="w-3.5 h-3.5 animate-spin" />
                <span>Detectando paquete y aristas...</span>
              </div>
            </div>
          ) : (
            /* Detected Bounding Box */
            <div className="relative w-72 h-52 border-2 border-emerald-400 bg-emerald-500/10 rounded-2xl flex flex-col justify-between p-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold tracking-wider uppercase">
                  📦 Caja Detectada ({Math.round(confidence * 100)}%)
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Vol: {((lengthCm * widthCm * heightCm) / 1000).toFixed(1)} Litros
                </span>
              </div>

              {/* Edge Dimensions Labels */}
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300 drop-shadow-md">
                <span className="bg-slate-900/90 px-1.5 py-0.5 rounded">L: {lengthCm} cm</span>
                <span className="bg-slate-900/90 px-1.5 py-0.5 rounded">A: {widthCm} cm</span>
                <span className="bg-slate-900/90 px-1.5 py-0.5 rounded">H: {heightCm} cm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis & Detection Summary Panel */}
      <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-4">
        {scanState === 'detected' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Grid of Results */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Dimensiones</span>
                <span className="text-sm font-bold text-white font-mono">
                  {lengthCm} × {widthCm} × {heightCm} cm
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-medium">Peso Real</span>
                  <span className="text-[10px] text-indigo-400">Editar</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-16 bg-slate-900 text-sm font-bold text-white px-2 py-0.5 rounded border border-slate-600 focus:outline-none font-mono"
                  />
                  <span className="text-xs font-bold text-slate-300">KG</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Peso Volumétrico</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {volumetricWeightKg} KG
                </span>
              </div>

              <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-500/40">
                <span className="text-[11px] text-indigo-300 block font-medium">Precio Estimado</span>
                <span className="text-sm font-bold text-white">
                  {formatMoney(rec.price)}
                </span>
              </div>
            </div>

            {/* Smart Recommendation Banner */}
            <div className="p-3.5 bg-linear-to-r from-indigo-950/60 to-slate-800/80 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-300 block">
                    Servicio Recomendado: <strong className="text-white capitalize">{rec.service.replace('_', ' ')}</strong>
                  </span>
                  <span className="text-slate-400">
                    Vehículo Óptimo: <strong className="text-indigo-300">{rec.vehicle}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setScanState('editing')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium px-2 py-1 bg-slate-800 rounded-lg"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Ajustar Manual</span>
              </button>
            </div>
          </div>
        )}

        {scanState === 'editing' && (
          <div className="space-y-3 p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
            <h5 className="font-bold text-white">Ajuste Manual de Medidas</h5>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Largo (cm)</label>
                <input
                  type="number"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Ancho (cm)</label>
                <input
                  type="number"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Alto (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setScanState('scanning')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-escanear</span>
          </button>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-300">
                Cancelar
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              icon={<Check className="w-4 h-4" />}
              onClick={handleConfirm}
            >
              Aplicar Medidas Detectadas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
