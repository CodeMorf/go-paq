import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type OrganizationStatus = "trial" | "active" | "suspended";

export default function SuperAdminOrganizationPanel({ visible }: { visible: boolean }) {
  const organizations = trpc.superAdmin.organizations.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const [feedback, setFeedback] = useState("");
  const updateStatus = trpc.superAdmin.updateOrganizationStatus.useMutation({
    onSuccess: async (organization) => {
      setFeedback(organization ? `Estado actualizado: ${organization.name}.` : "Estado actualizado.");
      await utils.superAdmin.organizations.invalidate();
    },
    onError: (error) => setFeedback(error.message),
  });

  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm">
    <CardHeader>
      <CardTitle>Super Admin · organizaciones</CardTitle>
      <p className="text-sm text-slate-500">Vista global protegida por el rol administrativo de plataforma. Los cambios quedan auditados en la organización afectada.</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {organizations.isLoading && <p className="text-sm text-slate-500">Cargando organizaciones…</p>}
      {organizations.isError && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{organizations.error.message}</p>}
      {organizations.data?.length === 0 && <p className="text-sm text-slate-500">No hay organizaciones registradas.</p>}
      {organizations.data?.map((organization) => <div key={organization.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
        <div><strong className="block text-sm text-slate-900">{organization.name}</strong><span className="text-xs text-slate-500">{organization.slug} · {organization.country} · {organization.currency}</span></div>
        <div className="flex items-center gap-2"><Select value={organization.status} onValueChange={(status) => updateStatus.mutate({ organizationId: organization.id, status: status as OrganizationStatus })} disabled={updateStatus.isPending}><SelectTrigger className="w-36 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="trial">Prueba</SelectItem><SelectItem value="active">Activa</SelectItem><SelectItem value="suspended">Suspendida</SelectItem></SelectContent></Select><Button variant="outline" size="sm" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ organizationId: organization.id, status: organization.status as OrganizationStatus })}>Guardar</Button></div>
      </div>)}
      {feedback && <p role="status" className="text-sm text-slate-600">{feedback}</p>}
    </CardContent>
  </Card>;
}
