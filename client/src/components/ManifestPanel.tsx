import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, PackageCheck, Plus, Send, Truck } from "lucide-react";

const nextStatus: Record<string, "sealed" | "in_transit" | "received" | "reconciled" | undefined> = {
  open: "sealed",
  sealed: "in_transit",
  in_transit: "received",
  received: "reconciled",
};

const statusLabel: Record<string, string> = {
  open: "Aperto",
  sealed: "Sigillato",
  in_transit: "In transito",
  received: "Ricevuto",
  reconciled: "Riconciliato",
};

export default function ManifestPanel({ visible }: { visible: boolean }) {
  const [direction, setDirection] = useState<"outbound" | "inbound" | "transfer">("outbound");
  const utils = trpc.useUtils();
  const manifests = trpc.manifests.list.useQuery(undefined, { enabled: visible });
  const create = trpc.manifests.create.useMutation({ onSuccess: () => utils.manifests.list.invalidate() });
  const advance = trpc.manifests.advance.useMutation({ onSuccess: () => utils.manifests.list.invalidate() });

  if (!visible) return null;
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-orange-500" /> Manifest operativi</CardTitle><p className="mt-1 text-sm text-slate-500">Abrir, sigilla e riconcilia i trasferimenti di filiale.</p></div>
        <div className="flex items-center gap-2"><select aria-label="Direzione manifest" value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"><option value="outbound">Partenza</option><option value="inbound">Arrivo</option><option value="transfer">Trasferimento</option></select><Button size="sm" className="bg-orange-500 text-white hover:bg-orange-400" disabled={create.isPending} onClick={() => create.mutate({ direction })}><Plus className="mr-1 h-4 w-4" />Abrir</Button></div>
      </CardHeader>
      <CardContent className="space-y-3">
        {manifests.isLoading && <p className="text-sm text-slate-500">Cargando manifest…</p>}
        {!manifests.isLoading && !manifests.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">Nessun manifest operativo ancora aperto.</div>}
        {manifests.data?.map((manifest) => { const next = nextStatus[manifest.status]; return <div key={manifest.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="rounded-xl bg-white p-2 text-orange-500 shadow-sm">{manifest.direction === "outbound" ? <Send className="h-4 w-4" /> : manifest.direction === "transfer" ? <Truck className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{manifest.code}</p><p className="text-xs text-slate-500">{manifest.direction === "outbound" ? "Partenza" : manifest.direction === "inbound" ? "Arrivo" : "Trasferimento"} · {new Date(manifest.createdAt).toLocaleString()}</p></div></div><div className="flex items-center justify-between gap-3 sm:justify-end"><Badge className="border-slate-200 bg-white text-slate-600">{statusLabel[manifest.status]}</Badge>{next && <Button size="sm" variant="outline" className="border-slate-200 bg-white" disabled={advance.isPending} onClick={() => advance.mutate({ manifestId: manifest.id, nextStatus: next })}>{next === "sealed" ? "Sigilla" : next === "in_transit" ? "Invia" : next === "received" ? "Ricevi" : "Riconcilia"}</Button>}</div></div>; })}
      </CardContent>
    </Card>
  );
}
