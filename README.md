# GoPaq

## Logística puerta a puerta para República Dominicana

**GoPaq** es una plataforma logística multiempresa y multisucursal orientada a operaciones reales de courier, casilleros internacionales, envíos locales y nacionales, recogidas, entregas, fulfillment, tracking GPS y servicios especiales. La experiencia principal está localizada para República Dominicana (`es-DO`) y utiliza DOP como moneda operativa predeterminada.

> **By CodeMorf.tech** — ingeniería de producto, arquitectura y evolución de la plataforma GoPaq.

La plataforma está diseñada para conectar clientes, sucursales, almacenes, conductores y administración en una operación auditable. Incluye portales web y PWA para `/admin`, `/sucursal`, `/driver` y `/cliente`, además de documentación pública para integraciones en `/docs-api`.

## Estado actual

GoPaq se encuentra en desarrollo avanzado sobre staging. El núcleo operativo y la API REST ya cuentan con aislamiento por organización, permisos por recurso y acción, auditoría, cotización, pickups, creación/edición/cancelación de envíos, tracking, rutas, manifiestos, inventario, cobros, facturación, documentos y servicios especiales. El portal Super Admin incorpora gestión global de organizaciones y estados, separada de la operación tenant-scoped.

La ejecución con clientes, cobros o paquetes reales requiere completar la configuración de infraestructura y las validaciones autenticadas descritas en [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md). En particular, el entorno productivo debe proporcionar una conexión Redis TLS válida, secretos OAuth reales y una sesión de base de datos con permisos de migración verificables. El proyecto no incluye datos de clientes, reseñas, testimonios ni credenciales ficticias.

## Capacidades principales

| Área | Implementación |
| --- | --- |
| Multi-tenant | Organización activa, sucursales, almacenes, memberships y filtros tenant-scoped. |
| Operación | Envíos, paquetes, pickups, intentos de entrega, rutas, paradas, manifiestos, consolidaciones e inventario. |
| Servicios | Local, nacional, internacional, compra asistida, mudanzas y carga pesada. |
| Seguimiento | Tracking público minimizado, timeline privado, puntos GPS y evidencia de entrega. |
| PWA driver | Cola offline cifrada con AES-GCM, idempotencia, recuperación, conflictos, rechazo y límite de capacidad. |
| Seguridad | OAuth Manus, permisos por recurso/acción, API keys revocables, scopes, rate limiting Redis y auditoría. |
| Finanzas | Caja de sucursal, cobros contra entrega, recibos, facturas y estados financieros. |
| Integraciones | Google Maps, almacenamiento seguro, agente LLM asistido, API REST versionada y trazabilidad de requests. |
| Identidad | Marca GoPaq Hawk, interfaz en español, tema claro predeterminado y tema oscuro opcional. |

## Arquitectura

El proyecto utiliza React 19 y Tailwind CSS 4 en el cliente, Express 4 y tRPC 11 para el servidor, Drizzle ORM con MySQL/TiDB para persistencia y Redis para rate limiting distribuido. Los procedimientos tRPC son el contrato principal entre frontend y backend; la API REST pública se encuentra bajo `/api/v1`.

```text
client/                 Portales React, PWA, layout y componentes reutilizables
client/src/pages/       Superficies públicas y portales operativos
drizzle/schema.ts       Modelo de datos y estados de dominio
server/db.ts            Helpers tenant-scoped y persistencia
server/routers.ts       Contratos tRPC y enforcement de permisos
server/publicApi.ts     API REST autenticada para integradores
server/_core/           OAuth, contexto, storage, mapas, LLM y runtime
server/*\.test.ts       Pruebas unitarias y de integración Vitest
scripts/                Preflight y utilidades de validación
```

Las migraciones se generan desde el esquema Drizzle y se aplican mediante el flujo controlado del proyecto. Las operaciones destructivas sobre datos productivos deben evitarse y revisarse antes de ejecutarse.

## Portales

El portal `/admin` concentra la configuración de la organización, gestión global Super Admin de organizaciones, permisos, API keys, auditoría, perfiles, rutas, documentos y supervisión operativa. `/sucursal` está orientado a recepción, pickups, inventario, almacenes, manifiestos, caja y movimientos de paquetes. `/driver` es una PWA móvil para rutas, paradas, escaneo, GPS, POD y operación offline. `/cliente` permite cotizar, crear envíos, solicitar pickups, consultar tracking y revisar documentos autorizados. `/docs-api` documenta autenticación, scopes, formatos, errores, versionamiento y ejemplos de integración.

## API pública

