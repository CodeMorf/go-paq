import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RouteOpsPanel({ visible }: { visible: boolean }) {
  const [routeId, setRouteId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState("none");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [driverForRoute, setDriverForRoute] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const routes = trpc.routes.list.useQuery(undefined, { enabled: visible });
  const branches = trpc.branches.list.useQuery(undefined, { enabled: visible });
  const drivers = trpc.routes.drivers.useQuery(undefined, { enabled: visible });
  const stops = trpc.routes.stops.useQuery({ routeId: routeId as number }, { enabled: visible && Boolean(routeId) });
  const utils = trpc.useUtils();
  const createRoute = trpc.routes.create.useMutation({
    onSuccess: async (route) => {
      setFeedback(`Ruta ${route.code} creada.`);
      setVehicleLabel("");
      setBranchId("none");
      await utils.routes.list.invalidate();
    },
    onError: (error) => setFeedback(error.message),
  });
  const assignRoute = trpc.routes.assign.useMutation({
    onSuccess: async (route) => {
      setFeedback(`Ruta ${route.code} asignada al conductor seleccionado.`);
      await utils.routes.list.invalidate();
    },
    onError: (error) => setFeedback(error.message),
  });

  if (!visible) return null;

  const submitRoute = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback("");
    createRoute.mutate({ branchId: branchId === "none" ? undefined : Number(branchId), vehicleLabel: vehicleLabel.trim() || undefined });
  };

  const assignSelected = () => {
    if (!routeId) return;
    const driverUserId = Number(driverForRoute[routeId]);
    if (!driverUserId) {
      setFeedback("Selecciona un conductor antes de asignar la ruta.");
      return;
    }
    setFeedback("");
    assignRoute.mutate({ routeId, driverUserId });
  };

  return (
    <Card className="mt-6 border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Rutas y paradas</CardTitle>
        <p className="text-sm text-slate-500">Crea recorridos y asigna conductores de la organización activa.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={submitRoute} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <Label htmlFor="route-branch">Sucursal de salida</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="route-branch" className="mt-1 bg-white"><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sucursal asignada</SelectItem>
                {branches.data?.map((branch) => <SelectItem key={branch.id} value={String(branch.id)}>{branch.name} · {branch.city}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="route-vehicle">Vehículo o referencia</Label><Input id="route-vehicle" value={vehicleLabel} onChange={(event) => setVehicleLabel(event.target.value)} maxLength={100} placeholder="Opcional" className="mt-1 bg-white" /></div>
          <Button type="submit" disabled={createRoute.isPending}>{createRoute.isPending ? "Creando…" : "Crear ruta"}</Button>
        </form>

        {feedback && <p className="text-sm text-slate-600" role="status">{feedback}</p>}
        {routes.isLoading && <p className="text-sm text-slate-500">Cargando rutas…</p>}
        {!routes.isLoading && !routes.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No hay rutas operativas registradas.</div>}
        <div className="grid gap-2">
          {routes.data?.slice(0, 20).map((route) => <button key={route.id} type="button" onClick={() => setRouteId(route.id)} className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${route.id === routeId ? "border-orange-300 bg-orange-50" : "border-slate-100 bg-slate-50 hover:border-orange-200"}`}>
            <span><strong className="block text-sm">{route.code}</strong><span className="text-xs text-slate-500">{route.status} · {route.vehicleLabel || "Vehículo por asignar"} · {route.driverUserId ? `Conductor #${route.driverUserId}` : "Sin conductor"}</span></span><span className="text-xs font-semibold text-orange-600">Ver paradas</span>
          </button>)}
        </div>

        {routeId && <div className="space-y-4 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-orange-50 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1"><Label htmlFor="route-driver">Conductor de la ruta #{routeId}</Label><Select value={driverForRoute[routeId] || "none"} onValueChange={(value) => setDriverForRoute((current) => ({ ...current, [routeId]: value }))}><SelectTrigger id="route-driver" className="mt-1 bg-white"><SelectValue placeholder="Selecciona un conductor" /></SelectTrigger><SelectContent><SelectItem value="none">Sin conductor</SelectItem>{drivers.data?.map((driver) => <SelectItem key={driver.userId} value={String(driver.userId)}>{driver.name || driver.email || `Usuario #${driver.userId}`}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={assignSelected} disabled={assignRoute.isPending || !drivers.data?.length}>{assignRoute.isPending ? "Asignando…" : "Asignar conductor"}</Button>
          </div>
          <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-600">Paradas de la ruta #{routeId}</p>{stops.isLoading && <p className="text-sm text-slate-500">Cargando paradas…</p>}{!stops.isLoading && !stops.data?.length && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No hay paradas registradas para esta ruta.</p>}<div className="space-y-2">{stops.data?.map((stop) => <div key={stop.id} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs"><span>{stop.sequence}. {stop.address}</span><span className="font-semibold text-slate-500">{stop.status}</span></div>)}</div></div>
        </div>}
      </CardContent>
    </Card>
  );
}
