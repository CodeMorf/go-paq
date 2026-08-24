import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");
source = source.replace(
  /useEffect\(\(\) => \{ if \(portal === "driver"\) setOfflineCount\(listPendingDriverOperations\(\)\.length\); if \(portal === "sucursal"\) QRCode\.toDataURL\("GPQ-240823-0184", \{ width: 180, margin: 1 \}\)\.then\(setLabelQr\)\.catch\(\(\) => setLabelQr\(""\)\); \}, \[portal\]\);/,
  'useEffect(() => { if (portal === "driver") setOfflineCount(listPendingDriverOperations().length); }, [portal]);'
);
source = source.replace(
  /<CardContent className="space-y-4">\{\["GPQ-240823-0184 · Escaneo completado", "Ruta SDQ-04 · GPS activo", "Manifiesto M-0088 · Listo para transferencia", "POD GPQ-240823-0163 · Firmado"\]\.map\(\(event, i\) => <div key=\{event\} className="flex gap-3">.*?<\/CardContent><\/Card>/,
  '<CardContent><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-400">Los eventos operativos aparecerán aquí cuando existan registros reales para esta organización.</div></CardContent></Card>'
);
source = source.replace(
  /<p className="text-sm text-slate-500">QR verificable · GPQ-240823-0184 · Manifiesto M-0088<\/p>/,
  '<p className="text-sm text-slate-500">Las etiquetas se habilitan después de una recepción real.</p>'
);
source = source.replace(
  /\{labelQr \? <img src=\{labelQr\} alt="QR del envío GPQ-240823-0184" className="h-36 w-36" \/> : <div className="h-36 w-36 animate-pulse rounded-xl bg-slate-100" \/>\}/,
  '<div className="flex h-36 w-36 items-center justify-center rounded-xl bg-slate-100 p-4 text-center text-xs text-slate-500">Sin etiqueta disponible</div>'
);
source = source.replace(/<Button className="mt-4 bg-orange-500 text-white hover:bg-orange-400">Preparar etiqueta<\/Button>/, '<Button disabled className="mt-4">Preparar etiqueta</Button>');
fs.writeFileSync(path, source);
