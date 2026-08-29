import { Router } from 'express';
import { isPostgres, queryOneAsync } from '../../db/database';
import { WitylogixBridge } from '../../integrations/witylogix/witylogix.adapter';
import { KarrioAdapter } from '../../integrations/karrio/karrio.adapter';

export const integrationsRouter = Router();

integrationsRouter.get('/health', async (_req, res) => {
  let dbStatus = 'healthy';
  try {
    const testRow = await queryOneAsync('SELECT 1 as live');
    if (!testRow) dbStatus = 'unresponsive';
  } catch (error: any) {
    dbStatus = `error: ${error.message}`;
  }

  const wityStart = Date.now();
  const wityResult = await WitylogixBridge.health();
  const wityError = 'error' in wityResult ? wityResult.error : undefined;
  const witylogix = {
    configured: WitylogixBridge.isConfigured(),
    serviceUrl: process.env.WITYLOGIX_SERVICE_URL || null,
    licenseNotice: 'GNU AGPL-3.0 — independent service, HTTP boundary',
    reachable: wityResult.success,
    latencyMs: WitylogixBridge.isConfigured() ? Date.now() - wityStart : null,
    status: !WitylogixBridge.isConfigured() ? 'NOT CONFIGURED' : wityResult.success ? 'ONLINE' : (wityError || 'UNAVAILABLE')
  };

  const karrioStart = Date.now();
  const karrioResult = await KarrioAdapter.health();
  const karrio = {
    configured: KarrioAdapter.isConfigured(),
    serviceUrl: process.env.KARRIO_API_URL || null,
    licenseNotice: 'GNU LGPL-3.0 OSS core — independent service',
    reachable: karrioResult.success,
    latencyMs: process.env.KARRIO_API_URL ? Date.now() - karrioStart : null,
    status: !process.env.KARRIO_API_URL ? 'NOT CONFIGURED' : karrioResult.success ? 'ONLINE' : (karrioResult.error || 'UNAVAILABLE')
  };

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    database: { engine: isPostgres ? 'PostgreSQL + PostGIS' : 'SQLite (Local Dev)', status: dbStatus },
    witylogix,
    karrio
  });
});