La API utiliza Bearer API keys revocables, scopes explícitos, aislamiento por organización, rate limiting distribuido y respuestas JSON versionadas. Las rutas principales verificadas cubren cotizaciones, envíos, pickups y tracking. Los destinos webhook se administran por organización, usan HTTPS, secretos cifrados y firma HMAC; los eventos operativos de shipment, tracking, entrega e incidentes ya pueden disparar entregas automáticas. El contrato REST webhook y la cola externa de reintentos siguen pendientes.

```bash
curl -X POST https://tu-dominio.example/api/v1/quotes \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"national","originCountry":"DO","destinationCountry":"DO","weightKg":2.5}'
```

Las claves deben almacenarse fuera del código fuente y limitarse al mínimo de scopes requerido por cada integración. Nunca se deben registrar secretos, tokens completos ni datos sensibles en logs o issues.

## Desarrollo local

Requisitos recomendados: Node.js 22, pnpm, una base MySQL/TiDB compatible y las variables de entorno del proyecto. Después de clonar el repositorio, instala dependencias y ejecuta el servidor de desarrollo:

```bash
gh repo clone CodeMorf/go-paq
git checkout main
pnpm install
pnpm dev
```

Comandos de validación disponibles:

```bash
pnpm exec tsc --noEmit
pnpm test -- --run
pnpm build
pnpm preflight
```

`pnpm preflight` debe ejecutarse con `NODE_ENV=production` antes de iniciar producción. Comprueba la presencia de secretos críticos y exige una URL Redis con TLS sin imprimir valores sensibles.

## Configuración requerida

Las variables de entorno se administran mediante el entorno de despliegue y nunca deben confirmarse en Git. Entre las variables críticas se encuentran `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` y `REDIS_URL` con esquema TLS (`rediss://`) en producción.

Las integraciones de mapas, storage y LLM deben conectarse mediante las configuraciones proporcionadas por la plataforma. Para el entorno productivo también se deben verificar OAuth real, Redis TLS, permisos de base de datos, storage y claves de mapas. Consulta [`PRODUCTION_CONFIGURATION.md`](./PRODUCTION_CONFIGURATION.md) y [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) antes de habilitar tráfico real.

## Seguridad y operación

Cada consulta y mutation operativa debe resolver la organización activa desde el contexto autenticado. Las acciones sensibles requieren permisos específicos como `view`, `create`, `edit`, `approve`, `assign`, `collect`, `refund`, `export` o `configure`, según el recurso. Los eventos operativos, financieros, de seguridad y de agente se registran en auditoría tenant-scoped.

La cola offline del conductor no autoriza localmente pagos ni confirmaciones sensibles. Las operaciones offline se cifran en el dispositivo, se sincronizan con idempotencia y pueden quedar en conflicto o rechazadas para revisión. La recolección GPS debe limitarse a una sesión operativa autorizada y respetar el consentimiento mostrado al conductor.

## Pruebas y calidad

La suite Vitest cubre autenticación, API keys, rate limiting, permisos, aislamiento, GPS, estados de paquetes y envíos, cancelación comercial, manifiestos, agente LLM, autorización Super Admin, firma HMAC de webhooks, migraciones, logs REST, consulta REST de entregas y cola offline: 113 pruebas aprobadas y 2 Shopify omitidas en la validación actual. Antes de cada cambio relevante se recomienda ejecutar TypeScript, tests y build; antes de un release se debe realizar además una validación autenticada de los portales en desktop y móvil.

El proyecto documenta de forma explícita los elementos que todavía dependen de infraestructura o de una sesión autenticada. Esta transparencia es intencional: una prueba de staging o una interfaz sin sesión no debe presentarse como evidencia de producción con datos reales.

## Documentación del proyecto

| Documento | Propósito |
| --- | --- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Límites de arquitectura, módulos y decisiones principales. |
| [`PRODUCTION_CONFIGURATION.md`](./PRODUCTION_CONFIGURATION.md) | Variables, integraciones y configuración de despliegue. |
| [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) | Checklist vivo de preparación para producción. |
| [`VISUAL_VALIDATION.md`](./VISUAL_VALIDATION.md) | Evidencia y pendientes de validación visual. |
| [`docs/PRIVACY_AND_RETENTION.md`](./docs/PRIVACY_AND_RETENTION.md) | Controles operativos de privacidad, minimización y retención. |
| [`docs/PRODUCTION_MIGRATION_AND_DEPLOYMENT.md`](./docs/PRODUCTION_MIGRATION_AND_DEPLOYMENT.md) | Migración limpia, backups, rollback y criterio de salida. |
| [`todo.md`](./todo.md) | Historial de funcionalidades completadas y trabajo pendiente. |

## Licencia y contacto

El código y la configuración de este repositorio pertenecen al proyecto GoPaq y deben gestionarse conforme a los acuerdos del equipo propietario. Para información de producto, ingeniería o colaboración, consulta **CodeMorf.tech**.

**GoPaq — logística clara, trazable y puerta a puerta.**
