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

## 🧩 Arquitectura de Sistemas & Paneles (34 Vistas Especializadas)

GoPaq está estructurado en **5 Grandes Ecosistemas** interconectados en tiempo real que suman **34 paneles operativos** y **11 pestañas maestras de configuración**:

---

### 1. 🛡️ Super Admin & Centro de Control Operativo (19 Paneles)

| Panel / Subvista | Identificador | Descripción y Funcionalidad |
|---|---|---|
| **Dashboard General** | `dashboard` | KPIs operativos y financieros, volumen de envíos, tasas de entrega y métricas ejecutivas. |
| **Operaciones en Vivo (Live Console)** | `operaciones-vivo` | Consola de telemetría en tiempo real, logs de eventos y estado de toda la red logística. |
| **Centro Omnicanal Zernio** | `zernio-omnichannel` | Hub centralizado de atención al cliente multicanal (WhatsApp, SMS, Email) con bots IA. |
| **IA Event Automation Studio** | `ia-eventos` | Motor visual de reglas automatizadas para alertas, reintentos y excepciones en tránsito. |
| **Escaneo Masivo (Bulk Scanner)** | `escaneo-masivo` | Recepción, clasificación y despacho de paquetes por lote con alertas de audio. |
| **Mapa de Flota en Vivo** | `mapa-flota` | Telemetría GPS en tiempo real de choferes, unidades móviles y rutas activas. |
| **Gestión de Envíos (Shipments)** | `envios` | Control integral del ciclo de vida de guías, filtros avanzados y actualización de estados. |
| **Courier Internacional & Lockers** | `courier-intl` | Gestión aduanal, vuelos/contenedores, manifiestos y casilleros de importación. |
| **Despacho y Rutas (Routes Dispatcher)** | `rutas` | Planificación, optimización y asignación dinámica de paquetes a transportistas. |
| **Mudanzas & Carga Pesada** | `mudanzas-carga` | Cubicaje, estiba, cotización de volumen ($m^3$) y fletes especiales. |
| **Flota de Drivers** | `drivers` | Ficha de choferes, vehículos, pólizas, licencias y métricas de rendimiento. |
| **Sucursales y Almacenes (Hubs)** | `sucursales` | Red de agencias físicas, centros de distribución e inventarios por sede. |
| **Registro & Matcher de Sucursales** | `registro-sucursal-matcher` | Enrutamiento inteligente y asignación de clientes a la agencia más cercana. |
| **Gestión de Clientes Corporativos** | `clientes` | Fichas de cliente, límites de crédito, cuentas por cobrar y facturación. |
| **Zonas Peligrosas / Alto Riesgo** | `zonas-peligrosas` | Geocercas de seguridad, restricciones de entrega y recargos por zona de riesgo. |
| **Conciliación COD (Cash on Delivery)** | `cod` | Liquidación automatizada de pagos contra entrega y transferencias a comercios. |
| **Motor de Tarifas Dinámicas** | `tarifas` | Matrices de precios por peso, volumen, zona geográfica y tipo de servicio. |
| **Equipo & RBAC** | `equipo` | Control de acceso basado en roles con permisos granulares por módulo. |
| **Configuración Global del Sistema** | `configuracion` | Centro de control maestro con **14 Secciones de Ajustes**: |
| | ↳ *Branding & Identidad* | Logo, paleta de colores y personalización corporativa. |
| | ↳ *Localización & Divisas* | Moneda base (`DOP`, `USD`, `EUR`), impuestos y formatos regionales. |
| | ↳ *Servicios* | Capacidades activas de paquetería, última milla, mudanzas, carga y COD. |
| | ↳ *Aduanas & Casilleros* | Tarifas arancelarias, direcciones físicas en Miami/Madrid y límites. |
| | ↳ *Operaciones & Despacho* | Parámetros de SLA, tolerancias de tiempo y radios de cobertura. |
| | ↳ *Facturación Fiscal* | Comprobantes fiscales (NCF), secuencias numéricas e impuestos. |
| | ↳ *Pagos & Pasarelas COD* | Comisiones de recaudo, métodos de pago y transferencias. |
| | ↳ *Notificaciones & Alertas* | Plantillas para SMS, Push, WhatsApp y correos transaccionales. |
| | ↳ *Automatización IA* | Integración con Gemini AI, modelos OCR y prompts del sistema. |
| | ↳ *Driver y Sincronización* | Intervalos GPS, modo offline y requisitos de evidencia de entrega. |
| | ↳ *Almacenamiento* | Proveedor de archivos, URLs firmadas y retención de POD/documentos. |
| | ↳ *Integraciones* | Selección de carriers, routing, geocoding y tracking externo. |
| | ↳ *Base de Datos & Redis* | Estado de conexiones, sincronización de caché y réplicas. |
| | ↳ *Seguridad & 2FA* | Políticas de contraseñas, sesiones activas y listas de IP permitidas. |
| | ↳ *Desarrolladores & Webhooks* | Endpoints, logs de webhooks y tokens de integración. |

