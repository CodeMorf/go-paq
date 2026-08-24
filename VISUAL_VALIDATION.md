# GoPaq — Validación visual

## Revisión ejecutada

Se capturaron las rutas `/`, `/docs-api`, `/admin`, `/sucursal`, `/driver` y `/cliente` en viewport desktop de 1280 × 720 contra el servidor de desarrollo activo. La landing pública conserva una composición clara, el cotizador live muestra DOP y la documentación refleja los endpoints REST ampliados.

## Hallazgos comprobados

La landing mantiene jerarquía visual, contraste suficiente y responsive base; el cotizador no introduce datos ficticios y la documentación muestra `POST /api/v1/shipments`, `POST /api/v1/pickups` y `GET /api/v1/tracking/:trackingCode` junto con sus scopes. El panel reservado presenta una pantalla de acceso consistente con la marca GoPaq.

Las cuatro rutas internas redirigen al portal de autenticación cuando no existe una sesión válida. Por ello, esta captura no verifica todavía los estados autenticados ni la interacción real de los portales por rol. No se declara esa prueba como completada: requiere una sesión de prueba OAuth válida o credenciales de prueba proporcionadas por el entorno de validación.

## Recomendación de cierre

Repetir las mismas rutas con sesiones autorizadas para admin, sucursal, driver y cliente; verificar estados de carga, vacío, error, permisos cross-tenant, bandeja offline y formularios especiales. La revisión visual pública no sustituye esas pruebas autenticadas.
