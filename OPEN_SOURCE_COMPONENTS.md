# 📦 GoPaq — Componentes Open Source & Licencias

Este documento detalla las referencias y motores Open Source integrados en GoPaq mediante adaptadores backend limpios.

---

## 1. 🚚 Witylogix
- **Repositorio:** [https://github.com/wityliti/witylogix](https://github.com/wityliti/witylogix)
- **Licencia:** MIT / Open Source
- **Propósito en GoPaq:**
  - Despacho de última milla.
  - Ordenamiento espacial y optimización heurística de paradas de entrega.
  - Telemetría GPS en tiempo real desde la aplicación del conductor.
  - Validación de prueba de entrega electrónica (e-POD: firma en canvas y captura fotográfica).
- **Adaptador GoPaq:** `server/integrations/witylogix/witylogix.adapter.ts`

---

## 2. 🌐 Karrio (ex-Purplship)
- **Repositorio:** [https://github.com/karrioapi/karrio](https://github.com/karrioapi/karrio)
- **Licencia:** Apache 2.0
- **Propósito en GoPaq:**
  - Agregador de tarifas multi-carrier (DHL, FedEx, UPS, USPS).
  - Formato estandarizado de etiquetas térmicas de 4x6" (ZPL / PDF).
  - Normalización de eventos de rastreo para envíos internacionales.
- **Adaptador GoPaq:** `server/integrations/karrio/karrio.adapter.ts`

---

## 3. 🛡️ Módulos Propios Desarrollados por GoPaq (No Open Source / Propietarios)
- **Courier Internacional & Lockers:** Direcciones asignadas en Miami, Madrid, Milán y República Dominicana con flujo aduanal y consolidación en cajas master.
- **Ledger Transaccional COD:** Conciliación contable de cobro en mano, custodia en chofer, depósito en sucursal y liquidación a cuentas comerciales.
- **Sucursal OS:** Punto de venta de mostrador (POS), inventario físico por estanterías y arqueo de caja diario.
- **Mudanzas & Carga Pesada:** Cubicaje espacial en $m^3$, cálculo de pisos/ascensores, cuadrillas y fletes de carga pesada.
