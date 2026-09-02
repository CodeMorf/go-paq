import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { authRouter } from '../api/v1/auth.routes';
import { shipmentsRouter } from '../api/v1/shipments.routes';
import { quotesRouter } from '../api/v1/quotes.routes';
import { trackingRouter } from '../api/v1/tracking.routes';
import { routesRouter } from '../api/v1/routes.routes';
import { driversRouter } from '../api/v1/drivers.routes';
import { branchesRouter } from '../api/v1/branches.routes';
import { clientsRouter } from '../api/v1/clients.routes';
import { codRouter } from '../api/v1/cod.routes';
import { internationalRouter } from '../api/v1/international.routes';
import { movingRouter } from '../api/v1/moving.routes';
import { heavyCargoRouter } from '../api/v1/heavyCargo.routes';
import { apiKeysRouter } from '../api/v1/apiKeys.routes';
import { webhooksRouter } from '../api/v1/webhooks.routes';
import { openapiRouter } from '../api/v1/openapi.routes';
import { integrationsRouter } from '../api/v1/integrations.routes';
import { configurationRouter } from '../api/v1/configuration.routes';
import { requestId, publicError } from './http';
import { checkDatabase, isPostgres, queryOneAsync } from '../db/database';
import Redis from 'ioredis';

export const app = express();
app.set('trust proxy', 1);

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Espera unos minutos antes de volver a intentar.' }
});

const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Límite temporal alcanzado. Intenta nuevamente en unos segundos.' }
});

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') callback(null, true);
    else callback(new Error('Bloqueado por política CORS'));
  },
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(requestId);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GoPaq Core Logistics API', version: process.env.GOPAQ_VERSION || '2.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/ready', async (_req, res) => {
  const database = await checkDatabase();
  let redis = { ok: process.env.NODE_ENV !== 'production' && !process.env.REDIS_URL, configured: !!process.env.REDIS_URL, error: undefined as string | undefined };
  if (process.env.REDIS_URL) {
    const client = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 1500 });
    try {
      await client.connect();
      redis = { ok: (await client.ping()) === 'PONG', configured: true, error: undefined };
      await client.quit();
    } catch (error) {
      redis = { ok: false, configured: true, error: error instanceof Error ? error.message : 'redis_error' };
      client.disconnect();
    }
  }
  let migrationsReady = !isPostgres;
  if (isPostgres) {
    try { migrationsReady = !!(await queryOneAsync('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1')); } catch { migrationsReady = false; }
  }
  const ready = database.ok && redis.ok && migrationsReady;
  return res.status(ready ? 200 : 503).json({ success: ready, status: ready ? 'ready' : 'not_ready', database, redis, migrations: migrationsReady });
});

const apiV1 = express.Router();
apiV1.use(publicRateLimit);
apiV1.use('/auth', authRateLimit);
apiV1.use('/auth', authRouter);
apiV1.use('/shipments', shipmentsRouter);
apiV1.use('/quotes', quotesRouter);
apiV1.use('/tracking', trackingRouter);
apiV1.use('/routes', routesRouter);
apiV1.use('/drivers', driversRouter);
apiV1.use('/branches', branchesRouter);
apiV1.use('/clients', clientsRouter);
apiV1.use('/cod', codRouter);
apiV1.use('/international', internationalRouter);
apiV1.use('/moving', movingRouter);
apiV1.use('/heavy-cargo', heavyCargoRouter);
apiV1.use('/api-keys', apiKeysRouter);
apiV1.use('/webhooks', webhooksRouter);
apiV1.use('/integrations', integrationsRouter);
apiV1.use('/configuration', configurationRouter);
apiV1.use('/docs', openapiRouter);
app.use('/api/v1', apiV1);

// In the production image the Vite build is served by the same process.
// This fallback is what makes direct visits to /portal/*, /sucursal/*, etc. work after a browser refresh.
const distDir = path.resolve(process.cwd(), 'dist');
const indexFile = path.join(distDir, 'index.html');
if (fs.existsSync(indexFile)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(indexFile);
  });
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]:', err instanceof Error ? err.message : 'unknown_error');
  res.status(err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500).json({ success: false, error: publicError(err) });
});
