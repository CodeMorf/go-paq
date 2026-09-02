import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/http';
import { AuthenticatedRequest, authenticate, requireRole } from '../../auth/middleware';
import {
  CONFIGURATION_CATEGORIES,
  ConfigurationCategory,
  getConfigurationRevisions,
  getOrganizationConfiguration,
  updateOrganizationConfiguration
} from '../../modules/configuration/configuration.service';
import { normalizeRole } from '../../auth/roles';

export const configurationRouter = Router();

const readRoles = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS'];
const fullWriteRoles = ['SUPER_ADMIN', 'OWNER'];
const adminWriteCategories = new Set<ConfigurationCategory>([
  'organization', 'localization', 'services', 'operations', 'international', 'finance', 'billing',
  'notifications', 'automation', 'driver', 'storage', 'developer'
]);
const operationsWriteCategories = new Set<ConfigurationCategory>(['services', 'operations', 'international', 'driver']);

function isConfigurationCategory(value: string): value is ConfigurationCategory {
  return (CONFIGURATION_CATEGORIES as readonly string[]).includes(value);
}

function canWrite(role: string | undefined, category: ConfigurationCategory) {
  const normalized = normalizeRole(role);
  if (fullWriteRoles.includes(normalized)) return true;
  if (normalized === 'ADMIN') return adminWriteCategories.has(category);
  if (normalized === 'OPERATIONS') return operationsWriteCategories.has(category);
  return false;
}

configurationRouter.get('/', authenticate, requireRole(readRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const configuration = await getOrganizationConfiguration(req.organizationId!);
  return res.json({
    success: true,
    organizationId: req.organizationId,
    categories: CONFIGURATION_CATEGORIES,
    ...configuration
  });
}));

configurationRouter.get('/revisions', authenticate, requireRole(readRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsedLimit = Number(req.query.limit || 50);
  const revisions = await getConfigurationRevisions(req.organizationId!, Number.isFinite(parsedLimit) ? parsedLimit : 50);
  return res.json({ success: true, revisions });
}));

const updateSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  expectedVersion: z.number().int().min(0),
  reason: z.string().trim().max(240).optional()
}).strict();

configurationRouter.patch('/:category', authenticate, requireRole(readRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const categoryParam = String(req.params.category || '');
  if (!isConfigurationCategory(categoryParam)) return res.status(404).json({ success: false, error: 'Categoría de configuración no encontrada.' });
  if (!canWrite(req.user?.role, categoryParam)) return res.status(403).json({ success: false, error: 'Este rol puede consultar, pero no modificar esta categoría de configuración.' });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'La solicitud de configuración es inválida.' });

  const updated = await updateOrganizationConfiguration({
    organizationId: req.organizationId!,
    userId: req.user!.userId,
    category: categoryParam,
    patch: parsed.data.settings,
    expectedVersion: parsed.data.expectedVersion,
    reason: parsed.data.reason,
    ipAddress: req.ip
  });
  return res.json({ success: true, organizationId: req.organizationId, category: categoryParam, ...updated });
}));
