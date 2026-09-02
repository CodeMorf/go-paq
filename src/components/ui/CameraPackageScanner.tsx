import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, Scan, X } from 'lucide-react';
import { Button } from './DesignSystem';
import { PackageDimensions, ServiceType } from '../../types';

interface CameraPackageScannerProps {
  onDimensionsDetected?: (dims: PackageDimensions, serviceRecommended: ServiceType, price: number) => void;
  onDetectPackage?: (data: any) => void;
  onScanComplete?: (data: any) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

/** Camera capture adapter. Computer vision is not claimed without a configured provider. */
export const CameraPackageScanner: React.FC<CameraPackageScannerProps> = ({ onDimensionsDetected, onDetectPackage, onScanComplete, onCancel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lengthCm, setLengthCm] = useState(20); const [widthCm, setWidthCm] = useState(15); const [heightCm, setHeightCm] = useState(10); const [weightKg, setWeightKg] = useState(1); const [category, setCategory] = useState('Paquete');
  useEffect(() => { if (!cameraEnabled) return; let stream: MediaStream | null = null; navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } }).then((activeStream) => { stream = activeStream; if (videoRef.current) videoRef.current.srcObject = activeStream; }).catch(() => { setCameraError('Permiso de cámara no concedido. Las medidas deben introducirse manualmente.'); setCameraEnabled(false); }); return () => { stream?.getTracks().forEach((track) => track.stop()); }; }, [cameraEnabled]);
  const close = onClose || onCancel;
  const confirm = () => { const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(1)); const data = { lengthCm, widthCm, heightCm, weightKg, volumetricWeightKg, category }; if (onScanComplete) onScanComplete(data); if (onDetectPackage) onDetectPackage(data); if (onDimensionsDetected) onDimensionsDetected({ ...data, detectedType: 'caja', confidence: undefined }, 'local', 0); close?.(); };
  return <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-800 p-4"><div className="flex items-center gap-2"><Scan className="h-5 w-5 text-indigo-400" /><div><h4 className="text-sm font-bold">Captura de paquete</h4><p className="text-xs text-slate-400">La cámara captura referencia; no se simula medición IA.</p></div></div>{close && <button type="button" onClick={close} className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Cerrar"><X className="h-5 w-5" /></button>}</div>{cameraError && <div className="flex items-start gap-2 border-b border-amber-800/60 bg-amber-950/60 p-3 text-xs text-amber-300"><AlertCircle className="h-4 w-4 shrink-0" />{cameraError}</div>}<div className="relative flex aspect-video items-center justify-center bg-slate-950 p-4">{cameraEnabled ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full rounded-xl object-cover" /> : <div className="max-w-sm text-center text-sm text-slate-400"><Camera className="mx-auto mb-3 h-10 w-10 text-slate-500" /><p>Activa la cámara para visualizar el paquete o continúa con la captura manual.</p></div>}</div><div className="space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="secondary" size="sm" onClick={() => setCameraEnabled((value) => !value)}>{cameraEnabled ? 'Apagar cámara' : 'Activar cámara'}</Button><span className="text-[11px] text-amber-300">Motor dimensional: NO CONFIGURADO</span></div><div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">{([['Largo', lengthCm, setLengthCm], ['Ancho', widthCm, setWidthCm], ['Alto', heightCm, setHeightCm], ['Peso kg', weightKg, setWeightKg]] as const).map(([label, value, setter]) => <label key={label} className="font-bold text-slate-300">{label}<input type="number" min="0.01" step="0.1" value={value} onChange={(event) => setter(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 font-mono text-white" /></label>)}</div><label className="block text-xs font-bold text-slate-300">Categoría<input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white" /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Cancelar</Button><Button type="button" variant="primary" icon={<Check className="h-4 w-4" />} onClick={confirm}>Usar medidas verificadas</Button></div></div></div>;
};
