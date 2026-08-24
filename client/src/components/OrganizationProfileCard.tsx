import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe2, Settings2 } from "lucide-react";

export default function OrganizationProfileCard({ visible }: { visible: boolean }) {
  const { data, isLoading } = trpc.logistics.scope.useQuery(undefined, { enabled: visible });
  if (!visible) return null;
  const services = Array.isArray(data?.organization.activeServices) ? data.organization.activeServices : [];
  return <Card className="mb-6 border-0 bg-white shadow-sm"><CardHeader className="flex-row items-start justify-between"><div><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-orange-500" /> Profilo organizzazione</CardTitle><p className="mt-1 text-sm text-slate-500">Configurazione regionale applicata al tenant operativo.</p></div><Globe2 className="h-5 w-5 text-slate-300" /></CardHeader><CardContent>{isLoading ? <p className="text-sm text-slate-500">Caricamento configurazione…</p> : data ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs uppercase tracking-wide text-slate-400">Organizzazione</p><p className="mt-1 font-semibold text-slate-900">{data.organization.name}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Regione</p><p className="mt-1 font-semibold text-slate-900">{data.organization.country} · {data.organization.timezone}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Lingua e valuta</p><p className="mt-1 font-semibold text-slate-900">{data.organization.language.toUpperCase()} · {data.organization.currency}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Servizi attivi</p><div className="mt-1 flex flex-wrap gap-1">{services.length ? services.map((service) => <Badge key={String(service)} className="border-emerald-200 bg-emerald-50 text-emerald-700">{String(service)}</Badge>) : <span className="text-sm text-slate-500">Configurazione da completare</span>}</div></div></div> : <p className="text-sm text-slate-500">Nessuna organizzazione attiva associata.</p>}</CardContent></Card>;
}
