# GoPaq — Privacidad y retención operativa

## Propósito

Este documento define controles técnicos y operativos de GoPaq para minimizar datos, limitar accesos y conservar evidencias durante el tiempo necesario para operar envíos, pickups, entregas, cobros y soporte. **No sustituye una revisión legal local** ni una política contractual aprobada por el responsable del tratamiento.

## Datos tratados

GoPaq puede tratar identidad y contacto de clientes, remitentes, destinatarios y contactos autorizados; direcciones y coordenadas necesarias para pickup, ruta y entrega; datos de peso, dimensiones, contenido declarado y valor; estados, incidencias, documentos, POD, firma, fotografía, cobros, facturas, recibos, gastos y tickets. La API y los logs no deben guardar secretos, tokens completos, cuerpos de documentos ni payloads sensibles.

## Principios de acceso

Cada organización solo puede consultar y mutar datos de su propio contexto. Los permisos se asignan por recurso y acción. Las coordenadas del conductor se registran únicamente durante una sesión de turno/ruta activa y con la política de consentimiento visible. El acceso a POD, documentos, caja, cobros, reembolsos, auditoría y logs REST requiere permisos específicos y queda registrado cuando corresponde.

## Almacenamiento y seguridad

Los bytes de fotografías, firmas y documentos se almacenan en storage administrado; la base conserva referencias, claves y metadatos necesarios. El service worker no cachea API, credenciales ni portales autenticados. La cola offline se cifra localmente y no puede confirmar por sí misma entregas, pagos ni transiciones críticas. Las credenciales se administran como secretos del entorno y no deben entrar al repositorio, HTML, bundles, logs o issues.

## Retención propuesta para aprobación

Los plazos siguientes son valores operativos iniciales y deben ser aprobados por la organización y asesoría legal antes de producción. El job de eliminación o anonimización no está habilitado automáticamente en este checkpoint.

| Categoría | Uso | Retención operativa propuesta | Acción al vencer |
| --- | --- | --- | --- |
| Sesiones, API keys revocadas y rate-limit | Seguridad y acceso | 90 días desde expiración/revocación | Revocar o eliminar metadatos no necesarios |
| Logs REST y auditoría | Seguridad, soporte y trazabilidad | 365 días | Exportar evidencia aprobada y anonimizar cuando proceda |
| GPS de rutas | Operación, seguridad y prueba de servicio | 90 días desde cierre de ruta | Eliminar o agregar según necesidad aprobada |
| POD, fotos, firmas y documentos | Evidencia de entrega, facturación y disputas | 2 años desde cierre financiero | Retener solo cuando exista obligación o disputa documentada |
| Facturas, recibos, cobros y caja | Contabilidad y conciliación | Según obligación fiscal local aprobada | Archivado seguro o eliminación autorizada |
| Tickets y contactos autorizados | Atención y control de acceso | 365 días desde cierre | Anonimizar datos personales no necesarios |
| Cola offline local | Sincronización del dispositivo | Hasta sincronización, rechazo descartado o 30 días | Descartar cifradamente y conservar solo el resultado mínimo |

## Derechos y solicitudes

La organización debe definir un canal para solicitudes de acceso, corrección, oposición, eliminación o exportación cuando sean aplicables. Toda solicitud debe verificar identidad, organización y alcance antes de responder. Las eliminaciones no deben romper obligaciones fiscales, disputas, auditoría o seguridad; cuando exista una retención obligatoria, se debe restringir el acceso y documentar el motivo.

## Incidentes

Ante pérdida, acceso indebido, exposición de secretos o carga incorrecta, congelar la operación afectada, preservar logs y request IDs, revocar credenciales comprometidas, limitar acceso y escalar al responsable de seguridad y privacidad. No se deben borrar evidencias antes de completar la investigación y el backup aprobado.

## Checklist antes de producción

Aprobar legalmente los plazos; designar responsable de privacidad; probar aislamiento cross-tenant; verificar que storage, logs y backups no expongan PII; revisar permisos de exportación; probar revocación de API keys; documentar el canal de solicitudes; y configurar un proceso de retención/anominización con monitoreo. Hasta completar estos puntos, GoPaq permanece **NO-GO para datos reales**.

**By CodeMorf.tech**
