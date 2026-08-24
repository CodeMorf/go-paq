# GoPaq — Validación visual

## Revisión ejecutada

Se capturaron las rutas `/`, `/docs-api`, `/admin`, `/sucursal`, `/driver` y `/cliente` en viewport desktop de 1280 × 720 contra el servidor de desarrollo activo. La landing pública conserva una composición clara, el cotizador live muestra DOP y la documentación refleja los endpoints REST ampliados.

## Hallazgos comprobados

La landing mantiene jerarquía visual, contraste suficiente y responsive base; el cotizador no introduce datos ficticios y la documentación muestra `POST /api/v1/shipments`, `POST /api/v1/pickups` y `GET /api/v1/tracking/:trackingCode` junto con sus scopes. El panel reservado presenta una pantalla de acceso consistente con la marca GoPaq.

Las cuatro rutas internas redirigen al portal de autenticación cuando no existe una sesión válida. Por ello, esta captura no verifica todavía los estados autenticados ni la interacción real de los portales por rol. No se declara esa prueba como completada: requiere una sesión de prueba OAuth válida o credenciales de prueba proporcionadas por el entorno de validación.

## Recomendación de cierre

Repetir las mismas rutas con sesiones autorizadas para admin, sucursal, driver y cliente; verificar estados de carga, vacío, error, permisos cross-tenant, bandeja offline y formularios especiales. La revisión visual pública no sustituye esas pruebas autenticadas.

## Validación pública posterior a tokens semánticos — 24 de agosto de 2026

Se capturaron `/` y `/docs-api` en viewport desktop 1280 × 720 con la shell pública completa. La landing conserva jerarquía, CTA, calculadora DOP, panel de control y sección oscura de servicios; la documentación mantiene tarjetas navy, bloques de código legibles, navegación de endpoints y CTA de inicio de sesión. Los fondos de marca usan tokens `gopaq-*` y los tonos de texto se resuelven mediante variables semánticas; los acentos naranja y los estados verde/rojo permanecen deliberados como señales operativas.

La revisión no certifica `/admin`, `/sucursal`, `/driver` ni `/cliente` autenticados porque esta sesión no dispone de una cuenta OAuth de prueba. La barrera se conserva como pendiente explícito y no se ha sustituido por datos simulados.

## Segunda pasada de tokens — 24 de agosto de 2026

La captura pública actual de `/` y `/docs-api` en 1280 × 720 confirma que la jerarquía y el contraste se conservan tras sustituir tonos slate por tokens `gopaq-*`, `text-muted-*`, `border-border` y `bg-muted`. Los fondos oscuros, bloques de código y textos secundarios de la documentación permanecen legibles; los acentos naranja, verde y rojo se mantienen como señales semánticas deliberadas. Esta evidencia cubre superficies públicas; los cuatro portales autenticados siguen pendientes por falta de sesión OAuth de prueba.

## Verificación pública del incremento tarifario — 24 de agosto de 2026

Se capturaron `/` y `/docs-api` en viewport desktop 1280 × 720 y móvil 375 × 812. La landing conserva navegación y CTA visibles sin solapamientos; el hero mantiene contraste claro y el cotizador permanece dentro de la composición pública. `/docs-api` conserva la jerarquía de autenticación, endpoint de cotización y navegación responsive; el encabezado móvil se mantiene en varias filas sin desbordamiento visible.

El cotizador público ahora requiere un slug de organización explícito mediante `?org=slug` para consultar una tarifa real. Sin ese contexto muestra un estado vacío honesto en vez de un importe por defecto. La verificación visual no demuestra una sesión autenticada ni dispositivos reales con cámara; `/admin`, `/sucursal`, `/driver` y `/cliente` autenticados continúan pendientes.
