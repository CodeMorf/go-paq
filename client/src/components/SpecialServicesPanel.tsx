import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const serviceLabels = { assisted_purchase: "Compra asistida", heavy_cargo: "Carga pesada", moving: "Mudanza" } as const;
const statusLabels = { requested: "Solicitado", quoted: "Cotizado", approved: "Aprobado", scheduled: "Programado", in_progress: "En curso", completed: "Completado", cancelled: "Cancelado" } as const;
type ServiceType = keyof typeof serviceLabels;

export default function SpecialServicesPanel({ visible, canManage = false }: { visible: boolean; canManage?: boolean }) {
  const [shipmentId, setShipmentId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("assisted_purchase");
  const [crewSize, setCrewSize] = useState("1");
  const [vehicleType, setVehicleType] = useState("");
  const [handlingNotes, setHandlingNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const services = trpc.services.list.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const create = trpc.services.create.useMutation({ onSuccess: async () => { setFeedback("Servicio especial solicitado."); setShipmentId(""); setHandlingNotes(""); setVehicleType(""); setCrewSize(serviceType === "moving" ? "2" : "1"); await utils.services.list.invalidate(); }, onError: (error) => setFeedback(error.message) });
  const update = trpc.services.update.useMutation({ onSuccess: async () => { setFeedback("Estado del servicio actualizado."); await utils.services.list.invalidate(); }, onError: (error) => setFeedback(error.message) });
  if (!visible) return null;

  const requiresCrew = serviceType === "moving";
  const requiresVehicle = serviceType === "moving" || serviceType === "heavy_cargo";
  const changeService = (next: ServiceType) => { setServiceType(next); setCrewSize(next === "moving" ? "2" : "1"); if (next === "assisted_purchase") setVehicleType(""); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = Number(shipmentId);
    const crew = Number(crewSize);
    if (!Number.isInteger(id) || id < 1) { setFeedback("Indica un ID de envío válido."); return; }
    if (!Number.isInteger(crew) || crew < (requiresCrew ? 2 : 1)) { setFeedback(requiresCrew ? "Una mudanza requiere una cuadrilla mínima de 2 personas." : "La cuadrilla debe tener al menos 1 persona."); return; }
    if (requiresVehicle && !vehicleType.trim()) { setFeedback(serviceType === "moving" ? "Una mudanza requiere indicar el vehículo especial." : "La carga pesada requiere indicar el vehículo especial."); return; }
    create.mutate({ shipmentId: id, serviceType, crewSize: crew, vehicleType: vehicleType.trim() || undefined, handlingNotes: handlingNotes.trim() || undefined });
  };

  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Servicios especiales</CardTitle><p className="text-sm text-slate-500">Cada servicio se valida contra el tipo del envío y conserva sus requisitos de operación.</p></CardHeader><CardContent className="space-y-5"><form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[.8fr_1fr_.7fr_1.2fr_1.8fr_auto] xl:items-end"><div><Label htmlFor="special-shipment">ID de envío</Label><Input id="special-shipment" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} inputMode="numeric" placeholder="Ej. 1024" className="mt-1 bg-white" /></div><div><Label>Servicio</Label><Select value={serviceType} onValueChange={(value) => changeService(value as ServiceType)}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(serviceLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="special-crew">Personas</Label><Input id="special-crew" value={crewSize} onChange={(event) => setCrewSize(event.target.value)} inputMode="numeric" min={1} max={20} className="mt-1 bg-white" /></div><div><Label htmlFor="special-vehicle">Vehículo {requiresVehicle ? "especial *" : "(opcional)"}</Label><Input id="special-vehicle" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} maxLength={100} placeholder={requiresVehicle ? "Camión / furgón" : "No requerido"} className="mt-1 bg-white" /></div><div><Label htmlFor="special-notes">Requisitos y notas</Label><Input id="special-notes" value={handlingNotes} onChange={(event) => setHandlingNotes(event.target.value)} maxLength={2000} placeholder={serviceType === "moving" ? "Muebles, pisos, ascensor y acceso" : serviceType === "heavy_cargo" ? "Peso, dimensiones y equipo de carga" : "Origen de compra e instrucciones"} className="mt-1 bg-white" /></div><Button type="submit" disabled={create.isPending}>{create.isPending ? "Solicitando…" : "Solicitar servicio"}</Button></form><div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900"><strong>{serviceLabels[serviceType]}:</strong> {requiresCrew ? "cuadrilla mínima de 2 personas" : "cuadrilla estándar"}; {requiresVehicle ? "vehículo especial obligatorio" : "vehículo especial no obligatorio"}.</div>{feedback && <p className="text-sm text-slate-600" role="status">{feedback}</p>}{!services.isLoading && !services.data?.length && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No hay servicios especiales registrados.</p>}<div className="space-y-2">{services.data?.map((service) => <div key={service.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Envío #{service.shipmentId} · {serviceLabels[service.serviceType]}</p><p className="mt-1 text-xs text-slate-500">{statusLabels[service.status]} · {service.crewSize} persona{service.crewSize === 1 ? "" : "s"} · {service.requiresSpecialVehicle ? service.vehicleType || "Vehículo especial" : "Vehículo estándar"}</p>{service.handlingNotes && <p className="mt-1 text-xs text-slate-500">{service.handlingNotes}</p>}</div>{canManage && !["completed", "cancelled"].includes(service.status) && <Select defaultValue="quoted" onValueChange={(status) => update.mutate({ serviceId: service.id, status: status as "quoted" | "approved" | "scheduled" | "in_progress" | "completed" | "cancelled" })}><SelectTrigger className="w-40 bg-white text-xs"><SelectValue placeholder="Actualizar" /></SelectTrigger><SelectContent><SelectItem value="quoted">Cotizar</SelectItem><SelectItem value="approved">Aprobar</SelectItem><SelectItem value="scheduled">Programar</SelectItem><SelectItem value="in_progress">Iniciar</SelectItem><SelectItem value="completed">Completar</SelectItem><SelectItem value="cancelled">Cancelar</SelectItem></SelectContent></Select>}</div>)}</div></CardContent></Card>;
}
