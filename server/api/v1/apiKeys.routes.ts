import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const apiKeysRouter = Router();

apiKeysRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const keys = queryAll(`SELECT id, key_name, key_prefix, mode, scopes, active, last_used_at, created_at FROM api_keys WHERE organization_id = ?`, [orgId]);
  return res.json({ success: true, keys });
});

apiKeysRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { keyName = 'API Key E-commerce', mode = 'live', scopes = 'shipments:read,shipments:write,tracking:read' } = req.body;

  const rawSecret = `gp_${mode}_sec_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawSecret.substring(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
  const keyId = `apk-${Date.now()}`;
  const now = new Date().toISOString();

  execute(`
    INSERT INTO api_keys (id, organization_id, client_id, key_name, key_prefix, key_hash, mode, scopes, active, created_at)
    VALUES (?, ?, 'cli-techstore', ?, ?, ?, ?, ?, 1, ?)
  `, [keyId, orgId, keyName, keyPrefix, keyHash, mode, scopes, now]);

  return res.status(201).json({
    success: true,
    message: 'API Key generada con éxito. Cópiala ahora; por seguridad no volverá a mostrarse.',
    apiKey: {
      id: keyId,
      keyName,
      keyPrefix,
      rawSecret,
      mode,
      scopes,
      createdAt: now
    }
  });
});
