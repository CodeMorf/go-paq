import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriverGpsCard({ visible }: { visible: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("GPS disattivato");
  const record = trpc.gps.record.useMutation();
  const points = trpc.gps.points.useQuery({}, { enabled: visible, refetchInterval: enabled ? 15000 : false });
  useEffect(() => {
    if (!visible || !enabled || !("geolocation" in navigator)) return;
    setMessage("Richiesta posizione…");
    const watchId = navigator.geolocation.watchPosition(
      (position) => { setMessage(`Posizione aggiornata · ±${Math.round(position.coords.accuracy)} m`); record.mutate({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy, capturedAt: new Date(), source: "driver" }); },
      () => setMessage("Impossibile ottenere la posizione"),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [visible, enabled]);
  if (!visible) return null;
  return <Card className="mb-6 border-0 bg-[#071a2e] text-white shadow-sm"><CardHeader><CardTitle>GPS del turno</CardTitle><p className="text-sm text-slate-400">La posizione viene raccolta solo quando abiliti il tracking per il turno attivo.</p></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-orange-300">{message}</p><p className="mt-1 text-xs text-slate-500">Coordinate inviate al backend con timestamp UTC.</p>{points.data?.[0] && <p className="mt-2 text-xs text-slate-400">Ultima sincronizzazione: {new Date(points.data[0].capturedAt).toLocaleString()} · ±{Math.round(Number(points.data[0].accuracyMeters ?? 0))} m</p>}</div><Button onClick={() => setEnabled((value) => !value)} className={enabled ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-orange-500 text-white hover:bg-orange-400"}>{enabled ? "Disattiva GPS" : "Abilita GPS"}</Button></CardContent></Card>;
}
