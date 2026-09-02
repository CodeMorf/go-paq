# Checklist de producción GoPaq

Última verificación documentada: 2026-09-02. Estado global: **desplegado y operativo en validación controlada**. La verificación de este release (`3bece74`) se ejecutó desde `https://gopaq.lat/`; los límites externos y las pruebas que requieren una ventana operativa permanecen explícitos.

## Código, seguridad y CI local

- [x] Cuatro superficies de login: `/super-admin/login`, `/portal/login`, `/sucursal/login` y `/driver/login`.
- [x] El backend comprueba área, rol, organización, permisos y propiedad del recurso; no depende de ocultar botones.
- [x] JWT de corta duración, refresh rotatorio en cookie HttpOnly, logout, expiración y auditoría de acceso.
- [x] Registro de clientes limitado a la organización pública configurada; el formulario no puede elegir tenants internos.
- [x] Registro público exige una sucursal activa; la selección se carga desde el API público y el backend persiste `branch_id` en usuario y cliente.
- [x] Tenant demo `org-demo` aislado, reseteable y con restricciones sandbox.
- [x] Aislamiento por `organization_id` en envíos, rutas, sucursales, clientes, COD, internacional y API keys.
- [x] Idempotencia para creación de envíos, POD, COD, escaneos, prealertas y operaciones de integración.
- [x] Entrega/POD + tracking + COD + outbox en transacción atómica.
- [x] Migraciones explícitas con historial y advisory lock; PostGIS se valida durante readiness.
- [x] Outbox + BullMQ + reintentos con backoff y trabajos fallidos.
- [x] Driver React/PWA con GPS del navegador, POD, firma, foto y cola offline; una operación solo se marca sincronizada después de respuesta del servidor.
- [x] Se eliminaron del bundle las pantallas operativas antiguas que simulaban GPS, etiquetas, IA, OAuth, rutas o mutaciones locales.
- [x] `npm ci`/dependencias deterministas, TypeScript, lint, 55 pruebas API/seguridad, build Vite y `git diff --check` verificados.
- [x] Configuración Global: 14 secciones con valores por tenant, API PATCH protegida, control de versión, auditoría, outbox e historial de revisiones.
- [x] Identidad visual: logo PNG transparente y favicon se guardan mediante API en almacenamiento persistente; colores, favicon y logo se aplican después de confirmación del backend.
- [x] Maestros operativos: alta real de sucursales y conductores con validación de tenant, sucursal, duplicados, auditoría y outbox.
- [x] Google Maps: credencial de navegador separada de la configuración de negocio, cifrada en PostgreSQL, versionada/auditada y con estado público `NO CONFIGURADO` cuando no existe.
- [x] El selector cruzado Admin/Portal/Agencia/Driver fue eliminado; cada área permanece en su propia ruta, sesión y guard de backend.
- [x] Mudanzas y carga pesada: cotización, orden persistida, trabajo unificado, ruta, POD y rastreo canónico verificados en API.

## VPS y despliegue verificados

- [x] Rama desplegada: `Morf/production-hardening`.
- [x] Release desplegado: `3bece74` (`feat(config): persist tenant branding and operational master data` + protección de almacenamiento local).
- [x] Ubuntu 26.04 LTS; 4 vCPU; 7.8 GiB RAM; aproximadamente 109 GiB libres en el volumen raíz al auditar.
- [x] Docker Engine y Compose activos; servicios con `restart: unless-stopped`.
- [x] PostgreSQL 18.6 verificado desde la base en ejecución.
- [x] PostGIS 3.6.4 verificado mediante `postgis_full_version()`.
- [x] Redis 8.10.1 Alpine activo, con AOF y contraseña, dentro de la red Docker privada.
- [x] API publicada únicamente en `127.0.0.1:4000`; PostgreSQL y Redis no tienen puertos publicados al host.
- [x] Nginx/aaPanel existente integrado sin reemplazar ni modificar los sitios co-alojados.
- [x] HTTP redirige a HTTPS; Cloudflare dejó de devolver 526; `/api/health` y `/api/ready` responden correctamente.
- [x] WebSocket `/ws` queda detrás del proxy con autenticación y validación de origen.
- [x] Bootstrap de administrador productivo ejecutado de forma idempotente sin guardar la contraseña en Git.
- [x] Demo seed/reset ejecutados explícitamente; no se ejecutan seeds demo al iniciar la aplicación.
- [x] Backup local programado en `/etc/cron.d/gopaq-backup`, con archivos `0600` y retención configurada.
- [x] Restore probado en una base temporal con el dump más reciente; se validaron 2 organizaciones y el proceso eliminó la base temporal.

