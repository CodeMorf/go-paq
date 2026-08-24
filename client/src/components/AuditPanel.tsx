import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditPanel({ visible }: { visible: boolean }) {
  const audit = trpc.audit.list.useQuery(undefined, { enabled: visible });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Audit operativo</CardTitle><p className="text-sm text-slate-500">Eventi recenti isolati per organizzazione e non modificabili dall’interfaccia.</p></CardHeader><CardContent className="space-y-2">{audit.data?.length ? audit.data.slice(0, 8).map((event) => <div key={event.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold">{event.action}</p><p className="text-xs text-slate-500">{event.category} · {event.resourceType || "sistema"}</p></div><time className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</time></div>) : <p className="text-sm text-slate-500">Nessun evento audit disponibile.</p>}</CardContent></Card>;
}
