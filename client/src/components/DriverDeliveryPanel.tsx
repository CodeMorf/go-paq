import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enqueueDriverOperation, syncDriverOperations, type OfflineOperation, type OfflineSendResult } from "@/lib/offlineQueue";

type PodPayload = { shipmentId: number; recipientName: string; note?: string; evidenceUrl?: string; idempotencyKey: string };

export default function DriverDeliveryPanel({ visible }: { visible: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [message, setMessage] = useState("");
  const confirmDelivery = trpc.logistics.confirmDelivery.useMutation();
  const sendOperation = useCallback(async (operation: OfflineOperation): Promise<OfflineSendResult> => {
    if (operation.kind !== "pod") return { state: "rejected", reason: "Tipo de operación no compatible con este sincronizador" };
    try {
      await confirmDelivery.mutateAsync(operation.payload as unknown as PodPayload);
      return "synced";
    } catch (error) {
      const reason = error instanceof Error ? error.message : "El servidor rechazó la operación";
      if (/estado|conflict|idempotencia|pertenece|encontrad/i.test(reason)) return { state: "conflict", reason };
      throw error;
    }
  }, [confirmDelivery]);
  const syncPending = useCallback(() => { if (visible && navigator.onLine) void syncDriverOperations(sendOperation); }, [sendOperation, visible]);
  useEffect(() => { if (!visible) return undefined; window.addEventListener("online", syncPending); syncPending(); return () => window.removeEventListener("online", syncPending); }, [syncPending, visible]);
  if (!visible) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    const id = Number(shipmentId);
    const idempotencyKey = `pod-${shipmentId}-${Date.now()}`;
    const payload: PodPayload = { shipmentId: id, recipientName, note: note || undefined, evidenceUrl: evidenceUrl || undefined, idempotencyKey };
    if (!navigator.onLine) {
      await enqueueDriverOperation({ idempotencyKey, kind: "pod", payload });
      setMessage("Sin conexión: entrega guardada cifrada y pendiente de sincronización.");
      setShipmentId(""); setRecipientName(""); setNote(""); setEvidenceUrl("");
      return;
    }
    confirmDelivery.mutate(payload, { onSuccess: () => { setShipmentId(""); setRecipientName(""); setNote(""); setEvidenceUrl(""); setMessage("Entrega confirmada y registrada en la línea de tiempo."); }, onError: (error) => setMessage(error.message) });
  };

  return <Card className="mb-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Prueba de entrega (POD)</CardTitle><p className="text-sm text-slate-500">Confirma solo una entrega que esté en ruta de entrega. Si no hay conexión, se guarda cifrada y se sincroniza al recuperar red.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-2"><div><Label htmlFor="pod-shipment">ID del envío</Label><Input id="pod-shipment" type="number" min="1" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} required /></div><div><Label htmlFor="pod-recipient">Recibido por</Label><Input id="pod-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} minLength={2} maxLength={180} required /></div><div><Label htmlFor="pod-evidence">URL de evidencia (opcional)</Label><Input id="pod-evidence" type="url" placeholder="https://…" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} /></div><div><Label htmlFor="pod-note">Nota</Label><Textarea id="pod-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} /></div><div className="flex items-center gap-3 md:col-span-2"><Button type="submit" disabled={confirmDelivery.isPending}>{confirmDelivery.isPending ? "Registrando…" : "Confirmar entrega"}</Button>{message && <p className="text-sm text-slate-600" role="status">{message}</p>}</div></form></CardContent></Card>;
}
