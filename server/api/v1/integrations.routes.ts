import { Router } from 'express';
import { isPostgres, queryOneAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole } from '../../auth/middleware';
import { asyncHandler } from '../../core/http';
import { WitylogixBridge } from '../../integrations/witylogix/witylogix.adapter';
import { KarrioAdapter } from '../../integrations/karrio/karrio.adapter';

export const integrationsRouter = Router();

integrationsRouter.get('/health', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS']), asyncHandler(async (_req: AuthenticatedRequest, res) => {
  let dbStatus = 'healthy';
  try {
    const testRow = await queryOneAsync<{ live: number }>('SELECT 1 AS live');
    if (!testRow) dbStatus = 'unresponsive';
  } catch (error) {
    dbStatus = 'error';
  }

  const wityStart = Date.now();
  const wityResult = await WitylogixBridge.health();
  const wityError = 'error' in wityResult ? wityResult.error : undefined;
  const karrioStart = Date.now();
  const karrioResult = await KarrioAdapter.health();
  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    database: { engine: isPostgres ? 'PostgreSQL + PostGIS' : 'SQLite (solo desarrollo)', status: dbStatus },
    witylogix: { configured: WitylogixBridge.isConfigured(), licenseNotice: 'GNU AGPL-3.0 — servicio independiente por HTTP', reachable: wityResult.success, latencyMs: WitylogixBridge.isConfigured() ? Date.now() - wityStart : null, status: !WitylogixBridge.isConfigured() ? 'NOT CONFIGURADO' : wityResult.success ? 'ONLINE' : (wityError || 'UNAVAILABLE') },
    karrio: { configured: KarrioAdapter.isConfigured(), licenseNotice: 'GNU LGPL-3.0 — servicio independiente', reachable: karrioResult.success, latencyMs: KarrioAdapter.isConfigured() ? Date.now() - karrioStart : null, status: !KarrioAdapter.isConfigured() ? 'NOT CONFIGURADO' : karrioResult.success ? 'ONLINE' : (karrioResult.error || 'UNAVAILABLE') }
  });
}));
