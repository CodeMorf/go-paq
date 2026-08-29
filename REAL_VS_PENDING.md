# 📊 GoPaq — Estado Real de Módulos & Auditoría Técnica

Este documento audita el estado real de cada módulo de GoPaq conforme a la regla estricta:
**Un módulo es REAL únicamente si tiene persistencia en base de datos relacional, endpoints con control de acceso y tenant isolation, manejo de errores y pruebas automatizadas que lo validan.**

---

## 🟢 ESTADO DETALLADO POR MÓDULOS

| Módulo / Capacidad | Estado | Backend & DB | Frontend Conectado | Notas Técnicas |
|---|---|---|---|---|
| **Autenticación & Sesiones** | **REAL** | JWT, bcrypt, `admin@gopaq.local`, `sucursal@gopaq.local`, `cliente@gopaq.local` | ✅ Sí | Validado con pruebas de login y rechazo de contraseñas inválidas. |
| **Aislamiento Multi-Tenant** | **REAL** | `organization_id` obligatorio en todas las consultas y mutations | ✅ Sí | Probado en test suite (acceso cruzado entre tenants bloqueado con 404/403). |
| **API Key Security & Scopes** | **REAL** | Hashing SHA-256 en DB, prefijo `gp_live_`, validación de scopes | ✅ Sí | Probado con claves válidas, inválidas y validación de scopes (`shipments:write`). |
| **Motor de Tarifas GoPaq** | **REAL** | Base + peso real + volumétrico IATA + distancia + zonas rojas + COD | ✅ Sí | Servidor calcula server-side sin Math.random. |
| **Creación de Envíos & Tracking** | **REAL** | `POST /api/v1/shipments` con tracking criptográfico colisión-safe (`GP-HEX`) | ✅ Sí | Si API falla, el frontend muestra error real y no crea datos ficticios. |
| **Despacho y Rutas (GoPaq Engine)** | **REAL** | Optimización espacial 2-opt, asignación de paradas a chofer y despacho | ✅ Sí | Motor propietario desacoplado de AGPL. |
| **Telemetría GPS & WebSockets** | **REAL** | Streaming vía WebSocket autenticado por JWT y canal aislado por organización | ✅ Sí | Drivers solo pueden actualizar su propia unidad. |
| **Firma Digital & e-POD** | **REAL** | Captura en canvas táctil, foto y verificación en servidor | ✅ Sí | Persiste en tabla `shipments.pod_json`. |
| **Conciliación COD (Ledger)** | **REAL** | Transacciones contables de recaudo, custodia y liquidación con referencia | ✅ Sí | Totalización de caja y saldos pendientes en DB. |
| **Sucursal OS (Punto de Venta)** | **REAL** | Registro de guías en mostrador, inventario físico y arqueo de caja | ✅ Sí | Persiste balance diario en DB. |
| **Casilleros & Consolidación** | **REAL** | Direcciones en Miami/Madrid/Milán/RD y consolidación de guías master | ✅ Sí | Persiste en tablas de casilleros y paquetes. |
| **Mudanzas & Carga Pesada** | **REAL** | Cotización por $m^3$, pisos, ayudantes y fletes pesados | ✅ Sí | Endpoint REST activo en backend. |
| **Karrio Multi-Carrier Rating** | **PARTIAL (Adapter)** | Adaptador HTTP real a `KARRIO_API_URL` | ✅ Sí | Si Karrio no está activo, devuelve `provider_unavailable` (sin tarifas falsas). |
| **Witylogix Engine** | **NOT INTEGRATED (License Boundary)** | Adaptador HTTP RPC aislado para contenedor externo | N/A | Excluido del core por licencia AGPL-3.0; reemplazado por motor propio. |
| **Notificaciones WhatsApp / SMS** | **PARTIAL (Local DB Center)** | Registro en base de datos y WebSockets activos | ✅ Sí | Conexión con proveedores externos (Meta Cloud API/Twilio) requiere credenciales de producción. |
| **Hardware de Báscula Serial** | **NOT IMPLEMENTED** | Entrada manual en formulario POS o estimación óptica por cámara | ✅ Sí | Requiere driver WebSerial / hardware físico conectado. |

---

## 🔒 Auditoría de Fallbacks Simulados (Fake Fallbacks)
- **Eliminación Total de Fallback Falso:** En [`src/context/AppContext.tsx`](file:///C:/Users/grupo.SHIP24GO/Desktop/GoPaq/src/context/AppContext.tsx), la función `addShipment` ya NO inserta datos locales ficticios si la API falla. El frontend captura el error HTTP y notifica al usuario con un toast de error explícito.
- **Empty States:** Si una consulta a la base de datos devuelve un array vacío, la interfaz muestra el estado vacío real del sistema sin inyectar datos mock.
