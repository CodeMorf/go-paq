import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dimensionUnits, weightUnits, type DimensionUnit, type WeightUnit } from "@/lib/units";
import { PackagePlus, ScanLine, Split, Undo2, X } from "lucide-react";

const packageStatuses = ["expected", "received", "inspected", "stored", "dispatched", "delivered", "incident", "returned"] as const;
const statusLabels: Record<(typeof packageStatuses)[number], string> = { expected: "Esperado", received: "Recibido", inspected: "Inspeccionado", stored: "Almacenado", dispatched: "Despachado", delivered: "Entregado", incident: "Incidencia", returned: "Devuelto" };
const weightOptions = Object.keys(weightUnits) as WeightUnit[];
const dimensionOptions = Object.keys(dimensionUnits) as DimensionUnit[];

type PackageChildDraft = { weight: string; locationCode: string };

export default function PackageOpsPanel({ visible }: { visible: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>("cm");
  const [locationCode, setLocationCode] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [receptionPhoto, setReceptionPhoto] = useState<File | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
  const [selectedLocation, setSelectedLocation] = useState<Record<number, string>>({});
  const [splitTarget, setSplitTarget] = useState<number | null>(null);
  const [splitChildren, setSplitChildren] = useState<PackageChildDraft[]>([{ weight: "", locationCode: "" }, { weight: "", locationCode: "" }]);
  const [repackTarget, setRepackTarget] = useState<number | null>(null);
  const [repackDraft, setRepackDraft] = useState({ weight: "", length: "", width: "", height: "", locationCode: "", note: "" });
  const [feedback, setFeedback] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const packages = trpc.packages.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const createPackage = trpc.packages.create.useMutation({
    onSuccess: async (created) => {
      setFeedback(`Paquete ${created.packageCode} registrado.`);
      setShipmentId(""); setDescription(""); setWeight(""); setLength(""); setWidth(""); setHeight(""); setLocationCode(""); setBarcodeValue("");
      if (receptionPhoto) {
        const reader = new FileReader();
        reader.onload = () => { const dataUrl = String(reader.result ?? ""); const base64 = dataUrl.split(",")[1] ?? ""; const extension = receptionPhoto.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"; uploadReceptionPhoto.mutate({ shipmentId: created.shipmentId, documentType: "receipt", fileName: `reception-${created.id}.${extension}`, mimeType: receptionPhoto.type || "image/jpeg", dataBase64: base64 }); };
        reader.readAsDataURL(receptionPhoto);
      }
      setReceptionPhoto(null);
      await utils.packages.list.invalidate();
    },
    onError: (error) => setFeedback(error.message),
  });
  const uploadReceptionPhoto = trpc.documents.upload.useMutation({ onSuccess: (document) => setFeedback(`Paquete registrado y fotografía de recepción guardada: ${document.url}`), onError: (error) => setFeedback(`Paquete registrado, pero no se guardó la fotografía: ${error.message}`) });
  const updatePackage = trpc.packages.update.useMutation({
    onSuccess: async (updated) => { setFeedback(`Paquete ${updated.packageCode} actualizado.`); await utils.packages.list.invalidate(); },
    onError: (error) => setFeedback(error.message),
  });
  const splitPackage = trpc.packages.split.useMutation({
    onSuccess: async (result) => { setFeedback(`Separación registrada: ${result.children.length} paquetes hijos creados.`); setSplitTarget(null); setSplitChildren([{ weight: "", locationCode: "" }, { weight: "", locationCode: "" }]); await utils.packages.list.invalidate(); await utils.inventory.list.invalidate(); },
    onError: (error) => setFeedback(error.message),
  });
  const repackPackage = trpc.packages.repack.useMutation({
    onSuccess: async (updated) => { setFeedback(`Reempaque registrado para ${updated.packageCode}.`); setRepackTarget(null); setRepackDraft({ weight: "", length: "", width: "", height: "", locationCode: "", note: "" }); await utils.packages.list.invalidate(); await utils.inventory.list.invalidate(); },
    onError: (error) => setFeedback(error.message),
  });

  const numeric = (value: string) => value.trim() ? Number(value) : undefined;
  const stopScanner = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setScannerOpen(false); };
  const startScanner = async () => {
    const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor) { setScannerStatus("Este navegador no expone escaneo automático; introduce el código manualmente."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setScannerStatus("Este dispositivo no permite acceso a cámara; introduce el código manualmente."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream; setScannerOpen(true); setScannerStatus("Apunta la cámara al QR o código de barras…");
      requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;
        video.srcObject = stream; await video.play();
        const detector = new BarcodeDetectorCtor({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a"] });
        const scan = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try { const results = await detector.detect(video); const value = results.find((item) => item.rawValue)?.rawValue; if (value) { setBarcodeValue(value); setScannerStatus(`Código capturado: ${value}`); stopScanner(); return; } } catch { setScannerStatus("No se pudo leer el código; intenta de nuevo o introduce el valor manualmente."); }
          requestAnimationFrame(() => void scan());
        };
        void scan();
      });
    } catch { setScannerStatus("No se obtuvo acceso a la cámara; verifica el permiso del navegador o introduce el valor manualmente."); }
  };
  useEffect(() => () => stopScanner(), []);

  if (!visible) return null;
  const create = (event: React.FormEvent) => {
    event.preventDefault(); setFeedback("");
    const id = Number(shipmentId);
    if (!Number.isInteger(id) || id <= 0) { setFeedback("Indica un ID de envío válido de la organización activa."); return; }
    createPackage.mutate({ shipmentId: id, description: description.trim() || undefined, weight: numeric(weight), weightUnit, length: numeric(length), width: numeric(width), height: numeric(height), dimensionUnit, locationCode: locationCode.trim() || undefined, barcodeValue: barcodeValue.trim() || undefined });
  };
  const update = (id: number) => {
    const next = selectedStatus[id]; const location = selectedLocation[id]?.trim();
    updatePackage.mutate({ id, status: next && next !== "keep" ? next as (typeof packageStatuses)[number] : undefined, locationCode: location || undefined });
  };
  const setChildDraft = (index: number, key: keyof PackageChildDraft, value: string) => setSplitChildren((current) => current.map((child, childIndex) => childIndex === index ? { ...child, [key]: value } : child));
  const submitSplit = (packageId: number) => {
    const children = splitChildren.map((child) => ({ weight: Number(child.weight), weightUnit: "kg" as const, locationCode: child.locationCode.trim() || undefined }));
    if (children.some((child) => !Number.isFinite(child.weight) || child.weight <= 0)) { setFeedback("Cada paquete hijo requiere un peso válido en kg."); return; }
    splitPackage.mutate({ packageId, children });
  };
  const submitRepack = (packageId: number) => {
    if (!repackDraft.weight.trim() && !repackDraft.length.trim() && !repackDraft.width.trim() && !repackDraft.height.trim() && !repackDraft.locationCode.trim()) { setFeedback("Indica al menos una medida, peso o ubicación nueva para registrar el reempaque."); return; }
    repackPackage.mutate({ packageId, weight: numeric(repackDraft.weight), weightUnit: "kg", length: numeric(repackDraft.length), width: numeric(repackDraft.width), height: numeric(repackDraft.height), dimensionUnit: "cm", locationCode: repackDraft.locationCode.trim() || undefined, note: repackDraft.note.trim() || undefined });
  };

  return <Card className="mt-6 border-0 bg-white shadow-sm">
    <CardHeader><CardTitle>Recepción, almacén y embalaje</CardTitle><p className="text-sm text-slate-500">Registra medidas, escanea el código, ubica cada paquete y conserva la trazabilidad de separación o reempaque.</p></CardHeader>
    <CardContent className="space-y-5">
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div><Label htmlFor="package-shipment">ID del envío</Label><Input id="package-shipment" inputMode="numeric" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} placeholder="Ej. 1024" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-description">Descripción</Label><Input id="package-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Contenido declarado" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-weight">Peso</Label><div className="mt-1 flex gap-2"><Input id="package-weight" type="number" min="0" step="0.001" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" className="bg-white" /><Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as WeightUnit)}><SelectTrigger className="w-24 bg-white"><SelectValue /></SelectTrigger><SelectContent>{weightOptions.map((unit) => <SelectItem key={unit} value={unit}>{weightUnits[unit].label}</SelectItem>)}</SelectContent></Select></div></div>
        <div><Label>Dimensiones</Label><div className="mt-1 flex gap-1"><Input aria-label="Largo" type="number" min="0" step="0.01" value={length} onChange={(event) => setLength(event.target.value)} placeholder="L" className="bg-white" /><Input aria-label="Ancho" type="number" min="0" step="0.01" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="A" className="bg-white" /><Input aria-label="Alto" type="number" min="0" step="0.01" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="H" className="bg-white" /><Select value={dimensionUnit} onValueChange={(value) => setDimensionUnit(value as DimensionUnit)}><SelectTrigger className="w-20 bg-white"><SelectValue /></SelectTrigger><SelectContent>{dimensionOptions.map((unit) => <SelectItem key={unit} value={unit}>{dimensionUnits[unit].label}</SelectItem>)}</SelectContent></Select></div></div>
        <div><Label htmlFor="package-location">Ubicación inicial</Label><Input id="package-location" value={locationCode} onChange={(event) => setLocationCode(event.target.value)} maxLength={80} placeholder="Ej. A-01-03" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-photo">Fotografía de recepción</Label><Input id="package-photo" type="file" accept="image/*" capture="environment" onChange={(event) => setReceptionPhoto(event.target.files?.[0] ?? null)} className="mt-1 bg-white" /><p className="mt-1 text-xs text-muted-foreground">Opcional · máximo 10 MB · se guarda en storage seguro.</p></div>
        <div><Label htmlFor="package-barcode">QR / código de barras</Label><div className="mt-1 flex gap-2"><Input id="package-barcode" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} maxLength={120} placeholder="Escaneo o referencia" className="bg-white" /><Button type="button" variant="outline" size="icon" aria-label="Abrir escáner" onClick={() => void startScanner()}><ScanLine className="h-4 w-4" /></Button></div>{scannerStatus && <p role="status" className="mt-1 text-xs text-muted-foreground">{scannerStatus}</p>}{scannerOpen && <div className="mt-2 rounded-xl border border-border bg-slate-950 p-2"><video ref={videoRef} muted playsInline className="aspect-video w-full rounded-lg object-cover" /><Button type="button" variant="outline" className="mt-2 border-white/20 bg-transparent text-white hover:bg-white/10" onClick={stopScanner}><X className="mr-2 h-4 w-4" />Cerrar cámara</Button></div>}</div>
        <div className="flex items-end lg:col-span-2"><Button type="submit" disabled={createPackage.isPending || uploadReceptionPhoto.isPending} className="w-full"><PackagePlus className="mr-2 h-4 w-4" />{createPackage.isPending ? "Guardando…" : "Registrar paquete"}</Button></div>
      </form>
      {feedback && <p className="text-sm text-slate-600" role="status">{feedback}</p>}
      {packages.isLoading && <p className="text-sm text-slate-500">Cargando paquetes…</p>}
      {packages.error && <p className="text-sm text-destructive" role="alert">No se pudieron cargar los paquetes: {packages.error.message}</p>}
      {!packages.isLoading && !packages.error && !packages.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No hay paquetes registrados en la organización activa.</div>}
      <div className="space-y-3">{packages.data?.slice(0, 50).map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-900">{item.packageCode}</p><p className="text-xs text-slate-500">Envío #{item.shipmentId} · {item.description || "Sin descripción"}</p>{item.parentPackageId && <p className="text-xs text-slate-500">Hijo de paquete #{item.parentPackageId} · {item.packagingStatus}</p>}</div><span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">{statusLabels[item.status]} · {item.packagingStatus}</span></div><div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><span>Peso: {item.weightKg ? `${item.weightKg} kg` : "Sin pesar"}</span><span>Medidas: {item.lengthCm && item.widthCm && item.heightCm ? `${item.lengthCm} × ${item.widthCm} × ${item.heightCm} cm` : "Sin medir"}</span><span>Ubicación: {item.locationCode || "Sin ubicación"}</span></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Select value={selectedStatus[item.id] || "keep"} onValueChange={(value) => setSelectedStatus((current) => ({ ...current, [item.id]: value }))}><SelectTrigger className="bg-white sm:w-48"><SelectValue placeholder="Cambiar estado" /></SelectTrigger><SelectContent><SelectItem value="keep">Conservar estado</SelectItem>{packageStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select><Input value={selectedLocation[item.id] ?? item.locationCode ?? ""} onChange={(event) => setSelectedLocation((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={80} placeholder="Ubicación, ej. A-01-03" className="bg-white sm:flex-1" /><Button variant="outline" onClick={() => update(item.id)} disabled={updatePackage.isPending}>Guardar movimiento</Button></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { setSplitTarget(splitTarget === item.id ? null : item.id); setRepackTarget(null); }}><Split className="mr-2 h-4 w-4" />{splitTarget === item.id ? "Cerrar separación" : "Separar"}</Button><Button type="button" variant="outline" onClick={() => { setRepackTarget(repackTarget === item.id ? null : item.id); setSplitTarget(null); }}><Undo2 className="mr-2 h-4 w-4" />{repackTarget === item.id ? "Cerrar reempaque" : "Reempacar"}</Button></div>{splitTarget === item.id && <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3"><p className="text-sm font-semibold text-slate-900">Separar en dos paquetes hijos</p><p className="mt-1 text-xs text-slate-600">El servidor valida el peso total, relaciona los hijos con este paquete y registra inventario.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{splitChildren.map((child, index) => <div key={index} className="rounded-lg border border-orange-100 bg-white p-2"><Label htmlFor={`split-weight-${item.id}-${index}`}>Hijo {index + 1}: peso kg</Label><Input id={`split-weight-${item.id}-${index}`} type="number" min="0.001" step="0.001" value={child.weight} onChange={(event) => setChildDraft(index, "weight", event.target.value)} className="mt-1" /><Label htmlFor={`split-location-${item.id}-${index}`} className="mt-2 block">Ubicación</Label><Input id={`split-location-${item.id}-${index}`} value={child.locationCode} onChange={(event) => setChildDraft(index, "locationCode", event.target.value)} maxLength={80} placeholder="A-01-03" className="mt-1" /></div>)}</div><Button type="button" className="mt-3" disabled={splitPackage.isPending} onClick={() => submitSplit(item.id)}>{splitPackage.isPending ? "Separando…" : "Confirmar separación"}</Button></div>}{repackTarget === item.id && <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-sm font-semibold text-slate-900">Actualizar embalaje</p><p className="mt-1 text-xs text-slate-600">El ajuste conserva el historial y crea un movimiento de inventario.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Input aria-label="Nuevo peso kg" type="number" min="0.001" step="0.001" placeholder="Peso kg" value={repackDraft.weight} onChange={(event) => setRepackDraft((current) => ({ ...current, weight: event.target.value }))} /><Input aria-label="Nuevo largo cm" type="number" min="0.1" step="0.01" placeholder="Largo cm" value={repackDraft.length} onChange={(event) => setRepackDraft((current) => ({ ...current, length: event.target.value }))} /><Input aria-label="Nuevo ancho cm" type="number" min="0.1" step="0.01" placeholder="Ancho cm" value={repackDraft.width} onChange={(event) => setRepackDraft((current) => ({ ...current, width: event.target.value }))} /><Input aria-label="Nuevo alto cm" type="number" min="0.1" step="0.01" placeholder="Alto cm" value={repackDraft.height} onChange={(event) => setRepackDraft((current) => ({ ...current, height: event.target.value }))} /><Input aria-label="Nueva ubicación" maxLength={80} placeholder="Ubicación" value={repackDraft.locationCode} onChange={(event) => setRepackDraft((current) => ({ ...current, locationCode: event.target.value }))} /><Input aria-label="Motivo del reempaque" maxLength={1000} placeholder="Motivo" value={repackDraft.note} onChange={(event) => setRepackDraft((current) => ({ ...current, note: event.target.value }))} /></div><Button type="button" className="mt-3" disabled={repackPackage.isPending} onClick={() => submitRepack(item.id)}>{repackPackage.isPending ? "Guardando…" : "Confirmar reempaque"}</Button></div>}</div>)}</div>
    </CardContent>
  </Card>;
}
