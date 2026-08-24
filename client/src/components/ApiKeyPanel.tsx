import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ApiKeyPanel({ visible }: { visible: boolean }) {
  const [name, setName] = useState("Integrazione GoPaq");
  const [newSecret, setNewSecret] = useState("");
  const keys = trpc.apiKeys.list.useQuery(undefined, { enabled: visible });
  const issue = trpc.apiKeys.issue.useMutation({ onSuccess: (data) => { setNewSecret(data.secret); keys.refetch(); } });
  const revoke = trpc.apiKeys.revoke.useMutation({ onSuccess: () => keys.refetch() });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Accessi API</CardTitle><p className="text-sm text-slate-500">Chiavi per partner e-commerce, scope limitati e revoca auditable.</p></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><Input aria-label="Nome chiave API" value={name} onChange={(event) => setName(event.target.value)} className="border-slate-200" /><Button onClick={() => issue.mutate({ name, scopes: ["quotes:read", "tracking:read"] })} className="bg-orange-500 text-white hover:bg-orange-400">Emetti chiave</Button></div>{newSecret && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900"><strong>Segreto mostrato una sola volta:</strong><code className="ml-2 break-all">{newSecret}</code></div>}<div className="mt-5 space-y-2">{keys.data?.map((key) => <div key={key.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{key.name}</p><p className="text-xs text-slate-500">{key.keyPrefix} · scope: {key.scopes}</p></div>{key.revokedAt ? <span className="text-xs font-semibold text-red-600">Revocata</span> : <Button variant="outline" className="border-red-200 text-red-700" onClick={() => revoke.mutate({ id: key.id })}>Revoca</Button>}</div>)}</div></CardContent></Card>;
}
