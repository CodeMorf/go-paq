# GoPaq — Codex Production Roadmap

This file is the execution contract for finishing GoPaq for production.

## Objective

Finish GoPaq end-to-end with real authentication, tenant isolation, persistent business operations, dedicated service engines, demo access, production deployment, public website at `gopaq.lat`, and automated verification of all critical functions.

## 1. Dedicated login routes

Implement separate real login screens backed by the same secure authentication backend and strict role guards:

- `/super-admin/login` — SUPER_ADMIN / OWNER / ADMIN / OPERATIONS
- `/portal/login` — CLIENT / CUSTOMER
- `/sucursal/login` — BRANCH_MANAGER / MANAGER / COUNTER / DISPATCHER / WAREHOUSE / CASHIER
- `/driver/login` — DRIVER / COURIER

`/login` may remain as an access selector.

Every login must use backend authentication, hashed passwords, signed sessions/JWT, rate limiting, secure logout, session expiration, tenant context, audit logs and server-side authorization. Never rely on client-side role switches.

## 2. Public GoPaq website

Build the real public website at `https://gopaq.lat/`.

Use the visual style/UX of `nomina.allsender.tech` as a design reference, while implementing GoPaq branding and original code. If the reference cannot be accessed automatically, use owner-provided screenshots/design tokens or recreate the same visual language manually.

Required public routes:

- `/`
- `/servicios`
- `/servicios/envios`
- `/servicios/courier-internacional`
- `/servicios/mudanzas`
- `/servicios/carga-pesada`
- `/servicios/ultima-milla`
- `/rastreo`
- `/cotizar`
- `/sucursales`
- `/nosotros`
- `/contacto`
- `/login`

Use `src/components/ui/GoPaqLogo.tsx` consistently. Do not replace the official logo with placeholders.

Public CTAs must connect to real tracking, quote, registration and login flows.

## 3. Demo/test access

Create an isolated demo tenant, e.g. `org-demo`.

Provide one-click `Acceso de prueba` on each login surface:

- Super Admin demo
- Client demo
- Branch demo
- Driver demo

Demo data must be clearly marked, resettable and completely isolated from production customers. Destructive/demo financial actions must remain sandboxed.

## 4. Separate professional engines

Move business rules out of a giant frontend context. UI -> API -> Engine -> DB -> events.

Required bounded engines/modules:

1. Identity & Tenant Engine
2. Shipment Engine
3. Rating Engine
4. Routing & Dispatch Engine
5. Driver Field Engine
6. Branch & Warehouse Engine
7. COD & Billing Engine
8. International Courier Engine
9. Moving Engine
10. Heavy Cargo Engine
11. Tracking & Notification Engine
12. Omnichannel / AI Automation Engine
13. Integration / Webhook Engine
14. Public Quote / Tracking Gateway

Each engine owns its contracts, validation, state machine, persistence and tests.

## 5. Open-source integrations

Evaluate and integrate only where they improve production quality. Keep license boundaries documented.

Recommended stack:

- Karrio — self-hosted multi-carrier shipping API behind an HTTP adapter.
- Valhalla + OpenStreetMap — primary routing/matrix engine.
- Photon — geocoding/autocomplete/reverse geocoding.
- PostgreSQL + PostGIS — production data/geospatial target after completing async DB migration.
- Redis + durable queue — jobs, retries, notifications, webhook delivery, provider sends and reconciliation.
- OpenStreetMap-compatible production tile provider/self-hosted tiles for maps.

Do not copy AGPL/GPL service code into GoPaq core. Use network-service boundaries and verify license obligations.

## 6. Driver App

Keep Driver App in React first. Make it mobile-first and PWA-ready so native wrapping/migration remains possible later.

Required:

- real `/driver/login`
- backend manifest
- GPS permission + real telemetry
- POD camera/photo
- signature capture
- QR/barcode scanner where browser support exists
- click-to-call/navigation intents
- offline outbox with idempotency
- route start/finish
- stop completion/failure/reschedule
- COD collection
- background/resume-safe sync where supported
- no fake GPS/network/provider success in production

