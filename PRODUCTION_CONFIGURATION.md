# Configuración de producción de GoPaq

## Plataforma recomendada

GoPaq está preparado para ejecutarse en el hosting administrado de Manus con Node.js, Express, React, tRPC, Drizzle ORM y MySQL/TiDB. El modo actual es **Autoscale**: la aplicación debe tratar cada petición como stateless y conservar el estado operativo en la base de datos y en el almacenamiento administrado. No se requiere Docker ni un servidor persistente para las funciones actualmente implementadas.

## Variables y secretos

Los valores deben configurarse desde el gestor de secretos del proyecto. No se deben guardar valores reales en `.env`, en el repositorio ni en el cliente.

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión MySQL/TiDB. En producción debe usar TLS y una base separada por entorno. |
| `JWT_SECRET` | Sí | Firma de las sesiones de GoPaq. Debe ser aleatorio y diferente entre entornos. |
| `VITE_APP_ID` | Sí | Identificador de la aplicación OAuth de Manus. |
| `OAUTH_SERVER_URL` | Sí | Servidor OAuth utilizado por el callback `/api/oauth/callback`. |
| `VITE_OAUTH_PORTAL_URL` | Sí | Portal de inicio de sesión que abre el cliente. |
| `OWNER_OPEN_ID` y `OWNER_NAME` | Sí | Identidad propietaria utilizada por el runtime y los controles administrativos. |
| `BUILT_IN_FORGE_API_URL` | Sí | API administrada para LLM, storage, mapas y servicios integrados del servidor. |
| `BUILT_IN_FORGE_API_KEY` | Sí | Credencial server-side para Forge; nunca debe exponerse en HTML o bundles. |
| `VITE_FRONTEND_FORGE_API_URL` | Sí para mapas | Proxy frontend de Forge usado por el cargador de Google Maps. |
| `VITE_FRONTEND_FORGE_API_KEY` | Sí para mapas | Credencial pública/proxy entregada por Manus para cargar Maps; no sustituirla por una clave Google directa. |
| `VITE_APP_TITLE` y `VITE_APP_LOGO` | Recomendadas | Marca visible y logo del sitio. |
| `VITE_ANALYTICS_ENDPOINT` y `VITE_ANALYTICS_WEBSITE_ID` | Opcionales | Analítica del sitio si se habilita. |

## Dependencias administradas

La autenticación depende de Manus OAuth y valida la cookie de estado antes de crear la sesión. Los documentos y activos no se guardan en el disco local: el backend usa storage administrado y conserva en la base de datos únicamente la clave, URL y metadatos. El endpoint `/manus-storage/*` sirve recursos mediante redirección firmada y `Cache-Control: no-store`.

Los mapas usan el proxy de Forge y el componente `MapView`; no se debe solicitar una clave Google al cliente ni introducir una librería de mapas alternativa. El agente AI llama al LLM desde procedimientos server-side y las acciones que cambian estados, datos, finanzas o comunicaciones deben seguir el catálogo de aprobaciones y quedar auditadas.

## Base de datos y migraciones

Una instalación limpia se verificó aplicando la secuencia completa del journal sobre MariaDB vacío: se crearon **18 tablas** y el default regional de `organizations.language` quedó en `es`. El esquema mantiene `DOP` como moneda por defecto y `America/Santo_Domingo` como zona horaria.

Para cambios posteriores se debe modificar primero `drizzle/schema.ts`, ejecutar `pnpm drizzle-kit generate`, revisar el SQL generado y aplicar la migración en el entorno correspondiente. Las migraciones no deben contener `DROP TABLE` ni alteraciones destructivas sin una estrategia explícita de respaldo y reversión.

## Seguridad operativa

Todas las consultas operativas deben derivar `organizationId` del contexto autenticado. Documentos, puntos GPS, eventos, pickups, rutas y confirmaciones POD validan la pertenencia de sus referencias; el cliente no puede fijar tarifas ni cambiar estados fuera de las transiciones permitidas. Las cargas de documentos deben pasar por el backend y utilizar storage administrado, nunca bytes persistidos en columnas ni rutas locales.

El service worker no almacena llamadas API, respuestas con credenciales ni portales autenticados. La cola offline puede conservar operaciones limitadas para sincronización, pero no debe confirmar localmente cobros, entregas ni cambios críticos de estado.

## Checklist antes de operar paquetes reales

Antes de pasar a producción operativa se requiere configurar y probar OAuth, base de datos TLS, storage, mapas, Forge/LLM, dominios, backups, observabilidad, retención de datos y políticas de privacidad. También faltan módulos de inventario detallado, recepción y pesaje de paquetes, asignación completa de carga, incidencias, facturación/cobros, devoluciones y gestión completa de usuarios/branches. Por ese motivo el estado correcto de este checkpoint sigue siendo **NO-GO para operar paquetes reales**, aunque la base técnica y los flujos implementados están verificados para continuar la construcción.
