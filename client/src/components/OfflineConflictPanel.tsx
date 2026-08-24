import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPendingDriverOperations, resolveDriverConflict, type OfflineOperation } from "@/lib/offlineQueue";

const kindLabels: Record<OfflineOperation["kind"], string> = { scan: "Escaneo", status: "Cambio de estado", pod: "Prueba de entrega", expense: "Gasto" };

export default function OfflineConflictPanel({ visible }: { visible: boolean }) {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [feedback, setFeedback] = useState("");
  const refresh = useCallback(() => { if (visible) void listPendingDriverOperations().then(setOperations); }, [visible]);
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 15000); return () => window.clearInterval(timer); }, [refresh]);
  if (!visible || !operations.length) return null;

  const resolve = async (idempotencyKey: string, resolution: "retry" | "discard") => {
    const changed = await resolveDriverConflict(idempotencyKey, resolution);
    setFeedback(changed ? resolution === "retry" ? "Operación marcada para reintento." : "Operación descartada y conservada como rechazada." : "El conflicto ya no está disponible.");
    refresh();
  };

  return <Card className="mb-6 border-orange-200 bg-orange-50/60 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-orange-950"><AlertTriangle className="h-5 w-5 text-orange-600" />Revisión offline</CardTitle><p className="text-sm text-orange-900/80">Estas operaciones no se vuelven a ejecutar automáticamente. Revisa el motivo antes de reintentarlas.</p></CardHeader><CardContent className="space-y-3">{operations.map((operation) => <div key={operation.idempotencyKey} className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{kindLabels[operation.kind]} · {operation.state === "conflict" ? "Conflicto" : "Pendiente"}</p><p className="truncate text-xs text-slate-500">Clave: {operation.idempotencyKey} · intentos: {operation.attempts}</p>{operation.conflictReason && <p className="mt-1 text-sm text-orange-900">Motivo: {operation.conflictReason}</p>}{operation.lastError && <p className="mt-1 text-sm text-red-700">{operation.lastError}</p>}</div><div className="flex shrink-0 gap-2">{operation.state === "conflict" && <><Button size="sm" variant="outline" className="border-orange-300 text-orange-800" onClick={() => void resolve(operation.idempotencyKey, "retry")}><RefreshCw className="mr-1 h-4 w-4" />Reintentar</Button><Button size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => void resolve(operation.idempotencyKey, "discard")}>Descartar</Button></>}{operation.state === "pending" && <span className="inline-flex items-center text-xs text-slate-500"><RefreshCw className="mr-1 h-3 w-3" />Pendiente de sincronización</span>}</div></div>)}{feedback && <p className="flex items-center gap-2 text-sm text-orange-950" role="status"><CheckCircle2 className="h-4 w-4" />{feedback}</p>}</CardContent></Card>;
}
