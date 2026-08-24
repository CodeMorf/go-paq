# GoPaq — Project TODO

## Fondazioni e architettura

- [x] Definire shell applicativa e routing reale per `/`, `/admin`, `/sucursal`, `/driver`, `/cliente` e `/docs-api`.
- [x] Impostare identità visiva GoPaq con palette navy, arancio, bianco, tipografia leggibile e componenti responsive.
- [x] Aggiungere manifest PWA, service worker, icone e installabilità base.
- [x] Documentare nella codebase i confini della prima release e le integrazioni configurabili.

## Multi-azienda, filiali e accesso

- [ ] Estendere lo schema dati con organizzazioni, filiali, sedi, magazzini, utenti organizzativi e appartenenze.
- [ ] Implementare ruoli e permessi granulari per visualizzare, creare, modificare, approvare, assegnare, incassare, rimborsare, esportare e configurare.
- [ ] Applicare isolamento organizzativo a query e mutation tramite contesto autenticato.
- [ ] Implementare profilo aziendale, configurazione regionale, lingua, valuta, fuso orario e servizi attivi.
- [ ] Implementare audit log immutabile per azioni operative, finanziarie, di sicurezza e agente LLM.

## Nucleo logistico

- [x] Creare modello spedizione/ordine con riferimenti mittente, destinatario, servizio e organizzazione.
- [x] Creare modello pacco con peso reale, peso volumetrico, dimensioni, contenuto, valore, restrizioni e stato.
- [ ] Implementare pickup, tentativi, finestre horarie, assegnazioni, route stop e manifest.
- [ ] Implementare flusso locale, nazionale e internazionale con origine, destinazione, dogana e documenti.
- [ ] Implementare consolidamento, separazione, reimballaggio, trasferimenti tra filiali e ubicazioni di magazzino.
- [ ] Implementare macchina degli stati separata per commerciale, fisico, trasporto, finanziario, acquisto assistito e incidenti.
- [ ] Implementare timeline di eventi con attore, timestamp UTC, filiale, posizione, motivo, evidenza e origine.
- [ ] Implementare motore tariffe versionado con peso, volume, distanza, zona, servicio, supplementi, tasse, sconti e valuta.

## Portale `/admin`

- [ ] Costruire dashboard KPI per spedizioni, pacchi, consegne, ritardi, incidenti, ricavi e stato integrazioni.
- [ ] Costruire gestione organizzazioni, piani, moduli, limiti, utenti, filiali, flotte e configurazioni.
- [ ] Costruire gestione catalogo servizi, tariffe, zone, stati, notifiche e template documentali.
- [ ] Costruire vista operativa globale con filtri per organizzazione, filiale, paese, stato e periodo.
- [ ] Costruire area audit, sicurezza, attività recenti e approvazioni pendenti.

## Portale `/sucursal`

- [ ] Costruire ricezione rapida per guida, casella, telefono, QR e codice a barre.
- [ ] Costruire scanner/registrazione di peso, dimensioni, fotografie, ubicazione e anomalie.
- [ ] Costruire kanban operativo: atteso, ricevuto, revisione, pronto, transito, filiale destinazione, rotta, consegnato, incidente.
- [ ] Costruire inventario, scaffali/zone, consolidamento, smistamento e trasferimenti tra filiali.
- [ ] Costruire manifest di partenza/arrivo e chiusura con riconciliazione.
- [ ] Costruire gestione cassa di filiale con apertura, movimenti, chiusura e differenze.

## PWA `/driver`

- [ ] Costruire dashboard mobile-first per turno, disponibilità, veicolo, incarichi e rotta.
- [ ] Costruire scansione carico, elenco fermate, priorità, navigazione e contatto protetto.
- [ ] Costruire aggiornamenti di stato pickup/consegna con PIN, firma, nome, foto, coordinate e timestamp.
- [ ] Costruire gestione tentativo fallito, motivo, evidenze, incassi, spese e chiusura rotta.
- [x] Implementare coda offline locale cifrata con idempotenza, stati sincronizado/en espera/conflicto/rechazado.
- [ ] Limitare la raccolta GPS alla sessione di turno/rotta attiva e rendere visibile il consenso/policy.

## Portale `/cliente` e sito pubblico

