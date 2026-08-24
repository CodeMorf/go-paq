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
- [ ] Implementare pickup, tentativi, finestre orarie, assegnazioni, route stop e manifest.
- [ ] Implementare flusso locale, nazionale e internazionale con origine, destinazione, dogana e documenti.
- [ ] Implementare consolidamento, separazione, reimballaggio, trasferimenti tra filiali e ubicazioni di magazzino.
- [ ] Implementare macchina degli stati separata per commerciale, fisico, trasporto, finanziario, acquisto assistito e incidenti.
- [ ] Implementare timeline di eventi con attore, timestamp UTC, filiale, posizione, motivo, evidenza e origine.
- [ ] Implementare motore tariffe versionato con peso, volume, distanza, zona, servizio, supplementi, tasse, sconti e valuta.

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
- [ ] Implementare coda offline locale cifrata con idempotenza, stati sincronizzato/in attesa/conflitto/rifiutato.
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
