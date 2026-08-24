import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CirclePlay, MapPin, ScanLine, Square } from "lucide-react";

const routeLabels: Record<string, string> = { draft: "Borrador", assigned: "Asignada", active: "En turno", closed: "Cerrada" };
const stopLabels = { pending: "Pendiente", arrived: "En punto", completed: "Completada", failed: "Fallida", skipped: "Omitida" } as const;

type StopStatus = keyof typeof stopLabels;

export default function DriverRoutePanel({ visible }: { visible: boolean }) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | undefined>();
  const [stopStatus, setStopStatus] = useState<Record<number, StopStatus>>({});
  const [barcodeValue, setBarcodeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const routes = trpc.routes.myAssigned.useQuery(undefined, { enabled: visible });
  const stopInput = useMemo(() => ({ routeId: selectedRouteId ?? 0 }), [selectedRouteId]);
  const stops = trpc.routes.myStops.useQuery(stopInput, { enabled: visible && Boolean(selectedRouteId) });
  const utils = trpc.useUtils();
  const routeStatus = trpc.routes.myStatus.useMutation({ onSuccess: async (route) => { setFeedback(`Ruta ${route.code}: ${routeLabels[route.status]}.`); await utils.routes.myAssigned.invalidate(); await utils.routes.myStops.invalidate(); }, onError: (error) => setFeedback(error.message) });
  const updateStop = trpc.routes.stopsUpdate.useMutation({ onSuccess: async () => { setFeedback("Estado de parada actualizado."); await utils.routes.myStops.invalidate(); }, onError: (error) => setFeedback(error.message) });
  const scan = trpc.routes.scan.useMutation({ onSuccess: (pkg) => { setFeedback(`Carga validada: ${pkg.packageCode}.`); setBarcodeValue(""); }, onError: (error) => setFeedback(error.message) });

  if (!visible) return null;
  const selectedRoute = routes.data?.find((route) => route.id === selectedRouteId);
  const saveStop = (stopId: number) => { const status = stopStatus[stopId]; if (!status) { setFeedback("Selecciona un estado antes de guardar."); return; } updateStop.mutate({ stopId, status }); };
  const submitScan = (event: React.FormEvent) => { event.preventDefault(); if (!selectedRouteId) { setFeedback("Selecciona una ruta asignada antes de escanear."); return; } if (barcodeValue.trim().length < 3) { setFeedback("Introduce el código leído por el escáner."); return; } scan.mutate({ barcodeValue: barcodeValue.trim(), routeId: selectedRouteId }); };

  return <Card className="mb-6 border-0 bg-gopaq-navy text-white shadow-sm">
    <CardHeader><CardTitle>Mi turno y ruta asignada</CardTitle><p className="text-sm text-gopaq-muted">Solo aparecen rutas asignadas a tu usuario. El servidor valida cada escaneo y cada cambio de parada.</p></CardHeader>
    <CardContent className="space-y-4">
      {routes.isLoading && <p className="text-sm text-gopaq-muted">Cargando rutas asignadas…</p>}
      {routes.error && <p role="alert" className="text-sm text-gopaq-danger">No se pudieron cargar tus rutas: {routes.error.message}</p>}
      {!routes.isLoading && !routes.error && !routes.data?.length && <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 text-sm text-gopaq-muted">Todavía no tienes una ruta asignada. Solicita asignación a la sucursal.</div>}
      <div className="grid gap-2">{routes.data?.map((route) => <button key={route.id} type="button" onClick={() => { setSelectedRouteId(route.id); setFeedback(""); }} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${selectedRouteId === route.id ? "border-gopaq-accent bg-gopaq-accent/15" : "border-white/10 bg-white/[.04] hover:border-gopaq-accent-line"}`}><span><strong className="block text-sm">{route.code}</strong><span className="text-xs text-gopaq-muted">{routeLabels[route.status]} · {route.vehicleLabel || "Vehículo pendiente"}{route.startedAt ? ` · Inicio ${new Date(route.startedAt).toLocaleTimeString()}` : ""}</span></span><span className="text-xs font-semibold text-gopaq-accent">{selectedRouteId === route.id ? "Seleccionada" : "Abrir ruta"}</span></button>)}</div>
      {selectedRoute && <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-gopaq-accent">Ruta activa</p><p className="mt-1 font-bold">{selectedRoute.code} · {routeLabels[selectedRoute.status]}</p></div><div className="flex gap-2">{selectedRoute.status === "assigned" && <Button size="sm" className="bg-gopaq-accent text-white hover:bg-gopaq-accent-hover" onClick={() => routeStatus.mutate({ routeId: selectedRoute.id, nextStatus: "active" })} disabled={routeStatus.isPending}><CirclePlay className="mr-2 h-4 w-4" />Iniciar turno</Button>}{selectedRoute.status === "active" && <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => routeStatus.mutate({ routeId: selectedRoute.id, nextStatus: "closed" })} disabled={routeStatus.isPending}><Square className="mr-2 h-4 w-4" />Cerrar turno</Button>}</div></div>
        <form onSubmit={submitScan} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><div><Label htmlFor="driver-route-barcode" className="text-white">Escanear carga</Label><Input id="driver-route-barcode" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} maxLength={120} placeholder="Código QR o de barras" className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-gopaq-muted" /></div><Button type="submit" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" disabled={scan.isPending}><ScanLine className="mr-2 h-4 w-4" />{scan.isPending ? "Validando…" : "Validar carga"}</Button></form>
        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-gopaq-accent">Paradas ordenadas</p>{stops.isLoading && <p className="text-sm text-gopaq-muted">Cargando paradas…</p>}{stops.error && <p role="alert" className="text-sm text-gopaq-danger">No se pudieron cargar las paradas: {stops.error.message}</p>}{!stops.isLoading && !stops.error && !stops.data?.length && <p className="rounded-xl border border-white/10 p-3 text-sm text-gopaq-muted">La ruta no tiene paradas asignadas.</p>}<div className="space-y-2">{stops.data?.map((stop) => <div key={stop.id} className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span><strong className="text-sm">{stop.sequence}. {stop.address}</strong><span className="ml-2 text-xs text-gopaq-muted">{stop.shipmentId ? `Envío #${stop.shipmentId}` : `Pickup #${stop.pickupId}`}</span></span><div className="flex items-center gap-2"><Select value={stopStatus[stop.id] || "current"} onValueChange={(value) => setStopStatus((current) => ({ ...current, [stop.id]: value as StopStatus }))}><SelectTrigger className="w-36 border-white/10 bg-white/10 text-white"><SelectValue placeholder={stopLabels[stop.status]} /></SelectTrigger><SelectContent><SelectItem value="current">{stopLabels[stop.status]}</SelectItem>{Object.entries(stopLabels).filter(([key]) => key !== stop.status).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => saveStop(stop.id)} disabled={updateStop.isPending}>Guardar</Button></div></div>{stop.latitude && stop.longitude && <a className="mt-2 inline-flex items-center gap-1 text-xs text-gopaq-accent hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.latitude},${stop.longitude}`)}`} target="_blank" rel="noreferrer"><MapPin className="h-3 w-3" />Abrir ubicación</a>}</div>)}</div></div>
      </div>}
      {feedback && <p role="status" className="text-sm text-gopaq-muted">{feedback}</p>}
    </CardContent>
  </Card>;
}
