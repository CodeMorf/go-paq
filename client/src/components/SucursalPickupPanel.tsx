import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SucursalPickupPanel({ visible }: { visible: boolean }) {
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const pickups = trpc.pickups.list.useQuery(undefined, { enabled: visible });
  const create = trpc.pickups.create.useMutation({ onSuccess: () => { setAddress(""); setContactName(""); setNotes(""); pickups.refetch(); } });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Recepción de recogidas</CardTitle><p className="text-sm text-slate-500">Registrar il ritiro e mantieni la filiale sincronizzata.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Contatto" aria-label="Contatto pickup" className="border-slate-200" /><Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Indirizzo di ritiro" aria-label="Indirizzo pickup" className="border-slate-200" /><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas operativas" aria-label="Note pickup" className="min-h-10 border-slate-200" /><Button disabled={address.length < 5 || contactName.length < 2 || create.isPending} onClick={() => create.mutate({ address, contactName, notes })} className="bg-orange-500 text-white hover:bg-orange-400">Registrar</Button></div><div className="mt-5 space-y-2">{pickups.data?.slice(0, 5).map((pickup) => <div key={pickup.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><div><p className="font-semibold">{pickup.contactName}</p><p className="text-xs text-slate-500">{pickup.address}</p></div><span className="text-xs font-semibold text-orange-600">{pickup.status}</span></div>)}</div></CardContent></Card>;
}
