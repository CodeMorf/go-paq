import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
let source = fs.readFileSync(path, "utf8");
const start = source.indexOf('<div className="mt-6 grid gap-4 md:grid-cols-3">');
const end = source.indexOf('</div></DashboardLayout>;', start);
if (start === -1 || end === -1) throw new Error("No se encontró el bloque de tracking público");
const replacement = '<div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">El mapa operativo y la línea de tiempo se muestran dentro de los portales autorizados cuando existen rutas y posiciones reales.</div>';
source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(path, source);
