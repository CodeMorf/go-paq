# GoPaq: operación de producción

## Arquitectura vigente

El despliegue usa Docker Compose en una red privada (`gopaq_private`) con:

- `gopaq-api`: API Node/Express y build Vite servido por el mismo proceso.
- `gopaq-worker`: colas BullMQ, outbox, realtime Redis y webhooks.
- `gopaq-migrate`: migraciones explícitas antes de iniciar API/worker.
- `postgres`: `postgis/postgis:18-3.6`, PostgreSQL 18 con PostGIS 3.6.
- `redis`: Redis con contraseña, AOF, sin puerto publicado al host.
- Nginx/aaPanel existente: único punto público para `80` y `443`, con proxy hacia `127.0.0.1:4000`.

La versión actualmente verificada en producción es `378bb49`. El vhost de GoPaq se mantiene separado del resto de sitios del VPS; antes de ajustar el límite de solicitud se creó una copia fechada y se validó/recargó únicamente el Nginx que ya atiende `gopaq.lat`. El límite vigente del vhost es `client_max_body_size 4m` para dejar margen al transporte base64 de fotos/POD comprimidas.

PostgreSQL es la fuente persistente de verdad. Redis se usa para colas, locks, rate limiting y realtime; no contiene el estado definitivo de envíos, POD, COD o pagos.

En producción el rate limiting de autenticación y API pública usa Redis mediante ventanas fijas atómicas; si Redis no responde, autenticación no se degrada silenciosamente y el endpoint de readiness queda no listo.
El endpoint de readiness solo expone estado (`ok`, motor, PostGIS y configuración de Redis); los errores crudos de conexión se conservan en logs del servicio y no se devuelven al navegador en producción. El API también drena HTTP, WebSocket, Redis y PostgreSQL durante SIGTERM/SIGINT antes de salir.

## Directorios y secretos

- Aplicación: `/opt/gopaq`.
- Variables privadas: `/opt/gopaq/.env.production`, modo `0600`, nunca en Git.
- Evidencia POD: volumen Docker `gopaq_uploads`, montado en `/app/data/uploads`.
- Datos PostgreSQL: volumen Docker `gopaq_postgres_data`.
- Datos Redis: volumen Docker `gopaq_redis_data`.
- Backups: `/var/backups/gopaq`, modo `0700`, con retención de 14 días.

Variables críticas: `DATABASE_URL` (generada por Compose), `REDIS_URL` (generada por Compose), `JWT_SECRET`, `SESSION_SECRET`, `WEBHOOK_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `CORS_ORIGINS`, `DEMO_ACCESS_ENABLED` y `GOPAQ_PUBLIC_ORG_ID`.

No se registran contraseñas, tokens JWT completos ni secretos de proveedores.

La credencial de navegador de Google Maps se configura desde `/super-admin/configuracion`, no se compila dentro de Vite ni se guarda en Git. Se almacena cifrada en `organization_integration_credentials` con el protector de `WEBHOOK_ENCRYPTION_KEY`; el panel solo muestra una pista enmascarada. El endpoint público `/api/v1/configuration/maps` entrega esa clave únicamente al mapa público del tenant configurado, por lo que la clave debe tener restricciones HTTP referrer para `https://gopaq.lat/*` y solo las APIs necesarias. Si no existe una clave guardada, el estado correcto es `NO CONFIGURADO`.
La migración `014_normalize_geography_active` corrige instalaciones históricas que tenían `countries.active`, `provinces.active` y `service_zones.active` como booleanos. Quita el default booleano, convierte los valores a `INTEGER 0/1` y repone el default `1` dentro de la misma transacción; en una base nueva es un no-op seguro.
Las migraciones `015_operational_query_indexes` y `016_cod_shipment_index` se ejecutan desde el runner PostgreSQL bajo el mismo advisory lock. La versión 016 añade el índice tenant-aware para conciliación COD por envío; ambas son aditivas y no modifican datos de negocio.
Las coordenadas se administran en la misma sección de configuración mediante `PATCH /api/v1/branches/:id/location`, protegido para `SUPER_ADMIN`, `OWNER` y `ADMIN`, con auditoría y outbox. Latitud y longitud deben ser verificadas por el administrador; el sistema no convierte direcciones genéricas en pins ni inventa ubicaciones. En PostgreSQL el endpoint sincroniza además `branches.location` como `geography(Point, 4326)`.

