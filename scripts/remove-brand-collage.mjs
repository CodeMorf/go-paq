import fs from "node:fs";

const path = "client/src/pages/Home.tsx";
const lines = fs.readFileSync(path, "utf8").split("\n");
const output = [];
for (const line of lines) {
  if (line.includes('const brandBoard =')) continue;
  if (line.includes('<div className="relative mx-auto w-full max-w-xl lg:ml-auto">')) {
    output.push('          <div className="relative mx-auto w-full max-w-xl lg:ml-auto"><div className="absolute -inset-10 rounded-[4rem] bg-orange-500/10 blur-3xl" /><div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-orange-500">Centro de control GoPaq</p><h2 className="mt-3 max-w-sm text-3xl font-black tracking-tight text-card-foreground">Tu paquete, nuestra ruta.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Una operación clara para coordinar recogidas, transporte y entregas en un solo lugar.</p></div><div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-orange-400/60 bg-slate-950"><img src={avatarHalcon} alt="Halcón GoPaq" className="h-full w-full object-cover object-top" /></div></div><div className="mt-10 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-orange-500/10 p-4"><p className="text-2xl font-black text-orange-500">24/7</p><p className="mt-1 text-xs text-muted-foreground">Visibilidad</p></div><div className="rounded-2xl bg-slate-900 p-4 text-white"><p className="text-2xl font-black">GPS</p><p className="mt-1 text-xs text-slate-400">En vivo</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-2xl font-black text-emerald-600">99%</p><p className="mt-1 text-xs text-muted-foreground">Trazabilidad</p></div></div><div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-4"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><div><p className="text-sm font-bold text-card-foreground">Operación sincronizada</p><p className="text-xs text-muted-foreground">Actualización segura y auditable</p></div></div></div></div>');
  } else {
    output.push(line);
  }
}
fs.writeFileSync(path, output.join("\n"));
