import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy } from "lucide-react";

const statusLabels: Record<string, string> = { open: "Abierto", in_progress: "En gestión", waiting_customer: "Esperando cliente", resolved: "Resuelto", closed: "Cerrado" };
const categories: Record<string, string> = { shipment: "Envío", billing: "Facturación", pickup: "Pickup", delivery: "Entrega", account: "Cuenta", other: "Otro" };

export default function SupportTicketAdminPanel({ visible }: { visible: boolean }) {
  const tickets = trpc.customer.tickets.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const [message, setMessage] = useState("");
  const manage = trpc.customer.tickets.manage.useMutation({ onSuccess: async () => { setMessage("Ticket actualizado."); await utils.customer.tickets.invalidate(); }, onError: (error) => setMessage(error.message) });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-gopaq-accent" /> Soporte de clientes</CardTitle><p className="text-sm text-gopaq-faint">Vista tenant-scoped. Solo aparecen casos accesibles con el permiso de soporte de tu membresía.</p></CardHeader><CardContent>{tickets.isLoading && <p className="text-sm text-gopaq-faint">Cargando tickets…</p>}{tickets.error && <p role="alert" className="text-sm text-gopaq-danger">No se pudieron cargar los tickets: {tickets.error.message}</p>}{!tickets.isLoading && !tickets.error && !tickets.data?.length && <p className="rounded-xl border border-dashed border-gopaq-line p-4 text-sm text-gopaq-faint">No hay tickets registrados.</p>}<div className="space-y-3">{tickets.data?.map((ticket) => <div key={ticket.id} className="rounded-2xl border border-gopaq-line bg-muted p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">#{ticket.id} · {ticket.subject}</p><Badge className="bg-gopaq-accent-soft text-gopaq-accent">{statusLabels[ticket.status]}</Badge></div><p className="mt-2 text-sm text-gopaq-faint">{categories[ticket.category]} · Cliente #{ticket.userId}{ticket.shipmentId ? ` · Envío #${ticket.shipmentId}` : ""}</p><p className="mt-2 text-sm leading-6 text-foreground">{ticket.description}</p>{ticket.resolution && <p className="mt-2 rounded-xl bg-white p-3 text-sm text-gopaq-faint">Resolución: {ticket.resolution}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><Select value={ticket.status} onValueChange={(value) => manage.mutate({ ticketId: ticket.id, status: value as "open" | "in_progress" | "waiting_customer" | "resolved" | "closed" })} disabled={manage.isPending}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div></div>)}</div>{message && <p role="status" className="mt-4 text-sm text-gopaq-faint">{message}</p>}</CardContent></Card>;
}
