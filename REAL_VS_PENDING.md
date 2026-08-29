# 📊 GoPaq — Estado de Funcionalidades: Real vs Pendiente

Este documento presenta una auditoría técnica detallada sobre qué funcionalidades operan con backend y persistencia real en base de datos frente a integraciones con proveedores de infraestructura productiva externa.

---

## 🟢 Funcionalidades 100% REALES (Backend, DB, API & Frontend Conectado)

| Módulo / Capacidad | Estado | Backend & DB |
|---|---|---|
| **Autenticación & Sesiones** | 100% REAL | JWT, bcrypt, `admin@gopaq.local`, `sucursal@gopaq.local`, `cliente@gopaq.local`. |
| **Multi-Tenancy & RBAC** | 100% REAL | Aislamiento por `organization_id` y validación de roles en endpoints. |
| **Motor de Tarifas** | 100% REAL | Cálculo matemático exacto por peso, volumen IATA, distancia y zonas rojas. |
| **Creación de Envíos** | 100% REAL | `POST /api/v1/shipments`, número de tracking único server-side, persistencia en DB. |
| **Rastreo (Tracking)** | 100% REAL | `GET /api/v1/tracking/:tracking`, consulta en DB relacional con historial de eventos. |
| **Despacho y Rutas (Witylogix)** | 100% REAL | Optimización de paradas, asignación a choferes y despacho en vivo. |
| **Telemetría GPS & Driver App** | 100% REAL | Transmisión de coordenadas, velocidad, rumbo y batería vía REST y WebSocket. |
| **Firma Digital & e-POD** | 100% REAL | Captura táctil de firma, foto de evidencia y registro en base de datos. |
| **Conciliación COD** | 100% REAL | Ledger contable de recaudos, custodia y liquidaciones a comercios. |
| **Sucursal OS & POS** | 100% REAL | Emisión de guías en mostrador, inventario de tienda y arqueo de caja diario. |
| **Casilleros Internacionales** | 100% REAL | Direcciones en Miami/Madrid/Milán/RD y consolidación de bultos. |
| **Mudanzas & Carga Pesada** | 100% REAL | Cotizador por volumen ($m^3$), pisos y fletes especializados. |
| **API Keys & Webhooks** | 100% REAL | Keys hasheadas con SHA-256, scopes de seguridad y registro de webhooks. |
| **Documentación OpenAPI** | 100% REAL | Especificación OpenAPI 3.1 real servida en `/api/v1/docs/openapi.json`. |

---

## 🟡 Integraciones Externas Pendientes (Para Fase de Producción en Cloud)
- **WhatsApp Business API Real:** Actualmente las conversaciones operan mediante el centro omnicanal en base de datos; la conexión directa con Meta Cloud API / Twilio requiere credenciales productivas de cliente.
- **Pasarelas de Pago Bancarias Externas:** El sistema procesa balance interno, crédito y COD; la conexión con Stripe o procesadores locales requiere claves de comercio en vivo.
- **Hardware de Báscula Serial / Bluetooth:** El peso se ingresa en el formulario del POS o mediante estimación óptica con cámara.
