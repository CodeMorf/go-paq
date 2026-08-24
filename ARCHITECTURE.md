# GoPaq — Architettura della prima release

## Obiettivo

GoPaq è una piattaforma logistica multi-azienda e multi-filiale. La prima release costruisce un nucleo unico per identità, organizzazioni, filiali, spedizioni, pacchi, eventi auditabili e portali dedicati. L’interfaccia pubblica serve clienti e partner; le aree protette separano l’esperienza operativa di amministratori, filiali, autisti e clienti.

| Area | Percorso | Responsabilità |
| --- | --- | --- |
| Web pubblico | `/` | Servizi, copertura, quotazione e tracking pubblico protetto |
| Amministrazione | `/admin` | Organizzazioni, utenti, filiali, servizi, tariffe, flotte e KPI |
| Filiale | `/sucursal` | Ricezione, scansione, magazzino, manifest e trasferimenti |
| Driver PWA | `/driver` | Turno, incarichi, GPS, rotta, POD, incassi e offline |
| Cliente | `/cliente` | Preventivi, spedizioni, tracking, documenti e notifiche |
| API | `/docs-api` | Contratti, autenticazione, esempi, eventi e webhooks |

## Principi di sicurezza

Ogni record di dominio contiene `organizationId` quando appartiene a un’azienda. Le procedure protette devono risolvere l’appartenenza dell’utente e aggiungere il filtro organizzativo alla query; il client non può scegliere liberamente l’organizzazione di lettura o modifica. I ruoli descrivono il contesto operativo, mentre le autorizzazioni granulari descrivono l’azione consentita. Le prove di consegna, gli incassi, le modifiche di stato e le azioni dell’agente sono eventi append-only con attore e contesto.

## PWA e connettività instabile

La PWA registra un service worker con cache della shell. Le operazioni driver future dovranno usare una coda locale con chiave idempotente e stato esplicito. La cache non deve mai far apparire come confermati pagamenti, consegne o transizioni che il server non ha validato.

## Integrazioni configurabili

| Integrazione | Uso | Stato prima release |
| --- | --- | --- |
| Mappe e geocoding | Rotte, fermate, GPS e indirizzi | Predisposta tramite componente Maps |
| Storage | Foto POD, documenti ed etichette | Predisposto tramite storage sicuro |
| Notifiche | Aggiornamenti a cliente e team | Predisposto tramite API built-in |
| LLM | Supporto, estrazione e classificazione | Predisposto tramite proxy server-side |
| Pagamenti | Tariffe, saldi e contrassegno | Da collegare con credenziali dell’azienda |
| SMS/WhatsApp/email | Comunicazioni operative | Da collegare con provider e credenziali |

Le credenziali non vanno inserite nel codice o nel client. Ogni provider esterno deve essere incapsulato in un adattatore con gestione di errori, timeout, audit e modalità disattivabile per organizzazione.

## Confini della prima release

La prima release rende verificabili il routing, il tema GoPaq, il modello dati centrale, l’accesso protetto, la base PWA e l’impostazione dei portali. Pagamenti, tracking realtime, webhook firmados, mappe operative, documenti generati e agente LLM cuentan con componentes conectados en staging, pero requieren credenciales reales y pruebas de integración antes de producción; no se sustituyen por datos ficticios ni integraciones simuladas.
