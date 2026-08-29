# 📦 GoPaq — Componentes Open Source, Licencias y Límites de Integración

Este documento detalla con precisión legal y técnica la relación entre GoPaq y los componentes Open Source referenciados.

---

## 1. 🚚 Witylogix
- **Repositorio:** [https://github.com/wityliti/witylogix](https://github.com/wityliti/witylogix)
- **Licencia Real:** **GNU Affero General Public License v3 (AGPL-3.0)** (NO MIT).
- **Decisión de Arquitectura & Cumplimiento:**
  - Para preservar la naturaleza comercial y propietaria de la plataforma GoPaq sin contaminación de copyleft fuerte (AGPL-3.0), **NO se incrusta ni copia código de Witylogix directamente en el repositorio de GoPaq**.
  - GoPaq implementa su propio motor heurístico de optimización espacial y ordenamiento de paradas (`GoPaqRoutingEngine`) en `server/modules/routing/routing.engine.ts`.
  - Se provee una interfaz cliente desacoplada (`server/integrations/witylogix/witylogix.adapter.ts`) en caso de que se desee desplegar un microservicio de Witylogix en un contenedor independiente bajo cumplimiento de red AGPL.
- **Estado de Integración:** `LICENSE BOUNDARY / ISOLATED RPC CLIENT`

---

## 2. 🌐 Karrio (ex-Purplship)
- **Repositorio:** [https://github.com/karrioapi/karrio](https://github.com/karrioapi/karrio)
- **Licencia Real:** **GNU Lesser General Public License v3 (LGPL-3.0)** para componentes base OSS, con extensiones comerciales/enterprise separadas.
- **Implementación en GoPaq:**
  - Adaptador HTTP real (`server/integrations/karrio/karrio.adapter.ts`) que consume la API REST de Karrio mediante `KARRIO_API_URL` y `KARRIO_API_KEY`.
  - **Manejo de Disponibilidad:** Si Karrio no está configurado o el servicio no responde en el entorno actual, la API devuelve explícitamente `error: "provider_unavailable"`. **No se fabrican tarifas ficticias locales**.
  - Generación estándar de etiquetas de impresión térmica 4x6" en formato ZPL/PDF.
- **Estado de Integración:** `REAL HTTP ADAPTER (Requires live Karrio instance for carrier rating)`

---

## 3. 🛡️ Módulos Propios Desarrollados por GoPaq (Propiedad Intelectual de GoPaq)
- **Motor de Tarificación Dinámica:** Cálculo de peso volumétrico IATA, recargos de seguridad por zonas rojas, seguro y comisión de recaudo COD.
- **Courier Internacional & Casilleros (Lockers):** Direcciones en Miami (Doral), Madrid, Milán y Santo Domingo con control aduanal y consolidación de bultos.
- **Ledger Transaccional COD:** Libro mayor contable con ciclo de cobro, custodia en chofer, recepción en agencia y liquidación bancaria a comercios.
- **Sucursal OS:** Sistema operativo para agencias locales, mostrador POS, inventario físico por estanterías y arqueo de caja con balance diario.
- **Mudanzas & Carga Pesada:** Cubicaje espacial en $m^3$, cálculo de pisos/ascensores, cuadrillas y fletes industriales.