El registro público de clientes consulta `/api/v1/branches/public`, exige que el cliente seleccione una sucursal activa y persiste esa relación en `users.branch_id` y `clients.branch_id`. El mapa ordena por distancia únicamente cuando el dispositivo concede geolocalización y la sucursal tiene coordenadas verificadas; sin clave o coordenadas muestra el estado real y mantiene la selección manual.

## Migraciones y bootstrap

```bash
cd /opt/gopaq
docker compose --env-file .env.production up -d postgres redis
docker compose --env-file .env.production run --rm gopaq-migrate
docker compose --env-file .env.production run --rm \
  -e GOPAQ_BOOTSTRAP_CONFIRM=I_UNDERSTAND \
  -e GOPAQ_BOOTSTRAP_ADMIN_EMAIL='correo-admin-real' \
  -e GOPAQ_BOOTSTRAP_ADMIN_NAME='Nombre del administrador' \
  -e GOPAQ_BOOTSTRAP_ADMIN_PASSWORD='contraseña efímera de al menos 16 caracteres' \
  gopaq-migrate npm run seed:production
docker compose --env-file .env.production run --rm gopaq-migrate npm run seed:demo
docker compose --env-file .env.production up -d gopaq-api gopaq-worker
```

Para un release concreto, construir y levantar con `GOPAQ_VERSION=<commit-verificado>`; el health check debe mostrar esa versión antes del smoke test público.

El bootstrap es idempotente y no reemplaza la contraseña existente. `seed:demo` solo afecta `org-demo`; no se ejecuta automáticamente al arrancar. La migración `007_google_maps_credentials` se aplica después de la migración `006_configuration_center` bajo el mismo advisory lock.

## URLs y comprobaciones

- Web: `https://gopaq.lat/`
- Health: `https://gopaq.lat/api/health`
- Liveness: `https://gopaq.lat/api/livez`
- Readiness: `https://gopaq.lat/api/readyz` (alias compatible: `/api/ready`)
- API: `https://gopaq.lat/api/v1/`
- OpenAPI: `https://gopaq.lat/api/v1/docs/openapi.json`
- Logins: `/super-admin/login`, `/portal/login`, `/sucursal/login`, `/driver/login`.
- Configuración Google Maps: `/super-admin/configuracion` (solo `SUPER_ADMIN` y `OWNER` pueden guardar o retirar la credencial).

El smoke público automatizado se ejecuta sin mutaciones con:

```bash
SMOKE_BASE_URL=https://gopaq.lat npm run smoke
```

Para validar también roles, se deben inyectar temporalmente `SMOKE_SUPER_ADMIN_EMAIL`, `SMOKE_SUPER_ADMIN_PASSWORD`, `SMOKE_CLIENT_EMAIL`, `SMOKE_CLIENT_PASSWORD`, `SMOKE_BRANCH_EMAIL`, `SMOKE_BRANCH_PASSWORD`, `SMOKE_DRIVER_EMAIL` y `SMOKE_DRIVER_PASSWORD`; nunca se escriben en el repositorio ni en la salida del script.

El proxy debe redirigir HTTP a HTTPS, soportar `Upgrade` para `/ws` y no publicar `5432`, `6379`, workers ni servicios auxiliares.

## Backups y restore

El backup usa formato custom de `pg_dump` y no detiene la aplicación:

```bash
/opt/gopaq/infra/backup-postgres.sh
/opt/gopaq/infra/test-restore.sh /var/backups/gopaq/gopaq-<timestamp>.dump
```

El restore de prueba crea una base temporal, restaura el dump, valida tablas y la elimina al terminar. Las copias en el mismo volumen son una protección local; falta configurar un destino externo de backups (S3/R2/otro) con credenciales del propietario de la cuenta.

## Operación diaria

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=200 gopaq-api
docker compose --env-file .env.production logs --tail=200 gopaq-worker
docker compose --env-file .env.production restart gopaq-api gopaq-worker
docker compose --env-file .env.production up -d --remove-orphans
```

Una migración nueva debe ser compatible hacia atrás antes de cambiar la imagen. Ante un fallo de health/smoke se conserva la imagen anterior y se revierte el cambio de Compose; no se ejecutan `DROP`, `TRUNCATE` ni resets automáticos.

## Integraciones externas

Karrio, WhatsApp, SMS, email, IA y proveedores de geocodificación/routing se manejan por adaptadores. Cuando no hay credenciales, el estado es `NO CONFIGURADO`/`provider_unavailable`; no se presenta una conexión exitosa. La única acción externa pendiente para activar cada proveedor es entregar y validar sus credenciales sandbox/producción, además de sus webhooks y políticas de cuenta.
