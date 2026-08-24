import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueDriverOperation, syncDriverOperations, type OfflineOperation, type OfflineSendResult } from "@/lib/offlineQueue";

type PodPayload = { shipmentId: number; recipientName: string; deliveryPin?: string; note?: string; evidenceUrl?: string; latitude?: number; longitude?: number; idempotencyKey: string };

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { const result = String(reader.result ?? ""); resolve(result.includes(",") ? result.split(",", 2)[1] : result); }; reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la fotografía")); reader.readAsDataURL(file); });
}

function currentPosition() {
  return new Promise<{ latitude: number; longitude: number } | null>((resolve) => { if (!("geolocation" in navigator)) return resolve(null); navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => resolve(null), { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }); });
}

export default function DriverDeliveryPanel({ visible }: { visible: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [deliveryPin, setDeliveryPin] = useState("");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [signaturePresent, setSignaturePresent] = useState(false);
  const [message, setMessage] = useState("");
  const signatureRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const confirmDelivery = trpc.logistics.confirmDelivery.useMutation();
  const uploadEvidence = trpc.documents.upload.useMutation();
  const sendOperation = useCallback(async (operation: OfflineOperation): Promise<OfflineSendResult> => {
    if (operation.kind !== "pod") return { state: "rejected", reason: "Tipo de operación no compatible con este sincronizador" };
    try {
      await confirmDelivery.mutateAsync(operation.payload as unknown as PodPayload);
      return "synced";
    } catch (error) {
      const reason = error instanceof Error ? error.message : "El servidor rechazó la operación";
      if (/estado|conflict|idempotencia|pertenece|encontrad|pin|ruta/i.test(reason)) return { state: "conflict", reason };
      throw error;
    }
  }, [confirmDelivery]);
  const syncPending = useCallback(() => { if (visible && navigator.onLine) void syncDriverOperations(sendOperation); }, [sendOperation, visible]);
  useEffect(() => { if (!visible) return undefined; window.addEventListener("online", syncPending); syncPending(); return () => window.removeEventListener("online", syncPending); }, [syncPending, visible]);
  if (!visible) return null;

  const resetSignature = () => { const canvas = signatureRef.current; if (canvas) { const context = canvas.getContext("2d"); context?.clearRect(0, 0, canvas.width, canvas.height); } setSignaturePresent(false); };
  const reset = () => { setShipmentId(""); setRecipientName(""); setDeliveryPin(""); setNote(""); setEvidenceUrl(""); setPhoto(null); resetSignature(); };
  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = signatureRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height }; };
  const startSignature = (event: React.PointerEvent<HTMLCanvasElement>) => { const canvas = signatureRef.current; const point = pointerPosition(event); if (!canvas || !point) return; canvas.setPointerCapture(event.pointerId); const context = canvas.getContext("2d"); if (!context) return; context.strokeStyle = "#071a2e"; context.lineWidth = 3; context.lineCap = "round"; context.lineJoin = "round"; context.beginPath(); context.moveTo(point.x, point.y); drawingRef.current = true; setSignaturePresent(true); };
  const drawSignature = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawingRef.current) return; const point = pointerPosition(event); const context = signatureRef.current?.getContext("2d"); if (!point || !context) return; context.lineTo(point.x, point.y); context.stroke(); };
  const endSignature = (event: React.PointerEvent<HTMLCanvasElement>) => { drawingRef.current = false; if (signatureRef.current?.hasPointerCapture(event.pointerId)) signatureRef.current.releasePointerCapture(event.pointerId); };
  const canvasToBase64 = () => signatureRef.current?.toDataURL("image/png").split(",", 2)[1] ?? "";
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const id = Number(shipmentId);
    if (!Number.isInteger(id) || id <= 0 || recipientName.trim().length < 2) { setMessage("Indica un envío válido y el nombre de quien recibe."); return; }
    if (deliveryPin && !/^\d{4,8}$/.test(deliveryPin)) { setMessage("El PIN debe tener entre 4 y 8 dígitos."); return; }
    if (!navigator.onLine && (photo || signaturePresent)) { setMessage("La foto y la firma necesitan conexión para cargarse al storage seguro. Sin red, quita la evidencia o sincronízala desde la ficha del envío."); return; }
    const idempotencyKey = `pod-${id}-${Date.now()}`;
    try {
      let uploadedEvidenceUrl = evidenceUrl.trim() || undefined;
      const uploadedNotes: string[] = [];
      if (photo) {
        const dataBase64 = await fileToBase64(photo);
        const extension = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const uploaded = await uploadEvidence.mutateAsync({ shipmentId: id, documentType: "pod", fileName: `pod-photo-${id}-${Date.now()}.${extension}`, mimeType: photo.type || "image/jpeg", dataBase64 });
        uploadedEvidenceUrl = uploaded.url;
        uploadedNotes.push("Fotografía POD cargada");
      }
      if (signaturePresent) {
        const uploaded = await uploadEvidence.mutateAsync({ shipmentId: id, documentType: "pod", fileName: `pod-signature-${id}-${Date.now()}.png`, mimeType: "image/png", dataBase64: canvasToBase64() });
        uploadedEvidenceUrl = uploadedEvidenceUrl || uploaded.url;
        uploadedNotes.push("Firma del receptor cargada");
      }
      const position = await currentPosition();
      const payload: PodPayload = { shipmentId: id, recipientName: recipientName.trim(), deliveryPin: deliveryPin || undefined, note: [note.trim(), ...uploadedNotes].filter(Boolean).join(" · ") || undefined, evidenceUrl: uploadedEvidenceUrl, latitude: position?.latitude, longitude: position?.longitude, idempotencyKey };
      if (!navigator.onLine) {
        await enqueueDriverOperation({ idempotencyKey, kind: "pod", payload });
        reset(); setMessage("Sin conexión: entrega guardada cifrada y pendiente de sincronización.");
        return;
      }
      await confirmDelivery.mutateAsync(payload);
      reset(); setMessage(`Entrega confirmada${uploadedEvidenceUrl ? " con evidencia POD" : ""} y registrada en la línea de tiempo.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo registrar el POD"); }
  };

  return <Card className="mb-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Prueba de entrega (POD)</CardTitle><p className="text-sm text-slate-500">Confirma solo una entrega de tu ruta. El PIN se verifica en el servidor, la fotografía y firma se guardan en storage seguro, y las coordenadas se registran si el dispositivo las autoriza.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-2"><div><Label htmlFor="pod-shipment">ID del envío</Label><Input id="pod-shipment" type="number" min="1" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} required /></div><div><Label htmlFor="pod-recipient">Recibido por</Label><Input id="pod-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} minLength={2} maxLength={180} required /></div><div><Label htmlFor="pod-pin">PIN de entrega (si fue configurado)</Label><Input id="pod-pin" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={deliveryPin} onChange={(event) => setDeliveryPin(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="4–8 dígitos" /></div><div><Label htmlFor="pod-photo">Fotografía POD</Label><Input id="pod-photo" type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="bg-white" /><p className="mt-1 text-xs text-slate-500">Se sube al storage seguro; no se guarda como blob en la base.</p></div><div className="md:col-span-2"><Label htmlFor="pod-signature">Firma del receptor</Label><canvas id="pod-signature" ref={signatureRef} width={900} height={220} onPointerDown={startSignature} onPointerMove={drawSignature} onPointerUp={endSignature} onPointerCancel={endSignature} className="mt-1 h-36 w-full touch-none rounded-xl border border-dashed border-slate-300 bg-slate-50" aria-label="Área para dibujar la firma del receptor" /><div className="mt-2 flex items-center gap-3"><Button type="button" variant="outline" size="sm" onClick={resetSignature}>Limpiar firma</Button><span className="text-xs text-slate-500">La firma se carga como documento POD al enviar.</span></div></div><div><Label htmlFor="pod-evidence">URL de evidencia externa (opcional)</Label><Input id="pod-evidence" type="url" placeholder="https://…" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} /></div><div><Label htmlFor="pod-note">Nota de entrega</Label><Textarea id="pod-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Observación del receptor o de campo" /></div><div className="flex items-center gap-3 md:col-span-2"><Button type="submit" disabled={confirmDelivery.isPending || uploadEvidence.isPending}>{uploadEvidence.isPending ? "Subiendo evidencia…" : confirmDelivery.isPending ? "Registrando…" : "Confirmar entrega"}</Button>{message && <p className="text-sm text-slate-600" role="status">{message}</p>}</div></form></CardContent></Card>;
}
