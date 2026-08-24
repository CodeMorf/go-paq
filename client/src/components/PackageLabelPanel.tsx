import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, QrCode } from "lucide-react";

export default function PackageLabelPanel({ visible }: { visible: boolean }) {
  const packages = trpc.packages.list.useQuery(undefined, { enabled: visible });
  const [selectedId, setSelectedId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const barcodeRef = useRef<SVGSVGElement>(null);
  const selected = packages.data?.find((item) => String(item.id) === selectedId) ?? packages.data?.[0];
  useEffect(() => {
    if (!selected) { setQrUrl(""); return; }
    void QRCode.toDataURL(selected.packageCode, { width: 180, margin: 1 }).then(setQrUrl).catch(() => setQrUrl(""));
    if (barcodeRef.current) JsBarcode(barcodeRef.current, selected.packageCode, { format: "CODE128", width: 1.7, height: 48, displayValue: true, fontSize: 12, margin: 2 });
  }, [selected]);
  if (!visible) return null;
  return <Card className="mt-6 border-0 bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-gopaq-accent" /> Etiqueta imprimible</CardTitle><p className="text-sm text-gopaq-faint">Selecciona un paquete registrado. El QR y Code128 se generan desde su código real, sin referencias ficticias.</p><Select value={selectedId || (selected ? String(selected.id) : "")} onValueChange={setSelectedId}><SelectTrigger className="mt-3 max-w-md"><SelectValue placeholder="Selecciona un paquete" /></SelectTrigger><SelectContent>{packages.data?.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.packageCode} · Envío #{item.shipmentId}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent>{packages.isLoading && <p className="text-sm text-gopaq-faint">Cargando paquetes…</p>}{packages.error && <p role="alert" className="text-sm text-gopaq-danger">No se pudieron cargar paquetes: {packages.error.message}</p>}{!packages.isLoading && !packages.error && !selected && <p className="rounded-xl border border-dashed border-gopaq-line p-4 text-sm text-gopaq-faint">Registra un paquete para habilitar su etiqueta.</p>}{selected && <div id="gopaq-print-label" className="max-w-md rounded-2xl border-2 border-gopaq-navy bg-white p-5 text-foreground"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.22em] text-gopaq-accent">GoPaq</p><p className="mt-1 text-xs text-gopaq-faint">Logística puerta a puerta</p></div><p className="text-right text-xs font-semibold text-gopaq-faint">Sucursal<br />Recepción</p></div><div className="mt-5 flex items-center justify-between gap-5"><div><p className="text-2xl font-black tracking-tight">{selected.packageCode}</p><p className="mt-1 text-sm text-gopaq-faint">Envío #{selected.shipmentId}</p><p className="mt-3 text-sm font-semibold">{selected.description || "Paquete GoPaq"}</p><p className="mt-1 text-xs text-gopaq-faint">{selected.weightKg ? `${selected.weightKg} kg` : "Peso pendiente"} · {selected.locationCode || "Ubicación pendiente"}</p></div>{qrUrl && <img src={qrUrl} alt={`QR ${selected.packageCode}`} className="h-28 w-28" />}</div><div className="mt-4 border-t border-gopaq-line pt-3"><svg ref={barcodeRef} aria-label={`Código de barras ${selected.packageCode}`} className="h-16 w-full" /></div><div className="mt-2 flex justify-end"><Button size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir etiqueta</Button></div></div>}</CardContent></Card>;
}
