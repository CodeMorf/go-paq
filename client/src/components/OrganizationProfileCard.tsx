import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe2, Pencil, Save, Settings2 } from "lucide-react";

export default function OrganizationProfileCard({ visible }: { visible: boolean }) {
  const { data, isLoading } = trpc.logistics.scope.useQuery(undefined, { enabled: visible });
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [currency, setCurrency] = useState("");
  const [timezone, setTimezone] = useState("");
  const [services, setServices] = useState("");
  const update = trpc.organization.updateProfile.useMutation({
    onSuccess: () => { setEditing(false); setSaveMessage("Configurazione salvata correttamente."); utils.logistics.scope.invalidate(); },
    onError: (error) => setSaveMessage(error.message || "Salvataggio non riuscito. Verifica permessi e connessione."),
  });

  useEffect(() => {
    if (!data) return;
    setCountry(data.organization.country);
    setLanguage(data.organization.language);
    setCurrency(data.organization.currency);
    setTimezone(data.organization.timezone);
    setServices(Array.isArray(data.organization.activeServices) ? data.organization.activeServices.map(String).join(", ") : "");
  }, [data]);

  if (!visible) return null;
  const activeServices = Array.isArray(data?.organization.activeServices) ? data.organization.activeServices : [];
  const submit = () => {
    if (!country.trim() || !language.trim() || !currency.trim() || !timezone.trim()) { setSaveMessage("Completa paese, lingua, valuta e fuso orario."); return; }
    setSaveMessage("");
    update.mutate({ country: country.trim(), language: language.trim(), currency: currency.trim(), timezone: timezone.trim(), activeServices: services.split(",").map((item) => item.trim()).filter(Boolean) });
  };

  return (
    <Card className="mb-6 border-0 bg-white shadow-sm">
      <CardHeader className="flex-row items-start justify-between">
        <div><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-orange-500" /> Profilo organizzazione</CardTitle><p className="mt-1 text-sm text-slate-500">Configurazione regionale applicata al tenant operativo.</p></div>
        <div className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-slate-300" />{!editing && <Button size="sm" variant="outline" className="border-slate-200 bg-white" onClick={() => { setSaveMessage(""); setEditing(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Modifica</Button>}</div>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-slate-500">Caricamento configurazione…</p>}
        {!isLoading && !data && <p className="text-sm text-slate-500">Nessuna organizzazione attiva associata.</p>}
        {!isLoading && data && !editing && <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs uppercase tracking-wide text-slate-400">Organizzazione</p><p className="mt-1 font-semibold text-slate-900">{data.organization.name}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Regione</p><p className="mt-1 font-semibold text-slate-900">{data.organization.country} · {data.organization.timezone}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Lingua e valuta</p><p className="mt-1 font-semibold text-slate-900">{data.organization.language.toUpperCase()} · {data.organization.currency}</p></div><div><p className="text-xs uppercase tracking-wide text-slate-400">Servizi attivi</p><div className="mt-1 flex flex-wrap gap-1">{activeServices.length ? activeServices.map((service) => <Badge key={String(service)} className="border-emerald-200 bg-emerald-50 text-emerald-700">{String(service)}</Badge>) : <span className="text-sm text-slate-500">Configurazione da completare</span>}</div></div></div>
          {saveMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{saveMessage}</p>}
        </>}
        {!isLoading && data && editing && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold text-slate-500">Paese<input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label><label className="text-xs font-semibold text-slate-500">Lingua<input value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label><label className="text-xs font-semibold text-slate-500">Valuta<input value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label><label className="text-xs font-semibold text-slate-500">Fuso orario<input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label><label className="text-xs font-semibold text-slate-500 sm:col-span-2 lg:col-span-3">Servizi attivi<input value={services} onChange={(event) => setServices(event.target.value)} placeholder="local, national, international" className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900" /></label><div className="flex items-end gap-2"><Button className="bg-orange-500 text-white hover:bg-orange-400" disabled={update.isPending} onClick={submit}><Save className="mr-1 h-4 w-4" />{update.isPending ? "Salvataggio…" : "Salva"}</Button><Button variant="outline" className="border-slate-200 bg-white" onClick={() => { setEditing(false); setSaveMessage(""); }}>Annulla</Button></div>{saveMessage && <p role="alert" className="text-sm text-rose-700 sm:col-span-2 lg:col-span-4">{saveMessage}</p>}</div>}
      </CardContent>
    </Card>
  );
}
