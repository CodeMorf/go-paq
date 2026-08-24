import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dimensionUnits, toCm, toKg, weightUnits, type DimensionUnit, type WeightUnit } from "@/lib/units";
import { formatMoney } from "@/lib/format";

export default function QuoteWidget({ organizationSlug = "" }: { organizationSlug?: string }) {
  const [form, setForm] = useState({ weight: 2, length: 30, width: 20, height: 15, distanceKm: 18 });
  const [, setLocation] = useLocation();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>("cm");
  const quoteInput = useMemo(() => ({ actualWeightKg: toKg(form.weight, weightUnit), lengthCm: toCm(form.length, dimensionUnit), widthCm: toCm(form.width, dimensionUnit), heightCm: toCm(form.height, dimensionUnit), distanceKm: form.distanceKm }), [form, weightUnit, dimensionUnit]);
  const quote = trpc.quote.preview.useQuery({ ...quoteInput, organizationSlug }, { enabled: Boolean(organizationSlug) });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }));
  const dimensionFields: Array<[keyof typeof form, string]> = [["length", "Largo"], ["width", "Ancho"], ["height", "Alto"]];
  return (
    <Card className="border-border bg-card text-card-foreground shadow-xl">
      <CardHeader><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Cotización en vivo</p><CardTitle className="mt-2 text-2xl">Calcula tu envío</CardTitle><p className="text-sm">Estimación calculada con la tarifa vigente de la organización seleccionada, basada en peso, volumen, distancia y recargos.</p></CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><label className="text-xs font-semibold text-muted-foreground">Peso<Input type="number" min="0.1" step="0.1" value={form.weight} onChange={update("weight")} className="mt-1" /></label><label className="text-xs font-semibold text-muted-foreground">Unidad<Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as WeightUnit)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weightUnits).map(([value, unit]) => <SelectItem key={value} value={value}>{unit.label}</SelectItem>)}</SelectContent></Select></label></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">{dimensionFields.map(([key, label]) => <label key={key} className="text-xs font-semibold text-muted-foreground">{label}<Input type="number" min="0.1" step="0.1" value={form[key]} onChange={update(key)} className="mt-1" /></label>)}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]"><label className="text-xs font-semibold text-muted-foreground">Unidad de dimensión<Select value={dimensionUnit} onValueChange={(value) => setDimensionUnit(value as DimensionUnit)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(dimensionUnits).map(([value, unit]) => <SelectItem key={value} value={value}>{unit.label}</SelectItem>)}</SelectContent></Select></label><label className="text-xs font-semibold text-muted-foreground">Distancia (km)<Input type="number" min="1" step="1" value={form.distanceKm} onChange={update("distanceKm")} className="mt-1" /></label></div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-muted p-4"><div><p className="text-xs uppercase tracking-[.18em] text-muted-foreground">Total estimado</p><p className="mt-1 text-3xl font-black text-primary">{quote.data ? formatMoney(quote.data.total, quote.data.currency) : "—"}</p>{!organizationSlug && <p className="mt-2 text-xs text-muted-foreground">Selecciona una organización pública con `?org=slug` para consultar una tarifa real.</p>}{quote.error && <p className="mt-2 text-xs text-destructive">{quote.error.message}</p>}</div><Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => setLocation("/cliente")}>Solicitar envío</Button></div>
      </CardContent>
    </Card>
  );
}