---

### 2. 🏢 Sucursal OS — Sistema para Agencias y Puntos de Venta (6 Paneles)

| Panel / Subvista | Identificador | Descripción y Funcionalidad |
|---|---|---|
| **Dashboard de Sucursal** | `dashboard` | Resumen de ventas diarias en mostrador, paquetes entrantes y por entregar. |
| **Mostrador / Punto de Venta (Counter POS)** | `mostrador` | Emisión rápida de guías físicas, pesaje y cobro de envíos al público. |
| **Inventario Físico de Sucursal** | `inventario` | Paquetes en custodia para retiro en tienda (*Pickup*) y transferencias. |
| **Despacho de Drivers Locales** | `despacho-drivers` | Asignación y salida de mensajeros de última milla asignados a la agencia. |
| **Arqueo y Cierre de Caja** | `arqueo-caja` | Control de cobros en efectivo, tarjeta y transferencias con balance diario. |
| **Escáner Masivo de Sucursal** | `escaneo-masivo` | Validación de bultos al ingreso de la camioneta troncal o salida a ruta. |

---

### 3. 👤 Portal de Clientes & E-Commerce (7 Paneles)

| Panel / Subvista | Identificador | Descripción y Funcionalidad |
|---|---|---|
| **Dashboard del Cliente** | `dashboard` | Resumen de paquetes en tránsito, saldo disponible y recaudos COD pendientes. |
| **Crear Envío / Cotizador** | `crear-envio` | Asistente de cotización y generación de envíos individuales o masivos. |
| **Tracking Público & Privado** | `tracking` | Rastreador en tiempo real con línea de tiempo detallada y fotos de evidencia. |
| **Casillero Internacional (Lockers)** | `casillero` | Direcciones asignadas en Miami, Madrid, etc., para compras internacionales. |
| **Mis Paquetes & Historial** | `paquetes-list` | Historial completo con filtros de búsqueda y descarga de comprobantes. |
| **Cuenta Corriente & Facturación** | `cuenta-corriente` | Historial de facturación, abonos y transferencias de dinero COD. |
| **API Keys & Webhooks** | `api-keys` | Generación de credenciales y webhooks para integrar tiendas Shopify, WooCommerce, etc. |

---

### 4. 📱 Driver App — Aplicación Móvil para Conductores (1 Módulo con 6 Capacidades)

- 🚚 **Manifiesto de Ruta:** Lista interactiva de paradas ordenadas con geolocalización y enlace a Waze/Google Maps.
- 📷 **Escaneo OCR con Cámara:** Reconocimiento visual de etiquetas y códigos de barra con la cámara del dispositivo.
- ✍️ **Prueba de Entrega Digital (e-POD):** Captura de firma táctil en pantalla, fotografía de entrega y coordenadas GPS.
- 💵 **Control de Recaudación COD:** Registro y validación del dinero cobrado en efectivo al cliente final.
- 🔔 **Notificaciones Push & Audio:** Alertas auditivas y avisos instantáneos ante cambios de ruta o asignaciones.
- 📶 **Modo Offline & Sync Health:** Cola local de transacciones para operar en zonas sin cobertura celular.

---

### 5. 📖 Documentación & API REST (1 Panel)

- ⚡ **API Docs & Explorer (`docs`):** Especificación interactiva con endpoints REST, autenticación Bearer y ejemplos de código en cURL, JavaScript y Python.

---

### 🖨️ Componentes y Modales Globales
- **Command Palette (`Ctrl+K`):** Buscador rápido universal para navegación instantánea.
- **Modal Global de Creación de Envíos:** Accesible desde las áreas autenticadas y conectado al motor de cotización/envíos.


---

## 💻 Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend Core** | React 19, TypeScript, Vite |
| **Estilos & UI** | Tailwind CSS v4, Motion (Framer Motion), Lucide Icons |
| **Realtime & Mensajería** | WebSockets autenticados, Redis Pub/Sub y Webhooks por outbox |
| **Inteligencia & OCR** | Adaptadores de proveedor; sin proveedor activo se informa `NO CONFIGURADO` |
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
│   ├── types/               # Definiciones de tipos TypeScript
│   ├── utils/               # Utilidades de interfaz y estado de sincronización
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
- La documentación usa el marcador `YOUR_API_KEY`; las claves reales solo se generan desde una sesión autorizada, se almacenan hasheadas y se muestran una sola vez.

---

## 👤 Autor

**CodeMorf**  
- GitHub: [@CodeMorf](https://github.com/CodeMorf)
- Repositorio: [https://github.com/CodeMorf/go-paq](https://github.com/CodeMorf/go-paq)

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

