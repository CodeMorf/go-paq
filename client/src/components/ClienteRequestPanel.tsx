import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function parseLocalDate(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function ClienteRequestPanel({ visible }: { visible: boolean }) {
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const create = trpc.pickups.create.useMutation({
    onSuccess: () => {
      setAddress("");
      setContactName("");
      setNotes("");
      setWindowStart("");
      setWindowEnd("");
    },
  });
  if (!visible) return null;

  const start = parseLocalDate(windowStart);
  const end = parseLocalDate(windowEnd);
  const invalidWindow = Boolean((windowStart && !start) || (windowEnd && !end) || (start && end && end <= start));
  const canSubmit = address.length >= 5 && contactName.length >= 2 && !invalidWindow && !create.isPending;

  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Solicita una recogida</CardTitle><p className="text-sm text-slate-500">Envía una solicitud al equipo operativo; puedes indicar una ventana horaria preferida.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Nombre de contacto" aria-label="Nombre de contacto" className="border-slate-200" /><Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Dirección de recogida" aria-label="Dirección de recogida" className="border-slate-200" /><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas o contenido" aria-label="Notas de la solicitud" /></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label htmlFor="pickup-window-start" className="mb-1 block text-xs font-semibold text-slate-600">Desde (opcional)</label><Input id="pickup-window-start" type="datetime-local" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} aria-label="Inicio de ventana horaria" className="border-slate-200" /></div><div><label htmlFor="pickup-window-end" className="mb-1 block text-xs font-semibold text-slate-600">Hasta (opcional)</label><Input id="pickup-window-end" type="datetime-local" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} aria-label="Fin de ventana horaria" className="border-slate-200" /></div></div><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className={`text-xs ${invalidWindow ? "text-red-600" : "text-slate-500"}`}>{invalidWindow ? "La hora final debe ser posterior a la hora inicial." : "La hora se enviará como fecha UTC al equipo operativo."}</p><Button disabled={!canSubmit} onClick={() => create.mutate({ address, contactName, notes: notes || undefined, windowStart: start, windowEnd: end })} className="bg-orange-500 text-white hover:bg-orange-400">{create.isPending ? "Enviando…" : "Enviar solicitud"}</Button></div></CardContent></Card>;
}
