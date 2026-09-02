import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const apiKeysRouter = Router();

apiKeysRouter.get('/', authenticate, requireScope('api_keys:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const own = ['CLIENT', 'CUSTOMER'].includes(normalizeRole(req.user?.role)) || req.authType === 'api_key';
  const keys = await queryAllAsync(`SELECT id, key_name, key_prefix, mode, scopes, active, last_used_at, created_at FROM api_keys WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, keys });
}));

const keySchema = z.object({ keyName: z.string().trim().min(2).max(120).default('API Key'), mode: z.enum(['test', 'live']).default('test'), scopes: z.array(z.string().trim().min(3).max(80)).min(1).max(20).default(['shipments:read', 'tracking:read']), clientId: z.string().trim().min(1).max(160).optional() });
const allowedScopes = new Set(['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'quotes:write', 'webhooks:read', 'webhooks:write']);

apiKeysRouter.post('/', authenticate, requireScope('api_keys:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = keySchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de API Key inválidos.' });
  if (parsed.data.scopes.some((scope) => !allowedScopes.has(scope))) return res.status(422).json({ success: false, error: 'La API Key solicita un scope no permitido.' });
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const clientScoped = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const clientId = clientScoped ? req.clientId : parsed.data.clientId || null;
  if (clientScoped && parsed.data.clientId && parsed.data.clientId !== req.clientId) return res.status(403).json({ success: false, error: 'No puedes generar una API Key de otro cliente.' });
  if (clientId && !(await queryOneAsync('SELECT id FROM clients WHERE id = ? AND organization_id = ? AND active = 1', [clientId, orgId]))) return res.status(422).json({ success: false, error: 'Cliente inválido para esta organización.' });
  const rawSecret = `gp_${parsed.data.mode}_sec_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = rawSecret.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
  const keyId = `apk-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO api_keys (id, organization_id, client_id, key_name, key_prefix, key_hash, mode, scopes, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`, [keyId, orgId, clientId, parsed.data.keyName, keyPrefix, keyHash, parsed.data.mode, parsed.data.scopes.join(','), now]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, metadata_json, created_at) VALUES (?, ?, ?, 'api_key.created', 'api_key', ?, 'success', ?, ?)`, [`aud-${crypto.randomUUID()}`, orgId, req.user?.userId || null, keyId, JSON.stringify({ mode: parsed.data.mode, scopes: parsed.data.scopes }), now]);
  });
  return res.status(201).json({ success: true, message: 'API Key generada. Cópiala ahora; no volverá a mostrarse.', apiKey: { id: keyId, keyName: parsed.data.keyName, keyPrefix, rawSecret, mode: parsed.data.mode, scopes: parsed.data.scopes, createdAt: now } });
}));
