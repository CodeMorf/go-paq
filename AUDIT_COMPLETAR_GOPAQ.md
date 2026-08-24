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
| Driver | Parcialmente funcional | Rutas asignadas, inicio/cierre de turno, paradas, escaneo protegido, GPS limitado a ruta `active`, entrega/POD, incidencias y cola offline cifrada | Faltan disponibilidad formal, gastos, conciliación visual autenticada y prueba real con cámara |
| Sucursal | Parcialmente funcional | Pickups, recepción/escaneo con cámara y fallback manual, almacén, paquetes, separación, reempaque, inventario, rutas, manifiestos, incidencias, finanzas y servicios especiales | Faltan fotos/etiquetas imprimibles, transferencias E2E y flujo autenticado completo |
| Super Admin | Parcialmente funcional | Perfil de organización, API keys, auditoría, rutas y paneles operativos reutilizables | Faltan gestión global de organizaciones, planes, usuarios, vehículos, zonas, tarifas e integraciones |
| API REST | Implementada parcialmente | Quotes, shipments, pickups y tracking con API key, scope, tenant isolation, rate limit y rechazo de tarifa ausente; `/docs-api` actualizado con `organizationSlug`/`zoneCode` | Falta cerrar idempotencia uniforme, request ID, webhooks firmados y documentos |
| Tenancy | Parcialmente reforzado | Helpers derivan la organización del contexto; `memberships.list/updateScope` muestra y valida branch/warehouse; permisos y ownership de rutas aplican scope activo | Falta una batería completa cross-tenant sobre base limpia y pruebas autenticadas del panel |
| Tarifas | Implementadas con límites | Catálogo server-side versionado con zonas, vigencia, divisor volumétrico, recargo, combustible, descuento, impuesto y moneda; REST y `quote.preview` rechazan tarifa ausente | Faltan pruebas de producción con catálogo real y validación visual admin autenticada |
| Offline | Implementada | AES-GCM, idempotencia, recuperación, conflictos, rechazo y límite de capacidad | Falta E2E con servidor real y pruebas móviles autenticadas |
| Infraestructura | No verificada completamente | Preflight exige secretos críticos y `rediss://` en producción | Faltan Redis TLS, OAuth, storage, mapas, observabilidad, retención y aceptación con credenciales reales |

## Esquema y migraciones

El esquema fuente se encuentra en `drizzle/schema.ts`. La cadena de migraciones versionada está en `drizzle/0000_*.sql` hasta `drizzle/0016_*.sql`, con snapshots y journal en `drizzle/meta/`. El repositorio también conserva un script de verificación de schema limpio. No se aplica ninguna migración destructiva durante esta auditoría.

La configuración documenta que una instalación limpia fue comprobada con 29 tablas. `PRODUCTION_READINESS.md` contenía una referencia histórica a 18 tablas; debe mantenerse alineada con la cifra actual de 29 para evitar evidencia contradictoria.

## Rutas y procedimientos existentes

El router principal contiene grupos para organización, memberships, autenticación, logística, agente, paquetes, inventario, consolidaciones, incidencias, intentos, pagos, caja, facturas, servicios, auditoría, documentos, API keys, GPS, cotización, rutas, manifiestos, sucursales, almacenes, pickups y tracking. Las rutas del Driver exponen `myAssigned`, `myStops` y `myStatus`; el backend restringe escaneo, paradas, intentos, POD y GPS a la asignación y al estado operativo correspondiente. La mutation `memberships.updateScope` es tenant-scoped, valida sucursal y almacén activos contra la organización activa y escribe auditoría de seguridad.

Las rutas React están registradas para `/`, `/admin`, `/sucursal`, `/driver`, `/cliente` y `/docs-api`. Los portales comparten `DashboardLayout` y muestran componentes funcionales cuando corresponde, pero también conservan acciones y tarjetas que informan que ciertos módulos están pendientes. Esas áreas no deben presentarse como terminadas hasta conectar sus procedimientos y validarlas con sesión real.

