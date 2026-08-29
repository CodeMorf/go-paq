# 📑 GoPaq — Estado de Implementación de la API REST v1.4

Todos los endpoints listados a continuación están implementados y activos en el backend GoPaq Core API (`http://localhost:4000/api/v1`).

---

## 🔐 Autenticación & Usuarios
- `POST /api/v1/auth/login`: Autenticación con email/password y retorno de JWT token.
- `POST /api/v1/auth/register`: Registro de nuevos clientes con resolución explícita de tenant (`organizationId` o `tenantSlug`), prevención de emails duplicados y asignación de casillero internacional.
- `GET /api/v1/auth/me`: Perfil del usuario autenticado y organización.

## 📦 Envíos & Tracking
- `GET /api/v1/shipments`: Lista de envíos con filtros por estado y búsqueda (aislado por `organization_id`).
- `POST /api/v1/shipments`: Creación transaccional de envíos con cálculo de tarifas y asignación de guía criptográfica colisión-safe (`GP-HEX`).
- `GET /api/v1/shipments/:id`: Detalle completo de guía con hitos de trazabilidad (aislado por `organization_id`).
- `GET /api/v1/tracking/:trackingNumber`: Consulta pública de rastreo en tiempo real.

## 💰 Cotizaciones & Tarifas
- `POST /api/v1/quotes`: Cálculo dinámico de costos por peso, dimensiones IATA, servicio y zonas.

## 🚚 Rutas & Despacho (GoPaq Engine)
- `GET /api/v1/routes`: Lista de rutas activas e historial de despacho.
- `POST /api/v1/routes`: Creación y ordenamiento heurístico de paradas de entrega.
- `POST /api/v1/routes/:id/dispatch`: Publicación y despacho de ruta a conductor.

## 📱 Conductores & Telemetría
- `GET /api/v1/drivers`: Flota de conductores y estado operativo.
- `POST /api/v1/drivers/telemetry`: Streaming de coordenadas GPS, velocidad y batería.
- `GET /api/v1/drivers/active-manifest`: Manifiesto de paradas asignadas al conductor.

## 🏢 Sucursales & Almacén
- `GET /api/v1/branches`: Red de sucursales y agencias activas.
- `GET /api/v1/branches/:id/inventory`: Paquetes en custodia física en sucursal.
- `POST /api/v1/branches/:id/cash-close`: Arqueo y balance de caja diario.

## 💵 Conciliación COD
- `GET /api/v1/cod/ledger`: Libro contable de cobros contra entrega y saldos pendientes.
- `POST /api/v1/cod/settle`: Liquidación bancaria de fondos a comercios.

## ✈️ Courier Internacional
- `GET /api/v1/international/lockers`: Casilleros asignados en Miami, Madrid, Milán y RD.
- `GET /api/v1/international/packages`: Paquetes internacionales recibidos.
- `POST /api/v1/international/consolidate`: Agrupación de paquetes en caja master.

## 📦 Mudanzas & Carga Pesada
- `GET /api/v1/moving/orders`: Órdenes de mudanza y cubicaje.
- `POST /api/v1/moving/quote`: Cotizador de mudanzas por $m^3$ y pisos.
- `GET /api/v1/heavy-cargo/orders`: Órdenes de carga industrial y maquinaria.

## 🔑 Integraciones, Diagnóstico & OpenAPI
- `GET /api/v1/integrations/health`: Diagnóstico en vivo de Base de Datos, Witylogix (AGPL) y Karrio (LGPL).
- `GET /api/v1/api-keys`: Listado de claves de API.
- `POST /api/v1/api-keys`: Generación segura de API Keys hasheadas con SHA-256.
- `GET /api/v1/webhooks`: Registro de webhooks y endpoints suscritos.
- `GET /api/v1/docs/openapi.json`: Especificación completa OpenAPI 3.1.
