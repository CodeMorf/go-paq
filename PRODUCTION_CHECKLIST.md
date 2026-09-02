# Checklist de producción GoPaq

## Verificado en código y CI

- [x] Cuatro superficies de login con validación de rol en backend.
- [x] JWT corto, refresh rotatorio en cookie HttpOnly, logout y auditoría.
- [x] Aislamiento por `organization_id` en endpoints críticos.
- [x] Idempotencia para shipment, entrega/POD y liquidación COD.
- [x] Transacción atómica de entrega, tracking, COD y outbox.
- [x] Migraciones explícitas, advisory lock y PostGIS.
- [x] Outbox + BullMQ + retries/backoff + failed jobs.
- [x] Driver móvil React con GPS del navegador, POD y cola offline confirmada por servidor.
- [x] Build, TypeScript, API tests y flujo de aislamiento tenant local: 24/24.
- [x] Compose sin publicación de PostgreSQL/Redis.
- [x] Evidencia POD fuera de PostgreSQL como clave de storage en volumen persistente.
- [x] Secretos de webhook cifrados en reposo cuando `WEBHOOK_ENCRYPTION_KEY` está configurada.

## Verificación en VPS pendiente de evidencia final

- [ ] Pull de imágenes y confirmación de PostgreSQL 18.6/PostGIS 3.6.4.
- [ ] Migración desde base vacía y readiness público.
- [ ] Bootstrap de administrador real y tenant demo aislado.
- [ ] Nginx/Cloudflare: HTTPS público sin 526 y WebSocket activo.
- [ ] Smoke de los cuatro logins desde `gopaq.lat`.
- [ ] Smoke cliente: cotización, envío persistido y tracking.
- [ ] Smoke sucursal: inventario, escaneo y cierre de caja.
- [ ] Smoke dispatcher: ruta, asignación y despacho.
- [ ] Smoke driver: ruta, GPS, POD, COD y replay idempotente.
- [ ] Backup y restore en base temporal.
- [ ] Reinicio de API, worker, Redis y VPS con persistencia comprobada.
- [ ] Medición p50/p95/p99, queries lentas, cola y frontend.
- [ ] Copia de backup fuera del volumen principal.
- [ ] Credenciales reales de proveedores externos y webhooks verificados; si faltan, UI `NO CONFIGURADO`.

Mientras alguno de estos puntos no tenga evidencia, el estado correcto es **Validando**, no “GoPaq está en producción”.
