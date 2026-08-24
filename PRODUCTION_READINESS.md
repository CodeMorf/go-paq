# GoPaq — Estado de preparación para producción

## Resumen ejecutivo

La revisión crítica fue incorporada al plan de trabajo y se corrigieron varios bloqueos concretos. **GoPaq todavía no debe operar paquetes reales ni cobros en producción** hasta completar los flujos logísticos y las configuraciones de infraestructura que siguen pendientes.

## Correcciones aplicadas y verificadas

| Área | Estado | Evidencia |
|---|---|---|
| Schema Drizzle | Verificado | `drizzle/schema.ts`, journal y SQL están versionados; `scripts/verify-clean-schema.mjs` aplicó el journal completo sobre MariaDB vacío y verificó 18 tablas y default `language=es`. |
| Datos simulados públicos | Corregido | Se retiraron métricas numéricas, envíos, GPS, manifiestos, QR, fechas y códigos de rastreo de ejemplo; los portales muestran consultas reales, placeholders neutrales o estados vacíos. |
| Documentación API | Corregida | `/docs-api` declara el único REST público implementado: `POST /api/v1/quotes`. Los endpoints de envíos, seguimiento REST y recogidas se identifican como pendientes. |
| Tarifas | Endurecidas y localizadas | El cliente solo envía peso, dimensiones y distancia; mínimos, precio por kg/km y recargo se aplican server-side en DOP. El formateador visible usa `es-DO` y `RD$`. |
| Service worker | Endurecido | No cachea `/api/*`, solicitudes con credenciales ni portales autenticados; solo conserva un shell público explícito. |
| Shopify | Fuera de alcance | El router y contexto cliente fueron retirados del flujo funcional; el smoke test externo permanece omitido intencionalmente. |
| Verificación técnica | Verde con alcance declarado | `pnpm check`, `pnpm build` y Vitest pasan: 14 suites, 33 tests; 2 tests Shopify quedan omitidos por decisión de alcance. Se realizaron capturas desktop/móvil de landing, docs y login sin sesión autenticada. | 
| Operación de última milla | Parcial implementada | La UI permite crear rutas, seleccionar sucursal real, listar conductores del tenant, asignar una ruta y consultar paradas. El GPS exige una referencia válida de envío o ruta. | 
| Entrega y documentos | Parcial implementada | POD idempotente y auditada disponible para driver; documentos usan storage administrado y validación tenant. Facturación, cobros y recepción/pesaje siguen pendientes. | 
| Configuración de producción | Documentada | `PRODUCTION_CONFIGURATION.md` declara secretos, OAuth, base TLS, storage, mapas, LLM, PWA y límites operativos sin incluir valores sensibles. |

## Pendientes que bloquean un GO de producción

Todavía faltan recepción y pesaje de paquetes, inventario detallado, transferencias con carga, asignación completa de conductores y paradas, incidencias, cobros, facturación, devoluciones, rate limit distribuido, políticas de retención/privacidad y sustitución de servicios Manus si se instala fuera de Manus. Ya existe creación/edición básica de envíos, almacenes, rutas, manifest, GPS con referencia, pickups aislados y POD idempotente.

La prueba real de checkout limpio ya se ejecutó contra MariaDB local vacío usando la secuencia del journal, sin tocar la base administrada activa. Los requisitos de autenticación, storage, mapas, LLM y secretos quedaron documentados en `PRODUCTION_CONFIGURATION.md`; aún deben configurarse y probarse en el entorno real de producción.

## Conclusión

El proyecto queda en un estado técnico más honesto y seguro para continuar desarrollo. **El resultado actual es NO-GO para producción operativa**; sí es apto como base de desarrollo y demo funcional parcial. No se debe declarar que todos los flujos logísticos funcionan hasta completar y probar los pendientes anteriores.