- [ ] Costruire sito pubblico GoPaq con servizi, copertura, filiali, FAQ, politiche e CTA.
- [ ] Costruire autenticazione cliente, profilo individuale/aziendale, indirizzi e contatti autorizzati.
- [ ] Costruire quotatore con origine, destinazione, peso, dimensioni, servizio e stima trasparente.
- [ ] Costruire creazione richiesta di spedizione, pickup, acquisto assistito, carico pesante e fulfillment.
- [ ] Costruire dashboard invii, saldi, fatture, notifiche, ticket e documenti.
- [ ] Costruire tracking pubblico protetto per numero di guida e tracking privato autenticato.

## Mappe, GPS, tracking e documenti

- [x] Integrare componente mappa preconfigurato con geocoding, indicazioni, fermate e rotte.
- [ ] Implementare posizione corrente autista, ultima posizione nota, stato tracking e timeline operativa.
- [ ] Implementare vista mappa amministrativa con filtri per rotta, stato, filiale e ritardo.
- [ ] Implementare etichette con barcode/QR e template configurabili per organizzazione.
- [ ] Implementare documenti di spedizione, dogana, fatture, ricevute e proof of delivery tramite storage sicuro.
- [ ] Implementare download/visualizzazione documenti con metadati, permessi e audit.

## API pubblica e `/docs-api`

- [ ] Definire autenticazione API con chiavi revocabili, scope, rate limit e isolamento organizzativo.
- [ ] Definire endpoint documentati per quotazioni, spedizioni, pacchi, tracking, pickup, webhooks e documenti.
- [x] Costruire `/docs-api` con contratti, esempi request/response, errori, autenticazione e versionamento.
- [ ] Implementare webhook firmati per eventi di spedizione, tracking, consegna e incidenti.
- [ ] Implementare log API, tentativi, risposte, revoche e strumenti di verifica.

## Agente LLM operativo

- [x] Integrare agente LLM tramite proxy/infrastruttura configurata, senza esporre credenziali al client.
- [ ] Costruire configurazione per organizzazione: prompt, moduli, lingue, soglie e modalità assistita.
- [ ] Implementare supporto contestuale per operatori, clienti e amministratori.
- [ ] Implementare classificazione/estrazione da documenti con output strutturato e validazione.
- [x] Implementare suggerimenti di tariffa, stato, anomalia o risposta senza autorizzare automaticamente azioni sensibili.
- [ ] Implementare approvazione umana per azioni che modificano dati, finanze, stato di consegna o comunicazioni esterne.
- [ ] Salvare input rilevante, output, azione proposta, approvatore, esito e audit trail.

## Qualità e sicurezza

- [ ] Scrivere test Vitest per autenticazione, isolamento organizzativo, permessi, transizioni di stato e idempotenza offline.
- [ ] Verificare TypeScript, build, percorsi, stati di caricamento, errori e vuoti.
- [ ] Verificare accessibilità tastiera, focus visibile, contrasto e responsive desktop/mobile.
- [ ] Verificare installabilità PWA, cache essenziale e sincronizzazione senza confermare localmente pagamenti o consegne.
- [ ] Verificare che nessuna integrazione esterna sia simulata o hardcoded e documentare le credenziali necessarie.
- [ ] Eseguire revisione visuale dei percorsi principali e salvare il checkpoint finale della prima release.

- [x] Brandizzare la schermata di accesso dei portali interni con identità GoPaq, linguaggio operativo e continuità visiva rispetto al sito pubblico.

## Correzioni architetturali emerse

- [x] Implementare service worker reale e registrazione client per completare la base PWA installabile/offline.
- [x] Aggiungere documentazione dedicata in `ARCHITECTURE.md` con scope della prima release e integrazioni configurabili.
- [ ] Estendere lo schema con magazzini/sedi operative esplicite e relazioni agli utenti organizzativi.
- [ ] Implementare autorizzazione granulare per azione con enforcement backend e test.
- [ ] Aggiungere query/mutation del dominio con filtro obbligatorio per `organizationId` dal contesto autenticato.
- [ ] Implementare audit log centralizzato append-only per eventi operativi, finanziari, sicurezza e LLM con procedure e test.

