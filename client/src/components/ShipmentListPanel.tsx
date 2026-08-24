import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShipmentListPanel({ visible }: { visible: boolean }) {
  const shipments = trpc.logistics.shipments.useQuery(undefined, { enabled: visible });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Envíos recenti</CardTitle><p className="text-sm text-slate-500">Elenco sincronizzato e isolato per organizzazione.</p></CardHeader><CardContent className="space-y-2">{shipments.data?.length ? shipments.data.slice(0, 8).map((shipment) => <div key={shipment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><strong className="block text-sm">{shipment.trackingCode}</strong><span className="text-xs text-slate-500">{shipment.originCountry} → {shipment.destinationCountry} · {shipment.serviceType}</span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{shipment.physicalStatus}</span></div>) : <p className="text-sm text-slate-500">Nessuna spedizione disponibile.</p>}</CardContent></Card>;
}
