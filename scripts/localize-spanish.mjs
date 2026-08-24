import fs from "node:fs";
import path from "node:path";

const replacements = new Map([
  ["Accesso", "Acceso"], ["accesso", "acceso"], ["Portale", "Portal"], ["portale", "portal"],
  ["Caricamento", "Cargando"], ["Documenti", "Documentos"], ["Apri", "Abrir"], ["Nessun documento disponibile", "No hay documentos disponibles"],
  ["Ricezione pickup", "Recepción de recogidas"], ["Ricezione pacco", "Recibir paquete"], ["Registra", "Registrar"], ["Note operative", "Notas operativas"],
  ["Scansiona", "Escanear"], ["Gestisci", "Gestionar"], ["Trasferisci filiale", "Transferir sucursal"], ["La mia giornata", "Mi jornada"], ["Il mio spazio GoPaq", "Mi espacio GoPaq"],
  ["Oggi", "Hoy"], ["Ultimi eventi sincronizzati", "Últimos eventos sincronizados"], ["Sincronizzati", "Sincronizados"], ["Consegnate", "Entregados"], ["Incidenti", "Incidentes"],
  ["Sito pubblico", "Sitio público"], ["Preventivo", "Cotización"], ["Spedizioni", "Envíos"], ["filiali", "sucursales"], ["autisti", "conductores"], ["consegne", "entregas"],
  ["pagamento", "pago"], ["Operazioni", "Operaciones"], ["operazioni", "operaciones"], ["completato", "completado"], ["Firmato", "Firmado"],
  ["Ultimo miglio", "Última milla"], ["Internazionale", "Internacional"], ["Casella, consolidamento e documenti doganali.", "Casillero, consolidación y documentos aduaneros."],
  ["Stampa dopo la scansione di ricezione.", "Imprime después del escaneo de recepción."], ["operativo", "operativo"], ["auditabile", "auditable"],
]);

const root = path.resolve("client/src");
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) {
      let content = fs.readFileSync(full, "utf8");
      for (const [from, to] of replacements) content = content.split(from).join(to);
      fs.writeFileSync(full, content);
    }
  }
}
visit(root);
