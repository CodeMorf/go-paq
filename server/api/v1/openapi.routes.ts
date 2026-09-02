import { Router } from 'express';

export const openapiRouter = Router();

openapiRouter.get('/openapi.json', (req, res) => {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'GoPaq Core Logistics REST API',
      version: '1.6.0',
      description: 'API Pública de Logística, Courier Internacional, Despacho de Última Milla y Conciliación COD para GoPaq.',
      contact: { name: 'Soporte GoPaq API' }
    },
    servers: [
      { url: 'https://gopaq.lat/api/v1', description: 'API pública de GoPaq' },
      { url: 'http://localhost:4000/api/v1', description: 'Servidor local' }
    ],
    paths: {
      '/auth/login': {
        post: {
          summary: 'Iniciar Sesión y Obtener Token JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string', format: 'password' },
                    area: { type: 'string', enum: ['super-admin', 'portal', 'sucursal', 'driver'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Token generado exitosamente' }
          }
        }
      },
      '/quotes': {
        post: {
          summary: 'Cotizar Envío en Tiempo Real',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceType: { type: 'string', example: 'local' },
                    originCity: { type: 'string', example: 'Santo Domingo' },
                    destCity: { type: 'string', example: 'Santiago' },
                    weightKg: { type: 'number', example: 2.5 }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Cotización calculada' }
          }
        }
      },
      '/shipments': {
        get: {
          summary: 'Listar Envíos Registrados',
          responses: { '200': { description: 'Lista de envíos' } }
        },
        post: {
          summary: 'Crear Nuevo Envío Logístico',
          responses: { '201': { description: 'Envío creado con tracking' } }
        }
      },
      '/tracking/{trackingNumber}': {
        get: {
          summary: 'Consultar Rastreo de Guía en Vivo',
          parameters: [
            { name: 'trackingNumber', in: 'path', required: true, schema: { type: 'string' }, example: 'GP-892410' }
          ],
          responses: { '200': { description: 'Detalle de trazabilidad en vivo' } }
        }
      },
      '/moving/quote': {
        post: {
          summary: 'Calcular cotización de mudanza',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['volumeM3'], properties: { volumeM3: { type: 'number' }, floors: { type: 'integer' }, hasElevator: { type: 'boolean' }, crewCount: { type: 'integer' }, distanceKm: { type: 'number' } } } } } },
          responses: { '200': { description: 'Cotización calculada por el motor de mudanzas' } }
        }
      },
      '/moving/orders': {
        get: { summary: 'Listar órdenes de mudanza del tenant', responses: { '200': { description: 'Órdenes persistidas' } } },
        post: { summary: 'Crear orden de mudanza', parameters: [{ name: 'Idempotency-Key', in: 'header', required: false, schema: { type: 'string' } }], responses: { '201': { description: 'Orden y trabajo unificado persistidos' } } }
      },
      '/heavy-cargo/quote': {
        post: {
          summary: 'Calcular cotización de carga pesada',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['totalWeightKg', 'lengthM', 'widthM', 'heightM'], properties: { palletsCount: { type: 'integer' }, totalWeightKg: { type: 'number' }, lengthM: { type: 'number' }, widthM: { type: 'number' }, heightM: { type: 'number' }, equipmentRequired: { type: 'string' } } } } } },
          responses: { '200': { description: 'Cotización calculada por el motor de carga pesada' } }
        }
      },
      '/heavy-cargo/orders': {
        get: { summary: 'Listar órdenes de carga pesada del tenant', responses: { '200': { description: 'Órdenes persistidas' } } },
        post: { summary: 'Crear orden de carga pesada', parameters: [{ name: 'Idempotency-Key', in: 'header', required: false, schema: { type: 'string' } }], responses: { '201': { description: 'Orden y trabajo unificado persistidos' } } }
      },
      '/configuration': {
        get: {
          summary: 'Consultar configuración efectiva del tenant',
          description: 'Devuelve valores de negocio por organización y estado de versionado. Nunca devuelve secretos de infraestructura.',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Configuración efectiva' }, '403': { description: 'Rol no autorizado' } }
        }
      },
      '/configuration/{category}': {
        patch: {
          summary: 'Actualizar una sección de configuración',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'category', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['settings', 'expectedVersion'], properties: { settings: { type: 'object', additionalProperties: true }, expectedVersion: { type: 'integer', minimum: 0 }, reason: { type: 'string' } } } } } },
          responses: { '200': { description: 'Configuración persistida y versionada' }, '409': { description: 'Versión desactualizada' }, '422': { description: 'Configuración inválida' } }
        }
      },
      '/configuration/google-maps': {
        patch: {
          summary: 'Guardar o retirar la credencial de navegador de Google Maps',
          description: 'Actualiza la credencial cifrada y versionada del tenant. La respuesta nunca contiene la clave completa.',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['apiKey', 'expectedVersion'], properties: { apiKey: { type: ['string', 'null'], minLength: 20 }, expectedVersion: { type: 'integer', minimum: 0 }, reason: { type: 'string' } } } } } },
          responses: { '200': { description: 'Credencial guardada o retirada' }, '403': { description: 'Rol no autorizado' }, '409': { description: 'Versión desactualizada' }, '422': { description: 'Clave o versión inválida' }, '503': { description: 'Cifrado de credenciales no configurado' } }
        }
      },
      '/configuration/maps': {
        get: {
          summary: 'Consultar la configuración pública de Google Maps',
          description: 'Devuelve la clave de navegador únicamente cuando el tenant público la configuró; no devuelve ninguna otra configuración.',
          responses: { '200': { description: 'Estado de Google Maps y clave de navegador configurada' }, '503': { description: 'Credencial no disponible' } }
        }
      },
      '/configuration/revisions': {
        get: {
          summary: 'Consultar historial de configuración',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Historial de revisiones' } }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  };

  return res.json(schema);
});