## Pruebas ejecutadas durante la auditoría

Se ejecutaron `pnpm exec tsc --noEmit`, `pnpm test -- --run` y `pnpm build`. El resultado observado fue TypeScript sin errores, **84 pruebas aprobadas y 2 omitidas** por la integración Shopify fuera de alcance, además de build de producción correcto. El build emitió únicamente una advertencia no bloqueante sobre chunks mayores a 500 kB.

No se ejecutó una prueba E2E autenticada completa del flujo `Cliente → cotización → envío → pickup → sucursal → almacén → manifiesto → driver → entrega → POD → tracking → documento → cobro`, porque requiere una sesión OAuth y datos/credenciales de infraestructura apropiados. Por tanto, ese flujo permanece pendiente y no se declara aprobado.

## Prioridad de implementación

La siguiente prioridad técnica debe ser completar el ciclo Cliente y Driver de gastos/conciliación, recepción con fotografía, etiquetas imprimibles, transferencias E2E y validación visual autenticada. Ya existen `approve` para servicios especiales, `refund` financiero, exportaciones protegidas, tarifas server-side, compra asistida, separación/reempaque y ownership de rutas Driver. Después deben cerrarse request IDs/idempotencia REST/webhooks, pruebas E2E autenticadas y la configuración de Redis TLS/OAuth/storage/mapas.

## Dependencias externas

La producción requiere `DATABASE_URL`, `JWT_SECRET`, OAuth real, Forge/storage, configuración de mapas y `REDIS_URL` con esquema `rediss://`. Ningún valor secreto se incorpora a este documento o al repositorio. El preflight debe ejecutarse antes del arranque productivo y la decisión GO/NO-GO debe basarse en logs verificables, no en pantallas vacías ni en datos ficticios.

## Hito Cliente — migración 0019

Se completó una primera superficie persistente del área Cliente sin datos simulados. La migración `0019_giant_talisman.sql` crea `customer_profiles`, `customer_addresses`, `customer_contacts` y `support_tickets`, todas con `organizationId` y `userId`. Las procedures `customer.profile`, `customer.addresses.*`, `customer.contacts.*` y `customer.tickets.*` aplican sesión protegida, ownership por usuario y organización activa; los tickets administrativos requieren `support_tickets:view/edit`, mientras que el cliente solo lista y crea sus propios casos. Cada alta o cambio relevante escribe auditoría tenant-scoped.

El portal `/cliente` ahora incluye perfil individual/empresarial, teléfono, identificación, idioma, libreta de direcciones con dirección predeterminada y desactivación lógica, contactos autorizados y centro de ayuda con categorías, prioridad y vínculo opcional a un envío propio. `/admin` y `/sucursal` incluyen una vista de soporte que permite actualizar estados con permisos explícitos. Los estados vacíos y errores de red se muestran sin inventar registros.

La validación más reciente observada ejecutó `pnpm check`, `pnpm test -- --run` y `pnpm build`: TypeScript sin errores, **94 pruebas aprobadas y 2 omitidas** por Shopify fuera de alcance, y build de producción correcto. La captura de `/cliente` sin sesión confirmó el acceso protegido; no se ha afirmado una prueba autenticada porque OAuth real y una sesión de prueba aún no están disponibles.

Se añadió además captura opcional de fotografía de recepción desde Sucursal con `capture="environment"`, límite de 10 MB y subida como documento `receipt` a storage seguro. El panel de etiquetas selecciona paquetes reales y genera QR y Code128 desde `packageCode`, con impresión del navegador; no muestra etiquetas cuando no existe un paquete registrado.

La validación del hito de etiquetas observó `pnpm check`, 94 pruebas aprobadas y 2 omitidas por Shopify fuera de alcance, y build de producción correcto. La advertencia restante es el tamaño del bundle frontend, no un error de compilación.

El veredicto permanece **NO-GO para operación productiva** hasta configurar y verificar Redis TLS, OAuth, storage, mapas y secretos, completar el checkout limpio con usuario de base de datos autorizado y ejecutar la caminata E2E autenticada en los cuatro portales y dispositivos con cámara. Los nuevos módulos reducen los faltantes funcionales, pero no sustituyen esas verificaciones de infraestructura y seguridad.

