# GoPaq — Estado de preparación para producción

## Resumen ejecutivo

La revisión crítica fue incorporada al plan de trabajo y se corrigieron varios bloqueos concretos. **GoPaq todavía no debe operar paquetes reales ni cobros en producción** hasta completar los flujos logísticos y las configuraciones de infraestructura que siguen pendientes.

## Correcciones aplicadas y verificadas

| Área | Estado | Evidencia |
|---|---|---|
| Schema Drizzle | Verificado | `drizzle/schema.ts`, journal y SQL están versionados; `scripts/verify-clean-schema.mjs` aplicó el journal completo sobre MariaDB vacío y verificó 18 tablas y default `language=es`. |
| Datos simulados públicos | Corregido | Se retiraron métricas numéricas, envíos, GPS, manifiestos, QR, fechas y códigos de rastreo de ejemplo; los portales muestran consultas reales, placeholders neutrales o estados vacíos. |
| Documentación API | Corregida | `/docs-api` refleja los endpoints REST verificados: `POST /api/v1/quotes`, `POST /api/v1/shipments`, `POST /api/v1/pickups` y `GET /api/v1/tracking/:trackingCode`, todos con API key, versionado y scopes. |
| Tarifas | Endurecidas y localizadas | El cliente solo envía peso, dimensiones y distancia; mínimos, precio por kg/km y recargo se aplican server-side en DOP. El formateador visible usa `es-DO` y `RD$`. |
| Service worker | Endurecido | No cachea `/api/*`, solicitudes con credenciales ni portales autenticados; solo conserva un shell público explícito. |
| Shopify | Fuera de alcance | El router y contexto cliente fueron retirados del flujo funcional; el smoke test externo permanece omitido intencionalmente. |
| Verificación técnica | Verde con alcance declarado | `pnpm check`, `pnpm build` y Vitest pasan: 19 suites, 65 tests; 2 tests Shopify quedan omitidos por decisión de alcance. Se capturaron landing, docs y rutas de portal sin sesión autenticada; los portales protegidos requieren validación OAuth real. | 
| Operación de última milla | Parcial implementada | La UI permite crear rutas, seleccionar sucursal real, listar conductores del tenant, asignar una ruta y consultar paradas. El GPS exige una referencia válida de envío o ruta. | 
| Entrega y documentos | Implementada con validación pendiente de producción | POD idempotente y auditada, recepción/inspección/pesaje, documentos, facturación, cobros y recibos están conectados a flujos tenant-scoped; faltan aceptación con infraestructura y datos reales. | 
| Configuración de producción | Documentada | `PRODUCTION_CONFIGURATION.md` declara secretos, OAuth, base TLS, storage, mapas, LLM, PWA y límites operativos sin incluir valores sensibles. |

## Pendientes que bloquean un GO de producción

Todavía faltan rate limit distribuido con Redis configurado, políticas de retención/privacidad, configuración real de OAuth, storage y mapas, además de completar y validar operaciones pendientes como devoluciones y pruebas visuales autenticadas. Ya existe creación/edición básica de envíos, creación REST tenant-scoped de envíos y pickups, tracking REST privado, almacenes, rutas, manifest, GPS con referencia y POD idempotente; la operación real de paquetes y cobros continúa sujeta a configuración y validación de producción.

La prueba real de checkout limpio ya se ejecutó contra MariaDB local vacío usando la secuencia del journal, sin tocar la base administrada activa. Los requisitos de autenticación, storage, mapas, LLM y secretos quedaron documentados en `PRODUCTION_CONFIGURATION.md`; aún deben configurarse y probarse en el entorno real de producción.

## Conclusión

El proyecto queda en un estado técnico más honesto y seguro para continuar desarrollo. **El resultado actual es NO-GO para producción operativa**; sí es apto como base de desarrollo y demo funcional parcial. No se debe declarar que todos los flujos logísticos funcionan hasta completar y probar los pendientes anteriores.
