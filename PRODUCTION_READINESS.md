# GoPaq — Estado de preparación para producción

## Resumen ejecutivo

La revisión crítica fue incorporada al plan de trabajo y se corrigieron varios bloqueos concretos. **GoPaq todavía no debe operar paquetes reales ni cobros en producción** hasta completar los flujos logísticos y las configuraciones de infraestructura que siguen pendientes.

## Correcciones aplicadas y verificadas

| Área | Estado | Evidencia |
|---|---|---|
| Schema Drizzle | Parcialmente disponible | `drizzle/schema.ts` está versionado; el directorio de migraciones contiene snapshots/meta, pero requiere validación en un checkout y base limpia. |
| Datos simulados públicos | Corregido en esta ronda | Estadísticas, envíos, GPS, manifiesto, QR y timeline fijos fueron retirados de la landing/portales; se muestran estados vacíos o datos consultados. |
| Documentación API | Corregida | `/docs-api` declara el único REST público implementado: `POST /api/v1/quotes`. Los endpoints de envíos, seguimiento REST y recogidas se identifican como pendientes. |
| Tarifas | Endurecidas | El cliente solo envía peso, dimensiones y distancia; mínimos, precio por kg/km y recargo se aplican server-side en DOP. |
| Service worker | Endurecido | No cachea `/api/*`, solicitudes con credenciales ni portales autenticados; solo conserva un shell público explícito. |
| Shopify | Fuera de alcance | El storefront Shopify no participa en el flujo principal; su smoke test live quedó excluido de la suite principal. |
| Verificación técnica | Verde con una omisión explícita | `pnpm check`, `pnpm build` y Vitest pasan: 14 suites, 29 tests; 2 tests Shopify quedan omitidos por decisión de alcance. |

## Pendientes que bloquean un GO de producción

Todavía faltan el ciclo completo de envíos, recepción y pesaje, inventario, transferencias, asignación de conductores, POD, incidencias, cobros, facturación, devoluciones, controles de idempotencia críticos, rate limit distribuido, políticas de retención/privacidad y sustitución de servicios Manus si se instala fuera de Manus.

También debe ejecutarse una prueba desde checkout limpio contra una base de datos vacía. Esa prueba debe confirmar que el esquema y las migraciones crean todas las tablas sin depender de una base previamente preparada. La autenticación, storage, mapas, notificaciones y secretos deben definirse para el entorno real de producción.

## Conclusión

El proyecto queda en un estado técnico más honesto y seguro para continuar desarrollo. **El resultado actual es NO-GO para producción operativa**; sí es apto como base de desarrollo y demo funcional parcial. No se debe declarar que todos los flujos logísticos funcionan hasta completar y probar los pendientes anteriores.
