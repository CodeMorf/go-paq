import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Save, Users, Warehouse } from "lucide-react";

type ScopeValues = { branchId: string; warehouseId: string };

export default function MembershipScopePanel({ visible }: { visible: boolean }) {
  const memberships = trpc.memberships.list.useQuery(undefined, { enabled: visible });
  const branches = trpc.branches.list.useQuery(undefined, { enabled: visible });
  const warehouses = trpc.warehouses.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const [values, setValues] = useState<Record<number, ScopeValues>>({});
  const [message, setMessage] = useState("");
  const updateScope = trpc.memberships.updateScope.useMutation({
    onSuccess: () => {
      setMessage("Asignación operativa guardada.");
      void utils.memberships.list.invalidate();
    },
    onError: (error) => setMessage(error.message || "No se pudo guardar la asignación."),
  });

  useEffect(() => {
    if (!memberships.data) return;
    setValues((current) => {
      const next = { ...current };
      for (const item of memberships.data) {
        if (!next[item.membership.id]) {
          next[item.membership.id] = {
            branchId: item.membership.branchId ? String(item.membership.branchId) : "",
            warehouseId: item.membership.warehouseId ? String(item.membership.warehouseId) : "",
          };
        }
      }
      return next;
    });
  }, [memberships.data]);

  if (!visible) return null;
  const updateValue = (membershipId: number, key: keyof ScopeValues, value: string) => {
    setValues((current) => ({ ...current, [membershipId]: { ...current[membershipId], [key]: value } }));
    setMessage("");
  };
  const save = (membershipId: number) => {
    const selected = values[membershipId] ?? { branchId: "", warehouseId: "" };
    updateScope.mutate({ membershipId, branchId: selected.branchId ? Number(selected.branchId) : null, warehouseId: selected.warehouseId ? Number(selected.warehouseId) : null });
  };

  return (
    <Card className="mb-6 border-0 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-gopaq-accent" /> Usuarios y alcance operativo</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Cada asignación se valida dentro de la organización activa y queda auditada.</p>
          </div>
          <Badge variant="outline">Tenant-scoped</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {memberships.isLoading && <p className="text-sm text-muted-foreground">Cargando memberships…</p>}
        {memberships.isError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar los usuarios autorizados.</p>}
        {!memberships.isLoading && !memberships.isError && memberships.data?.length === 0 && <p className="text-sm text-muted-foreground">No hay memberships disponibles para esta organización.</p>}
        <div className="space-y-3">
          {memberships.data?.map((item) => {
            const selected = values[item.membership.id] ?? { branchId: "", warehouseId: "" };
            return (
              <div key={item.membership.id} className="grid gap-3 rounded-2xl border border-border bg-muted/40 p-4 lg:grid-cols-[1.2fr_.9fr_.9fr_auto] lg:items-end">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{item.user.name || "Usuario sin nombre"}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.user.email || "Sin correo"}</p>
                  <Badge className="mt-2 border-gopaq-accent-line/30 bg-gopaq-accent/10 text-gopaq-accent">{item.membership.role}</Badge>
                </div>
                <label className="text-xs font-semibold text-muted-foreground"><span className="mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Sucursal</span><select aria-label={`Sucursal de ${item.user.name || "usuario"}`} value={selected.branchId} onChange={(event) => updateValue(item.membership.id, "branchId", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"><option value="">Sin asignar</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} · {branch.name}</option>)}</select></label>
                <label className="text-xs font-semibold text-muted-foreground"><span className="mb-1 flex items-center gap-1"><Warehouse className="h-3.5 w-3.5" /> Almacén</span><select aria-label={`Almacén de ${item.user.name || "usuario"}`} value={selected.warehouseId} onChange={(event) => updateValue(item.membership.id, "warehouseId", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"><option value="">Sin asignar</option>{warehouses.data?.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></label>
                <Button className="bg-gopaq-navy text-white hover:bg-gopaq-blue" disabled={updateScope.isPending} onClick={() => save(item.membership.id)}><Save className="mr-2 h-4 w-4" />{updateScope.isPending ? "Guardando…" : "Guardar"}</Button>
              </div>
            );
          })}
        </div>
        {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
