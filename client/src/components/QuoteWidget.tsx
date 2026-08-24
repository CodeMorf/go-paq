import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function QuoteWidget() {
  const [form, setForm] = useState({ actualWeightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 15, distanceKm: 18 });
  const quote = trpc.quote.preview.useQuery({ minAmount: 10, perKg: 4.5, perKm: 0.8, fuelSurchargePct: 8, ...form }, { enabled: true });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }));
  return <Card className="border-orange-400/20 bg-[#0b1c31] text-white shadow-2xl shadow-black/20"><CardHeader><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-400">Preventivo live</p><CardTitle className="mt-2 text-2xl">Calcola la tua spedizione</CardTitle><p className="text-sm text-slate-400">Stima trasparente basata su peso volumetrico, distanza e carburante.</p></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{([['actualWeightKg','Peso (kg)'],['lengthCm','Lunghezza (cm)'],['widthCm','Larghezza (cm)'],['heightCm','Altezza (cm)'],['distanceKm','Distanza (km)']] as const).map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate-400">{label}<Input type="number" min="0.1" step="0.1" value={form[key]} onChange={update(key)} className="mt-1 border-white/10 bg-white/5 text-white" /></label>)}</div><div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-white/[.05] p-4"><div><p className="text-xs uppercase tracking-[.18em] text-slate-500">Totale stimato</p><p className="mt-1 text-3xl font-black text-orange-300">{quote.data ? `US$ ${quote.data.total.toFixed(2)}` : "—"}</p></div><Button className="bg-orange-500 text-white hover:bg-orange-400">Richiedi spedizione</Button></div></CardContent></Card>;
}
