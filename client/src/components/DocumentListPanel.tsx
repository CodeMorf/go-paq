import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentListPanel({ visible }: { visible: boolean }) {
  const documents = trpc.documents.list.useQuery(undefined, { enabled: visible });
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle>Documenti di spedizione</CardTitle><p className="text-sm text-slate-500">Etichette, dogana, ricevute e prove di consegna disponibili per la tua organizzazione.</p></CardHeader><CardContent className="space-y-2">{documents.data?.length ? documents.data.map((document) => <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-orange-200 hover:bg-orange-50"><span><strong className="block text-sm">{document.documentType}</strong><span className="text-xs text-slate-500">Spedizione #{document.shipmentId} · {document.mimeType}</span></span><span className="text-xs font-semibold text-orange-600">Apri</span></a>) : <p className="text-sm text-slate-500">Nessun documento disponibile.</p>}</CardContent></Card>;
}
