# 📦 GoPaq — Plataforma Integral de Logística, Courier & Última Milla

<div align="center">

![GoPaq Banner](https://img.shields.io/badge/GoPaq-Logistics%20Platform-0284c7?style=for-the-badge&logo=cargo&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-emerald?style=for-the-badge)
![Author](https://img.shields.io/badge/developer-CodeMorf-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-amber?style=for-the-badge)

**Desarrollado y mantenido por [CodeMorf](https://github.com/CodeMorf)**

*Solución SaaS modular de alto rendimiento para la gestión logística integral: envíos locales/nacionales, courier internacional, casilleros, mudanzas, carga pesada, control de sucursales, conciliación COD y app para conductores.*

</div>

---

## 🚀 Visión General

**GoPaq** es un ecosistema logístico de extremo a extremo diseñado para empresas de transporte, couriers, agencias y operadores de última milla. Proporciona una suite completa de herramientas interconectadas en tiempo real para optimizar cada etapa de la cadena de suministro.

---

## 🧩 Arquitectura de Módulos

### 1. 🛡️ Super Admin & Centro de Control Operativo
- **Live Console & Dashboard:** Monitoreo en tiempo real de envíos, métricas financieras, volumen de paquetes y KPIs operativos.
- **Gestión de Envíos & Courier Internacional:** Control unificado de paquetes locales, nacionales e importaciones/exportaciones con gestión aduanal.
- **Despacho & Optimización de Rutas:** Asignación inteligente de paquetes a conductores y cálculo dinámico de rutas de entrega.
- **Motor de Tarifas Dinámicas:** Configuración de precios por peso, volumen, zona geográfica, tipo de servicio y recargos.
- **Conciliación COD (Cash on Delivery):** Liquidación automatizada de pagos contra entrega, control de recaudos y pagos a clientes comerciales.
- **Gestión de Zonas de Riesgo:** Delimitación de polígonos y tarifas/restricciones especiales por nivel de seguridad.
- **IA Event Automation Studio:** Reglas automatizadas de alertas, reintentos y escalamiento ante excepciones en tránsito.
- **Centro Omnicanal Zernio:** Gestión de comunicaciones, notificaciones al cliente vía WhatsApp, SMS y correo electrónico.
- **Control de Flota & RBAC:** Administración de roles y permisos granulares (Super Admin, Operaciones, Sucursal, Conductor, Cliente).

### 2. 🏢 Sucursal OS (Punto de Venta & Agencias)
- **Counter POS:** Registro rápido de paquetes en mostrador con generación inmediata de guía.
- **Inventario Físico de Sucursal:** Control de paquetes recibidos, en custodia y listos para entrega en tienda (Pickup).
- **Caja & Cuadre Diario:** Arqueo de efectivo, cobros POS y transferencias con cierre de turno.
- **Despacho Local:** Asignación directa de paquetes a mensajeros y transportistas de la zona.

### 3. 👤 Portal de Clientes & Empresas
- **Creación & Cotización de Envíos:** Asistente interactivo para cotizar y registrar envíos individuales o por lote.
- **Casillero Internacional (Locker Addresses):** Direcciones asignadas en Miami, Madrid, etc., para recepción y reenvío de compras internacionales.
- **Tracking & Trazabilidad:** Consulta en tiempo real con línea de tiempo detallada de estados y evidencias.
- **Facturación & Balance:** Historial de facturas, recargas de saldo y estado de cuenta COD.
- **API Keys & Webhooks:** Acceso a llaves API y configuración de webhooks para integraciones directas con tiendas e-commerce (Shopify, WooCommerce, Custom).

### 4. 📱 Driver App (Aplicación para Conductores)
- **Manifiesto de Ruta:** Lista interactiva de entregas y recolecciones ordenadas con geolocalización.
- **Escaneo OCR & Cámara:** Lectura visual y de código de barras de etiquetas para confirmación rápida.
- **Prueba de Entrega Digital (e-POD):** Captura de firma digital táctil, fotografía de entrega y coordenadas GPS.
- **Sincronización Offline/Online:** Manejo resiliente de conectividad para registro en zonas sin cobertura.
- **Notificaciones Push:** Avisos en tiempo real sobre nuevas asignaciones, cancelaciones o cambios de ruta.

### 5. ⚡ Operaciones & Scanner Masivo
- **Bulk Scanner:** Escaneo masivo con pistola óptica o cámara para recepción en bodega, transferencias entre hubs y salidas a ruta.
- **Feedback Auditivo y Háptico:** Alertas sonoras para validación rápida y detección de errores de clasificación.
- **Impresión de Etiquetas Térmicas:** Generación y envío a impresión de formatos estándar (4x6", etc.).

---

## 💻 Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend Core** | React 19, TypeScript, Vite |
| **Estilos & UI** | Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| **Realtime & Mensajería** | Pusher JS, Webhooks, Audio Alerts API |
| **Inteligencia & OCR** | Google GenAI SDK, Canvas Confetti |
| **Herramientas de Build** | Bun / Node.js, PostCSS, Autoprefixer |

---

## 📂 Estructura del Proyecto

```
GoPaq/
├── src/
│   ├── components/
│   │   ├── clients/         # Módulo y registro de clientes
│   │   ├── docs/            # Documentación interactiva de la API
│   │   ├── driver/          # App móvil/web para conductores
│   │   ├── operations/      # Consola de operaciones y escáner masivo
│   │   ├── portal/          # Portal para clientes y e-commerce
│   │   ├── sucursal/        # Sistema operativo de agencias/sucursales
│   │   ├── super-admin/     # Panel de administración maestro
│   │   └── ui/              # Componentes de diseño, modales y widgets
│   ├── context/             # Estado global (AppContext)
│   ├── data/                # Mock data y reglas de automatización
│   ├── types/               # Definiciones de tipos TypeScript
│   ├── utils/               # Servicios de sincronización, audio y push
│   ├── App.tsx              # Ruteo principal y switch de módulos
│   ├── main.tsx             # Punto de entrada de la aplicación
│   └── index.css            # Estilos globales y Tailwind CSS
├── assets/                  # Recursos estáticos
├── .env.example             # Plantilla de variables de entorno
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
└── vite.config.ts           # Configuración del empaquetador Vite
```

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior) o Bun
- npm, pnpm o bun como gestor de paquetes

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CodeMorf/go-paq.git
   cd go-paq
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o con bun
   bun install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   # o con bun
   bun dev
   ```
   La aplicación se iniciará en `http://localhost:3000`.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 🔒 Seguridad y Privacidad

- Variables de entorno sensibles (`.env*`), credenciales de base de datos y certificados privados están permanentemente excluidos mediante `.gitignore`.
- Las claves y tokens mostrados en la documentación del portal son datos simulados con fines de demostración.

---

## 👤 Autor

**CodeMorf**  
- GitHub: [@CodeMorf](https://github.com/CodeMorf)
- Repositorio: [https://github.com/CodeMorf/go-paq](https://github.com/CodeMorf/go-paq)

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

