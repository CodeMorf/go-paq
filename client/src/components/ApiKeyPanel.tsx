import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const scopeOptions = [
  { value: "quotes:read", label: "Cotizar", description: "POST /api/v1/quotes" },
  { value: "shipments:read", label: "Consultar envíos", description: "Lectura de envíos" },
  { value: "shipments:write", label: "Crear envíos", description: "POST /api/v1/shipments" },
  { value: "tracking:read", label: "Consultar tracking", description: "GET /api/v1/tracking/:trackingCode" },
  { value: "pickups:write", label: "Crear pickups", description: "POST /api/v1/pickups" },
  { value: "webhooks:read", label: "Webhooks", description: "Preparado para eventos firmados" },
] as const;

type ApiScope = (typeof scopeOptions)[number]["value"];

export default function ApiKeyPanel({ visible }: { visible: boolean }) {
  const [name, setName] = useState("Integración GoPaq");
  const [newSecret, setNewSecret] = useState("");
  const [feedback, setFeedback] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["quotes:read", "tracking:read"]);
  const keys = trpc.apiKeys.list.useQuery(undefined, { enabled: visible });
  const issue = trpc.apiKeys.issue.useMutation({ onSuccess: (data) => { setNewSecret(data.secret); setFeedback("Clave emitida. Copia el secreto ahora: se muestra una sola vez."); void keys.refetch(); }, onError: (error) => setFeedback(error.message) });
  const revoke = trpc.apiKeys.revoke.useMutation({ onSuccess: () => { setFeedback("Clave revocada."); void keys.refetch(); }, onError: (error) => setFeedback(error.message) });
  if (!visible) return null;

  const toggleScope = (scope: ApiScope) => setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]);
  const submit = () => {
    if (name.trim().length < 2) { setFeedback("Indica un nombre para la clave."); return; }
    if (!scopes.length) { setFeedback("Selecciona al menos un scope."); return; }
    setNewSecret("");
    issue.mutate({ name: name.trim(), scopes });
  };

  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Claves API</CardTitle><p className="text-sm text-slate-500">Emite credenciales para integraciones externas con scopes mínimos y revocación auditable.</p></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-[1fr_auto]"><Input aria-label="Nombre de clave API" value={name} onChange={(event) => setName(event.target.value)} className="border-slate-200" /><Button onClick={submit} disabled={issue.isPending} className="bg-orange-500 text-white hover:bg-orange-400">{issue.isPending ? "Emitiendo…" : "Emitir clave"}</Button></div><fieldset className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"><legend className="mb-2 text-sm font-semibold text-slate-700">Scopes permitidos</legend>{scopeOptions.map((option) => <label key={option.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 has-[:checked]:border-orange-200 has-[:checked]:bg-orange-50"><input type="checkbox" checked={scopes.includes(option.value)} onChange={() => toggleScope(option.value)} className="mt-1 h-4 w-4 accent-orange-500" /><span><span className="block text-sm font-semibold text-slate-800">{option.label}</span><span className="block text-xs text-slate-500">{option.description}</span></span></label>)}</fieldset>{newSecret && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900"><strong>Secreto de una sola vista:</strong><code className="ml-2 break-all">{newSecret}</code></div>}{feedback && <p className="mt-3 text-sm text-slate-600" role="status">{feedback}</p>}<div className="mt-5 space-y-2">{keys.data?.map((key) => <div key={key.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{key.name}</p><p className="text-xs text-slate-500">{key.keyPrefix} · scopes: {key.scopes}</p></div>{key.revokedAt ? <span className="text-xs font-semibold text-red-600">Revocada</span> : <Button variant="outline" className="border-red-200 text-red-700" onClick={() => revoke.mutate({ id: key.id })} disabled={revoke.isPending}>Revocar</Button>}</div>)}</div></CardContent></Card>;
}
