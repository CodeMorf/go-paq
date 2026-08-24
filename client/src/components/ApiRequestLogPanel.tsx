import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ApiRequestLogPanel({ visible }: { visible: boolean }) {
  const [statusCode, setStatusCode] = useState("");
  const [route, setRoute] = useState("");
  const filters = { statusCode: statusCode ? Number(statusCode) : undefined, route: route.trim() || undefined };
  const query = trpc.apiLogs.list.useQuery(filters, { enabled: visible, retry: false });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm">
    <CardHeader><CardTitle>Registro de API</CardTitle><p className="text-sm text-gopaq-faint">Solicitudes recientes de tu organización; nunca se muestran cuerpos ni secretos.</p></CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="api-log-status">Status HTTP</Label><Input id="api-log-status" inputMode="numeric" placeholder="Ej. 429" value={statusCode} onChange={(event) => setStatusCode(event.target.value.replace(/[^0-9]/g, ""))} /></div>
        <div><Label htmlFor="api-log-route">Ruta exacta</Label><Input id="api-log-route" placeholder="/api/v1/shipments" value={route} onChange={(event) => setRoute(event.target.value)} /></div>
      </div>
      {query.isLoading && <p className="rounded-xl bg-muted p-4 text-sm text-gopaq-faint">Cargando registros…</p>}
      {query.isError && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">No se pudo consultar el registro. Revisa el permiso de auditoría.</p>}
      {!query.isLoading && !query.isError && query.data?.length === 0 && <p className="rounded-xl border border-dashed border-gopaq-line bg-muted p-4 text-sm text-gopaq-faint">Todavía no existen solicitudes registradas para los filtros actuales.</p>}
      {!!query.data?.length && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-gopaq-line text-xs uppercase tracking-wide text-gopaq-faint"><th className="px-3 py-2">Hora</th><th className="px-3 py-2">Request ID</th><th className="px-3 py-2">Ruta</th><th className="px-3 py-2">Resultado</th></tr></thead><tbody>{query.data.map((log) => <tr key={log.id} className="border-b border-gopaq-line/70"><td className="whitespace-nowrap px-3 py-3 text-gopaq-faint">{new Date(log.createdAt).toLocaleString("es-DO")}</td><td className="max-w-[180px] truncate px-3 py-3 font-mono text-xs">{log.requestId}</td><td className="px-3 py-3"><span className="font-medium">{log.method}</span> <span className="text-gopaq-faint">{log.route}</span></td><td className="px-3 py-3"><Badge className={log.success ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>{log.statusCode ?? "—"} · {log.success ? "OK" : "Error"}</Badge></td></tr>)}</tbody></table></div>}
    </CardContent>
  </Card>;
}
