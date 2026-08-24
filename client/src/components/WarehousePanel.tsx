import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WarehousePanel({ visible }: { visible: boolean }) {
  const warehouses = trpc.warehouses.list.useQuery(undefined, { enabled: visible });
  const branches = trpc.branches.list.useQuery(undefined, { enabled: visible });
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [feedback, setFeedback] = useState("");
  const create = trpc.warehouses.create.useMutation({ onSuccess: () => { setBranchId(""); setName(""); setCode(""); setAddress(""); setFeedback("Almacén creado correctamente."); void warehouses.refetch(); }, onError: (error) => setFeedback(error.message) });
  const update = trpc.warehouses.update.useMutation({ onSuccess: () => { setFeedback("Estado del almacén actualizado."); void warehouses.refetch(); }, onError: (error) => setFeedback(error.message) });

  if (!visible) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback("");
    create.mutate({ branchId: Number(branchId), name, code, address: address || undefined });
  };

  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Almacenes y ubicaciones</CardTitle><p className="text-sm text-slate-500">Gestiona las sedes operativas reales de esta organización. El ID de sucursal se valida en el servidor.</p></CardHeader><CardContent className="space-y-6">
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2"><div className="md:col-span-2"><p className="text-sm font-semibold text-slate-900">Registrar almacén</p></div><div><Label>Sucursal</Label>{branches.data?.length ? <Select value={branchId} onValueChange={setBranchId}><SelectTrigger><SelectValue placeholder="Selecciona una sucursal" /></SelectTrigger><SelectContent>{branches.data.map((branch) => <SelectItem key={branch.id} value={String(branch.id)}>{branch.name} · {branch.code}</SelectItem>)}</SelectContent></Select> : <Input id="warehouse-branch" type="number" min="1" value={branchId} onChange={(event) => setBranchId(event.target.value)} placeholder="ID de sucursal" required />}</div><div><Label htmlFor="warehouse-code">Código</Label><Input id="warehouse-code" value={code} onChange={(event) => setCode(event.target.value)} pattern="[A-Za-z0-9_-]+" minLength={2} maxLength={40} required /></div><div><Label htmlFor="warehouse-name">Nombre</Label><Input id="warehouse-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={160} required /></div><div><Label htmlFor="warehouse-address">Dirección</Label><Input id="warehouse-address" value={address} onChange={(event) => setAddress(event.target.value)} maxLength={1000} /></div><div className="md:col-span-2 flex items-center gap-3"><Button type="submit" disabled={create.isPending}>{create.isPending ? "Guardando…" : "Registrar almacén"}</Button>{feedback && <p className="text-sm text-slate-600" role="status">{feedback}</p>}</div></form>
    <div className="space-y-2">{warehouses.isLoading ? <p className="text-sm text-slate-500">Cargando almacenes…</p> : warehouses.data?.length ? warehouses.data.map((warehouse) => <div key={warehouse.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><strong className="block text-sm text-slate-900">{warehouse.name} · {warehouse.code}</strong><span className="text-xs text-slate-500">Sucursal {warehouse.branchId}{warehouse.address ? ` · ${warehouse.address}` : ""}</span></div><Button variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: warehouse.id, isActive: !warehouse.isActive })}>{warehouse.isActive ? "Desactivar" : "Activar"}</Button></div>) : <p className="text-sm text-slate-500">Aún no hay almacenes registrados.</p>}</div>
  </CardContent></Card>;
}