## Smoke real desde el dominio

- [x] `https://gopaq.lat/` responde HTTP 200 y sirve el build compilado.
- [x] Logo oficial GoPaq usado en menú, portada, logins y áreas.
- [x] Login productivo de Super Admin verificado; su intento de entrar al portal devuelve 403.
- [x] Las superficies de login no muestran `Acceso de prueba`; el endpoint demo existente permanece aislado en `org-demo` para pruebas internas controladas.
- [x] Google Maps público: la configuración real está activa y el loader JavaScript de Google respondió desde Internet; falta únicamente la validación visual interactiva en un navegador conectado y revisar periódicamente las restricciones de referrer/API en Google Cloud.
- [ ] Coordenadas de sucursales: falta confirmar y guardar desde `/super-admin/configuracion` la ubicación exacta de cada sucursal productiva; sin coordenadas el mapa permanece sin pines y no calcula cercanía.
- [x] Cliente: cotización backend, creación de shipment, persistencia e historial de tracking.
- [x] Sucursal: recepción/escaneo idempotente e inventario persistido.
- [x] Dispatcher: creación, asignación y despacho de ruta; Witylogix reporta `provider_unavailable` cuando no hay credenciales.
- [x] Driver: manifiesto, inicio de ruta, POD, foto/firma desde la app y COD; replay idempotente verificado.
- [x] COD: `collected_driver → received_branch → reconciled → settled_merchant`, con replay sin doble liquidación.
- [x] Internacional: casillero, prealerta y replay idempotente; consolidación queda conectada al motor y sin datos inventados.
- [x] Mudanza/carga pesada: orden real desde panel, asignación a ruta, manifiesto Driver, POD y tracking canónico verificados en API.
- [x] Reinicio de API/worker y Redis: readiness recuperado y datos persistentes conservados en PostgreSQL.
- [x] Aceptación operativa en `org-demo`: quote → shipment → tracking → recepción → ruta/despacho → manifiesto Driver → POD → tracking entregado; mudanza y carga pesada también completaron cotización, orden, despacho, POD y tracking. El tenant fue reseteado y sembrado después de la prueba.
- [x] Backup y restore posteriores al release: dump PostgreSQL creado con modo `0600` y restaurado en base temporal con 2 organizaciones; la base temporal fue eliminada automáticamente.

## Pendientes reales antes de ampliar tráfico

- [ ] Copia de backups fuera del VPS (S3/R2/otro destino). No se configuró porque no hay credenciales de almacenamiento externo entregadas.
- [ ] Credenciales y pruebas de proveedores externos: Karrio/carriers, Witylogix, WhatsApp/SMS/email, pagos, IA, Photon/Valhalla y object storage. La UI muestra `NO CONFIGURADO`/`provider_unavailable` mientras falten.
- [ ] Suite Playwright E2E completa y pruebas de viewport móvil en un pipeline CI dedicado; las pruebas API y smoke ejecutadas no sustituyen esa cobertura.
- [ ] Métricas p50/p95/p99, carga sostenida, profundidad de cola y TTFB de una ventana representativa de tráfico real.
- [ ] Reinicio completo del VPS y comprobación del kernel pendiente de actualización. No se reinició el host para no interrumpir los servicios co-alojados durante esta sesión.
- [ ] Verificación de backups remotos y prueba de restore fuera del volumen principal.

Mientras alguno de estos límites carezca de evidencia, el estado correcto es **Validando**, no “GoPaq está completamente terminado para producción a escala”.
