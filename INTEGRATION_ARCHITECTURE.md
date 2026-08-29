# 🏗️ GoPaq — Arquitectura de Integración & Core Backend

Este documento describe la arquitectura técnica que transforma a **GoPaq** en una plataforma logística de grado productivo mediante la combinación de un **Core Backend propio** y la integración de **motores Open Source especializados** bajo el patrón de diseño *Adapter Pattern*.

---

## 📐 Diagrama de Arquitectura de Capas

```
                         +-----------------------------------+
                         |           GOPAQ FRONTEND          |
                         |   (React 19, TypeScript, Tailwind)|
                         +-----------------+-----------------+
                                           |
                                           | HTTP REST (/api/v1/*) & WebSockets (/ws)
                                           v
                         +-----------------------------------+
                         |          GOPAQ CORE API           |
                         |        (Node.js / Express)        |
                         +--------+--------+--------+--------+
                                  |        |        |
         +------------------------+        |        +------------------------+
         |                                 |                                 |
         v                                 v                                 v
+------------------+             +--------------------+            +--------------------+
|  WITYLOGIX ADAPTER|            |    GOPAQ MODULES   |            |   KARRIO ADAPTER   |
| (Last-Mile / GPS)|             |  (Multi-Tenant DB) |            | (Carriers / Labels)|
+--------+---------+             +---------+----------+            +---------+----------+
         |                                 |                                 |
         v                                 v                                 v
- Optimización de Rutas          - Base de Datos Relacional        - Matriz Multicarrier
- Telemetría GPS en Vivo         - Ledger Contable COD             - Generador Etiquetas 4x6"
- e-POD (Firma y Foto)           - Casilleros Internacionales      - Tracking Unificado
- Manifiesto Conductor           - Mudanzas y Carga Pesada         - Webhooks Externos
```

---

## 🧩 Componentes del Backend (`server/`)

1. **`server/core/`**: Configuración de Express, middlewares de seguridad, CORS, parsers y manejador global de excepciones.
2. **`server/auth/`**: Autenticación JWT, hashing seguro con `bcryptjs`, aislamiento multi-tenant y middleware RBAC (`requireRole`).
3. **`server/db/`**: Esquema DDL relacional (`schema.sql`), pool de base de datos (`database.ts`) y seeds automáticos con datos reales (`seed.ts`).
4. **`server/api/v1/`**: Controladores de endpoints REST para todas las operaciones de la plataforma.
5. **`server/integrations/`**:
   - `witylogix/`: Adaptador de optimización heurística espacial, telemetría y e-POD.
   - `karrio/`: Adaptador de tarificación internacional multicarrier y generación de etiquetas térmicas.
6. **`server/modules/`**:
   - `pricing/`: Motor de tarificación dinámica por peso, volumen IATA, distancia, zonas rojas y COD.
   - `cod/`: Libro contable de recaudo, custodia y liquidación a comercios.
   - `international/`: Casilleros (Lockers) en Miami, Madrid, Milán y Santo Domingo, aduanas y consolidaciones.
   - `moving/`: Motor de mudanzas y cubicaje en $m^3$.
   - `heavyCargo/`: Órdenes de carga pesada y logística industrial.
7. **`server/realtime/`**: Bus WebSocket para transmisión en tiempo real de coordenadas de vehículos y eventos de ruta.

---

## 🔒 Multi-Tenant & RBAC

Todas las tablas y consultas están aisladas por `organization_id`. Los roles soportados son:
- `SUPER_ADMIN` / `Owner`: Acceso total y configuración del sistema.
- `ADMIN`: Gestión operativa y de clientes.
- `OPERATIONS` / `DISPATCHER`: Asignación de rutas y despacho de conductores.
- `COUNTER`: Punto de venta (POS) y recepción en sucursal.
- `DRIVER`: App móvil de reparto y e-POD.
- `CLIENT`: Portal de clientes corporativos y e-commerce.