## Hito API REST — idempotencia y trazabilidad

La API pública de envíos y recogidas ahora requiere `Idempotency-Key` de 8 a 120 caracteres. La tabla `api_idempotency_keys` de la migración 0020 guarda el hash del payload, método, ruta, organización, API key, respuesta y expiración de 24 horas, con clave única tenant-scoped. Las repeticiones reproducen la respuesta original; una clave con payload diferente devuelve `409 idempotency_conflict`, una operación en curso devuelve `409 idempotency_in_flight` y una reserva no disponible devuelve `503`.

Todas las rutas REST documentadas exponen `requestId` en el cuerpo y `X-Request-Id` en headers. Las pruebas de contrato cubren clave ausente, creación, replay, conflicto, liberación en error y trazabilidad. La validación observada queda en **99 pruebas aprobadas y 2 omitidas** por Shopify fuera de alcance, con TypeScript correcto; el hash se calcula con serialización canónica recursiva para evitar conflictos falsos por orden de propiedades. La build completa anterior fue correcta y debe repetirse en el siguiente checkpoint si se modifican dependencias de producción.


## Nota de compatibilidad TiDB — audit_logs

Se evaluó reforzar `audit_logs` con triggers `BEFORE UPDATE` y `BEFORE DELETE` en una migración 0021. La base TiDB conectada rechazó `CREATE TRIGGER` con `ERROR 1064`; la migración experimental fue retirada y no se dejó un artefacto desplegable incompatible. Por tanto, el estado actual es **append-only a nivel de aplicación**: no hay rutas de aplicación para actualizar o borrar auditoría, pero la garantía de inmutabilidad a nivel de motor sigue pendiente de una estrategia compatible con TiDB, como control de privilegios del usuario de base de datos, tabla de archivo administrada externamente o hash-chain transaccional.

## Hito de trazabilidad REST — api_request_logs

La migración 0021 añade `api_request_logs` con `requestId` único, método, ruta, status, resultado, código de error opcional, clave de idempotencia y referencias opcionales a organización/API key. Un middleware REST registra automáticamente el resultado al finalizar cada request y no persiste cuerpos de solicitudes ni respuestas, reduciendo exposición de datos sensibles. La cobertura de migraciones y contratos alcanza **100 pruebas aprobadas y 2 omitidas** por Shopify fuera de alcance; TypeScript y build de producción pasan, con el warning no bloqueante del bundle frontend grande.

## Consulta administrativa de logs REST

El portal `/admin` incorpora `ApiRequestLogPanel`, que consulta `apiLogs.list` con permiso `audit:view`, filtro opcional por status y ruta, scope obligatorio por organización y límite server-side de 200 registros. La interfaz muestra fecha, request ID, método, ruta y resultado, pero no cuerpos, tokens ni secretos. TypeScript, contratos seleccionados y build de producción pasan.

## Panel administrativo de trazabilidad REST

`/admin` ahora incluye un panel para consultar `api_request_logs` con filtros por código HTTP y ruta. La procedure `apiLogs.list` exige `audit:view`, deriva la organización desde la sesión autenticada, limita la consulta a 200 registros y no expone cuerpos, tokens ni secretos. La validación posterior a la integración mantiene TypeScript correcto, **100 pruebas aprobadas y 2 omitidas** por Shopify, además de build de producción correcta con el warning no bloqueante del bundle grande.

## Cobertura adicional del motor tarifario

Se amplió `tariffEngine.test.ts` para comprobar divisor volumétrico configurable, peso facturable, mínimo tarifario y el orden de recargo de combustible, descuento e impuesto, con redondeo monetario a dos decimales. La suite alcanza **101 pruebas aprobadas y 2 omitidas** por Shopify. Esta cobertura es determinista y no sustituye tarifas reales completas por organización ni una validación financiera E2E autenticada.
