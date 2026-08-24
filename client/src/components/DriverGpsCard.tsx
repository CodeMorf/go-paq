import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enqueueDriverOperation, syncDriverOperations, type OfflineOperation, type OfflineSendResult } from "@/lib/offlineQueue";

type GpsPayload = { routeId: number; latitude: number; longitude: number; accuracyMeters?: number; capturedAt: string; source: "driver" };

export default function DriverGpsCard({ visible }: { visible: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [routeId, setRouteId] = useState("");
  const [message, setMessage] = useState("GPS desactivado");
  const assignedRoutes = trpc.routes.myAssigned.useQuery(undefined, { enabled: visible });
  const selectedRouteId = routeId ? Number(routeId) : undefined;
  const selectedRoute = assignedRoutes.data?.find((route) => route.id === selectedRouteId);
  const routeIsActive = selectedRoute?.status === "active";
  const record = trpc.gps.record.useMutation();
  const filter = useMemo(() => ({ routeId: selectedRouteId }), [selectedRouteId]);
  const points = trpc.gps.points.useQuery(filter, { enabled: visible && routeIsActive && Boolean(selectedRouteId), refetchInterval: enabled ? 15000 : false });
  const utils = trpc.useUtils();
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
  useEffect(() => { if (enabled && !routeIsActive) { setEnabled(false); setMessage("GPS detenido: el turno seleccionado ya no está activo."); } }, [enabled, routeIsActive]);
  useEffect(() => {
    if (!visible || !enabled || !routeIsActive || !selectedRouteId || !("geolocation" in navigator)) return undefined;
    setMessage("Solicitando ubicación…");
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const capturedAt = new Date();
        const payload: GpsPayload = { routeId: selectedRouteId, latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy, capturedAt: capturedAt.toISOString(), source: "driver" };
        const idempotencyKey = `gps-route-${selectedRouteId}-${capturedAt.getTime()}`;
        if (!navigator.onLine) {
          void enqueueDriverOperation({ idempotencyKey, kind: "gps", payload }).then(() => setMessage(`Sin conexión: posición guardada · ±${Math.round(position.coords.accuracy)} m`)).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "No se pudo guardar la posición offline"));
        } else {
          setMessage(`Posición actualizada · ±${Math.round(position.coords.accuracy)} m`);
          record.mutate({ ...payload, capturedAt });
        }
      },
      () => setMessage("No se pudo obtener la ubicación"),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [visible, enabled, routeIsActive, selectedRouteId, record]);
  if (!visible) return null;
  const toggle = () => { if (!routeIsActive || !selectedRouteId) { setMessage("Selecciona una ruta asignada y activa tu turno antes de encender el GPS."); return; } setEnabled((value) => !value); };
  return <Card className="mb-6 border-0 bg-[#071a2e] text-white shadow-sm"><CardHeader><CardTitle>GPS del turno</CardTitle><p className="text-sm text-slate-400">La posición solo se recoge durante un turno activo y queda vinculada a la ruta asignada. Sin red, se conserva cifrada para sincronizar después.</p></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="gps-route" className="text-slate-300">Ruta activa</Label><Select value={routeId || "none"} onValueChange={(value) => { setRouteId(value === "none" ? "" : value); if (enabled) setEnabled(false); }}><SelectTrigger id="gps-route" className="mt-1 border-white/10 bg-white/10 text-white"><SelectValue placeholder="Selecciona una ruta" /></SelectTrigger><SelectContent><SelectItem value="none">Sin ruta seleccionada</SelectItem>{assignedRoutes.data?.map((route) => <SelectItem key={route.id} value={String(route.id)}>{route.code} · {route.status === "active" ? "Turno activo" : route.status}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-orange-300">{message}</p><p className="mt-1 text-xs text-slate-500">Consentimiento operativo: activar el control inicia la recolección; apagarlo detiene el watchPosition.</p>{points.data?.[0] && <p className="mt-2 text-xs text-slate-400">Última sincronización: {new Date(points.data[0].capturedAt).toLocaleString()} · ±{Math.round(Number(points.data[0].accuracyMeters ?? 0))} m</p>}</div><Button onClick={toggle} className={enabled ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-orange-500 text-white hover:bg-orange-400"}>{enabled ? "Desactivar GPS" : "Activar GPS"}</Button></div></CardContent></Card>;
}
