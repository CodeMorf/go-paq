import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DriverDeliveryPanel({ visible }: { visible: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [message, setMessage] = useState("");
  const confirmDelivery = trpc.logistics.confirmDelivery.useMutation({ onSuccess: () => { setShipmentId(""); setRecipientName(""); setNote(""); setEvidenceUrl(""); setMessage("Entrega confirmada y registrada en la línea de tiempo."); }, onError: (error) => setMessage(error.message) });
  if (!visible) return null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    confirmDelivery.mutate({ shipmentId: Number(shipmentId), recipientName, note: note || undefined, evidenceUrl: evidenceUrl || undefined, idempotencyKey: `pod-${shipmentId}-${Date.now()}` });
  };

  return <Card className="mb-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Prueba de entrega (POD)</CardTitle><p className="text-sm text-slate-500">Confirma solo una entrega que esté en ruta de entrega. El servidor valida organización, estado e idempotencia.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-2"><div><Label htmlFor="pod-shipment">ID del envío</Label><Input id="pod-shipment" type="number" min="1" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} required /></div><div><Label htmlFor="pod-recipient">Recibido por</Label><Input id="pod-recipient" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} minLength={2} maxLength={180} required /></div><div><Label htmlFor="pod-evidence">URL de evidencia (opcional)</Label><Input id="pod-evidence" type="url" placeholder="https://…" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} /></div><div><Label htmlFor="pod-note">Nota</Label><Textarea id="pod-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} /></div><div className="flex items-center gap-3 md:col-span-2"><Button type="submit" disabled={confirmDelivery.isPending}>{confirmDelivery.isPending ? "Registrando…" : "Confirmar entrega"}</Button>{message && <p className="text-sm text-slate-600" role="status">{message}</p>}</div></form></CardContent></Card>;
}
