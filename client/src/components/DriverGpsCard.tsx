import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enqueueDriverOperation, syncDriverOperations, type OfflineOperation, type OfflineSendResult } from "@/lib/offlineQueue";

type GpsPayload = { shipmentId?: number; routeId?: number; latitude: number; longitude: number; accuracyMeters?: number; capturedAt: string; source: "driver" };

export default function DriverGpsCard({ visible }: { visible: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [shipmentId, setShipmentId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [message, setMessage] = useState("GPS desactivado");
  const record = trpc.gps.record.useMutation();
  const filter = useMemo(() => ({ shipmentId: shipmentId ? Number(shipmentId) : undefined, routeId: routeId ? Number(routeId) : undefined }), [shipmentId, routeId]);
  const points = trpc.gps.points.useQuery(filter, { enabled: visible && Boolean(shipmentId || routeId), refetchInterval: enabled ? 15000 : false });
  const sendOperation = useCallback(async (operation: OfflineOperation): Promise<OfflineSendResult> => {
    if (operation.kind !== "gps") return { state: "rejected", reason: "Tipo de operación no compatible con GPS" };
    try {
      const payload = operation.payload as unknown as GpsPayload;
      await record.mutateAsync({ ...payload, capturedAt: new Date(payload.capturedAt) });
      return "synced";
    } catch (error) {
      const reason = error instanceof Error ? error.message : "El servidor rechazó el punto GPS";
      if (/permiso|válida|encontrad|organización|conflict/i.test(reason)) return { state: "conflict", reason };
      throw error;
    }
  }, [record]);
  const syncPending = useCallback(() => { if (visible && navigator.onLine) void syncDriverOperations(sendOperation); }, [sendOperation, visible]);
  useEffect(() => { if (!visible) return undefined; window.addEventListener("online", syncPending); syncPending(); return () => window.removeEventListener("online", syncPending); }, [syncPending, visible]);
  useEffect(() => {
    if (!visible || !enabled || (!filter.shipmentId && !filter.routeId) || !("geolocation" in navigator)) return undefined;
    setMessage("Solicitando ubicación…");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const capturedAt = new Date();
        const payload: GpsPayload = { ...filter, latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy, capturedAt: capturedAt.toISOString(), source: "driver" };
        const idempotencyKey = `gps-${filter.shipmentId ?? `route-${filter.routeId}`}-${capturedAt.getTime()}`;
        if (!navigator.onLine) {
          void enqueueDriverOperation({ idempotencyKey, kind: "gps", payload }).then(() => setMessage(`Sin conexión: posición guardada · ±${Math.round(position.coords.accuracy)} m`));
        } else {
          setMessage(`Posición actualizada · ±${Math.round(position.coords.accuracy)} m`);
          record.mutate({ ...payload, capturedAt: capturedAt });
        }
      },
      () => setMessage("No se pudo obtener la ubicación"),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [visible, enabled, filter, record]);
  if (!visible) return null;
  const toggle = () => { if (!enabled && !filter.shipmentId && !filter.routeId) { setMessage("Indica un ID de envío o ruta antes de activar el GPS"); return; } setEnabled((value) => !value); };
  return <Card className="mb-6 border-0 bg-[#071a2e] text-white shadow-sm"><CardHeader><CardTitle>GPS del turno</CardTitle><p className="text-sm text-slate-400">La posición solo se recoge durante el turno y siempre queda vinculada a un envío o ruta de tu organización. Sin red, se conserva cifrada para sincronizar después.</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="gps-shipment" className="text-slate-300">ID de envío (opcional)</Label><Input id="gps-shipment" type="number" min="1" value={shipmentId} onChange={(event) => { setShipmentId(event.target.value); if (event.target.value) setRouteId(""); }} className="border-white/10 bg-white/10 text-white" /></div><div><Label htmlFor="gps-route" className="text-slate-300">ID de ruta (opcional)</Label><Input id="gps-route" type="number" min="1" value={routeId} onChange={(event) => { setRouteId(event.target.value); if (event.target.value) setShipmentId(""); }} className="border-white/10 bg-white/10 text-white" /></div></div><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-orange-300">{message}</p><p className="mt-1 text-xs text-slate-500">Coordenadas limitadas a la referencia activa con timestamp UTC.</p>{points.data?.[0] && <p className="mt-2 text-xs text-slate-400">Última sincronización: {new Date(points.data[0].capturedAt).toLocaleString()} · ±{Math.round(Number(points.data[0].accuracyMeters ?? 0))} m</p>}</div><Button onClick={toggle} className={enabled ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-orange-500 text-white hover:bg-orange-400"}>{enabled ? "Desactivar GPS" : "Activar GPS"}</Button></div></CardContent></Card>;
}