- [ ] Aggiungere lingua e servizi attivi dell’organizzazione con query e UI di profilo.
- [ ] Estendere i pacchi con restrizioni e stato del pacco.
- [ ] Introdurre stati separati per acquisto assistito e incidenti con transizioni validate lato backend.
- [x] Aggiungere origine agli eventi spedizione e implementare mutation/query per append/list della timeline.
- [ ] Collegare utenti organizzativi a magazzini o sedi operative in modo esplicito.

- [x] Implementare logica Google Maps reale con `onMapReady`: geocoding, DirectionsService/DirectionsRenderer, fermate e rotta visualizzata.
- [x] Vincolare lato backend l’agente a restituire sempre `requiresApproval: true` per azioni sensibili e bloccare suggerimenti non conformi.
- [ ] Aggiungere procedure/UI specifiche per suggerimenti di tariffa, stato e anomalie con test dedicati.

- [x] Completare `/docs-api` con errori, response examples, policy di versioning e contratti dettagliati per quotes, shipments, tracking, pickups e webhooks.
- [ ] Aggiungere enforcement backend forte per l’agente: tipi di azione sensibile validati, suggerimenti non conformi rifiutati e test Vitest dedicati.

- [x] Correggere l’header mobile di `/docs-api` per evitare sovrapposizione tra logo, navigazione e CTA di accesso.

- [x] Inserire nella landing pubblica un quotatore live collegato a `quote.preview`, con peso volumetrico, distanza, carburante e totale trasparente.

- [x] Aggiungere al portale driver un pannello GPS con consenso esplicito, watchPosition e invio tRPC di coordinate/accuratezza/timestamp.

- [x] Aggiungere una macchina degli stati deterministica e testata per transizioni commerciali, fisiche, trasporto, finanziarie e incidenti.

- [x] Aggiungere al portale admin un pannello chiavi API con emissione scope-limitata, segreto one-time, elenco e revoca.
- [x] Esporre un endpoint REST `/api/v1/quotes` autenticato con Bearer key, scope e versione.

- [x] Aggiungere al portale sucursal un pannello pickup con lista organizzativa e registrazione validata di indirizzo, contatto e note via tRPC.

- [x] Collegare `tracking.publicByCode` al database con codice guida, stato logistico, paesi e messaggio pubblico minimizzato.

- [x] Aggiungere query tRPC `documents.list` e pannello admin/cliente per consultare metadati e aprire documenti autorizzati.

- [x] Aggiungere un pannello admin/sucursal per elencare rotte organizzative e visualizzare le fermate ordinate tramite tRPC.

- [x] Aggiungere procedura `audit.list` e pannello admin per consultare eventi organizzativi recenti con categoria, azione, risorsa e timestamp.

- [x] Aggiungere nel portale cliente un flusso di richiesta pickup con contatto, indirizzo, note e conferma via tRPC.

- [x] Aggiungere un pannello admin/cliente per elencare spedizioni reali isolate per organizzazione con codice, paesi, servizio e stato fisico.

- [x] Applicare permessi organizzativi `documents:create` e `documents:view` alle procedure di upload e consultazione documenti.

- [x] Applicare permessi organizzativi `routes:view`, `pickups:view` e `pickups:create` alle procedure operative di rotte e pickup.

- [x] Applicare rate limit per chiave API all’endpoint REST quote con risposta 429 e header `Retry-After`.

- [x] Aggiungere procedura `tracking.privateByShipment` per timeline privata autenticata, con isolamento tramite `listEventsForUser`.

