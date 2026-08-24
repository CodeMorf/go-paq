import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ClienteRequestPanel({ visible }: { visible: boolean }) {
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const create = trpc.pickups.create.useMutation({ onSuccess: () => { setAddress(""); setContactName(""); setNotes(""); } });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Richiedi un ritiro</CardTitle><p className="text-sm text-slate-500">Invia una richiesta al team operativo; la conferma viene gestita dalla filiale.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Nome contatto" aria-label="Nome contatto" className="border-slate-200" /><Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Indirizzo di ritiro" aria-label="Indirizzo di ritiro" className="border-slate-200" /><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Note o contenuto" aria-label="Note richiesta" className="border-slate-200" /></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Nessun pagamento viene confermato in questa fase.</p><Button disabled={address.length < 5 || contactName.length < 2 || create.isPending} onClick={() => create.mutate({ address, contactName, notes })} className="bg-orange-500 text-white hover:bg-orange-400">Invia richiesta</Button></div></CardContent></Card>;
}
