# GoPaq — Migración y despliegue de producción

## Alcance

Este procedimiento describe cómo promover GoPaq desde staging hacia una base y un dominio de producción separados. **No autoriza por sí solo el tráfico real**: el equipo debe obtener un veredicto GO después de completar secretos, pruebas autenticadas, backups, observabilidad y aceptación operativa.

## Precondiciones

Antes de migrar, confirmar que el commit a desplegar está en `main`, que `pnpm check`, `pnpm test -- --run` y `pnpm build` pasan, y que el workflow CI correspondiente terminó en `success`. Configurar `DATABASE_URL` con TLS, `JWT_SECRET` único por entorno, OAuth real, Forge server-side, proxy frontend de mapas, storage y `REDIS_URL` con esquema `rediss://`. No guardar valores en Git ni en archivos `.env` confirmados.

La base productiva debe ser distinta de staging. El usuario de migración debe disponer de permisos explícitos para aplicar `CREATE TABLE`, `ALTER TABLE` e índices; el usuario de runtime debe tener permisos mínimos y no debe utilizarse para destruir o recrear bases.

## Instalación limpia

1. Crear una base vacía de producción con TLS y un usuario de bootstrap aislado.
2. Clonar el repositorio y ejecutar `pnpm install --frozen-lockfile`.
3. Revisar `drizzle/schema.ts`, `drizzle/meta/_journal.json` y cada SQL del directorio `drizzle/` en orden numérico.
4. Aplicar las migraciones con el mecanismo Drizzle aprobado por el equipo, verificando cada resultado. No saltar migraciones ni ejecutar SQL manual no revisado.
5. Ejecutar `NODE_ENV=production pnpm preflight` sin imprimir secretos.
6. Verificar tablas, índices, defaults regionales (`es`, `DOP`, `America/Santo_Domingo`) y registros de configuración creados por el bootstrap.
7. Ejecutar smoke tests no destructivos de OAuth, storage, Maps, Redis y un endpoint REST sin datos sensibles.

La migración 0020 crea `api_idempotency_keys` y la 0021 crea `api_request_logs`. La instalación debe comprobar además que no existen `DROP TABLE`, `DROP DATABASE` ni triggers experimentales: TiDB no admite la estrategia de triggers append-only probada en staging.

## Backup y rollback

Antes de aplicar una migración, generar un backup verificable y probar su restauración en una base separada. Registrar versión, fecha UTC, operador, hash del backup y resultado de la restauración. Para un fallo de aplicación, revertir el despliegue a un checkpoint conocido; para un fallo de esquema, aplicar una migración correctiva compatible. No usar `DROP` como mecanismo de rollback y no ejecutar cambios destructivos sobre datos reales sin una estrategia aprobada.

## Validación posterior

Ejecutar el preflight en producción, comprobar logs de errores, rate limit Redis, redirección OAuth con cookies, carga de documentos, geocoding/rutas, request IDs REST, replay idempotente y escritura de `api_request_logs`. Hacer la caminata autenticada completa con cuentas de prueba por rol y una organización aislada: Cliente → cotización → envío → pickup → sucursal → almacén → manifiesto → Driver → entrega → POD → tracking → documento → cobro. Los datos de prueba deben estar identificados y no deben confundirse con paquetes de clientes.

## Criterio de salida

El despliegue permanece **NO-GO** si falta cualquiera de estos elementos: credenciales reales verificadas, Redis TLS conectado, OAuth autenticado, storage/Maps operativos, backup restaurable, observabilidad, retención y privacidad aprobadas, pruebas negativas cross-tenant, pruebas autenticadas de los cuatro portales o aceptación del flujo E2E. Una build verde no sustituye esas verificaciones.

## Evidencia que debe conservarse

Conservar el SHA de `main`, URL del workflow CI, versión de migración, logs de preflight sin secretos, resultado de backup/restore, resultados de pruebas, identidad del operador y decisión GO/NO-GO. Si alguna evidencia no está disponible, documentarla como pendiente en `PRODUCTION_READINESS.md` y no marcarla como completada en `todo.md`.

**By CodeMorf.tech**
