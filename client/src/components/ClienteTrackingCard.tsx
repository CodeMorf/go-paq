import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ClienteTrackingCard({ visible }: { visible: boolean }) {
  const [code, setCode] = useState("");
  const tracking = trpc.tracking.publicByCode.useQuery({ code }, { enabled: visible && code.length >= 6 });
  if (!visible) return null;
  return <Card className="mb-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Traccia una spedizione</CardTitle><p className="text-sm text-slate-500">Inserisci il numero di guida per verificare lo stato pubblico.</p></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Numero di guida" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="GPQ-240823-0184" className="border-slate-200" /><Button className="bg-orange-500 text-white hover:bg-orange-400">Cerca</Button></div>{code.length >= 6 && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-900">{tracking.data?.trackingCode ?? code}</p><p className="mt-1 text-slate-500">{tracking.data?.message ?? (tracking.isLoading ? "Verifica in corso…" : "Nessun evento pubblico disponibile.")}</p></div>}</CardContent></Card>;
}
