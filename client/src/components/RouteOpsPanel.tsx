import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RouteOpsPanel({ visible }: { visible: boolean }) {
  const [routeId, setRouteId] = useState<number | undefined>();
  const routes = trpc.routes.list.useQuery(undefined, { enabled: visible });
  const stops = trpc.routes.stops.useQuery({ routeId: routeId as number }, { enabled: visible && Boolean(routeId) });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Rotte e fermate</CardTitle><p className="text-sm text-slate-500">Pianificazione operativa sincronizzata per organizzazione.</p></CardHeader><CardContent><div className="grid gap-2">{routes.data?.slice(0, 6).map((route) => <button key={route.id} onClick={() => setRouteId(route.id)} className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${route.id === routeId ? "border-orange-300 bg-orange-50" : "border-slate-100 bg-slate-50 hover:border-orange-200"}`}><span><strong className="block text-sm">{route.code}</strong><span className="text-xs text-slate-500">{route.status} · {route.vehicleLabel || "Veicolo da assegnare"}</span></span><span className="text-xs font-semibold text-orange-600">Vedi fermate</span></button>)}</div>{routeId && <div className="mt-4 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-600">Fermate rotta #{routeId}</p><div className="space-y-2">{stops.data?.map((stop) => <div key={stop.id} className="flex justify-between rounded-lg bg-slate-50 p-2 text-xs"><span>{stop.sequence}. {stop.address}</span><span className="font-semibold text-slate-500">{stop.status}</span></div>)}</div></div>}</CardContent></Card>;
}
