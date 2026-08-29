import express from 'express';
import cors from 'cors';
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

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GoPaq Core Logistics API',
    version: '1.4.0',
    timestamp: new Date().toISOString()
  });
});

// API v1 Router Mounts
const apiV1 = express.Router();
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
apiV1.use('/docs', openapiRouter);

app.use('/api/v1', apiV1);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]:', err);
  res.status(500).json({ success: false, error: err.message || 'Error interno del servidor GoPaq.' });
});
