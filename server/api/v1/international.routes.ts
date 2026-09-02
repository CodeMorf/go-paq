import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';
import { serializeInternationalPackage } from '../../utils/serializers';

export const internationalRouter = Router();

// GET /api/v1/international/lockers
internationalRouter.get('/lockers', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const lockers = queryAll(`
    SELECT l.*, c.name as client_name, c.company_name
    FROM international_lockers l
    JOIN clients c ON l.client_id = c.id
    WHERE l.organization_id = ?
  `, [orgId]);

  return res.json({ success: true, lockers });
});

// GET /api/v1/international/packages
internationalRouter.get('/packages', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const packages = queryAll(`
    SELECT p.*, l.locker_code, c.company_name as client_name
    FROM international_packages p
    LEFT JOIN international_lockers l ON p.locker_id = l.id
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.organization_id = ?
    ORDER BY p.created_at DESC
  `, [orgId]);

  return res.json({ success: true, count: packages.length, packages: packages.map(serializeInternationalPackage) });
});

// POST /api/v1/international/consolidate
internationalRouter.post('/consolidate', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { packageIds = [], clientId, notes } = req.body;

  if (packageIds.length < 2) {
    return res.status(400).json({ success: false, error: 'Se requieren al menos 2 paquetes para consolidar.' });
  }

  const masterTracking = `GP-CONSOL-${Date.now().toString().slice(-6)}`;
  const consolidationId = `csl-${Date.now()}`;
  const now = new Date().toISOString();

  transaction(() => {
    execute(`
      INSERT INTO international_consolidations (id, organization_id, client_id, master_tracking, packages_count, total_weight_lbs, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 'consolidated', ?, ?)
    `, [consolidationId, orgId, clientId || 'cli-techstore', masterTracking, packageIds.length, notes || '', now]);

    for (const pId of packageIds) {
      const result:any = execute(`UPDATE international_packages SET status = 'consolidated', consolidation_id = ? WHERE id = ? AND organization_id = ? AND status != 'consolidated'`, [consolidationId, pId, orgId]);
      if (!result?.changes) throw new Error(`Paquete no válido para consolidación: ${pId}`);
    }
  });

  return res.status(201).json({
    success: true,
    message: 'Consolidación creada exitosamente.',
    masterTracking,
    consolidationId,
    packagesConsolidated: packageIds.length
  });
});
