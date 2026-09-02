import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/http';
import { AuthenticatedRequest, authenticate, requireRole } from '../../auth/middleware';
import {
  CONFIGURATION_CATEGORIES,
  ConfigurationCategory,
  getGoogleMapsConfiguration,
  getConfigurationRevisions,
  getPublicGoogleMapsConfiguration,
  getOrganizationConfiguration,
  updateGoogleMapsConfiguration,
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
  const googleMaps = await getGoogleMapsConfiguration(req.organizationId!);
  return res.json({
    success: true,
    organizationId: req.organizationId,
    categories: CONFIGURATION_CATEGORIES,
    ...configuration,
    googleMaps
  });
}));

// This endpoint intentionally returns only a restricted Google Maps browser
// key to the public map client. It never exposes any other tenant settings.
configurationRouter.get('/maps', asyncHandler(async (_req, res) => {
  const organizationId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  const googleMaps = await getPublicGoogleMapsConfiguration(organizationId);
  if (googleMaps.status === 'provider_unavailable') {
    return res.status(503).json({ success: false, error: 'Google Maps no está disponible en este momento.' });
  }
  return res.json({ success: true, provider: 'google_maps', ...googleMaps });
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

const googleMapsUpdateSchema = z.object({
  apiKey: z.union([z.string().trim().min(20).max(500), z.null()]),
  expectedVersion: z.number().int().min(0),
  reason: z.string().trim().max(240).optional()
}).strict();

configurationRouter.patch('/google-maps', authenticate, requireRole(fullWriteRoles), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = googleMapsUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'La clave de Google Maps o la versión de configuración es inválida.' });

  const updated = await updateGoogleMapsConfiguration({
    organizationId: req.organizationId!,
    userId: req.user!.userId,
    apiKey: parsed.data.apiKey,
    expectedVersion: parsed.data.expectedVersion,
    reason: parsed.data.reason,
    ipAddress: req.ip
  });
  return res.json({ success: true, organizationId: req.organizationId, ...updated });
}));

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
