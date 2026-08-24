import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const nextStatuses: Record<string, Array<{ value: "assigned" | "en_route" | "collected" | "failed" | "cancelled"; label: string }>> = {
  requested: [{ value: "assigned", label: "Asignar" }, { value: "cancelled", label: "Cancelar" }],
  assigned: [{ value: "en_route", label: "En ruta" }, { value: "cancelled", label: "Cancelar" }],
  en_route: [{ value: "collected", label: "Marcar recogido" }, { value: "failed", label: "Marcar fallo" }, { value: "cancelled", label: "Cancelar" }],
};

export default function SucursalPickupPanel({ visible }: { visible: boolean }) {
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const pickups = trpc.pickups.list.useQuery(undefined, { enabled: visible });
  const create = trpc.pickups.create.useMutation({ onSuccess: async () => { setAddress(""); setContactName(""); setNotes(""); setFeedback("Pickup registrado."); await pickups.refetch(); }, onError: (error) => setFeedback(error.message) });
  const updateStatus = trpc.pickups.updateStatus.useMutation({ onSuccess: async () => { setFeedback("Estado de pickup actualizado y auditado."); await pickups.refetch(); }, onError: (error) => setFeedback(error.message) });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Recepción y operación de recogidas</CardTitle><p className="text-sm text-slate-500">Registra solicitudes y avanza únicamente las transiciones válidas.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Contacto" aria-label="Contacto pickup" className="border-slate-200" /><Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Dirección de recogida" aria-label="Dirección pickup" className="border-slate-200" /><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas operativas" aria-label="Notas pickup" className="min-h-10 border-slate-200" /><Button disabled={address.length < 5 || contactName.length < 2 || create.isPending} onClick={() => create.mutate({ address, contactName, notes })} className="bg-orange-500 text-white hover:bg-orange-400">Registrar</Button></div><div className="mt-4 grid gap-3 md:grid-cols-2"><Input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="URL de evidencia (opcional)" aria-label="URL de evidencia pickup" className="border-slate-200" /><Input value={failureReason} onChange={(event) => setFailureReason(event.target.value)} placeholder="Motivo si el pickup falla" aria-label="Motivo de fallo pickup" className="border-slate-200" /></div><div className="mt-5 space-y-2">{pickups.data?.slice(0, 10).map((pickup) => <div key={pickup.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{pickup.contactName}</p><p className="text-xs text-slate-500">{pickup.address} · #{pickup.id}</p></div><span className="text-xs font-semibold text-orange-600">{pickup.status}</span></div>{nextStatuses[pickup.status] && <div className="mt-3 flex flex-wrap gap-2">{nextStatuses[pickup.status].map((next) => <Button key={next.value} size="sm" variant="outline" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ pickupId: pickup.id, status: next.value, evidenceUrl: evidenceUrl || undefined, failureReason: next.value === "failed" ? failureReason || undefined : undefined })}>{next.label}</Button>)}</div>}</div>)}{!pickups.isLoading && !pickups.data?.length && <p className="text-sm text-slate-500">No hay pickups registrados para esta organización.</p>}</div>{feedback && <p role="status" className="mt-3 text-sm text-slate-600">{feedback}</p>}</CardContent></Card>;
}