- [x] Applicare il permesso `api_keys:view` alla lista chiavi API del portale admin, mantenendo `create/configure` per emissione e revoca.
- [x] Aggiungere ciclo manifest sucursal: apertura, elenco, sigillo, transito, ricezione e riconciliazione con isolamento organizzativo e audit.
- [x] Aggiungere test Vitest per transizioni manifest valide, salti di stato e stato terminale.
- [x] Rafforzare l’enforcement agente con tipi di azione ammessi, rifiuto dei tipi sconosciuti e test Vitest dedicato.
- [x] Mostrare nel portale driver l’ultima posizione GPS sincronizzata, timestamp UTC e accuratezza con refresh periodico.
- [x] Applicare `routes:view` anche alla query delle fermate per evitare accessi parzialmente autorizzati.
- [x] Mostrare nel portale admin il profilo organizzativo con regione, lingua, valuta, fuso orario e servizi attivi.
- [x] Aggiungere modifica protetta del profilo organizzativo con lingua, valuta, fuso orario, paese e servizi attivi.
- [x] Aggiungere feedback UI per il salvataggio del profilo organizzativo: stato loading, conferma successo e messaggio errore per permessi/validazione/rete.
- [ ] Verificare in browser il flusso di modifica del profilo organizzativo e coprire successo, errore e stato vuoto.
- [x] Aggiungere permessi `tracking:view/create` e audit alla lettura e registrazione dei punti GPS.
- [x] Aggiungere audit anche alla lettura dei punti GPS e testare enforcement `tracking:view/create` e audit di lettura/registrazione.
- [x] Scrivere test tRPC d’integrazione per `gps.points`/`gps.record`, inclusi permessi `tracking:view/create` e chiamate audit.
- [x] Coprire esplicitamente il rifiuto `gps.record` senza `tracking:create` e garantire che l’audit sia scritto solo sui percorsi autorizzati.
- [x] Verificare esplicitamente che `gps.points` non scriva audit quando manca `tracking:view` e che l’audit avvenga solo dopo autorizzazione.
- [x] Proteggere `audit.list` con `audit:view` e testare il rifiuto senza permesso.
- [x] Applicare `tracking:view` anche al tracking privato per spedizione e testare il rifiuto senza permesso.
- [x] Proteggere l’elenco spedizioni con `shipments:view` e testare il rifiuto senza permesso.
- [x] Applicare permessi tracking alla timeline privata e agli eventi spedizione con test di rifiuto e audit.
- [x] Aggiungere test tRPC per rifiuto timeline senza `tracking:view`.
- [x] Aggiungere test tRPC per rifiuto append evento senza `tracking:create` e assenza di persistenza/audit.
- [x] Aggiungere test tRPC per audit `shipment.event.appended` sul percorso autorizzato.
- [x] Proteggere la dashboard overview con `shipments:view` e testare il rifiuto senza permesso.
- [x] Aggiungere test tRPC specifico per il rifiuto di `logistics.overview` senza `shipments:view`.
- [x] Proteggere la mutation `logistics.audit` con `audit:create` e testare il rifiuto senza permesso.
- [x] Aggiungere test tRPC per `logistics.audit` senza `audit:create` e verificare assenza di scrittura audit.
- [x] Richiedere organizzazione attiva nella procedura `agent.suggest` e mantenere audit LLM sempre tenant-scoped.
- [x] Migrar la interfaz visible de GoPaq al español como idioma principal.
- [x] Establecer el tema claro como predeterminado y conservar el tema oscuro como opción manual.
- [x] Integrar los avatares proporcionados de la operadora y del halcón en los lugares visuales correspondientes.
- [x] Retirar la foto de la operadora del diseño principal y sustituirla por la nueva composición de marca GoPaq proporcionada.
- [x] Retirar también el collage de marca del hero y reemplazarlo por una composición limpia basada en logo, color y avatar discreto.
- [x] Reubicar el halcón solo en puntos de identidad donde no sature la composición.
- [x] Hacer una pasada visual final para confirmar que el halcón queda limitado a puntos de identidad y no compite con el contenido.
- [x] Añadir selector claro/oscuro a landing y documentación API, adaptando estilos públicos al tema activo.
- [x] Sustituir fondos y textos oscuros hardcodeados de landing/docs por tokens semánticos que respondan al tema activo.
- [x] Completar avatares en landing, docs, login y cabeceras compartidas con verificación responsive.
- [x] Verificar responsive del login y de cabeceras internas con el halcón, y documentar el resultado visual.
- [x] Completar la localización al español en portales internos, login y componentes compartidos, revisando cadenas residuales.
- [x] Reemplazar clases de color hardcodeadas de landing/docs por tokens semánticos reales del tema.
- [x] Capturar y documentar landing, docs, login y cabeceras internas en desktop/móvil antes del checkpoint visual.
- [x] Corregir el encabezado móvil de `/docs-api` para evitar desbordamiento horizontal y mantener CTA accesible.
- [x] Añadir unidades configurables de peso: libra, onza, kilogramo y gramo.
- [x] Añadir unidades configurables de dimensión: centímetro y pulgada, con conversiones consistentes.
- [x] Extraer conversiones de peso y dimensión a un helper compartido y probar lb/oz/kg/g y cm/pulgada.
- [x] Asegurar que las pruebas de conversiones de unidades sean detectadas explícitamente por Vitest y verificar su ejecución.
- [x] Reutilizar las unidades en las superficies operativas de paquetes, sucursal y manifiestos donde se capturen medidas.
- [x] Establecer DOP/RD$ como moneda predeterminada de GoPaq para República Dominicana en cotización, tarifas y paneles.
- [x] Mantener Shopify fuera de alcance por decisión del producto; no se integra en `/cliente`, `/admin` ni `/sucursal`.
- [x] Mantener fuera de alcance el catálogo Shopify; GoPaq calcula cotizaciones server-side en DOP.
- [x] Mantener fuera de alcance el carrito y checkout Shopify; el cliente usa el flujo operativo propio de GoPaq.
- [x] Implementar cotización cliente con resumen de peso, dimensiones, unidades y servicio; checkout Shopify fuera de alcance.
- [ ] Validar flujo de producción, aislamiento de portales, estados de carga/error y responsive.
- [x] Ejecutar prueba autónoma de producción en alcance actual: compilación, suites Vitest, rutas públicas, responsive y aislamiento tenant; Shopify queda excluido por alcance.
- [x] Generar reporte de verificación con resultados comprobados y bloqueos reales, sin afirmar pruebas no ejecutadas.
- [x] Resolver incidente de servidor de desarrollo detenido y confirmar arranque saludable.
- [x] Publicar el proyecto GoPaq en `CodeMorf/go-paq.git` con rama `main` y commit verificable.
- [x] Verificar checkout limpio con schema Drizzle y migraciones desplegables mediante prueba automatizada de la migración inicial.
- [x] Retirar claims y datos simulados de landing y portales, sustituyéndolos por consultas reales o estados vacíos.
- [x] Retirar mapa, rutas y timeline públicos con direcciones/paradas fijas; mostrar estado vacío hasta disponer de datos reales.
- [x] Alinear documentación API con endpoints realmente implementados.
- [x] Mantener todas las tarifas fuera del control del cliente y calcularlas server-side por organización/servicio/moneda.
- [x] Validar pertenencia organizativa de documentos y exigir referencias válidas para puntos GPS, eventos y pickups.
- [x] Evitar caché de respuestas autenticadas en el service worker.
- [x] Documentar dependencias de Manus y declarar explícitamente los requisitos de producción.
- [ ] Completar los flujos logísticos faltantes antes de cualquier declaración GO de producción.
- [x] Desactivar Shopify del flujo principal y excluir su smoke test externo mientras la integración permanezca fuera de alcance.
- [x] Verificar que `drizzle/schema.ts`, migraciones y configuración de base de datos estén incluidos y desplegables desde un checkout limpio.
- [x] Eliminar estadísticas, envíos, manifiestos, GPS y fechas simuladas de la landing y reemplazarlas por datos reales o estados vacíos.
- [x] Hacer que las acciones visibles sin backend real aparezcan como pendientes o queden conectadas a procedimientos existentes.
- [x] Alinear `/docs-api` con los endpoints REST realmente implementados o implementar los contratos anunciados.
- [x] Impedir que el cliente controle tarifas: resolver precios server-side por organización, zona, servicio, vigencia y moneda DOP.
- [x] Reforzar documentos y GPS con validación de pertenencia organizativa, referencias válidas y límites seguros.
- [x] Corregir el service worker para no cachear respuestas autenticadas y documentar límites actuales de la PWA offline.
- [x] Documentar dependencias de Manus y preparar una configuración explícita para producción antes de declarar GO.
- [x] Mantener fuera de alcance el catálogo Shopify por decisión del producto; no se monta en `/cliente`.
- [x] Mantener fuera de alcance el carrito y checkout Shopify por decisión del producto.
- [x] Verificar que `/admin` y `/sucursal` no rendericen catálogo, carrito ni checkout Shopify.

