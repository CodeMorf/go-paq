# Auditoría de completitud de GoPaq

**Fecha de auditoría:** 24 de agosto de 2026  
**Repositorio:** `CodeMorf/go-paq`  
**Atribución:** **By CodeMorf.tech**

## Veredicto de auditoría

GoPaq es una base fullstack avanzada con un núcleo logístico conectado a base de datos, tRPC, API REST, permisos por acción, auditoría, PWA offline y componentes de operación. El estado correcto continúa siendo **NO-GO para producción operativa con clientes, cobros o paquetes reales**, porque existen funciones sin completar, pruebas autenticadas pendientes y dependencias de infraestructura real que no están verificadas en este entorno.

No se encontraron indicios de que deban crearse tablas duplicadas. El esquema actual ya contiene organizaciones, sucursales, memberships, envíos, paquetes, servicios, eventos, pickups, rutas, paradas, manifiestos, tarifas, almacenes, inventario, incidentes, intentos, pagos, caja, facturas, recibos, documentos, tracking, API keys, permisos y auditoría.

## Inventario técnico comprobado

| Superficie | Estado observado | Evidencia | Riesgo o dependencia |
| --- | --- | --- | --- |
| Cliente | Parcialmente funcional | Cotizador, solicitud de pickup, tracking, documentos, lista de envíos y servicios especiales conectados a tRPC | Faltan perfil, direcciones, contactos, checkout/saldo, tickets y devoluciones completos |
| Driver | Parcialmente funcional | GPS con consentimiento, entrega/POD, incidencias y cola offline cifrada | Faltan ciclo completo de turno, disponibilidad, gastos y conciliación visual autenticada |
| Sucursal | Parcialmente funcional | Pickups, almacén, paquetes, inventario, rutas, manifiestos, incidencias, finanzas y servicios especiales | Faltan recepción integral, separación, reempaque, etiquetas imprimibles y flujo E2E autenticado |
| Super Admin | Parcialmente funcional | Perfil de organización, API keys, auditoría, rutas y paneles operativos reutilizables | Faltan gestión global de organizaciones, planes, usuarios, vehículos, zonas, tarifas e integraciones |
| API REST | Implementada parcialmente | Quotes, shipments, pickups y tracking con API key, scope, tenant isolation y rate limit | Falta cerrar idempotencia uniforme, request ID, webhooks firmados y documentos |
| Tenancy | Parcialmente reforzado | Helpers derivan la organización del contexto; `memberships.updateScope` valida branch/warehouse | Falta UI administrativa para memberships y una batería completa cross-tenant sobre base limpia |
| Tarifas | Implementadas con límites | Cotización server-side con catálogo y reglas de servicios especiales | Falta motor completo versionado por zonas, descuentos, impuestos, combustible y monedas |
| Offline | Implementada | AES-GCM, idempotencia, recuperación, conflictos, rechazo y límite de capacidad | Falta E2E con servidor real y pruebas móviles autenticadas |
| Infraestructura | No verificada completamente | Preflight exige secretos críticos y `rediss://` en producción | Faltan Redis TLS, OAuth, storage, mapas, observabilidad, retención y aceptación con credenciales reales |

## Esquema y migraciones

El esquema fuente se encuentra en `drizzle/schema.ts`. La cadena de migraciones versionada está en `drizzle/0000_*.sql` hasta `drizzle/0013_*.sql`, con snapshots y journal en `drizzle/meta/`. El repositorio también conserva un script de verificación de schema limpio. No se aplica ninguna migración destructiva durante esta auditoría.

La configuración documenta que una instalación limpia fue comprobada con 29 tablas. `PRODUCTION_READINESS.md` contenía una referencia histórica a 18 tablas; debe mantenerse alineada con la cifra actual de 29 para evitar evidencia contradictoria.

## Rutas y procedimientos existentes

El router principal contiene grupos para organización, memberships, autenticación, logística, agente, paquetes, inventario, consolidaciones, incidencias, intentos, pagos, caja, facturas, servicios, auditoría, documentos, API keys, GPS, cotización, rutas, manifiestos, sucursales, almacenes, pickups y tracking. La mutation `memberships.updateScope` es tenant-scoped, valida sucursal y almacén activos contra la organización activa y escribe auditoría de seguridad.

Las rutas React están registradas para `/`, `/admin`, `/sucursal`, `/driver`, `/cliente` y `/docs-api`. Los portales comparten `DashboardLayout` y muestran componentes funcionales cuando corresponde, pero también conservan acciones y tarjetas que informan que ciertos módulos están pendientes. Esas áreas no deben presentarse como terminadas hasta conectar sus procedimientos y validarlas con sesión real.

## Pruebas ejecutadas durante la auditoría

Se ejecutaron `pnpm exec tsc --noEmit`, `pnpm test -- --run` y `pnpm build`. El resultado observado fue TypeScript sin errores, **68 pruebas aprobadas y 2 omitidas** por la integración Shopify fuera de alcance, además de build de producción correcto. El build emitió únicamente una advertencia no bloqueante sobre chunks mayores a 500 kB.

No se ejecutó una prueba E2E autenticada completa del flujo `Cliente → cotización → envío → pickup → sucursal → almacén → manifiesto → driver → entrega → POD → tracking → documento → cobro`, porque requiere una sesión OAuth y datos/credenciales de infraestructura apropiados. Por tanto, ese flujo permanece pendiente y no se declara aprobado.

## Prioridad de implementación

La siguiente prioridad técnica debe ser cerrar permisos sensibles (`approve`, `refund`, `export`), crear la interfaz administrativa de memberships, completar recepción/separación/reempaque y terminar el ciclo financiero de devoluciones. Después deben cerrarse request IDs/idempotencia REST/webhooks, pruebas E2E autenticadas y la configuración de Redis TLS/OAuth/storage/mapas.

## Dependencias externas

La producción requiere `DATABASE_URL`, `JWT_SECRET`, OAuth real, Forge/storage, configuración de mapas y `REDIS_URL` con esquema `rediss://`. Ningún valor secreto se incorpora a este documento o al repositorio. El preflight debe ejecutarse antes del arranque productivo y la decisión GO/NO-GO debe basarse en logs verificables, no en pantallas vacías ni en datos ficticios.