Driver must receive tasks from local delivery, international final-mile, moving, heavy cargo, returns/pickups and branch transfers in one unified manifest.

## 7. End-to-end service flows

Prove these flows in automated tests:

1. Client login -> quote -> shipment -> tracking.
2. Branch receiving -> scan -> inventory -> dispatch.
3. Dispatcher -> route optimization -> driver assignment -> dispatch.
4. Driver -> route -> POD -> COD.
5. Admin -> live status -> COD ledger.
6. Driver COD -> branch custody -> merchant settlement.
7. International locker -> package -> consolidation -> delivery.
8. Moving quote -> booking -> crew/vehicle -> route -> POD.
9. Heavy cargo quote -> equipment -> dispatch -> POD.
10. Public tracking returns canonical shipment events.
11. API key access obeys scopes.
12. Webhook signing/retry/delivery logging works.

## 8. Remove production mocks

Audit all `.ts` and `.tsx` files for:

- `MOCK_`
- `mockData`
- `mockAutomationRules`
- `Math.random()` used for business data
- fake GPS jitter
- fake provider success/ping
- hardcoded customer/branch IDs
- local-only CRUD that claims persistence
- `setTimeout` used to imitate providers/network
- placeholder phones/addresses/DNI treated as real
- buttons that only produce a toast

Keep simulation only behind explicit demo mode and never enable it in production.

## 9. Security requirements

- strict `organization_id` isolation
- RBAC/API scopes on server
- schema validation on requests
- rate limiting
- secure headers
- explicit production CORS
- secret manager/environment variables
- encrypted sensitive integration configuration
- HMAC webhook signatures
- no credentials/tokens in logs
- idempotency for critical writes
- immutable/auditable financial mutations
- health + readiness endpoints
- migrations, not ad-hoc production schema creation
- backup/restore documentation

## 10. Testing gate

Codex must test every critical function and route.

Required:

- engine unit tests
- endpoint integration tests
- tenant isolation tests
- RBAC negative tests
- state-machine tests
- COD consistency tests
- route/POD idempotency tests
- webhook tests
- provider-unavailable tests
- frontend critical component tests
- Playwright E2E for every login and main workflows
- mobile Driver App E2E
- public site tracking/quote E2E
- demo tenant tests
- migration tests
- Docker smoke tests

CI must run typecheck/lint, tests, E2E smoke, build, migrations and Docker validation. Do not merge with red required checks.

## 11. Production URL topology

Target:

- `https://gopaq.lat/`
- `https://gopaq.lat/super-admin/login`
- `https://gopaq.lat/super-admin/*`
- `https://gopaq.lat/portal/login`
- `https://gopaq.lat/portal/*`
- `https://gopaq.lat/sucursal/login`
- `https://gopaq.lat/sucursal/*`
- `https://gopaq.lat/driver/login`
- `https://gopaq.lat/driver/*`
- `https://gopaq.lat/docs/api/*`
- `/api/v1/*`

Deployment must include TLS, reverse proxy, migrations, persistent services, health checks, backups, observability/log rotation and rollback instructions.

## 12. Definition of done

GoPaq is only production-ready when:

- every primary UI route uses real persisted data;
- all four login surfaces are real and role-isolated;
- demo access is safe and isolated;
- `gopaq.lat` public website is complete/responsive;
- official GoPaq logo is used consistently;
- shipments, routes, branches, driver, COD, international, moving and heavy cargo are end-to-end;
- every service has a separated engine/module contract;
- integrations expose actual health, not simulated success;
- no operational mock fallback runs in production;
- database migrations are reproducible;
- OpenAPI/docs match behavior;
- CI and E2E suites are green;
- security and tenant-isolation tests pass.

## Codex working rules

Implement in small reviewable commits and phases. Run tests after every phase. Fix regressions before starting the next phase. Keep PR checklist/evidence updated. If blocked only by third-party credentials, DNS, physical hardware or an external account, finish the adapter/UI/error state and document exactly what the owner must provide; do not leave a fake implementation.

Master tracking issue: `#4`.