- [x] Hardening: cubrir con pruebas negativas la pertenencia tenant de documentos y puntos GPS
- [x] Retirar el router y contexto cliente de Shopify del flujo funcional
- [x] Añadir migración SQL inicial reproducible para el esquema actual
- [x] Formatear importes en español dominicano con DOP como valor predeterminado

- [x] Añadir creación real de envíos con código de rastreo generado en servidor, estados iniciales y auditoría.
- [x] Añadir edición protegida de envíos únicamente en estado borrador o cotizado, con aislamiento organizativo.
- [x] Añadir consulta de sucursales activas aislada por organización para operar con ubicaciones reales.
- [x] Añadir gestión real de almacenes: listado, creación, edición de estado y auditoría.
- [x] Añadir confirmación POD con receptor, evidencia opcional, transición a entregado, evento e idempotencia.
- [x] Añadir paneles de envíos, almacenes y POD a los portales correspondientes.
- [x] Añadir pruebas tRPC de autorización, auditoría y rechazo tenant para documentos, GPS y POD.
- [x] Añadir prueba automatizada de checkout limpio que verifica las 18 tablas de la migración inicial y la ausencia de DROP TABLE.
- [x] Revisar y corregir explícitamente la interfaz de login al español y comprobar cadenas residuales.
- [x] Ejecutar prueba real de checkout limpio aplicando la migración inicial sobre una base vacía sin tocar datos activos.
- [x] Alinear idioma regional por defecto a español y auditar uso consistente de DOP/RD$ en paneles visibles.
- [x] Completar UI de creación y asignación de rutas con sucursal y conductor reales.
- [x] Corregir la última cadena italiana del contrato de paradas y verificar localización completa del router visible.
- [ ] Iniciar una sesión válida de prueba y capturar desktop/móvil de `/admin`, `/sucursal`, `/driver` y `/cliente` autenticados para verificar cabeceras internas con el halcón.
- [ ] Ampliar `visual-verification.md` con hallazgos de cabeceras internas autenticadas; mantener esta verificación pendiente hasta contar con una sesión válida.
- [x] Implementar recepción, inspección, ubicación y despacho de paquetes con estado y ubicación tenant-scoped.
- [x] Reutilizar en paquetes las unidades configurables de peso y dimensión con normalización server-side a kg/cm.
- [x] Añadir pruebas de autorización y rechazo cross-tenant para operaciones de paquetes e inventario.

