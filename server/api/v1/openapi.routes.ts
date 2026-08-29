import { Router } from 'express';

export const openapiRouter = Router();

openapiRouter.get('/openapi.json', (req, res) => {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'GoPaq Core Logistics REST API',
      version: '1.4.0',
      description: 'API Pública de Logística, Courier Internacional, Despacho de Última Milla y Conciliación COD para GoPaq.',
      contact: {
        name: 'Soporte GoPaq API',
        email: 'api@gopaq.com'
      }
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Servidor Localhost de Desarrollo' },
      { url: 'https://api.gopaq.com/v1', description: 'Servidor de Producción' }
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
                    email: { type: 'string', example: 'admin@gopaq.local' },
                    password: { type: 'string', example: 'GoPaq123!' }
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
      }
    }
  };

  return res.json(schema);
});
