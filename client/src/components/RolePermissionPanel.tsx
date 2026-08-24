import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, LockKeyhole, Plus, Trash2 } from "lucide-react";

const roles = ["owner", "manager", "support", "finance", "supervisor", "warehouse", "dispatcher", "driver", "customer"] as const;
const actions = ["view", "create", "edit", "approve", "assign", "collect", "refund", "export", "configure"] as const;

export default function RolePermissionPanel({ visible }: { visible: boolean }) {
  const permissions = trpc.permissions.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const [role, setRole] = useState<(typeof roles)[number]>("support");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState<(typeof actions)[number]>("view");
  const [message, setMessage] = useState("");
  const grant = trpc.permissions.grant.useMutation({
    onSuccess: () => { setMessage("Permiso guardado."); setResource(""); void utils.permissions.list.invalidate(); },
    onError: (error) => setMessage(error.message || "No se pudo guardar el permiso."),
  });
  const revoke = trpc.permissions.revoke.useMutation({
    onSuccess: () => { setMessage("Permiso revocado."); void utils.permissions.list.invalidate(); },
    onError: (error) => setMessage(error.message || "No se pudo revocar el permiso."),
  });

  if (!visible) return null;
  const submit = () => {
    if (!resource.trim()) { setMessage("Indica el recurso al que aplica el permiso."); return; }
    setMessage("");
    grant.mutate({ role, resource: resource.trim(), action });
  };

  return (
    <Card className="mb-6 border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-gopaq-accent" /> Permisos por rol y acción</CardTitle>
        <p className="text-sm text-muted-foreground">Controla qué puede ver, crear, aprobar, cobrar, reembolsar, exportar o configurar cada rol.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 rounded-2xl border border-border bg-muted/40 p-4 md:grid-cols-[1fr_1.2fr_1fr_auto] md:items-end">
          <label className="text-xs font-semibold text-muted-foreground">Rol<select aria-label="Rol del permiso" value={role} onChange={(event) => setRole(event.target.value as (typeof roles)[number])} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground">{roles.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted-foreground">Recurso<input aria-label="Recurso del permiso" value={resource} onChange={(event) => setResource(event.target.value)} placeholder="shipments, cash, organization…" className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground" /></label>
          <label className="text-xs font-semibold text-muted-foreground">Acción<select aria-label="Acción del permiso" value={action} onChange={(event) => setAction(event.target.value as (typeof actions)[number])} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground">{actions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <Button className="bg-gopaq-navy text-white hover:bg-gopaq-blue" disabled={grant.isPending} onClick={submit}><Plus className="mr-2 h-4 w-4" />Conceder</Button>
        </div>
        {permissions.isLoading && <p className="mt-4 text-sm text-muted-foreground">Cargando permisos…</p>}
        {permissions.isError && <p role="alert" className="mt-4 text-sm text-destructive">No se pudieron cargar los permisos de la organización.</p>}
        {!permissions.isLoading && !permissions.isError && permissions.data?.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No hay permisos personalizados registrados.</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permissions.data?.map((permission) => <div key={permission.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{permission.role} · {permission.resource}</p><Badge className="mt-1 border-gopaq-success-line/30 bg-gopaq-success/10 text-gopaq-success"><Check className="mr-1 h-3 w-3" />{permission.action}</Badge></div><Button aria-label={`Revocar ${permission.role} ${permission.resource} ${permission.action}`} size="icon" variant="ghost" className="shrink-0 text-destructive hover:bg-destructive/10" disabled={revoke.isPending} onClick={() => revoke.mutate({ permissionId: permission.id })}><Trash2 className="h-4 w-4" /></Button></div>)}
        </div>
        {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