## Bloque de producción priorizado — continuación
- [x] Corregir el contrato REST de cotización y cubrir respuestas de validación, autenticación y rate limit; la tarifa ya no es controlable por el cliente y se resuelve por organización/servicio.
- [x] Completar recepción, inspección, pesaje y ubicación real de paquetes con estados explícitos, ubicación y auditoría.
- [x] Implementar inventario detallado por movimientos y consolidación/transferencias con carga, con tablas tenant-scoped y transición auditable.
- [x] Completar asignación de paradas y conductores y escaneo de código de barras tenant-scoped; el lector físico depende del dispositivo que envía el valor leído.
- [x] Implementar incidencias, intentos fallidos y devoluciones con auditoría, estados explícitos y rechazo cross-tenant.
- [x] Implementar cobro contra entrega, caja de sucursal, facturación y recibos en DOP, con validación tenant y auditoría financiera.
- [x] Separar compra asistida, mudanzas y carga pesada con reglas y datos propios.
- [ ] Endurecer offline cifrado con conflictos y rate limit distribuido con Redis en producción.
- [ ] Completar REST de envíos, pickups y tracking, además de configuración real de OAuth, storage, mapas y secretos.
- [ ] Añadir CI automático y conseguir pruebas visuales autenticadas de los cuatro portales.
- [x] Actualizar readiness, subir cambios a GitHub y emitir veredicto basado únicamente en pruebas ejecutadas; la verificación visual autenticada sigue separada y pendiente.
- [ ] Configurar `REDIS_URL` en el servidor de producción y validar conectividad TLS antes de activar rate limit distribuido.

