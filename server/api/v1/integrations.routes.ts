import { Router } from 'express';
import { isPostgres, queryOne } from '../../db/database';
import { WitylogixBridge } from '../../integrations/witylogix/witylogix.adapter';
import { KarrioAdapter } from '../../integrations/karrio/karrio.adapter';

export const integrationsRouter = Router();

// GET /api/v1/integrations/health
integrationsRouter.get('/health', async (req, res) => {
  const witylogixUrl = process.env.WITYLOGIX_SERVICE_URL;
  const karrioUrl = process.env.KARRIO_API_URL;
  const karrioKey = process.env.KARRIO_API_KEY;

  // 1. Database Health Check
  let dbStatus = 'healthy';
  try {
    const testRow = queryOne('SELECT 1 as live');
    if (!testRow) dbStatus = 'unresponsive';
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  // 2. Witylogix Health Check (AGPL Isolated Microservice)
  const witylogix = {
    configured: !!witylogixUrl,
    serviceUrl: witylogixUrl || null,
    licenseNotice: 'GNU AGPL-3.0 (Separated microservice architecture)',
    reachable: false,
    latencyMs: null as number | null,
    status: witylogixUrl ? 'checking' : 'NOT CONFIGURED'
  };

  if (witylogixUrl) {
    const start = Date.now();
    try {
      const resp = await fetch(`${witylogixUrl}${process.env.WITYLOGIX_HEALTH_PATH || '/health'}`, {
        signal: AbortSignal.timeout(Number(process.env.WITYLOGIX_TIMEOUT_MS) || 3000)
      });
      witylogix.reachable = resp.ok;
      witylogix.latencyMs = Date.now() - start;
      witylogix.status = resp.ok ? 'ONLINE' : `HTTP ${resp.status}`;
    } catch {
      witylogix.reachable = false;
      witylogix.status = 'UNREACHABLE';
    }
  }

  // 3. Karrio Health Check (LGPL-3.0 Multi-Carrier Engine)
  const karrio = {
    configured: !!(karrioUrl && karrioKey),
    serviceUrl: karrioUrl || null,
    licenseNotice: 'GNU LGPL-3.0 / Commercial Gateway',
    reachable: false,
    latencyMs: null as number | null,
    status: (karrioUrl && karrioKey) ? 'checking' : 'NOT CONFIGURED'
  };

  if (karrioUrl && karrioKey) {
    const start = Date.now();
    try {
      const resp = await fetch(`${karrioUrl}/v1/addresses`, {
        headers: { 'Authorization': `Token ${karrioKey}` },
        signal: AbortSignal.timeout(3000)
      });
      karrio.reachable = resp.status !== 500 && resp.status !== 502;
      karrio.latencyMs = Date.now() - start;
      karrio.status = resp.ok ? 'ONLINE' : `HTTP ${resp.status}`;
    } catch {
      karrio.reachable = false;
      karrio.status = 'UNREACHABLE';
    }
  }

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    database: {
      engine: isPostgres ? 'PostgreSQL + PostGIS' : 'SQLite (Local Dev)',
      status: dbStatus
    },
    witylogix,
    karrio
  });
});
