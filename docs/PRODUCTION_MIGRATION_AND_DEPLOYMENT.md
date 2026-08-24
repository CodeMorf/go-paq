# GoPaq — Migraciones y despliegue de producción

Este documento define el orden seguro para llevar GoPaq a un servidor. No ejecutar migraciones directamente sobre producción sin backup, staging y validación del checksum.

## 1. Orden de trabajo

1. Congelar el commit que se va a desplegar.
2. Crear backup completo de la base de datos.
3. Levantar una base de staging aislada.
4. Ejecutar todas las migraciones en orden numérico.
5. Ejecutar TypeScript, pruebas y build.
6. Configurar variables de entorno en staging.
7. Probar el flujo E2E:
   cliente → cotización → envío → pickup → sucursal → almacén → manifiesto → driver → entrega → POD → tracking.
8. Aprobar el resultado.
9. Crear snapshot del servidor y backup adicional.
10. Ejecutar migraciones en producción.
11. Reiniciar la aplicación con PM2.
12. Verificar health, login, API, base de datos y logs.

## 2. Migraciones SQL

Las migraciones viven en `drizzle/` y deben ejecutarse exclusivamente en orden:

- No renombrar ni reutilizar números de migración.
- No editar una migración ya aplicada.
- Toda modificación nueva debe crear una migración nueva.
- Registrar fecha, commit, operador y resultado.
- Verificar tablas, índices, claves y columnas después de cada grupo.
- Probar siempre primero en una base MariaDB/TiDB vacía.

Comandos previstos:

```bash
pnpm install --frozen-lockfile
pnpm db:push
pnpm check
pnpm test
pnpm build
```

Si el entorno administrado no permite crear o eliminar bases de datos, usar un usuario bootstrap aislado para staging. Nunca conceder permisos globales al usuario de la aplicación.

## 3. Backup antes de migrar

Ejemplo MariaDB/MySQL:

```bash
mysqldump --single-transaction --routines --triggers --events \
  --hex-blob --set-gtid-purged=OFF \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p \
  "$DB_NAME" > "gopaq-before-$(date -u +%Y%m%d-%H%M%S).sql"
```

Comprobar que el archivo no esté vacío y almacenarlo fuera del servidor principal. Mantener al menos tres copias: servidor, almacenamiento externo y copia local segura.

## 4. Variables de entorno

Configurar en el servidor, nunca en el frontend ni en Git:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=
JWT_SECRET=
OWNER_OPEN_ID=
OAUTH_SERVER_URL=
VITE_APP_ID=
VITE_OAUTH_PORTAL_URL=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
REDIS_URL=
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
```

Rotar cualquier secreto que haya sido expuesto. El archivo `.env` debe tener permisos restrictivos y no debe aparecer en logs.

## 5. Instalación de aplicación

```bash
git clone https://github.com/CodeMorf/go-paq.git
cd go-paq
git checkout <COMMIT_APROBADO>
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Crear el proceso PM2:

```bash
pm2 start dist/index.js --name gopaq
pm2 save
pm2 startup
```

El proxy debe exponer únicamente HTTPS. Node debe escuchar en localhost, no en un puerto público.

## 6. Nginx y TLS

Configurar:

- Dominio de producción.
- Proxy hacia `127.0.0.1:3000`.
- Redirección HTTP a HTTPS.
- Headers de seguridad.
- Límites de body adecuados para documentos.
- Timeout de API.
- Logs separados de acceso y error.
- Certificado TLS renovable automáticamente.

Cloudflare debe usar modo TLS estricto. No desactivar validación del certificado de origen.

## 7. Verificación posterior

Comprobar:

```bash
pm2 status
pm2 logs gopaq --lines 100
curl -I https://<DOMINIO>/
curl -I https://<DOMINIO>/api/health
```

Validar manualmente:

- Login OAuth.
- Área Cliente.
- Área Driver.
- Área Sucursal.
- Área Super Admin.
- Cotización server-side.
- Creación de envío.
- Pickup.
- Tracking.
- Documento.
- POD.
- Logs de auditoría.
- Rate limit.
- Redis.
- Storage.
- Mapas.
- Service worker sin cachear respuestas privadas.

## 8. Rollback

Si falla una migración o el flujo E2E:

1. Detener el despliegue.
2. Mantener la aplicación anterior activa si es compatible.
3. No borrar migraciones aplicadas.
4. Restaurar el backup en una base aislada.
5. Identificar la migración fallida.
6. Corregir mediante una nueva migración.
7. Repetir staging.
8. Solo después volver a producción.

No ejecutar `DROP DATABASE`, `git reset --hard` ni restauraciones destructivas sobre producción sin aprobación explícita y backup confirmado.

## 9. Criterio de aprobación

El despliegue solo puede marcarse como GO cuando:

- Migraciones completadas y verificadas.
- Backup comprobado.
- Build correcto.
- TypeScript correcto.
- Todas las pruebas no omitidas correctas.
- OAuth real probado.
- Redis real conectado.
- Storage real probado.
- Mapas configurados.
- E2E autenticado correcto en las cuatro áreas.
- No existen datos simulados.
- No hay secretos en el repositorio.
- El documento `PRODUCTION_READINESS.md` está actualizado con evidencias.

Mientras falte cualquiera de estos puntos, el estado debe permanecer NO-GO.