- [x] Implementar REST tenant-scoped para creación de envíos, solicitudes de pickup y tracking privado con API key, scopes, versionado, validación y rate limiting.
- [x] Añadir pruebas Vitest de los contratos REST de envíos, pickups, tracking, autorización y aislamiento organizativo.
- [ ] Mantener pendiente la configuración real de Redis, OAuth, storage, mapas y secretos antes del GO de producción.
- [x] Completar UI y reglas específicas de mudanzas y carga pesada con requisitos de cuadrilla, vehículo, programación y validación de servicio.
- [x] Endurecer cola offline cifrada con metadatos de conflicto, reintento explícito, descarte seguro y protección contra doble sincronización.
- [x] Actualizar panel admin de API keys con scopes REST explícitos y textos operativos en español.
- [x] Exponer en `/driver` la bandeja de operaciones offline en conflicto con razón, reintento y descarte seguro.
- [x] Añadir workflow GitHub Actions para `pnpm check`, `pnpm test` y `pnpm build`, corregir la resolución de pnpm y verificar el commit `b0d7758` en verde.
- [x] Conectar el formulario POD del driver con la cola offline cifrada y sincronización al recuperar conexión, con clasificación de conflictos y pruebas técnicas verdes.
- [x] Recuperar automáticamente operaciones offline que quedaron en `syncing` tras una interrupción de la PWA y cubrirlo con prueba unitaria.
- [x] Integrar puntos GPS del driver con la cola offline cifrada, limitando la captura a referencia de envío/ruta y sincronizando al recuperar red.
- [x] Integrar puntos GPS del driver con la cola offline cifrada, limitando la captura a referencia de envío/ruta y sincronizando al recuperar red.
- [x] Limitar la capacidad de la cola offline y comunicar al driver cuando no pueda aceptar más puntos GPS, preservando operaciones críticas.
- [x] Limitar la capacidad de la cola offline y comunicar al driver cuando no pueda aceptar más puntos GPS, preservando operaciones críticas.
- [ ] Repetir verificación de checkout limpio con un usuario de base de datos con permisos CREATE/DROP aislados; la ejecución actual fue bloqueada por ER_DBACCESS_DENIED_ERROR sin tocar datos activos.
- [x] Alinear la prueba de migraciones con la línea base y validar que toda la cadena incremental no contenga operaciones destructivas.
- [x] Alinear la prueba de migraciones con la línea base y validar que toda la cadena incremental no contenga operaciones destructivas.
- [x] Añadir preflight server-side de producción que valide presencia de secretos críticos y exija REDIS_URL con TLS sin imprimir valores sensibles.
- [x] Añadir preflight server-side de producción que valide presencia de secretos críticos y exija REDIS_URL con TLS sin imprimir valores sensibles.
- [x] Hacer obligatorio el preflight antes del arranque production para fallar rápido ante configuración incompleta o REDIS_URL insegura.
- [x] Hacer obligatorio el preflight antes del arranque production para fallar rápido ante configuración incompleta o REDIS_URL insegura.
- [x] Sustituir clases de color hardcodeadas de landing/docs por tokens semánticos reales del tema, conservando el contraste claro/oscuro.
- [x] Sustituir clases de color hardcodeadas de landing/docs por tokens semánticos reales del tema, conservando el contraste claro/oscuro.
- [x] Ejecutar el preflight de producción en CI con valores sintéticos, verificando el camino exitoso sin exponer secretos reales.
- [x] Ejecutar el preflight de producción en CI con valores sintéticos, verificando el camino exitoso sin exponer secretos reales.
- [ ] Corregir manifest PWA a español, descripción operativa de GoPaq y colores semánticos compatibles con el tema actual.
- [x] Corregir manifest PWA a español, descripción operativa de GoPaq y colores semánticos compatibles con el tema actual.
- [x] Reemplazar las clases de color restantes de Home/docs (`text-slate-*`, `bg-orange-*`, `bg-slate-*` y bordes) por tokens semánticos o clases de marca basadas en variables CSS.
- [x] Ejecutar una pasada final de contraste claro/oscuro en landing/docs y documentar que no quedan colores hardcodeados fuera de acentos deliberados de marca.
- [ ] Completar y probar relaciones usuario↔sede/magazzino y enforcement granular de approve, refund, export y action-level.
- [ ] Ampliar dominio logístico con ventanas horarias de pickup, separación/reempaque, estados de compra asistida y campos completos de timeline (actor, sucursal, posición, motivo y evidencia).
- [ ] Documentar y testear el motor tarifario versionado completo y el estado offline persistente `rejected`.
- [x] Añadir `reason` explícito a shipment_events y al contrato tRPC appendEvent, preservando actor, sucursal, posición, evidencia, origen e idempotencia.
- [x] Validar `branchId` de appendEvent contra la organización activa y conservar actor, posición, evidencia, motivo, origen e idempotencia.
