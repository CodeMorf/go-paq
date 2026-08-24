import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const packageStatuses = ["expected", "received", "inspected", "stored", "dispatched", "delivered", "incident", "returned"] as const;
const statusLabels: Record<(typeof packageStatuses)[number], string> = { expected: "Esperado", received: "Recibido", inspected: "Inspeccionado", stored: "Almacenado", dispatched: "Despachado", delivered: "Entregado", incident: "Incidencia", returned: "Devuelto" };

export default function PackageOpsPanel({ visible }: { visible: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [locationCode, setLocationCode] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
  const [selectedLocation, setSelectedLocation] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const packages = trpc.packages.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const createPackage = trpc.packages.create.useMutation({
    onSuccess: async (created) => {
      setFeedback(`Paquete ${created.packageCode} recibido en el registro esperado.`);
      setShipmentId(""); setDescription(""); setWeight(""); setLength(""); setWidth(""); setHeight(""); setLocationCode(""); setBarcodeValue("");
      await utils.packages.list.invalidate();
    },
    onError: (error) => setFeedback(error.message),
  });
  const updatePackage = trpc.packages.update.useMutation({
    onSuccess: async (updated) => { setFeedback(`Paquete ${updated.packageCode} actualizado.`); await utils.packages.list.invalidate(); },
    onError: (error) => setFeedback(error.message),
  });

  if (!visible) return null;
  const numeric = (value: string) => value.trim() ? Number(value) : undefined;
  const create = (event: React.FormEvent) => {
    event.preventDefault(); setFeedback("");
    const id = Number(shipmentId);
    if (!Number.isInteger(id) || id <= 0) { setFeedback("Indica un ID de envío válido de la organización activa."); return; }
    createPackage.mutate({ shipmentId: id, description: description.trim() || undefined, weight: numeric(weight), weightUnit: weightUnit as "kg" | "g" | "lb" | "oz", length: numeric(length), width: numeric(width), height: numeric(height), dimensionUnit: dimensionUnit as "cm" | "in", locationCode: locationCode.trim() || undefined, barcodeValue: barcodeValue.trim() || undefined });
  };
  const update = (id: number) => {
    const next = selectedStatus[id]; const location = selectedLocation[id]?.trim();
    updatePackage.mutate({ id, status: next && next !== "keep" ? next as (typeof packageStatuses)[number] : undefined, locationCode: location || undefined });
  };

  return <Card className="mt-6 border-0 bg-white shadow-sm">
    <CardHeader><CardTitle>Recepción y almacén de paquetes</CardTitle><p className="text-sm text-slate-500">Registra medidas, escanea el código y mueve cada paquete por un estado auditable.</p></CardHeader>
    <CardContent className="space-y-5">
      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div><Label htmlFor="package-shipment">ID del envío</Label><Input id="package-shipment" inputMode="numeric" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} placeholder="Ej. 1024" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-description">Descripción</Label><Input id="package-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Contenido declarado" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-weight">Peso</Label><div className="mt-1 flex gap-2"><Input id="package-weight" type="number" min="0" step="0.001" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" className="bg-white" /><Select value={weightUnit} onValueChange={setWeightUnit}><SelectTrigger className="w-24 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="lb">lb</SelectItem><SelectItem value="oz">oz</SelectItem></SelectContent></Select></div></div>
        <div><Label>Dimensiones</Label><div className="mt-1 flex gap-1"><Input aria-label="Largo" type="number" min="0" step="0.01" value={length} onChange={(event) => setLength(event.target.value)} placeholder="L" className="bg-white" /><Input aria-label="Ancho" type="number" min="0" step="0.01" value={width} onChange={(event) => setWidth(event.target.value)} placeholder="A" className="bg-white" /><Input aria-label="Alto" type="number" min="0" step="0.01" value={height} onChange={(event) => setHeight(event.target.value)} placeholder="H" className="bg-white" /><Select value={dimensionUnit} onValueChange={setDimensionUnit}><SelectTrigger className="w-20 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="in">in</SelectItem></SelectContent></Select></div></div>
        <div><Label htmlFor="package-location">Ubicación inicial</Label><Input id="package-location" value={locationCode} onChange={(event) => setLocationCode(event.target.value)} maxLength={80} placeholder="Ej. A-01-03" className="mt-1 bg-white" /></div>
        <div><Label htmlFor="package-barcode">Código de barras</Label><Input id="package-barcode" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} maxLength={120} placeholder="Escaneo o referencia" className="mt-1 bg-white" /></div>
        <div className="flex items-end lg:col-span-2"><Button type="submit" disabled={createPackage.isPending} className="w-full">{createPackage.isPending ? "Guardando…" : "Registrar paquete"}</Button></div>
      </form>
      {feedback && <p className="text-sm text-slate-600" role="status">{feedback}</p>}
      {packages.isLoading && <p className="text-sm text-slate-500">Cargando paquetes…</p>}
      {!packages.isLoading && !packages.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No hay paquetes registrados en la organización activa.</div>}
      <div className="space-y-3">{packages.data?.slice(0, 50).map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-900">{item.packageCode}</p><p className="text-xs text-slate-500">Envío #{item.shipmentId} · {item.description || "Sin descripción"}</p></div><span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">{statusLabels[item.status]}</span></div><div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><span>Peso: {item.weightKg ? `${item.weightKg} kg` : "Sin pesar"}</span><span>Medidas: {item.lengthCm && item.widthCm && item.heightCm ? `${item.lengthCm} × ${item.widthCm} × ${item.heightCm} cm` : "Sin medir"}</span><span>Ubicación: {item.locationCode || "Sin ubicación"}</span></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Select value={selectedStatus[item.id] || "keep"} onValueChange={(value) => setSelectedStatus((current) => ({ ...current, [item.id]: value }))}><SelectTrigger className="bg-white sm:w-48"><SelectValue placeholder="Cambiar estado" /></SelectTrigger><SelectContent><SelectItem value="keep">Conservar estado</SelectItem>{packageStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select><Input value={selectedLocation[item.id] ?? item.locationCode ?? ""} onChange={(event) => setSelectedLocation((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={80} placeholder="Ubicación, ej. A-01-03" className="bg-white sm:flex-1" /><Button variant="outline" onClick={() => update(item.id)} disabled={updatePackage.isPending}>Guardar movimiento</Button></div></div>)}</div>
    </CardContent>
  </Card>;
}
